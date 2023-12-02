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

function getId(id) {
    return document.getElementById(id);
}

// make page
let now_page = 0; // 現在的頁數

async function putRecord(page) {
    const {data : user} = await axios.get('/viewPa/nId');
    const {data : med_inventory_each} = await axios.get('/med_inventory_each', {params : {aId : user.nId}});
    const {data : medicines} = await axios.get('/medicines_normal');
    med_inventory_each.sort(function(a,b){ // 從最後看的開始排序
        return b.no - a.no;
    });
    var count_records = 0; // 總共有幾個可以放的紀錄, 不包含看完的
    var count_added_records = 0; // 真正放了幾個紀錄進 table
    total_len = 0; // when reset table, reset the total_len too
    getId("tab").innerHTML = ""; // 每次重新點, 都清空 table
    await tabTitle(); // 製作 tab title
    // 把各個批次的藥分開
    for (let i = 0;i < med_inventory_each.length;i++) {
            //console.log(med_inventory_each[i]);
        count_records++; // 計算總共有加了幾筆紀錄
        if (count_records <= (page-1) * limit_records) // 還沒到可以放進去的 index
            continue; // 重找
        if (count_added_records >= limit_records) // 真正放進去的紀錄不能超過限制的次數
            break; // 停止
        count_added_records++; // 真正放進去的次數
        for (let k = 0;k < medicines.length;k++) {
            if (med_inventory_each[i].code == medicines[k].code) { // 藥碼相同，有此筆藥的資訊  
                tab.innerHTML += "<tr id = 'each_row'" + i + "/><td/>" + med_inventory_each[i].no + 
                "<td>" + med_inventory_each[i].code + "</td>" +
                "<td id = 'medi_name'>" + medicines[k].medi_eng + "</td>" +
                "<td>" + parseFloat(med_inventory_each[i].quantity) + "</td>" + 
                "<td>" + parseFloat(med_inventory_each[i].now_quantity) + "</td>" + 
                "<td>" + lessTime(med_inventory_each[i].purchase_date) + "</td>" +
                "<td>" + med_inventory_each[i].expire + "</td>" +
                "<td>" + med_inventory_each[i].aId + "</td></tr>";
                break;
            }
        }
    }
}

var total_len = 0;
let limit_records = 14; // 頁面能顯示最大的列數量

async function tabTitle() { // 製作 table title
    const {data : user} = await axios.get('/viewPa/nId');
    getId('tab').innerHTML = 
    "<tr><td colspan = '8'>帳號：" + user.nId + "。單次批貨藥品紀錄</td>" + 
    "</tr><tr><td>編號</td><td>藥碼</td><td>藥品名稱</td><td>原始數量</td><td>目前數量</td><td>進貨日期</td><td>過期日期</td><td>負責人員</td>";
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
    const page_num = axios.get('/getPageNum', {params : {all_med : true, aId : user.nId}});
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