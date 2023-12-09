//var all_tab = [1, 3]; // 全部的 table id 
var now_table; // which doctor table is used
var all_tab = []; // all doctor aId
var all_doc_name = []; // 全部醫生名字

async function mkDocArray() { // 找所有是醫生的帳號的資訊
    var {data : all_account} = await axios.get("/get_account");
    for (let i = 0;i < all_account.records.length;i++) {
        // is doctor
        if (all_account.records[i].title == 'doc') {
            all_tab.push(all_account.records[i].aId);
            all_doc_name.push(all_account.records[i].name);
        }
    }
    // 依照醫生數量製作醫生選單
    docNav(); // make doctor nav bar
    listenDocBt(); // listen to doc bt
    return all_tab;
}

mkDocArray();

// make doctor nav bar with doctor number
function docNav() {
    console.log(all_tab);
    var nav_tab = getId("myTab");
    for (let i = 0;i < all_tab.length;i++) {
        console.log(i);
        // list element
        var page_li= document.createElement("li");
        page_li.className = "nav-item";
        page_li.role = 'presentation';
        // button element
        var page_bt= document.createElement("button");
        // button id = doc + doctor index
        page_bt.className = "nav-link";
        page_bt.setAttribute('id', ("doc" + all_tab[i]));
        page_bt.role = "tab";
        page_bt.innerHTML = "醫生" + all_tab[i] + '- ' + all_doc_name[i];
        // list append button
        page_li.appendChild(page_bt);
        // nav table append list
        nav_tab.appendChild(page_li);
    }
}

function jsonToString(json) {
    return Object.keys(json).map(function(key) {
        return encodeURIComponent(key) + '=' + encodeURIComponent(json[key]);
    }).join('&');
}
axios.get('/get', {
    params : {
        id : 5
    }
})

function cancelDefault(e) { // 預設是不能放置拖曳，所以要取消
    e.preventDefault();
};

getId('save').addEventListener('click', updateNum); // 保存更改

async function updateNum() { // 更新順序
    update_records = [] // 更新後的資料
    update_index = [] // 更新對照資料的 rId 順序
    var name;
    var value_id = ''; // column id
    for (let i = 0;i < total_len;i++) { // 總共有 total_len 行 row
        name = "log_row" + i;
        //console.log(name);
        var value_index = getId(name).getElementsByTagName('td')[2].innerHTML.indexOf('id');
        update_index.push(getId(name).getElementsByTagName('td')[0].innerHTML); // 放入對照的 rId
        value_id = '';
        value_index += 4; // 從 i 開始，所以 +4
        while (getId(name).getElementsByTagName('td')[2].innerHTML[value_index] != '"') { // 到 " 就停
            value_id += getId(name).getElementsByTagName('td')[2].innerHTML[value_index]; // 加字元
            value_index++; // 找下一個
        }
        update_records.push(getId(value_id).value); // 放進要更新的資料
    }
    var nId = await getNid();
    const {data : suc} = await axios.post('/ckPatients/updateNum', {nId : nId, change_num : change_num, update_records : update_records, update_index : update_index});
    var in_suc = updateIn(); // 更新是否在場
    //var paid_suc = updatePaid(); // 更新是否付款
    //if (suc.suc && in_suc && paid_suc) {
    if (suc.suc && in_suc) {
        alert('更新看診號成功！');
        location.reload();
    }
    else {
        alert('更新看診號失敗！');
        location.reload();
    }
}

var start_tar;
var start_pos; // 拖曳起始的位置
function start(){  
    start_tar = event.target;
    start_pos = event.composedPath(); // 放入起始位置(依序的上層的元素)
}

function getId(id) {
    return document.getElementById(id);
}

function getCla(cla) {
    return document.getElementsByClassName(cla);
}

function getColId(text) { // 從 td 的 innerHTML 找出 col id
    var id_index = text.indexOf('id');
    var value_id = '';
    id_index += 4;
    while (text[id_index] != '"') { // 到 " 就停
        value_id += text[id_index]; // 加字元
        id_index++; // 找下一個
    }
    return value_id;
}

var change_num = {}; // key = 更改的序號, value = 改了多少(singed)

