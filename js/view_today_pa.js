var all_tab = [1, 3]; // 全部的 table id 
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
    var nav_tab = getId("myTab");
    for (let i = 0;i < all_tab.length;i++) {
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
(async() => { // 查詢 nId
    const {data : user} = await axios.get('/viewPa/nId');
    var {data : account_info} = await getTitle(user.nId);
    var title = account_info.title;
    var name = account_info.name;
    getId('nId').innerHTML = "<b>" + user.nId + "</b> 號" + title + "：" + name + "";
})();

async function getTitle(nId) { // 用帳號找職位
    var title = axios.get('/getTitle', {params : {aId : nId}});
    console.log(title);
    return title;
}

(async() => { // 查詢是否為主責, 是就標示
    const {data : main_pos} = await axios.get('/fullcalendar/getMain'); // 主責帳號
    for (let i = 0;i < main_pos.aId.length;i++) { // 所有時間相符的主責帳號
        if (getNid(getId('nId').innerHTML) == main_pos.aId[i].aId) // 相符的帳號
            getId('nId').innerHTML += "（主責）"; 
    }
})();

function alertLog(response) { // 登入
    for (let i = 0;i < response.data[response.data.length-1].length;i++) {
        if (response.data[response.data.length-1][i].status) 
            return 1;
        }
    var name = prompt("請輸入您的帳號", ""); //將輸入的內容賦給變數 name ，
    var pass = prompt("請輸入您的密碼", ""); //將輸入的內容賦給變數 name ，
    var log_suc = 0;
    for (let i = 0;i < response.data[response.data.length-1].length;i++) {
        if (response.data[response.data.length-1][i].nId==name && response.data[response.data.length-1][i].pass==pass) {
            //getId('nId').value = name;
            alert('登入成功');
            log_suc = 1;
            return 1;
        }
    }
    if (log_suc == 0) {
        alert('登入失敗');
        location.reload();
    }
}    

var total_len = 0;
var index = 0;
var in_done;
var start_in = {}; // 一開始是否在場
var record_text;
let limit_records = 6; // 頁面能顯示最大的頁面數量
var medicines_records;
async function putRecord(dId, page) { // 把紀錄放進去 table
axios.get('/today_records').then(function(response) {
    axios.get('/data').then(function(data) {
        axios.get('/done_records').then(function(done) {
            response.data.sort(function(a,b){ // 排序，由近到遠
                return b.no - a.no;
            });
            var in_patients;
            var count_records = 0; // 總共有幾個可以放的紀錄, 不包含看完的
            var count_added_records = 0; // 真正放了幾個紀錄進 table
            total_len = 0; // when reset table, reset the total_len too
            getId("tab"+now_table).innerHTML = ""; // 每次重新點, 都清空 table
            mkTable(dId); // 製作該 id 的 table
            for (let j = 0;j < response.data.length;j++) { // 每一筆紀錄 
                if (response.data[j].dId != dId) // 不是此醫生
                    continue;
                in_patients = false;
                count_records++; // 計算總共有加了幾筆紀錄
                if (count_records <= (page-1) * limit_records) // 還沒到可以放進去的 index
                    continue; // 重找
                if (count_added_records >= limit_records) // 真正放進去的紀錄不能超過限制的次數
                    break; // 停止
                count_added_records++; // 真正放進去的次數
                
                for (let i = 0;i < data.data.length;i++) { // left join 到 patients
                    if (response.data[j].pId == data.data[i].pId) { // 病人代號相同
                        start_in[total_len] = response.data[j].in;
                        in_patients = true;
                        var no_card = 0; // 是否未帶卡
                        var tab_name = "tab"+ response.data[j].dId;
                        //getId(tab_name).innerHTML
                        //record_text = 
                        getId(tab_name).innerHTML += 
                        "<tbody id = 'tbody'" + total_len + "'><tr" + " id = 'log_row" + total_len + "'/><td/>"+ response.data[j].no  +  
                        "<td>" + response.data[j].dId + "</td>" + 
                        "<td>" + data.data[i]["name"] + "</td>" + 
                        "<td>" + lessTime(response.data[j].start) + "</td>" +
                        "<td>" + `${lessTime(response.data[j].end) ? lessTime(response.data[j].end) : '無'}` + "</td>" +
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
                        "<td><input type = 'checkbox'" + `${response.data[j].in && "checked"}` + " id = 'in_" + total_len + "'></input></td>" +
                        "<td><button id = '" + j + "' type = 'button' onclick = 'callPat(" + index + "," + response.data[j].no + ")'>刪除</button></td>" +  
                        "<td><button id = 'return" + j + "' type = 'button' onclick = 'returnCard(" + response.data[j].no + ")'>還卡</button></td>" +
                        "<td><button type = 'button' onclick = 'checkMedRec(" + response.data[j].no + ")'>病歷</button></td></tr></tbody>";                                 
                        //document.getElementById("in_"+total_len).checked = response.data[j].in;
                        //getId("in_" + total_len).checked = response.data[j].in == 1;
                        total_len += 1;
                        break;
                    }
                }
                if (!in_patients) { // 不在病患中，未帶卡或預約
                    start_in[total_len] = response.data[j].in;
                    var tab_name = "tab"+ response.data[j].dId;
                    getId(tab_name).innerHTML += 
                    "<tbody id = 'tbody'" + total_len + "'><tr" + " id = 'log_row" + total_len + "'/><td/>"+ response.data[j].no  +  
                    "<td>" + response.data[j].dId + "</td>" + 
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
                    "<td><input type = 'checkbox'" + `${response.data[j].in && "checked"}` + " id = 'in_" + total_len + "'></input></td>" +
                    "<td><button id = '" + j + "' type = 'button' onclick = 'callPat(" + index + "," + response.data[j].no + ")'>刪除</button></td>" +  
                    "<td><button id = 'return" + j + "' type = 'button' onclick = 'returnCard(" + response.data[j].no + ")'>還卡</button></td>" +
                    "<td><button type = 'button' onclick = 'checkMedRec(" + response.data[j].no + ")'>病歷</button></td></tr></tbody>";                                 
                    var no_card_id = "log_row" + total_len;
                    document.getElementById(no_card_id).style.backgroundColor = "red";
                    total_len += 1;
                }
            }
            //console.log(count_records);
            //mkStyle();
        })
    })
})
}

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

async function checkMedRec(rId) {
    var {data : medicines_records} = await axios.get('/medRec'); // done records
    var in_medi = false;  // 是否有藥物紀錄
    for (let i = 0;i < medicines_records.med_rec.length;i++) {
        if (medicines_records.med_rec[i].rId == rId) { // 有醫生開的藥物紀錄
            in_medi = true;
        }
    }
    if (!in_medi) {
        alert('查無藥物紀錄！');
        return;
    }
    const {data : suc} = await axios.post('/docMain/getPa', {view : true, rId : rId, pa_num : rId}); // 檢查帳號的權限
    if (suc) {
        alert('成功');
        window.location.href = "/ckPatients?view=true";
    }
    else {
        alert('無此病患');
    }
}

async function callPat(pa_num, rId) { // 按下刪除
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

async function returnCard(rId) { // 按下刪除
    const {data : up_suc} = await axios.post('/viewPa/updatePa', {rId : rId});
    if (Object.values(up_suc)) { // 是否刪除成功
        window.location.href = "/updatePa";
    }
    else {
        alert('更新失敗');
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

let now_page = 0; // 現在的頁數
function mkTable(tab_id) { // 依照醫生數量，製作 table
        getId('tab_pos').innerHTML = 
        `<table class = 'col-md-10' id = 'tab${tab_id}' border = '2' align = center>` +
        "<tr>" + 
        "<td style = 'text-align:center;' colspan = 17>" + 
        `Doc.${tab_id}` +  
        "</td>" +
        "</tr>" + 
        "<tr>" + 
        "<td><span id = 'chart_num'>病歷號</span></td>" + 
        "<td><span id = 'dId'>醫生代號</span><br/></td>" +
        "<td><span id = 'pat_name'>姓名</span></td>" +
        "<td><span id = 'time'>掛號時間</span></td>" +
        "<td><span id = 'end_time'>完診時間</span></td>" +
        "<td><span id = 'id'>身份證號</span></td>" +
        "<td><span id = 'sex'>性別</span></td>" +
        "<td><span id = 'birth'>生日</span></td>" +
        "<td><span id = 'tel1'>電話1</span></td>" +
        "<td><span id = 'tel2'>電話2</span></td>" +
        "<td><span id = 'mark'>註記</span></td>" +
        "<td><span id = 'regist'>掛號費</span></td>" +
        "<td><span id = 'part_self'>部份負擔</span></td>" +
        "<td><span id = 'deposit'>押金</span></td>" + 
        "<td><span id = 'all_self'>自費</span></td>" +
        "<td><span id = 'in'>是否在場</span><br/></td>" +
        "<td><span id = 'delete'>刪除</span><br/></td>" +
        "<td><span id = 'return_card'>還卡</span><br/></td>" +
        "<td><span id = 'return_card'>病歷</span><br/></td>" +
    "</tr>" +
    "</table>" +
    "<div>&nbsp;</div>"
}

let total_page_num;
async function mkDoc(e) {
    now_page = 0;
    if (e == 'first') {
        var tab_id = 1;
    }
    else {
        var tab_id = getDid(e.target.id); // 取得 dId
    }
    now_table = tab_id;
    mkTable(tab_id); // 製作該 id 的 table
    putRecord(tab_id, 1);
    const page_num = axios.get('/getPageNum', {params : {dId : tab_id, today : true}});
    page_num.then(function(result) { // make page
        var page_num_result = {data : result}.data.data.page_num; // total records num
        total_page_num = countPageNum(page_num_result); // total_page_num = all records/limit_records
        mkPageListener(total_page_num); // make listener of page list 
    });
}

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

mkDoc('first'); // 一開始先載入第一個醫生
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
        var title = await getTitle(nId);
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
    var title = await getTitle(nId);
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

let start_page; // 開始的頁數
let max_col_page = 10; // 一行最多可以有幾個頁數
function mkPageListener(page_num) { // 依照 page 的數量監聽
    // 如果總頁數 < 一行限制最大頁數，一行限制最大頁數 = 總頁數
    var temp_max_col_page = total_page_num < max_col_page ? total_page_num : max_col_page; 
    mkPage(page_num); // 製作頁面按鈕
    if (page_num >= temp_max_col_page) { // 最大只能 15 頁
        page_num = temp_max_col_page + parseInt(now_page);;
    }
    if (page_num >= total_page_num) {
        page_num = total_page_num;
    }
    getId('page_last').addEventListener('click', turnPage);
    getId('page_next').addEventListener('click', turnPage);
    getId('last_page').addEventListener('click', turnPage);
    getId('first_page').addEventListener('click', turnPage);
    for (let i = parseInt(start_page)+1;i < page_num+1;i++) // 從第一頁開始監聽
        getId('page_'+i).addEventListener('click', turnPage); // put records in table depend on page num
}

function turnPage(e) { // 翻頁
    if (e.keyCode && !(e.keyCode == 37 || e.keyCode == 39)) {
        return;
    }
    if (e.target.innerHTML == "上一頁" || e.keyCode == 37) {
        // 不能讓上一頁到 -1
        if (now_page < 1) {
            now_page = 0;
            return;
        }
        else {
            now_page -= 1;
        }
    }
    else if (e.target.innerHTML == "下一頁" || e.keyCode == 39) {
        if (now_page+1 < total_page_num) { // 下一頁不能超過最後一頁
            now_page += 1;
        }
        else {
            return;
        }
    }
    else if (e.target.innerHTML == "首頁") {
        now_page = 0;
    }
    else if (e.target.innerHTML == "尾頁") {
        now_page = total_page_num-1;
    }
    else { // 現在頁數 = 案的頁數-1
        now_page = parseInt(e.target.innerHTML)-1;
    }
    mkPageListener(total_page_num); // 重新製作頁面按鈕、監聽
    putRecord(now_table, now_page+1); // 把紀錄放進 table, 現在是第幾個 table, 第幾頁
};

function mkPage(page_num) { // make page with page_num
    if (getId('page_list')) // if page_list exist, renew one
        getId("page_list").remove(); // remove
    // 如果總頁數 < 一行限制最大頁數，一行限制最大頁數 = 總頁數
    var temp_max_col_page = total_page_num < max_col_page ? total_page_num : max_col_page; 
    // create and add the needed elements
    var page_list_element = document.createElement("ul");
    page_list_element.className = "pagination";
    page_list_element.setAttribute("id", "page_list");
    var page_top = getId("page_top");
    page_top.appendChild(page_list_element);
    var page_list = getId('page_list');
    var page_list = getId('page_list');
    if (page_num >= temp_max_col_page) { // 一行最大只能 10 頁
        page_num = temp_max_col_page + parseInt(now_page);
    }
    if (page_num >= total_page_num) { // 不能超過最大頁數
        page_num = total_page_num;
    }
    if (now_page > total_page_num-temp_max_col_page) {
        // 總共的頁數不能低於 10 ，所以當現在頁數 < 總頁數-10，開始的頁數還是要保持在總頁數 -10
        start_page = total_page_num-temp_max_col_page;
    }
    else { // 開始頁數 = 現在頁數
        start_page = now_page;
    }
    // 製作元素
    
    // 上一頁的元素
    var page_li= document.createElement("li");
    page_li.className = "page-item";
    var page_a = document.createElement("a");
    page_a.className = "page-link";
    page_a.setAttribute("id", "page_last");
    page_a.innerHTML = '上一頁'; // start from page 1
    page_li.appendChild(page_a);
    page_list.appendChild(page_li);
    
    // 首頁的元素
    var page_li= document.createElement("li");
    page_li.className = "page-item";
    var page_a = document.createElement("a");
    page_a.className = "page-link";
    page_a.setAttribute("id", "first_page");
    page_a.innerHTML = '首頁'; // start from page 1
    page_li.appendChild(page_a);
    page_list.appendChild(page_li);
    
    for (let i = start_page;i < page_num;i++) { // make page with page num
        var page_li= document.createElement("li");
        page_li.className = "page-item";
        var page_a = document.createElement("a");
        page_a.className = "page-link";
        page_a.setAttribute("id", "page_"+(i+1));
        if (i == now_page) { // 目前的頁數要用黑色字體
            page_a.style.color = 'black';
        }
        page_a.style.width = '50px';
        page_a.innerHTML = (parseInt(i)+1); // start from page 1
        page_li.appendChild(page_a);
        page_list.appendChild(page_li);
    }
    // 尾頁的元素
    var page_li= document.createElement("li");
    page_li.className = "page-item";
    var page_a = document.createElement("a");
    page_a.className = "page-link";
    page_a.setAttribute("id", "last_page");
    page_a.innerHTML = '尾頁'; // start from page 1
    page_li.appendChild(page_a);
    page_list.appendChild(page_li);
    
    // 下一頁
    var page_li= document.createElement("li");
    page_li.className = "page-item";
    var page_a = document.createElement("a");
    page_a.className = "page-link";
    page_a.setAttribute("id", "page_next");
    page_a.innerHTML = '下一頁'; // start from page 1
    page_li.appendChild(page_a);
    page_list.appendChild(page_li);
}

// get key down
document.body.addEventListener('keydown', turnPage ,false) //偵測按鍵

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