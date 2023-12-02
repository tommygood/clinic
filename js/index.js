var all_tab = [1, 3]; // 全部的 table id 
var now_table; // which doctor table is used
let limit_records = 15; // 頁面能顯示最大的頁面數量

function getId(id) {
    return document.getElementById(id);
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

function mkTable(tab_id) { // 依照醫生數量，製作 table
        getId('tab_pos').innerHTML = 
        `<table class = 'position-absolute ' id = 'tab${tab_id}' border = '2' align = center>` +
        "<tr>" + 
        "<td style = 'text-align:center;' colspan = 20>" + 
        `Doc.${tab_id}` +  
        "</td>" +
        "</tr>" + 
        "<tr>" + 
        "<td><span id = 'num'>看診號</span></td>" + 
        "<td><span id = 'in'>狀態</span></td>" + 
        "<td><span id = 'pat_name'>姓名</span></td>" +
    "</tr>" +
    "</table>" +
    "<div>&nbsp;</div>"
}

function listenDocBt() { // addEventListener on all doc bt
    for (let i = 0;i < all_tab.length;i++) {
        getId('doc'+all_tab[i]).addEventListener('click', mkDoc); // 
    }
}   

listenDocBt(); // listen to doc bt

async function mkDoc(e) {
    var tab_id = getDid(e.target.id); // 取得 dId
    now_table = tab_id;
    mkTable(tab_id); // 製作該 id 的 table
    putRecord(tab_id, 1);
    // make page
    const page_num = axios.get('/getPageNum', {params : {dId : tab_id}});
    page_num.then(function(result) { // make page
        var page_num_result = {data : result}.data.data.page_num; // total records num
        let total_page_num = countPageNum(page_num_result); // total_page_num = all records/limit_records
        mkPageListener(total_page_num); // make listener of page list 
    });
}

var index = 0;
async function putRecord(dId, page) { // 把紀錄放進去 table
    var {data : records} = await axios.get("index_records");
    var {data : patients} = await axios.get("index_patients");
    var in_patients;
    var count_records = 0; // 總共有幾個可以放的紀錄, 不包含看完的
    var count_added_records = 0; // 真正放了幾個紀錄進 table
    total_len = 0; // when reset table, reset the total_len too
    getId("tab"+now_table).innerHTML = ""; // 每次重新點, 都清空 table
    mkTable(dId); // 製作該 id 的 table
    // 排序
    records.records.sort(function(a,b){ 
        return a.num - b.num;
    });
    for (let j = 0;j < records.records.length;j++) { // 每一筆紀錄 
        if (records.records[j].dId != dId) // 不是此醫生
            continue;
        in_patients = false; // 是否在病人名單內
        // 分頁 分配
        count_records++; // 計算總共有加了幾筆紀錄
        if (count_records <= (page-1) * limit_records) // 還沒到可以放進去的 index
            continue; // 重找
        if (count_added_records >= limit_records) // 真正放進去的紀錄不能超過限制的次數
            break; // 停止
        count_added_records++; // 真正放進去的次數
        for (let i = 0;i < patients.records.length;i++) { // left join 到 patients
            if (records.records[j].pId == patients.records[i].pId) { // 病人代號相同
                in_patients = true;
                var no_card = 0; // 是否未帶卡
                var tab_name = "tab"+ records.records[j].dId;
                getId(tab_name).innerHTML += 
                "<tbody id = 'tbody'" + total_len + "'><tr/><td/>" + 
                records.records[j].num + 
                "<td>" + (records.records[j].in ? '報到' : '未報到') + "</td>" + 
                "<td>" + patients.records[i]["name"] + "</td></tr>"
                // if value == 1, checkbox default checked
                total_len += 1;
                break;
            }
        }
        if (!in_patients) { // 不在病患中，未帶卡或預約
            var tab_name = "tab"+ records.records[j].dId;
            getId(tab_name).innerHTML += 
            "<tbody id = 'tbody'" + total_len + "'><tr" + " id = 'log_row" + total_len + "'/><td/>"+  
            records.records[j].num + 
            "<td>" + (records.records[j].in ? '報到' : '未報到') + "</td>" + 
            "<td>" + '無' + "</td></tr>";
            var no_card_id = "log_row" + total_len;
            document.getElementById(no_card_id).style.backgroundColor = "red";
            total_len += 1;
        }
    }
}

function countPageNum(page_num_result) { // count page num
    let page_num = Math.floor(page_num_result/limit_records); // without float
    let page_less = page_num_result%limit_records; 
    if (page_less != 0) // is float
        page_num += 1; // add one more page
    return page_num;
}

function mkPageListener(page_num) { // 依照 page 的數量監聽
    mkPage(page_num);
    for (let i = 1;i < page_num+1;i++) // 從第一頁開始監聽
        getId('page_'+i).addEventListener('click', turnPage); // put records in table depend on page num
}

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

function turnPage(e) { // 翻頁
    //putRecord(now_table, e.path[0].innerHTML); // 把紀錄放進 table, 現在是第幾個 table, 第幾頁
    putRecord(now_table, e.target.innerHTML); // 把紀錄放進 table, 現在是第幾個 table, 第幾頁
};

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