function dropped(e) { // 放下
    if (!confirm('確定更換順序？')) { // confirm
        return;
    }
    e.preventDefault();
    e.stopPropagation();
    var end_pos = e.composedPath(); // 放置的位置(依序的上層的元素)
    var end_tar = e.target;
    for (let i = 0;i < start_pos.length;i++) { // 起始的 table
        if (typeof start_pos[i].id == "string") { // id 是字串型態
            if (start_pos[i].id.includes("tab")) // id包含 tab
                var start_num = i; // 記錄 table index
            if (start_pos[i].id.includes("row")) // id包含 tab
                var start_tr_num = i; // 記錄 table index
        }
    }
    for (let i = 0;i < end_pos.length;i++) { // 最後放置的 table
        if (typeof end_pos[i].id == "string") { // id 是字串型態
            if (end_pos[i].id.includes("tab")) // id 包含 tab
                var end_num = i; // 記錄 table index
            if (end_pos[i].id.includes("row")) // id包含 row
                var end_tr_num = i; // 記錄 table row index
        }
    }
    // 檢查不能和已完診的交換位置
    /*var start_endtime = start_tar.getElementsByTagName('td')[5].innerHTML // 一開始的完診時間
    var end_endtime = getId(end_pos[end_tr_num].id).getElementsByTagName('td')[5].innerHTML;
    if (start_endtime != "null" || end_endtime != "null") { // 都要是還沒看診過得才能換位置
        alert('不能和已完診的交換位置');
        return;
    }*/
    if (start_pos[start_num] == end_pos[end_num]) { // 相同 table 才能換位置
        let children= Array.from(e.target.parentNode.parentNode.parentNode.children); // table layer
        if(children.indexOf(e.target.parentNode.parentNode)>children.indexOf(start_tar.parentNode)) { // if the end target tbody order is bigger than start target tbody order
            e.target.parentNode.parentNode.after(start_tar.parentNode); // up the end target
        }
        else { // down the end target
            e.target.parentNode.parentNode.before(start_tar.parentNode);
        }
        var start_value = getId(getColId(start_tar.getElementsByTagName('td')[2].innerHTML)).value; // 一開始的看診號
        var table_id = getId(start_pos[start_num].id).getElementsByTagName('table'); // the table id of start row
        var all_tbody = getId(table_id[0].id).getElementsByTagName('tbody'); // tbody of this table
        //console.log(all_tbody);
        for (let i = 1;i < all_tbody.length;i++) { // 重新排序看診, start from index 1, as the first is title
            //console.log(getCla(start_pos[start_num].id)[i].id);
            //getCla(start_pos[start_num].id)[i].value = i+1;
            //console.log(getId('log_col1').value);
            //getId(getCla(start_pos[start_num].id)[i].id).value = i+1;
            var log_row = all_tbody[i].getElementsByTagName("tr")[0]; // the row
            var log_column = log_row.getElementsByTagName("td");
            var num_id = log_column[2].getElementsByTagName("input")[0].id; // id of num of this record
            getId(num_id).value = i;
        }
        var end_value = getId(getColId(start_tar.getElementsByTagName('td')[2].innerHTML)).value; // 改完的看診號
        var start_rnum = start_tar.getElementsByTagName('td')[0].innerHTML; // 被換的病人的 rId
        change_num[start_rnum] = start_value - end_value; // 記錄替換
        /*// 交換看診號
        var temp = getCla(start_pos[start_tr_num].id)[0].value; // 暫存開始的值
        getCla(start_pos[start_tr_num].id)[0].value = getCla(end_pos[end_tr_num].id)[0].value
        getCla(end_pos[end_tr_num].id)[0].value = temp;*/
        //console.log(getId('log_col1').value);
    }
}
(async() => { // 查詢 nId
    const {data : user} = await axios.get('/viewPa/nId');
    var {data : account_info} = await getTitle(user.nId);
    var title = account_info.title;
    var name = account_info.name;
    getId('nId').innerHTML = "<b>" + user.nId + "</b> 號" + title + "：" + name + "";
})();

(async() => { // 查詢是否為主責, 是就標示
    const {data : main_pos} = await axios.get('/fullcalendar/getMain'); // 主責帳號
    //console.log(main_pos);
    var nId = await getNid();
    for (let i = 0;i < main_pos.aId.length;i++) { // 所有時間相符的主責帳號
        if (nId == main_pos.aId[i].aId) // 相符的帳號
            getId('nId').innerHTML += "（主責）"; 
    }
})();

