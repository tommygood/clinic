function getId(id) {
    return document.getElementById(id);
}

const original_light = getId('light').innerHTML;

(async() => {
    const {data : financial} = await axios.get('/total_financial');
    var total_money = 0;
    for (let i = 0;i < financial.length;i++) {
        total_money += financial[i].money;
    }
    getId('total_money').innerHTML = "$ " + total_money;
})();

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
    var dash_is_breaked = false; // 只要把第一個 dash 換行，因為是年分
    for (let i = 0;i < times.length-5;i++) { // 不要後面五個字元
        if (times[i] == '-' && !dash_is_breaked) {
            new_time += ' ';
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

// make page
let now_page = 0; // 現在的頁數

async function putRecord(page) {
    const {data : financial} = await axios.get('/total_financial');
    financial.sort(function(a,b){ // 從最後看的開始排序
        return b.no - a.no;
    });
    var count_records = 0; // 總共有幾個可以放的紀錄, 不包含看完的
    var count_added_records = 0; // 真正放了幾個紀錄進 table
    total_len = 0; // when reset table, reset the total_len too
    getId("tab").innerHTML = ""; // 每次重新點, 都清空 table
    await tabTitle(); // 製作 tab title
    // 把各個批次的藥分開
    for (let i = 0;i < financial.length;i++) {
        count_records++; // 計算總共有加了幾筆紀錄
        if (count_records <= (page-1) * limit_records) // 還沒到可以放進去的 index
            continue; // 重找
        if (count_added_records >= limit_records) // 真正放進去的紀錄不能超過限制的次數
            break; // 停止
        count_added_records++; // 真正放進去的次數
        var reason_id = `${reasonId(financial[i].reason) ? reasonId(financial[i].reason) : '無'}`;
        var reason = reasonText(financial[i].reason); // 切割理由
        var reason_type = await getReasonType(reason); // 不同理由回傳其不同型態
        var this_detail = getDetailId(reason_type, reason_id); // 依照是否是有理由對應編號回傳元素
        tab.innerHTML += "<tr id = 'log_row'" + i + "/><td/>" + financial[i].no + 
        "<td>" + lessTime(financial[i].times) + "</td>" +
        "<td>" + financial[i].aId + "</td>" +
        "<td>" + reason + "</td>" + 
        this_detail +
        "<td>" + financial[i].money + "</td></tr>";
        total_money += financial[i].money;
        //getId('show_details').addEventListener('click', showDetail);
    }
    /*for (let i = 0;i < document.querySelectorAll("[id='show_details']").length;i++) { // 加上觸發事件
        document.querySelectorAll("[id='show_details']")[i].addEventListener('click', showDetail)
    }*/
}

var total_len = 0;
let limit_records = 12; // 頁面能顯示最大的列數量

function getDetailId(reason_type, reason_id) { // 依照是否是有理由對應編號回傳元素
    var this_detail;
    if (reason_type) { // 有理由對應編號，回傳 button
        this_detail = "<td><button onclick = 'showDetail(" + reason_type + ", " + reason_id + ")'>" + reason_id + "</button></td>";
    }
    else { // 沒有對應編號，回傳純文字
        this_detail = "<td>" + reason_id + "</td>";
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

async function tabTitle() { // 製作 table title
    const {data : user} = await axios.get('/viewPa/nId');
    getId('tab').innerHTML = 
    "<tr><td colspan = '7'>總帳務紀錄</td>" + 
    "</tr><tr><td>編號</td><td>時間</td><td>負責人員</td><td>理由</td><td>理由對應編號</td><td>金額</td>";
}

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
    putRecord(now_page+1); // 把紀錄放進 table, 現在是第幾個 table, 第幾頁
};

let total_page_num;
async function mkDoc(e) { // 製作醫生 table
    //now_page = 0;
    if (e == 'first') {
        var tab_id = 1;
    }
    else {
        var tab_id = getDid(e.target.id); // 取得 dId
    }
    now_table = tab_id;
    //mkTable(tab_id); // 製作該 id 的 table
    putRecord(tab_id);
    const {data : user} = await axios.get('/viewPa/nId');
    const page_num = axios.get('/getPageNum', {params : {all_financial : true}});
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

mkDoc('first');

// get key down
document.body.addEventListener('keydown', turnPage ,false) //偵測按鍵

function closeWindow() { // 關閉視窗
    getId('light').style.display='none';
    getId('fade').style.display='none';
}