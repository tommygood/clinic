const total_row = 9; // 新增帳務 table 的 row
function getId(id) {
    return document.getElementById(id);
}

var total_money = 0; // sum of total money

const original_light = getId('light').innerHTML;

(async() => { // 查詢 nId
    const {data : user} = await axios.get('/viewPa/nId');
    var {data : account_info} = await getTitle(user.nId);
    var title = account_info.title;
    var name = account_info.name;
    getId('nId').innerHTML = "<b>" + user.nId + "</b> 號" + title + "：" + name + "";
})();

async function getTitle(nId) { // 用帳號找職位
    var title = axios.get('/getTitle', {params : {aId : nId}});
    return title;
}

function moneyChange(total_len) { // 監聽更改錢、理由
    //getId("money_"+0).addEventListener('change', changed_list); // 監聽錢
    for (let i = 0;i < total_len;i++) {
        getId("money_"+i).addEventListener('change', changed_list); // 監聽錢
        getId('changed_reason_'+i).addEventListener('change', changed_list); // 監聽更改理由
    }
}

var changed_money_list = []; // 有更改的錢
var changed_reason_list = []; // 有更改的更改理由
var all_change = [];

function test() {
    alert(1);
}

async function changed_list(e) { // 更改金額或更改理由
    log_row = e.path[2].getElementsByTagName('td');
    var key_id = log_row[0].innerHTML;
    var in_all = false; // 是否放過
    var log_id = e.path[2].id;
    for (let i = 0;i < all_change.length;i++) {
        if (all_change[i] == log_id) {
            in_all = true;
            break;
        }
    }
    if (!in_all)
        all_change.push(log_id);
    if (e.target.id.includes('money')) { // 錢
        log_row[6].getElementsByTagName('input')[0].style.visibility = 'initial' ;
        var money = log_row[4].getElementsByTagName('input')[0].value; // 取得錢
        var in_money = false; // 先假設還沒算過這筆資料的錢
        // 找出是否有改過這筆
        for (let i = 0;i < Object.keys(changed_money_list).length;i++) { 
            if (key_id == Object.keys(changed_money_list[i])) { // 有改過
                changed_money_list[i][key_id][0] = money; // 只要改內容就好
                in_money = true;
            }
        }
        if (!in_money) // 還沒換過這筆資料的錢, 要新增
            changed_money_list.push({[key_id] : [money]});
    }
    else { // 更改理由
        var reason = log_row[6].getElementsByTagName('input')[0].value;
        var in_reason = false; // 先假設還沒算過這筆資料的錢
        // 找出是否有改過這筆
        for (let i = 0;i < Object.keys(changed_reason_list).length;i++) { 
            if (key_id == Object.keys(changed_reason_list[i])) { // 有改過
                changed_reason_list[i][key_id] = reason; // 只要改內容就好
                in_reason = true;
            }
        }
        if (!in_reason) // 還沒換過這筆資料的錢, 要新增
            changed_reason_list.push({[key_id] : reason});
    }
}

getId('changed_bt').addEventListener('click', submitChange); // 監聽更改理由

async function submitChange() {
    var final_all = {};
    for (let i = 0;i < all_change.length;i++) {
        log_row = getId(all_change[i]).getElementsByTagName('td');
        var money = log_row[4].getElementsByTagName('input')[0].value; // 取得錢
        var reason = log_row[6].getElementsByTagName('input')[0].value; // 取得理由
        if (reason == "") { // 檢查是否必填欄位為空值
            alert("理由欄位為必填");
            return;
        }
        else if (money == "") {
            alert("金額欄位為必填");
            return;
        }
        else { // 不是空值, 就加入準備傳送的集合
            final_all[onlyNum(all_change[i])+1] = [money, reason]; // db index start from 1
        }
    }
    const {data : user} = await axios.get('/viewPa/nId');
    const {data : update_financial} = await axios.post('/financial_today', {final_all : final_all, aId : user.nId});
    if (update_financial["suc"] == false) { // update succsessful, no need to alert the error msg
        for (let i = 0;i < update_financial["error"].length;i++) {
            alert(update_financial["error"][i]);
        }
    }
    else { // update successfully
        alert('更改成功');
        window.location.reload();
    }
}

function onlyNum(log_id) { // 把 log_row 拿掉
    var new_id = '';
    for (let i = 0;i < log_id.length;i++) {
        if (isNum(log_id[i])) // 是數字
            new_id += log_id[i];
    }
    return parseInt(new_id);
}

function isNum(n) { // 是不是數字
    return !isNaN(parseFloat(n)) && isFinite(n);
}

getId("settle_bt").addEventListener('click', settle); // 監聽錢