var total_len = 0;
var index = 0;
var in_done;
var start_in = {}; // 一開始是否在場
var record_text;
let limit_records = 6; // 頁面能顯示最大的頁面數量
function putRecord(dId, page) { // 把紀錄放進去 table
    axios.get('/records').then(function(response) {
        axios.get('/data').then(function(data) {
            axios.get('/done_records').then(async function(done) {
                response.data.sort(function(a,b){ // 排序
                    return a.num - b.num;
                });
                var in_patients;
                var count_records = 0; // 總共有幾個可以放的紀錄, 不包含看完的
                var count_added_records = 0; // 真正放了幾個紀錄進 table
                total_len = 0; // when reset table, reset the total_len too
                getId("tab"+now_table).innerHTML = ""; // 每次重新點, 都清空 table
                mkTable(dId); // 製作該 id 的 table
                getId('tab' + dId).addEventListener('drop', dropped);
                getId('tab' + dId).addEventListener('dragenter', cancelDefault);
                getId('tab' + dId).addEventListener('dragover', cancelDefault);
                for (let j = 0;j < response.data.length;j++) { // 每一筆紀錄 
                    if (response.data[j].dId != dId) // 不是此醫生
                        continue;
                    in_patients = false; // 是否在病人名單內
                    in_done = false; // 先假設還沒看過診
                    
                    for (let k = 0;k < done.data.length;k++) { // 是否已經看診過
                        if (response.data[j].no == done.data[k].rId) { // 看過了
                            in_done = true;
                            break;
                        }
                    }
                    if (in_done) // 看過了
                        continue; // 找下一個
                    // 分頁 分配
                    /*count_records++; // 計算總共有加了幾筆紀錄
                    if (count_records <= (page-1) * limit_records) // 還沒到可以放進去的 index
                        continue; // 重找
                    if (count_added_records >= limit_records) // 真正放進去的紀錄不能超過限制的次數
                        break; // 停止
                    count_added_records++; // 真正放進去的次數*/
                    for (let i = 0;i < data.data.length;i++) { // left join 到 patients
                        if (response.data[j].pId == data.data[i].pId) { // 病人代號相同
                            start_in[total_len] = response.data[j].in;
                            in_patients = true;
                            // 找有沒有帶卡
                            var {data : no_card} = await axios.post('/viewPa/inNoCard', {rId : response.data[j].no});
                            no_card.no_card_num = no_card.no_card_num==0 ? true : false; // 是否沒帶卡，要把 0,1 變 true,false
                            var tab_name = "tab"+ response.data[j].dId;
                            getId(tab_name).innerHTML += 
                            "<tbody id = 'tbody'" + total_len + "'><tr draggable='true' ondragstart='start()' " + " id = 'log_row" + total_len + "'/><td/>"+ response.data[j].no  +  
                            "<td>" + response.data[j].dId + "</td>" + 
                            "<td><input type = 'text' " + "class = 'tab" + response.data[j].dId + "' id = 'log_col" + j + "' style = 'width:50px' value = '" + response.data[j].num + "'></input></td>" +
                            "<td id = 'pat_name_td'>" + data.data[i]["name"] + "</td>" + 
                            "<td>" + lessTime(response.data[j].start) + "</td>" +
                            "<td>" + data.data[i].id + "</td>" +
                            "<td>" + data.data[i].sex + "</td>" +
                            "<td>" + lessBirth(data.data[i].birth) + "</td>" +
                            "<td>" + data.data[i].tel1 + "</td>" +
                            "<td>" + data.data[i].tel2 + "</td>" +
                            "<td>" + response.data[j].mark + "</td>" + 
                            "<td>" + response.data[j].regist + "</td>" +
                            "<td>" + response.data[j].self_part + "</td>" +
                            "<td>" + response.data[j].all_self + "</td>" +
                            "<td>" + response.data[j].deposit + "</td>" +
                            // if value == 1, checkbox default checked
                            "<td><input onclick='return false;' type = 'checkbox'" + `${response.data[j].paid && "checked"}` + " id = 'paid_" + total_len + "'></input></td>" +
                            "<td><input type = 'checkbox'" + `${response.data[j].in && "checked"}` + " id = 'in_" + total_len + "'></input></td>" +
                            "<td><input onclick='return false;' type = 'checkbox'" + `${no_card.no_card_num && "checked"}` + " id = 'no_card_" + total_len + "'></input></td>" +
                            "<td><button id = '" + j + "' type = 'button' onclick = 'callPat(" + index + "," + response.data[j].no + ")'>刪除</button></td>" +  
                            "<td><button id = 'return" + j + "' type = 'button' onclick = 'returnCard(" + response.data[j].no + ")'>還卡</button></td></tr></tbody>"; 
                            //document.getElementById("in_"+total_len).checked = response.data[j].in;
                            //getId("in_" + total_len).checked = response.data[j].in == 1;
                            total_len += 1;
                            break;
                        }
                    }
                    /*if (!in_patients) { // 不在病患中，未帶卡或預約
                        start_in[total_len] = response.data[j].in;
                        var tab_name = "tab"+ response.data[j].dId;
                        getId(tab_name).innerHTML += 
                        "<tbody id = 'tbody'" + total_len + "'><tr draggable='true' ondragstart='start()' " + " id = 'log_row" + total_len + "'/><td/>"+ response.data[j].no  +  
                        "<td>" + response.data[j].dId + "</td>" + 
                        "<td><input type = 'text' " + "class = 'tab" + response.data[j].dId + "' id = 'log_col" + j + "' style = 'width:50px' value = '" + response.data[j].num + "'></input></td>" +
                        "<td>" + null + "</td>" + 
                        "<td>" + lessTime(response.data[j].start) + "</td>" +
                        "<td>" + lessTime(response.data[j].end) + "</td>" +
                        "<td>" + null + "</td>" +
                        "<td>" + null + "</td>" +
                        "<td>" + null + "</td>" +
                        "<td>" + null + "</td>" +
                        "<td>" + null + "</td>" +
                        "<td>" + null + "</td>" + 
                        "<td>" + response.data[j].regist + "</td>" +
                        "<td>" + response.data[j].self_part + "</td>" +
                        "<td>" + response.data[j].all_self + "</td>" +
                        "<td>" + response.data[j].deposit + "</td>" +
                        "<td><input onclick='return false;' type = 'checkbox'" + `${response.data[j].paid && "checked"}` + " id = 'paid_" + total_len + "'></input></td>" +
                        "<td><input type = 'checkbox'" + `${response.data[j].in && "checked"}` + " id = 'in_" + total_len + "'></input></td>" +
                        "<td><button id = '" + j + "' type = 'button' onclick = 'callPat(" + index + "," + response.data[j].no + ")'>刪除</button></td>" +  
                        "<td><button id = 'return" + j + "' type = 'button' onclick = 'returnCard(" + response.data[j].no + ")'>還卡</button></td></tr>"; 
                        var no_card_id = "log_row" + total_len;
                        document.getElementById(no_card_id).style.backgroundColor = "red";
                        total_len += 1;
                    }*/
                }
                //mkStyle();
            })
        })
    })
}

