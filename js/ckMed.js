function getId(id) {
    return document.getElementById(id);
}

getId('search_bt').addEventListener('click', search);

function during(now_time, end) { // 檢查是否在過濾條件的時間內
    var curDate = new Date();
    var today = curDate.getFullYear() + '/' + (curDate.getMonth() + 1) + '/' + curDate.getDate(); // 當日
    today = new Date(today);
    var in_week = new Date();
    in_week.setDate(in_week.getDate() - 7);
    var week = in_week.getFullYear() + '/' + (in_week.getMonth() + 1) + '/' + in_week.getDate();
    week = new Date(week); // 七日內
    var in_month = new Date();
    in_month.setDate(in_month.getDate() - 30);
    var month = in_month.getFullYear() + '/' + (in_month.getMonth() + 1) + '/' + in_month.getDate();
    month = new Date(month); // 三十天內
    if (end == "day") {
        var endDate = today;
    }
    else if (end == "week") {
        var endDate = week;
    }
    else if (end == 'month') {
        var endDate = month;
    }
    else { // 條件為預設，列出全部
        return true;
    }
    // 是否在時間內
    if (now_time <= today && now_time >= endDate) {
        return true;
    }
    return false;
}

function makeDate(text) {
    var only_date = '';
    for (let i = 0;i < 10;i++) {
        if (text[i] == "-") {
            only_date += "/";
        }
        else {
            only_date += text[i];
        }
    }
    return new Date(only_date);
}

function search() { // 按下搜尋
    var new_text = ""; // 要新放進去的內容
    var count_index = 0; // 總共要放幾筆
    new_text += "<tr><td>編號</td><td>理由</td><td>藥碼</td><td>中文名稱</td><td>英文名稱</td><td>進貨日期</td><td>過期日期</td><td>負責人</td><td>數量</td><td>費用</td><td>註記</td></tr>"; // 表頭
    for (let i = 1;i < getId('tab1').getElementsByTagName('tr').length;i++) { // 從另外一個 tab 抓資料
        if (during(makeDate(getId('tab1').getElementsByTagName('tr')[i].getElementsByTagName('td')[5].innerHTML), getId('search').value)) { // 在區間內
            count_index += 1;
            new_text += getId('tab1').getElementsByTagName('tr')[i].innerHTML + "</tr><tr>"; // 加入內容
        }
    }
    mkDoc(count_index); // 重新用分頁標籤
    getId('tab').innerHTML = new_text; // 更新內容
}

(async() => {
    getId('light').style.display='block';
    getId('fade').style.display='block';
    // 藥品因買賣等理由增減的紀錄
    var {data : med_inventory_each} = await axios.get('/med_inventory_each');
    // 藥品因醫生看診增減的紀錄
    const {data : each_use_medicines} = await axios.get('/each_use_medicines');
    med_inventory_each = med_inventory_each.concat(each_use_medicines.records);
    med_inventory_each = bSort(med_inventory_each); // 依照進貨日期從近而遠排序
    const {data : medicines} = await axios.get('/medicines_normal');
    const {data : expense} = await axios.get('/expense');
    const {data : financial} = await axios.get('/total_financial');
    getId('light').style.display='none';
    getId('fade').style.display='none';
    var emId = '';
    var cost_emId = [];
    for (let i = 0;i < financial.length;i++) {
        if (financial[i].reason.includes('藥物')) { // 是藥物的收支
            for (let j = 3;j < financial[i].reason.length;j++) {
                emId += financial[i].reason[j]; // 找出單筆藥品的 no
            }
            cost_emId.push({[emId]:financial[i].money});
            emId = '';
        }
    }
    var cost = null; // 藥品的費用，有可能沒有，先設 null
    var count_index = 0; // 總共要放幾筆
    for (let i = 0;i < med_inventory_each.length;i++) { // 單筆藥品
        for (let k = 0;k < medicines.length;k++) { // 查詢藥品資料
            if (med_inventory_each[i].code == medicines[k].code) { // 藥碼相同
                cost = null;
                for (let j = 0;j < cost_emId.length;j++) {
                    if (Object.keys(cost_emId[j]) == med_inventory_each[i].no)
                        cost = Object.values(cost_emId[j]);
                }
                count_index += 1;
                // 進貨時間，如果是看診就是開始時間
                var time = med_inventory_each[i].purchase_date ? med_inventory_each[i].purchase_date : med_inventory_each[i].time;
                // 下面的隱藏起來，就不用再去抓
                tab1.innerHTML += "<tr id = 'log_row'" + i + "/><td/>" + med_inventory_each[i].no + 
                "<td>" + med_inventory_each[i].reason + "</td>" +
                "<td>" + med_inventory_each[i].code + "</td>" +
                "<td>" + medicines[k].medi_mand + "</td>" +
                "<td>" + medicines[k].medi_eng + "</td>" +
                "<td>" + lessTime(time) + "</td>" +
                "<td>" + `${med_inventory_each[i].expire ? med_inventory_each[i].expire : '無'}` + "</td>" +
                "<td>" + med_inventory_each[i].aId + "</td>" +
                "<td>" + med_inventory_each[i].quantity + "</td>" +
                "<td>" + `${cost ? cost : '無'}` + "</td>" +
                "<td>" + med_inventory_each[i].mark + "</td></tr>" 
                break;
            }
        }
    }
    mkDoc(count_index);
})();