async function settle() { // settle all financial records on the duty of this nurse
    // 詢問註解
    var origin_log = prompt("結算當班金額的註解");
    if (origin_log == null) { // 取消輸入
        alert('結算取消！');
        return;
    }
    // 詢問要剩下金額
    var last_money = prompt("要留給下一個班的金額");
    if (last_money == null) { // 取消輸入
        alert('結算取消');
        return;
    }
    else {
        if (!isNum(last_money)) { // 若不是數字，就設0
            last_money = 0;
        }
        if (last_money > total_money) { // 檢查是否剩餘金額 > 目前金額
            alert('剩餘金額不可大於目前總金額，結算取消！');
            return;
        }
    }
    // 送出結算記錄
    const {data : user} = await axios.get('/viewPa/nId');
    const {data : settle} = await axios.post("/financial_today/settle", {last_money : last_money, aId : user.nId, total_money : total_money, origin_log : origin_log});
    if (settle["suc"]) { // settle successfully
        alert('結算成功!');
        window.location.reload();
    }
    else {
        for (let i = 0;i < settle["error"].length;i++) {
            alert(settle["error"][i]);
        }
        window.location.reload();
    }
}

function mkAddTableRow() { // 製作新增帳務 table 的欄位
    var add_tab = getId('add_tab'); // 要新增的 table
    var td_reason_select = reasonSelect(); // 製作固定理由
    for (let i = 0;i < total_row;i++) { // 總共幾個 row
        var tr = document.createElement('tr'); // row
        // 編號
        var td_id = document.createElement('td'); // column
        td_id.innerHTML = i+1; // 編號
        tr.appendChild(td_id); // row append column
        // reason column
        var td_reason = document.createElement('td'); 
        var td_reason_input = document.createElement('input');
        td_reason_input.setAttribute('list', 'add_reason');
        td_reason_input.id = 'add_reason' + i;
        td_reason.appendChild(td_reason_input);
        td_reason.appendChild(td_reason_select); // fixed reason
        tr.appendChild(td_reason); // row append column
        // money column
        var td_money = document.createElement('td'); 
        var td_money_input = document.createElement('input');
        td_money_input.id = 'add_money' + i;
        td_money.appendChild(td_money_input);
        tr.appendChild(td_money); // row append column
        // mark column
        var td_mark = document.createElement('td'); 
        var td_mark_input = document.createElement('input');
        td_mark_input.id = 'add_mark' + i;
        td_mark.appendChild(td_mark_input);
        tr.appendChild(td_mark); 
        // row append column
        add_tab.appendChild(tr); 
    }
    // submit button
    var td_submit = document.createElement('button'); 
    td_submit.id = 'submit_add';
    td_submit.innerHTML = '送出';
    add_tab.appendChild(td_submit);
}
mkAddTableRow();

getId('submit_add').addEventListener('click', submitAdd);

function reasonSelect() { // 製作固定理由
    const fixed_reason = ['', '買食物', '買飲料', '其他'];
    var td_reason_select = document.createElement('datalist');
    for (let i = 0;i < fixed_reason.length;i++) {
        let td_reason_option = document.createElement('option');
        td_reason_option.value = fixed_reason[i];
        td_reason_option.innerHTML = fixed_reason[i];
        td_reason_select.appendChild(td_reason_option);
    }
    td_reason_select.id = 'add_reason';
    return td_reason_select;
}

async function submitAdd() { // 送出新增帳務記錄 
    var all_reason = [];
    var all_money = [];
    var all_mark = [];
    for (let i = 0;i < total_row;i++) { // 可能一次新增多筆帳務
        // 若理由不為空，且金額為數字就可以新增
        if (getId('add_reason'+i).value != "" && Number.isInteger(parseInt(getId('add_money'+i).value))) {
            all_reason.push(getId('add_reason'+i).value);
            all_money.push(parseInt(getId('add_money'+i).value));
            all_mark.push(getId('add_mark'+i).value);
        }
    }
    const {data : user} = await axios.get('/viewPa/nId');
    data = {all_reason : all_reason, all_money : all_money, all_mark : all_mark, aId : user.nId};
    const {data : result} = await axios.post('/financial_today/addFinancial', data);
    if (result.suc) {
        alert('新增成功！')
    }
    else {
        alert('新增失敗' + result.error_txt);
    }
    // 不管成功或失敗都重整葉面
    window.location.reload();
}

function reasonText(reason) {
    text_part = reason.split(',')[0];
    return text_part;
}

function reasonId(reason) {
    text_part = reason.split(',')[1];
    return text_part;
}

function lessTime(times) { // 把時間弄得好看一點
    if (times == null) // 如果還沒有時間
        return null;
    var new_time = '';
    for (let i = 0;i < times.length-5;i++) { // 不要後面五個字元
        if (times[i] == 'T') { // 把 T 換掉
            new_time += '\n';
            continue;
        }
        new_time += times[i];
    }
    return new_time;
}

function getDetailId(reason_type, reason_id) { // 依照是否是有理由對應編號回傳元素
    var this_detail;
    if (reason_type) { // 有理由對應編號，回傳 button
        this_detail = "<button onclick = 'showDetail(" + reason_type + ", " + reason_id + ")'>" + reason_id + "</button>";
    }
    else { // 沒有對應編號，回傳純文字
        this_detail = reason_id;
    }
    return this_detail;
}