async function callPat(pa_num, rId) { // 按下刪除
    can_deleted = await canDeleted(rId);
    if (!can_deleted) {
        alert('此病患已取得序號，不能刪除！');
        return;
    }
    var row_id;
    var value_id;
    var value_index;
    reSort(rId); // 重新排序
    const {data : del_suc} = await axios.post('/viewPa/del', {rId : rId}); // 刪除
    updateNum(); // 更新看診號
    if (Object.values(del_suc)) { // 是否刪除成功
        alert('刪除成功');
        location.reload();
    }
    else {
        alert('刪除失敗');
        location.reload();
    }
}

async function canDeleted(rId) {
    const {data : can_del} = await axios.post('/viewPa/canDeleted', {rId : rId}); // 刪除
    return can_del.can_deleted;
}

function reSort(rId) { // 重新排序看診號
    var resort_index = 0;
    var tab_len; // 每個 tab 的長度
    var tab_id; // 每個 tab 的 id
    var log_row; // 每個 row
    //for (let j = 0;j < all_tab.length;j++) { // 全部的 table
        tab_id = "tab" + now_table; // 該 table 的 id
        tab_len = getId(tab_id).getElementsByTagName('tbody').length - 1; // 該 tab 長度，第一個是表頭所以-1
        resort_index = 0; // 重新排序的看診號
        console.log(tab_len);
        for (let i = 1;i < tab_len+1;i++) { // 排序各個 table
            log_row = (getId(tab_id).getElementsByTagName('tbody')[i]);
            if (rId == log_row.getElementsByTagName('td')[0].innerHTML) // 是要刪除的，不要算
                continue;
            value_id = ""; // 看診號的 id
            value_index = log_row.getElementsByTagName('td')[2].innerHTML.indexOf('id');
            value_index += 4; // 從 i 開始，所以 +4
            while (log_row.getElementsByTagName('td')[2].innerHTML[value_index] != '"') { // 到 " 就停
                value_id += log_row.getElementsByTagName('td')[2].innerHTML[value_index]; // 加字元
                value_index++; // 找下一個
            }
            (getId(value_id).value) = resort_index+1; // 替換看診號
            resort_index++; // 下一個看診號
        }
    //}
}

