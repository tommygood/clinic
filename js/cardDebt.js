function getId(id) {
    return document.getElementById(id);
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

// total debt rId
var total_debt_rId = [];
// total debt index
var total_debt = [];
// put records
(async() => {
    var {data : no_card} = await axios.get('/no_card');
    no_card = no_card.no_card;
    for (let i = 0;i < no_card.length;i++) {
        // had returned card
        if (no_card[i].status) {
            putReturn(no_card[i], i);
        }
        // not return yet
        else {
            total_debt.push(i);
            total_debt_rId.push(no_card[i].rId);
            await putDebt(no_card[i], i); // 要等找病患資訊
        }
    }
    // listen to return button
    btListener(total_debt);
})();

// listen to returned button 
async function btListener(total_debt) {
    for (let i = 0;i < total_debt.length;i++) {
        getId('return_'+total_debt[i]).addEventListener('click', returnCard);
    }
}

// return card
async function returnCard(e) {
    // get button real id 
    var bt_id = Number(getBtId(e.target.id));
    // coresponded record index
    var record_index = total_debt.indexOf(bt_id);
    // coresponded rId
    var rId = total_debt_rId[record_index];
    // set rId cookie
    var is_confirm = confirm(`歸還卡片，病單號 ${rId}`);
    // not confirm
    if (!is_confirm)
        return;
    const {data : user} = await axios.get('/viewPa/nId');
    const {data : result} = await axios.post('/viewPa/submitUpdatePa', {rId : rId, aId : user.nId});
    if (result.suc) { // 是否還卡成功
        location.reload();
    }
    else {
        alert('還卡失敗');
        location.reload();
    }
}

function getBtId(id) { // get real id from button id
    var only_id = '';
    // start add real id 
    var start_add = false;
    for (let i = 0;i < id.length;i++) {
        if (start_add) {
            only_id += id[i];
        }
        // start to add 
        if (id[i] == "_") {
            start_add = true;
        }
    }
    return only_id;
}

// put debt records element
async function putDebt(record, i) {
    var {data : patients} = await axios.get('/data');
    var name = '無';
    var id = '無';
    for (let i = 0;i < patients.length;i++) {
        if (record.pId == patients[i].pId) {
            name = patients[i].name;
            id = patients[i].id;
            break;
        }
    }
    tab.innerHTML += "<tr id = 'log_row'" + i + "/><td/>" + record.rId + 
        "<td>" + name + "</td>" +
        "<td>" + id + "</td>" +
        "<td>" + lessTime(record.time) + "</td>" +
        "<td><button id = 'return_" + i + "'>還卡</button></td></tr>";
}

// put returned records element
function putReturn(record, i) {
    tab_return.innerHTML += "<tr id = 'log_row'" + i + "/><td/>" + record.rId + 
        "<td>" + lessTime(record.time) + "</td></tr>";
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