async function getReasonType(reason) {
    const patient_type = ['掛號費', '押金', '自費', '部份負擔', '醫生更動。自費', '醫生更動。部分負擔', '醫生更動。掛號費'];
    var minus = ['借出', '遺失', '賣出', '還出', '售出']; // 減少數量的動作
    if (patient_type.includes(reason)) { // 看診
        return 1;
    }
    else if (reason.includes('藥物')) { // 藥物
        for (let i = 0;i < minus.length;i++) { // 減少的
            if (reason.includes(minus[i])) {
                return 2;
            }
        }
        // 增加的
        return 3;
    }
    else {
        return null;
    }
}

async function showDetail(reason_type, reason_id) {
    try {
        if (!reason_type || !reason_id) {
            alert('無此細項！');
            return;
        }
    }
    catch(e) {
        alert('無此細項！');
        return;
    }
    if (reason_type == 1) {
        const {data : result} = await axios.post('/financial/showDetail', {reason_type : reason_type, rId : reason_id});
        if (result.suc) {
            var record_content = result.result[0];
            const pId = record_content.pId;
            var {data : patient_info} = await axios.post('/getSinglePatient', {pId : pId});
            patient_info = patient_info.result[0];
            // 要顯示的細項內容
            var show_text = '病單號：' + reason_id + '。看診日期：' + onlyDate(record_content.start) + '。病人姓名：' + patient_info.name +
            '。性別：' + patient_info.sex + '。身份證字號：' + patient_info.id + '。';
            showLight(show_text);
        }
        else {
            alert('細項查詢錯誤！');
        }
    }
    else if (reason_type == 2) {
        const {data : result} = await axios.post('/financial/showDetail', {reason_type : reason_type, rId : reason_id});
        //var {data : patient_info} = await axios.post('/getSinglePatient', {pId : pId});
        if (result.suc) {
            var data = result.result[0];
            // 要顯示的細項內容
            var show_text = '藥物使用編號：' + data.no + '。藥物代碼：' + data.code + '。使用日期：' + onlyDate(data.time) + '。<br/>負責人員：' + data.aId
            + '。使用量：' + data.quantity + '。理由：' + data.reason + '。';
            showLight(show_text);
        }
    }
    else if (reason_type == 3) {
        const {data : result} = await axios.post('/financial/showDetail', {reason_type : reason_type, rId : reason_id});
        //var {data : patient_info} = await axios.post('/getSinglePatient', {pId : pId});
        if (result.suc) {
            var data = result.result[0];
            // 要顯示的細項內容
            var show_text = '藥物庫存編號：' + data.no + '。藥物代碼：' + data.code + '。使用日期：' + onlyDate(data.purchase_date) + '。<br/>負責人員：' + data.aId
            + '。原始數量：' + data.quantity + '。理由：' + data.reason + '。註解：' + data.mark + '。';
            showLight(show_text);
        }
    }
}

function showLight(text) {
    getId('light').innerHTML = text;
    getId('light').innerHTML += '<br/>' + original_light;
    getId('light').style.display='block';
    getId('fade').style.display='block';
}

function onlyDate(times) { // 把時間弄得好看一點
    if (times == null) // 如果還沒有時間
        return null;
    var new_time = '';
    for (let i = 0;i < times.length;i++) { // 不要後面五個字元
        if (times[i] == 'T') { // 把 T 換掉
            break;
        }
        new_time += times[i];
    }
    return new_time;
}

function closeWindow() { // 關閉視窗
    getId('light').style.display='none';
    getId('fade').style.display='none';
}

(async() => { // 放入今日帳務金額
    const {data : financial} = await axios.get('/today_financial');
    for (let i = 0;i < financial.length;i++) {
        var reason_id = `${reasonId(financial[i].reason) ? reasonId(financial[i].reason) : '無'}`;
        var reason = reasonText(financial[i].reason); // 切割理由
        var reason_type = await getReasonType(reason); // 不同理由回傳其不同型態
        var this_detail = getDetailId(reason_type, reason_id); // 依照是否是有理由對應編號回傳元素
        tab.innerHTML += "<tr id = 'log_row" + i + "'/><td/>" + financial[i].no + 
        "<td>" + lessTime(financial[i].times) + "</td>" +
        "<td>" + financial[i].aId + "</td>" +
        "<td>" + reasonText(financial[i].reason) + "</td>" +
        "<td>" + this_detail + "</td>" +
        `<td><input id = 'money_${i}' type = 'input' style = 'width:100px' value = '${financial[i].money}'></input></td>` +
        "<td>" + financial[i].mark + "</td>" +
        `<td><input id = 'changed_reason_${i}' type = 'input' style = 'width:100px;' ></input></td></tr>`;
        total_money += financial[i].money;
        //getId("money_"+i).addEventListener('change', changed_list); // 監聽錢
        //getId('changed_reason_'+i).addEventListener('change', changed_list); // 監聽更改理由
    }
    getId('total_money').innerHTML = "$ " + total_money;
    moneyChange(financial.length);
})();