async function getTitle(nId) { // 用帳號找職位
    var title = axios.get('/getTitle', {params : {aId : nId}});
    console.log(title);
    return title;
}

async function updateIn() { // 更新在場
    var tab_len; // 每個 tab 的長度
    var tab_id; // 每個 tab 的 id
    var total_rId = [];
    var total_in = [];
    var each_in; // 每一個是否在場
    const in_pos = 16; // column of in is at 16 position
    var each_in_index; // 每一個是否在場的 index
        tab_id = "tab" + now_table; // 該 table 的 id
        tab_len = getId(tab_id).getElementsByTagName('tbody').length - 1; // 該 tab 長度，第一個是表頭所以-1
        for (let i = 1;i < tab_len+1;i++) { // 把每個 table 的 是否在場紀錄抓進去
            log_row = (getId(tab_id).getElementsByTagName('tbody')[i]); // row id
            each_rId = log_row.getElementsByTagName('td')[0].innerHTML; // rId
            // find the in id
            each_in_index = log_row.getElementsByTagName('td')[in_pos].innerHTML.indexOf('id'); // 先找出 in 的 id
            each_in_index += 4;
            each_in = ""; 
            while (log_row.getElementsByTagName('td')[in_pos].innerHTML[each_in_index] != '"') { // 到 " 就停
                each_in += log_row.getElementsByTagName('td')[in_pos].innerHTML[each_in_index];
                each_in_index++;
            }
            total_rId.push(each_rId); // 該筆資料 rId
            total_in.push(getId(each_in).checked); // 對應的 in
        }
    const {data : suc} = await axios.post('/ckPatients/updateIn', {total_rId : total_rId, total_in : total_in});
    return suc;
}

async function updatePaid() { // 更新在場
    var tab_len; // 每個 tab 的長度
    var tab_id; // 每個 tab 的 id
    var total_rId = [];
    var total_in = [];
    var each_in; // 每一個是否在場
    const in_pos = 15; // column of paid is at 15 position
    var each_in_index; // 每一個是否在場的 index
        tab_id = "tab" + now_table; // 該 table 的 id
        tab_len = getId(tab_id).getElementsByTagName('tbody').length - 1; // 該 tab 長度，第一個是表頭所以-1
        for (let i = 1;i < tab_len+1;i++) { // 把每個 table 的 是否在場紀錄抓進去
            log_row = (getId(tab_id).getElementsByTagName('tbody')[i]); // row id
            each_rId = log_row.getElementsByTagName('td')[0].innerHTML; // rId
            // find the in id
            each_in_index = log_row.getElementsByTagName('td')[in_pos].innerHTML.indexOf('id'); // 先找出 in 的 id
            each_in_index += 4;
            each_in = ""; 
            while (log_row.getElementsByTagName('td')[in_pos].innerHTML[each_in_index] != '"') { // 到 " 就停
                each_in += log_row.getElementsByTagName('td')[in_pos].innerHTML[each_in_index];
                each_in_index++;
            }
            total_rId.push(each_rId); // 該筆資料 rId
            total_in.push(getId(each_in).checked); // 對應的 in
        }
    const {data : suc} = await axios.post('/ckPatients/updatePaid', {total_rId : total_rId, total_in : total_in});
    // not successful
    if (!suc) {
        console.log('更新已付款失敗');
        alert('更新已付款失敗');
    }
    return suc;
}

async function returnCard(rId) { // 按下還卡
    if (!confirm(`編號：${rId}，確定還卡？`)) {
        return;
    }
    const {data : user} = await axios.get('/viewPa/nId');
    const {data : result} = await axios.post('/viewPa/submitUpdatePa', {rId : rId, aId : user.nId});
    if (result.suc) { // 是否還卡成功
        alert('還卡成功');
        location.reload();
    }
    else {
        alert('還卡失敗');
        location.reload();
    }
}

function mkStyle() { // 設置間距
    getId('tab' + all_tab[0]).style.margin = '0px 0px 0px 0px'; // 第一個 table 
    getId('tab3').getBoundingClientRect().width+= '1090';
    for (let i = 0;i < all_tab.length-1;i++) { // 設置每一個 table 的間距
        spacing = getId('tab' + (all_tab[i])).getBoundingClientRect().bottom - getId('tab' + (all_tab[i+1])).getBoundingClientRect().top; // 計算前面的 table 的 bottom - 後面 table 的 top
        distance = (-20 + -1 * spacing) * -1; // 保持間距
        getId('tab' + (all_tab[i+1])).style.margin = `${distance}px 0px 0px 0px` // 設置 table 間距
    }
}

