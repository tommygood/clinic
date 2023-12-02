function getId(id) {
    return document.getElementById(id);
}

(async() => { // 加入所有已結算帳務
    var {data : records} = await axios.get('/done_financial/records');
    records = records.records;
    var unchecked_num = 0;
    var checked_num = 0;
    var unchecked_total = []; // the i of uncheced
    var checked_total = []; // the if of checked
    for (let i = 0;i < records.length;i++) {
        if (records[i].is_true == null) { // the record not check yet
            var unchecked_num = unchecked_num + 1;
            unchecked_total.push(i);
            insertUnchecked(records, i); // insert unchecked record
        }
        else { // the record is checked
            var checked_num = checked_num + 1;
            checked_total.push(i);
            insertChecked(records, i);
        }
    }
    btListener(unchecked_total);
    checkedBtListener(checked_total);
})();

function insertChecked(records, i) {
    getId('checked_table').innerHTML += 
        "<tr id = 'log_row" + i + "'/><td/>" + records[i].no + 
        "<td>" + lessTime(records[i].time) + "</td>" +
        "<td>" + records[i].money + "</td>" +
        "<td>" + records[i].origin_aId + "</td>" +
        "<td>" + records[i].next_aId + "</td>" +
        "<td>" + records[i].origin_log + "</td>" + 
        "<td>" + records[i].next_log + "</td>" +
        "<td><button type = 'button' id = 'bt_" + i + "'>細項</button></td></tr>";
}

function insertUnchecked(records, i) {
    getId('uncheck_table').innerHTML += 
        "<tr id = 'log_row" + i + "'/><td/>" + records[i].no + 
        "<td>" + lessTime(records[i].time) + "</td>" +
        "<td>" + records[i].money + "</td>" +
        "<td>" + records[i].origin_aId + "</td>" +
        "<td>" + records[i].origin_log + "</td>" + 
        "<td><button type = 'button' id = 'bt_" + i + "'>細項</button></td>" +
        "<td><button type = 'button' id = 'checkbt_" + i + "'>核對</button></td></tr>";
}

function checkedBtListener(checked_total) { // make button listener with records length
    for (let i = 0;i < checked_total.length;i++) {
        // listen to each detail button
        getId('bt_'+checked_total[i]).addEventListener('click', showDetails);
    }
}

function btListener(unchecked_total) { // make button listener with records length
    for (let i = 0;i < unchecked_total.length;i++) {
        // listen to each detail button
        getId('bt_'+unchecked_total[i]).addEventListener('click', showDetails);
        // listen to each check button
        getId('checkbt_'+unchecked_total[i]).addEventListener('click', checkMoney);
    }
}

async function checkMoney(e) { // 核對金額
    var {data : records} = await axios.get('/done_financial/records');
    records = records.records;
    bt_num = mkBtNum(e.target.id);
    no = records[bt_num].no; // the num of record
    total_money = records[bt_num].money; // the money of record
    // confirm the num and money of record is right
    
    var is_sure = confirm(`編號:${no}, 總金額為:${total_money}。核對確認無誤`);
    
    // confirm true, submit 
    if (is_sure) { 
        // enter mark for this record
        const next_log = prompt('請輸入對於此紀錄的備註');
        // press cancel when enter the log, return
        if (next_log == null) {
            return;
        }
        const {data : user} = await axios.get('/viewPa/nId');
        const nId = user.nId;
        var {data : submit_check} = await axios.post("/done_financial/submit", {no : no, aId : nId, next_log : next_log});
        if (submit_check.error == '未登入')
            window.location.href = "/login";
        if (submit_check.suc) { // update done_financial set is_true = 1 successful
            alert('更新成功');
            window.location.reload();
        }
        else {
            alert('更新失敗');
            window.location.reload();
        }
    }
}

async function showDetails(e) { // show detail of this record
    var {data : records} = await axios.get('/done_financial/records');
    records = records.records;
    bt_num = mkBtNum(e.target.id);
    detail_array = detailArray(records[bt_num].details); // make detai array
    getId("checked_table").style.visibility = "hidden"; // 先把已核對紀錄隱藏，以防重疊
    putDetails(records[bt_num].no, detail_array); // put details array in 
}

async function putDetails(record_no, detail_array) { // make a detail table
    const {data : financial} = await axios.get('/total_financial');
    detailTitle(record_no); // set show_detail title
    for (let i = 0;i < detail_array.length;i++) { // each detail
        for (let j = 0;j < financial.length;j++) { // all financial records
            if (detail_array[i] == financial[j].no) { // find financial record
                putInElements(financial[j]);
            }
        }
    }
}

function detailTitle(record_no) { // set show_details table title
    getId('show_details').innerHTML = 
    "<tr><td style = 'text-align:center;' colspan = '7'>編號:" + 
    record_no + "的細項</td>" +
    "<tr><td>編號</td>" + 
    "<td>時間</td>" + 
    "<td>理由</td>" +
    "<td>金額</td>" +
    "<td>負責人員</td>" +
    "<td>備註</td></tr>";
}

function putInElements(record) { // put each detail financial record in table
    getId('show_details').innerHTML += 
    "<tr/><td/>" + record.no +
    "<td>" + lessTime(record.times) + "</td>" +
    "<td>" + record.reason + "</td>" +
    "<td>" + record.money + "</td>" +
    "<td>" + record.aId + "</td>" +
    "<td>" + record.mark + "</td></tr>";
}

function isNum(n) { // 是不是數字
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function detailArray(all_details) { // make a fId array
    if (all_details == null) // detail column is null
        return [];
    detail_array = []; // push fId in array
    all_details = all_details.split(',');
    for (let i = 0;i < all_details.length;i++) {
        // only push when element is numeric
        if (isNum(all_details[i])) 
            detail_array.push(all_details[i]); // push
    }
    return detail_array;
}

function mkBtNum(id) { // find button num from its id
    var bt_num = ""; // default is empty
    var start_num = false; // start add num character from _ 
    for (let i = 0;i < id.length;i++) {
        if (start_num) // start add
            bt_num += id[i];
        if (id[i] == "_") // start from _
            start_num = true;
    }
    return bt_num; // return num of button
}

getId("show_checked_table").addEventListener("click", () => 
{
    // switch the visibility

    // now is hidden, so turn to visible
    if (getId("checked_table").style.visibility == 'hidden') {
        getId('show_details').innerHTML = ""; // 先把顯示 detail 隱藏，防止重疊
        getId("checked_table").style.visibility = "visible";
    }
    else // now is visible, so turn to hidden
        getId("checked_table").style.visibility = "hidden";
});

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