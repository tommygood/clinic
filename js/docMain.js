function getId(id) {
    return document.getElementById(id);
}

async function callPat(pa_num, rId) { // 按下看診
    const {data : insert_suc} = await axios.post('/docMain/patStart', {dId : getId('dId'), rId : rId});
    if (!insert_suc) {
        alert('更新開診時間失敗');
        return;
    }
    // set cookie
    const {data : suc} = await axios.post('/docMain/getPa', {pa_num : pa_num, rId : rId}); // 檢查帳號的權限
    if (suc) {
        window.location.href = "/ckPatients";
    }
    else {
        alert('無此病患');
    }
}

(async() => {
    const {data : user} = await axios.get('/docMain/dId');
    const {data : rec} = await axios.get('/records');
    const {data : done} = await axios.get('/done_records');
    const {data : data} = await axios.get('/data');
    var {data : account_info} = await getTitle(user.dId);
    var title = account_info.title;
    var name = account_info.name;
    getId('dId').innerHTML = "<b>" + user.dId + "</b> 號" + title + "：" + name + "";
    getId('doc_info').innerHTML = "<b>" + user.dId + "</b> 號醫生候診清單";
    var in_patients;
    var index = 0;
    var in_done;
    for (let j = 0;j < rec.length;j++) { // 每一筆紀錄 
        in_patients = false; // 在病人的 table 裡
        in_done = false; // 還沒看過診
        for (let k = 0;k < done.length;k++) { // 是否已經看診過
            if (rec[j].no == done[k].rId) { // 看過了
                in_done = true;
                break;
            }
        }
        if (in_done) // 看過了
            continue; // 找下一個
        for (let i = 0;i < data.length;i++) { // left join 到 patients
            if (rec[j].pId == data[i].pId && rec[j].dId == user.dId) { // 病人代號相同且醫生代號相同
                in_patients = true;
                var no_card = 0; // 是否未帶卡
                tab.innerHTML += 
                "<tr" + " id = 'log_row" + j + "'/><td/>"+ rec[j].no  +  
                "<td>" + rec[j].num + "</td>" +
                "<td>" + lessTime(rec[j].start) + "</td>" +
                "<td>" + data[i].name + "</td>" +
                "<td>" + data[i].sex + "</td>" +
                "<td>" + lessBirth(data[i].birth) + "</td>" +
                "<td>" + data[i].tel1 + "</td>" +
                "<td>" + data[i].tel2 + "</td>" +
                "<td>" + rec[j].mark + "</td>" + 
                "<td>" + rec[j].regist + "</td>" +
                "<td>" + rec[j].self_part + "</td>" +
                "<td>" + rec[j].all_self + "</td>" +
                "<td>" + rec[j].deposit + "</td>" +
                "<td><button id = '" + j + "' type = 'button' onclick = 'callPat(" + index + "," + rec[j].no + ")'(>看診</button></td></tr>"  
                index += 1;
            }
        }
        if (!in_patients && rec[j].dId == user.dId) { // 不在病患中，未帶卡或預約
            tab.innerHTML += 
            "<tr" + " id = 'log_row" + j + "'/><td/>"+ rec[j].no  + 
            "<td>" + rec[j].num + "</td>" +
            "<td>" + rec[j].start + "</td>" +
            "<td>" + null + "</td>" +
            "<td>" + null + "</td>" +
            "<td>" + null + "</td>" +
            "<td>" + null + "</td>" +
            "<td>" + null + "</td>" +
            "<td>" + rec[j].mark + "</td>" + 
            "<td>" + rec[j].regist + "</td>" +
            "<td>" + rec[j].self_part + "</td>" +
            "<td>" + rec[j].all_self + "</td>" +
            "<td>" + rec[j].deposit + "</td>" + 
            "<td><button id = '" + j + "' type = 'button' onclick = 'callPat(" + index + "," + rec[j].no +")'(>看診</button></td></tr>"  
            index += 1;
            var no_card_id = "log_row" + j;
            document.getElementById(no_card_id).style.backgroundColor = "red";
        }
    }
})();

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

async function getTitle(nId) { // 用帳號找職位
    var title = axios.get('/getTitle', {params : {aId : nId}});
    console.log(title);
    return title;
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