function lessTime(times) { // 把時間弄得好看一點
    if (times == null) // 如果還沒有時間
        return null;
    var new_time = '';
    var dash_is_breaked = false; // 只要把第一個 dash 換行，因為是年分
    for (let i = 0;i < times.length-5;i++) { // 不要後面五個字元
        if (times[i] == '-' && !dash_is_breaked) {
            new_time += '<br/>';
            dash_is_breaked = true;
            continue;
        }
        if (times[i] == 'T') { // 把 T 換掉
            new_time += '<br/>';
            continue;
        }
        new_time += times[i];
    }
    return new_time;
}

async function getNid() { // 從 innerHTML 挑出 nId
    const {data : user} = await axios.get('/viewPa/nId');
    return user.nId;
}

// nav direct 

function directId(e) { // 導向網址
    window.location.href = "/" + e.target.id;
}

function navDirect() { // 導向 nav_bar 的 child 到該網址
    var nav_bar = getId('navbar'); // 所有 nav bar 的 child
    for (let i = 0;i < nav_bar.length;i++) { // 監聽所有的 child
        getId(nav_bar[i].id).addEventListener('click', directId);
    }
}
navDirect();

function mkTable(tab_id) { // 依照醫生數量，製作 table
        getId('tab_pos').innerHTML = 
        `<table class = 'position-absolute ' id = 'tab${tab_id}' border = '2' align = center>` +
        "<tr>" + 
        "<td style = 'text-align:center;' colspan = 20>" + 
        `Doc.${tab_id}` +  
        "</td>" +
        "</tr>" + 
        "<tr>" + 
        "<td><span id = 'chart_num'>病歷號</span></td>" + 
        "<td><span id = 'dId'>醫生代號</span><br/></td>" +
        "<td><span id = 'num'>看診號</span></td>" + 
        "<td id = 'pat_name_td'><span id = 'pat_name'>姓名</span></td>" +
        "<td><span id = 'time'>掛號時間</span></td>" +
        "<td><span id = 'id'>身份證號</span></td>" +
        "<td><span id = 'sex'>性別</span></td>" +
        "<td><span id = 'birth'>生日</span></td>" +
        "<td><span id = 'tel1'>電話1</span></td>" +
        "<td><span id = 'tel2'>電話2</span></td>" +
        "<td><span id = 'mark'>註記</span></td>" +
        "<td><span id = 'regist'>掛號費</span></td>" +
        "<td><span id = 'part_self'>部份負擔</span></td>" +
        "<td><span id = 'all_self'>自費</span></td>" +
        "<td><span id = 'deposit'>押金</span></td>" + 
        "<td><span id = 'paid'>是否付款</span><br/></td>" +
        "<td><span id = 'in'>是否在場</span><br/></td>" +
        "<td><span id = 'no_card'>未欠卡</span><br/></td>" +
        "<td><span id = 'delete'>刪除</span><br/></td>" +
        "<td><span id = 'return_card'>還卡</span><br/></td>" +
    "</tr>" +
    "</table>" +
    "<div>&nbsp;</div>"
}

async function mkDoc(e) {
    if (e == 'first') {
        var tab_id = 1;
    }
    else {
        var tab_id = getDid(e.target.id); // 取得 dId
    }
    //var tab_id = getDid(e.target.id); // 取得 dId
    now_table = tab_id;
    mkTable(tab_id); // 製作該 id 的 table
    putRecord(tab_id, 1);
    // make pageW
    /*const page_num = axios.get('/getPageNum', {params : {dId : tab_id}});
    page_num.then(function(result) { // make page
        var page_num_result = {data : result}.data.data.page_num; // total records num
        let total_page_num = countPageNum(page_num_result); // total_page_num = all records/limit_records
        mkPageListener(total_page_num); // make listener of page list 
    });*/
}

// 一開始先製作第一個醫生的看診明細
mkDoc('first');

function countPageNum(page_num_result) { // count page num
    let page_num = Math.floor(page_num_result/limit_records); // without float
    let page_less = page_num_result%limit_records; 
    if (page_less != 0) // is float
        page_num += 1; // add one more page
    return page_num;
}

function getDid(origin_dId) {
    var dId = ''
    for (let i = 0;i < origin_dId.length;i++) {
        if (isNum(origin_dId[i]))
            dId += origin_dId[i];
    }
    return dId;
}