function bSort(arr) { // bubble sort 排序購買時間和開藥時間
    for (let i = 0;i < arr.length-1;i++) {
        for (let j = 0;j < arr.length-1;j++) {
            var time = arr[j].purchase_date ? arr[j].purchase_date : arr[j].time;
            var times = arr[j+1].purchase_date ? arr[j+1].purchase_date : arr[j+1].time;
            if (time < times) {
                var temp = arr[j+1];
                arr[j+1] = arr[j];
                arr[j] = temp;
            }
        }
    }
    return arr;
}

function lessTime(times) { // 把時間弄得好看一點
    if (times == null || times == undefined) // 如果還沒有時間
        return '無';
    var new_time = '';
    for (let i = 0;i < 10;i++) { // 只要前10個字元
        if (times[i] == 'T') { // 把 T 換掉
            new_time += '\n';
            continue;
        }
        new_time += times[i];
    }
    return new_time;
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

function getId(id) {
    return document.getElementById(id);
}

// make page
let now_page = 0; // 現在的頁數

async function putRecord(page) {
    const {data : medicines} = await axios.get('/medicines_normal');
    var count_records = 0; // 總共有幾個可以放的紀錄, 不包含看完的
    var count_added_records = 0; // 真正放了幾個紀錄進 table
    total_len = 0; // when reset table, reset the total_len too
    getId("tab").innerHTML = ""; // 每次重新點, 都清空 table
    await tabTitle(); // 製作 tab title
    var new_text = ""; // 要新放進去的內容
    var count_index = 0; // 總共要放幾筆
    new_text += "<tr><td>理由對應編號</td><td>理由</td><td>藥碼</td><td>中文名稱</td><td>英文名稱</td><td>進貨日期</td><td>過期日期</td><td>負責人</td><td>數量</td><td>費用</td><td>註記</td></tr>"; // 表頭
    for (let i = 1;i < getId('tab1').getElementsByTagName('tr').length;i++) { // 從另外一個 tab 抓資料
        if (during(makeDate(getId('tab1').getElementsByTagName('tr')[i].getElementsByTagName('td')[5].innerHTML), getId('search').value)) { // 在區間內
            count_records++; // 計算總共有加了幾筆紀錄
            if (count_records <= (page-1) * limit_records) // 還沒到可以放進去的 index
                continue; // 重找
            if (count_added_records >= limit_records) // 真正放進去的紀錄不能超過限制的次數
                break; // 停止
            count_added_records++; // 真正放進去的次數
            count_index += 1;
            new_text += getId('tab1').getElementsByTagName('tr')[i].innerHTML + "</tr><tr>"; // 加入內容
        }
    }
    getId('tab').innerHTML = new_text; // 更新內容
}

var total_len = 0;
let limit_records = 9; // 頁面能顯示最大的列數量

async function tabTitle() { // 製作 table title
    const {data : user} = await axios.get('/viewPa/nId');
    getId('tab').innerHTML = 
    "<tr><td colspan = '7'>帳號：" + user.nId + "。單次批貨藥品紀錄</td>" + 
    "</tr><tr><td>理由對應編號</td><td>藥碼</td><td>藥品名稱</td><td>數量</td><td>過期日期</td><td>負責人員</td>";
}

function mkPage(page_num) { // make page with page_num
    console.log(now_page);
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
async function mkDoc(item_len) { // 製作醫生 table
    now_page = 0; // 重置現在頁數
    putRecord(1);
    const page_num = item_len; // 總物件數
    total_page_num = countPageNum(page_num); // total_page_num = all records/limit_records
    mkPageListener(total_page_num); // make listener of page list
}

function countPageNum(page_num_result) { // count page num
    let page_num = Math.floor(page_num_result/limit_records); // without float
    let page_less = page_num_result%limit_records; 
    if (page_less != 0) // is float
        page_num += 1; // add one more page
    return page_num;
}

// get key down
document.body.addEventListener('keydown', turnPage ,false) //偵測按鍵