function isNum(n) { // 是不是數字
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function listenDocBt() { // addEventListener on all doc bt
    for (let i = 0;i < all_tab.length;i++) {
        getId('doc'+all_tab[i]).addEventListener('click', mkDoc); // 
    }
}   

// chat room

getId("send_msg").addEventListener("click", sendMsg);

async function sendMsg() { // send msg
    const msg_len = getId('msg').value.length;
    // keep message standard = **xxx**
    // if meet the keep message standard, pass to localStroage
    if (getId('msg').value[0] == '*' && getId('msg').value[1] == '*'&& getId('msg').value[msg_len-1] == '*' && getId('msg').value[msg_len-2] == '*') {
        var msg = takeOutMark(getId('msg').value);
        sendKeepMsg(msg);
    }
    else {
        // send normal messages
        var nId = await getNid();
        var {data : title} = await getTitle(nId);
        var title = title.title;
        var msg = nId + " 號" + title + ": ";
        msg += getId("msg").value;
        socket.emit("docMsg", msg);
    }
}

function takeOutMark(msg) {
    // make a message without first and last two * mark 
    var new_mark = '';
    for (let i = 2;i < msg.length-2;i++) {
        new_mark += msg[i];
    }
    return new_mark;
}

async function sendKeepMsg(msg) { // send msg
    var nId = await getNid();
    var {data : title} = await getTitle(nId);
    var title = title.title;
    var msg_title = nId + " 號" + title + ": ";
    var final_msg = msg_title + msg;
    socket.emit("saveKeepMsg", final_msg);
}

var had_keep_msg = false; // whether already have keep message
var all_keep_msg_id = [];
document.addEventListener("DOMContentLoaded", () => { // load message into browser
    socket.on("msg", function (chat_msg) {
        var header_text = onlyText(chat_msg)[0]; // header text, include which account
        var real_text = addBr(onlyText(chat_msg)[1]); // the content of text
        var new_msg = header_text + real_text + "\n"; // all text = header + content
        var new_div = document.createElement("div");
        var new_content = document.createTextNode(new_msg);
        new_div.className = "border border-3 border-primary";
        new_div.appendChild(new_content);
        var chat_title = getId('chat_title');
        chat_title.appendChild(new_div);
        chat_title.style = "white-space: pre;" // make /n == break
    })
    
    // when submit keep living message, make and show it
    socket.on("keepMsg", function (keep_msg, kmId) {
        insertKeepElement(kmId, keep_msg);
    });
});
        
// count deleted button real index, as some is deleted
var bt_real_index = 0;
        
// filter deleted keep messages and put keep messages 
putKeepMsg();

function insertKeepElement(keep_msg_no, keep_msg_content) {
    // insert keep element
    all_keep_msg_id.push(keep_msg_no);
    var header_text = onlyText(keep_msg_content)[0]; // header text, include which account
    var real_text = addBr(onlyText(keep_msg_content)[1]); // the content of text
    var new_msg = header_text + real_text + "\n"; // all text = header + content
    // make delete button
    var del_bt = mkChatDelBt(bt_real_index);
    // make text div
    var new_div = document.createElement("div");
    var new_content = document.createTextNode(new_msg);
    new_div.className = "position-relative border border-3 border-danger";
    new_div.appendChild(del_bt);
    new_div.appendChild(new_content);
    var chat_title = getId('chat_title');
    chat_title.appendChild(new_div);
    chat_title.style = "white-space: pre;" // make /n == break
}

async function putKeepMsg() {
    // get all keep messages 
    var get_keep_msg = axios.get('/viewPa/getKeepMsg');
    get_keep_msg.then(async function(keep_messages) {
        var {data : keep_messages} = keep_messages;
        var keep_msg = keep_messages.keep_messages;
        // get all deleted keep message id
        const {data : user} = await axios.get('/viewPa/nId');
        const nId = user.nId; // nurse id
        var deleted_id = axios.get('/viewPa/delKeepMsg', {params : {aId : nId}});
        deleted_id.then(function(deleted_id) { // this user's deleted keep message id
            const all_del_id = deleted_id.data.del_keep_msg; 
            // filter all keep messages
            for (let i = 0;i < keep_msg.length;i++) { 
                // push all keep message id 
                if (inDeletedKeep(all_del_id, keep_msg[i].no)) {
                    // if is deleted, then don't show this message 
                    continue;
                }
                // not deleted, insert the element
                insertKeepElement(keep_msg[i].no, keep_msg[i].content);
                bt_real_index += 1; // real index+1
            }
        })
    });
}

function inDeletedKeep(del_records, keep_id) {
    // check if keep_id in deleted records
    for (let i = 0;i < del_records.length;i++) {
        // in deleted records, return false
        if (del_records[i].kmId == keep_id) 
            return true;
    }
    return false;
}

// make chat room delete button
function mkChatDelBt(i) {
    var del_bt = document.createElement("button");
    del_bt.id = "del_chat_" + i;
    del_bt.className = 'position-absolute buttom-0 end-0';
    del_bt.style.width = '20px';
    del_bt.style.height = '20px';
    del_bt.style.fontSize = '10px';
    del_bt.innerHTML = "╳";
    del_bt.onclick = function(){
        delChat(i);
    };
    return del_bt;
}

async function delChat(i) {
    // delete keep message with id
    var is_sure = confirm(`確定刪除第${i+1}個重要事項?`)
    if (!is_sure) // not sure, back. 
        return;
    // delete the keep message with kmId
    var nId = await getNid();
    const {data : del_keep_msg} = await axios.post('/viewPa/delKeepMsg', {del_id : all_keep_msg_id[i], aId : nId});
    if (del_keep_msg.suc) {
        alert('刪除重要紀錄成功!');
    }
    else {
        alert('刪除重要紀錄失敗!');
    }
    window.location.reload();
}

function onlyText(chat_msg) { // return the real text
    let start_index; // index of real start
    var header_text = "";
    var real_text = "";
    for (let i = 0;i < chat_msg.length;i++) {
        if (chat_msg[i] == ":") // start from 1 index behind
            start_index = i+1; // escapt the space
        if (i > start_index) // real text
            real_text += chat_msg[i];
        else
            header_text += chat_msg[i];
    }
    return [header_text, real_text]; // return [header, content]
}

function addBr(real_text) { // add break into text when is too long
    const max_char_limit = 12;
    br_text = ""; // break added text
    for (let i = 0;i < real_text.length;i++) {
        if (i % max_char_limit == 0) // the limit char of a line
            br_text += "\n"; // next line
        br_text += real_text[i];
    }
    return br_text;
}

// make page element

function mkPageListener(page_num) { // 依照 page 的數量監聽
    mkPage(page_num);
    for (let i = 1;i < page_num+1;i++) // 從第一頁開始監聽
        getId('page_'+i).addEventListener('click', turnPage); // put records in table depend on page num
}

function turnPage(e) { // 翻頁
    putRecord(now_table, e.path[0].innerHTML); // 把紀錄放進 table, 現在是第幾個 table, 第幾頁
};

function mkPage(page_num) { // make page with page_num
    if (getId('page_list')) // if page_list exist, renew one
        getId("page_list").remove(); // remove
    // create and add the needed elements
    var page_list_element = document.createElement("ul");
    page_list_element.className = "pagination";
    page_list_element.setAttribute("id", "page_list");
    var page_top = getId("page_top");
    page_top.appendChild(page_list_element);
    var page_list = getId('page_list');
    var page_list = getId('page_list');
    for (let i = 0;i < page_num;i++) { // make page with page num
        var page_li= document.createElement("li");
        page_li.className = "page-item";
        var page_a = document.createElement("a");
        page_a.className = "page-link";
        page_a.setAttribute("id", "page_"+(i+1));
        page_a.innerHTML = i+1; // start from page 1
        page_li.appendChild(page_a);
        page_list.appendChild(page_li);
    }
}

// logout, clear cookie
getId('logout').addEventListener('click', async() => {
    const {data : is_clear} = await axios.post('/viewPa/logoutCheck');
    // today financial is not clear
    if (!is_clear.suc) {
        var is_confirm = confirm(`${is_clear.log}`);
        // confirm user still want to logout
        if (is_confirm) {
            await axios.post('/viewPa/logout');
            window.location.href = "/login";
        }
    }
    // today financial is clear
    else {
        await axios.post('/viewPa/logout');
        window.location.href = "/login";
    }
});

function lessBirth(birth) { // 把生日用的好看一點
    var new_birth = '';
    var first_dash = false;
    for (let i = 0;i < birth.length;i++) {
        if (birth[i] == '-' && !first_dash) { // 把第一個 - 變成 <br/>
            new_birth += "<br/>";
            first_dash = true;
        }
        else { 
            new_birth += birth[i];
        }
    }
    return new_birth;
}