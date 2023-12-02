var rId;
var pId;
var is_submit = false; // 離開網頁是否是完診
var default_medicine_input_num = 10;
var medicine_input_num = default_medicine_input_num; // total medicines row number
//var new_medicine_input_num = medicine_input_num;
mkInput();
(async() => {
    const {data : rec} = await axios.get('/records');
    const {data : pa_num} = await axios.get('/ckPatients/rNum');
    const {data : info} = await axios.get('/data');
    const {data : dId} = await axios.get('/docMain/dId');
    const {data : done_records} = await axios.get('/done_records'); // done records
    //console.log(pa_num.rId);
    getId('dId').innerHTML = Object.values(dId);
    for (let i = 0;i < done_records.length;i++) { // 先檢查這筆紀錄是否已經看完, 因有可能是醫生檢查已看診病歷
        if (pa_num.rId == done_records[i].rId) { // 看完的
            const {data : all_record} = await axios.post('/docMain/all_record', {rId : pa_num.rId, check_first : true});
            if (Object.values(all_record)[1] && Object.values(all_record)[2]) // whether both record not empty
                insertRecords(Object.values(all_record)[1], Object.values(all_record)[2]); // put the record in
            // put done record fee and the patient info in table
            patientInfo(pa_num.rId);
            return;
        }
    }
    
    rec.sort(function(a,b){
        return a.num - b.num;
    });
    const this_doc = []; // only this doctor's records
    var done = false; // whether the record is done
    for (let i = 0;i < rec.length;i++) { // push records in array, which only have this doctor
        done = false;
        for (let j = 0;j < done_records.length;j++) {
            if (rec[i].no == done_records[j].rId) { // this records had done
                done = true;
            }
        }
        if (rec[i].dId == dId.dId && !done) { // same doctor and not done yet
            this_doc.push(rec[i]);
        }
    }
    rec.sort(function(a,b){
        return a.num - b.num;
    });
    var local_rId;
    for (let i = 0;i < this_doc.length;i++) { // 這個醫生的未看診紀錄
        if (this_doc[i].no == pa_num.rId) { // 找其中有和 cookie 中的 rId 相符的紀錄
            local_rId = pa_num.rId;
        }
    }
    document.getElementById('rId').value = local_rId;
    rId = local_rId; // 全域的 rId
    patientInfo(rId); // put the fee of the records and info of patient in
    recordDetail(todayDate(), rId, '<b>(當前)</b>'); // 放入當前病單號和今日日期
    const {data : check_record} = await axios.post('/docMain/check_record', {rId : rId, aId : getId('dId').innerHTML, pId : pId});
})();

async function patientInfo(rId) { // put patient info, record fee in
    const {data : info} = await axios.get('/data');
    const {data : getFee} = await axios.get('docMain/getFee', {params : {rId : rId}});
    const {data : getPId} = await axios.get('/docMain/getPId', {params : {rId : rId}});
    const {data : getDeposit} = await axios.get('/docMain/getDeposit', {params : {rId : rId}});
    is_deposit = parseInt(getDeposit.is_depo);
    pId = getPId.pId[0].pId; // pId
    const fee = getFee.fee[0]; // three kinds of fee
    var not_null = true; // 是否沒有 pId
    if (pId == null) { // 沒有 pId
        not_null = false;
        tab.innerHTML += "<tr/><td/>"+ rId  + 
        "<td>" + null + "</td>" +
        "<td>" + null + "</td>" +
        "<td>" + null + "</td>" +
        "<td>" + null + "</td>" +
        "<td>" + null + "</td>" +
        "<td>" + null + "</td>" +
        "<td>" + null + "</td>" +
        "<td>" + null + "</td>" +
        "<td>" + null + "</td>" + 
        "<td>" + null + "</td>" +
        "<td>" + null + "</td>" + 
        "<td ><input type = 'text' id = 'regist' style = 'width:50px' value = '" + fee.regist + "'></input></td>" +
        "<td><input type = 'text' id = 'self_part' style = 'width:50px' value = '" + fee.self_part + "'></input></td>" +
        "<td><input type = 'text' id = 'all_self' style = 'width:50px' value = '" + fee.all_self + "'></input></td></tr>"
    }
    if (not_null) { // 有 pId
        //pId = this_doc[pa_num.pa_num].pId;
        for (let j = 0;j < info.length;j++) { // find the patient
            if (pId == info[j].pId) { // same pId
                findFamily(pId);
                in_patients = true;
            //document.getElementById('r_num').value = this_doc[pa_num.pa_num].r_num;
                //document.getElementById('rId').value = this_doc[pa_num.pa_num].no;
            //document.getElementById('nrId').value = this_doc[pa_num.pa_num].nrId;
                checkVac(rId);
                tab.innerHTML += "<tr" + j + "/><td/>"+ rId  + 
                "<td id = 'patient_name'>" + info[j].name + "</td>" +
                "<td>" + info[j].birth + "</td>" +
                "<td>" + info[j].sex + "</td>" +
                "<td>" + mkAge(info[j].birth) + "</td>" +
                "<td>" + `${is_deposit ? '有' : '無'}` + "</td>" +
                "<td>" + info[j].pass + "</td>" +
                "<td>" + info[j].allergy + "</td>" +
                "<td>" + info[j].hate + "</td>" +
                "<td>" + info[j].mark + "</td>" + 
                "<td id = 'patient_weight'>" + info[j].weight + "</td>" +
                "<td id = 'patient_height'>" + info[j].height + "</td>" +
                "<td ><input type = 'text' id = 'regist' style = 'width:50px' value = '" + fee.regist + "'></input></td>" +
                "<td><input type = 'text' id = 'self_part' style = 'width:50px' value = '" + fee.self_part + "'></input></td>" +
                "<td><input type = 'text' id = 'all_self' style = 'width:50px' value = '" + fee.all_self + "'></input></td></tr>"
                break;
            }
        }
    }
    findRecommand('recommand_table');
    findMediRecommand('recommand_medi_table');
}

function getId(id) {
    return document.getElementById(id);
}

getId("diagnose_code").addEventListener('change', outSymptoms); // 當搜尋內容有改變

var symptoms = null; // 所有症狀，先設 null
var now_symptom_index; // 現在的診斷碼
var now_symptom_eng; // 現在的診斷的英文名稱
async function outSymptoms() { // 印出症狀
    findRecommand('recommand_table');
    findMediRecommand('recommand_medi_table');
    if (symptoms == null) { // 第一次讀取症狀，才要去撈資料庫
        const {data : symptoms_data} = await axios.get('/symptoms');
        symptoms = symptoms_data // 放入檔案
        for (let i = 0;i < symptoms.length;i++) { // 找出對應症狀
            if (symptoms[i].index == getId('diagnose_code').value) {
                now_symptom_eng = symptoms[i].eng_name;
                now_symptom_index = symptoms[i].index;
                getId('diagnose').innerHTML = "<b>" + symptoms[i].eng_name + "</b>";
            }
        }
    }
    else {
        for (let i = 0;i < symptoms.length;i++) {
            if (symptoms[i].index == getId('diagnose_code').value) {
                now_symptom_eng = symptoms[i].eng_name;
                now_symptom_index = symptoms[i].index;
                getId('diagnose').innerHTML = "<b>" + symptoms[i].eng_name + "</b>";
            }
        }
    }
}

document.addEventListener("keyup", async(event) => {
    // 總共需要檢查快捷的格
    var check_hot = ["main_sue"]
    // append medicine in hot_key array with total medicine input num
    for (let i = 0;i < medicine_input_num*2;i++) 
        check_hot.push('medicines'+i);
    for (let num = 0;num < check_hot.length;num++) {
        const {data : hot_key} = await axios.get('hot_key');
        var main_sue = getId(check_hot[num]).value;
        if (event.keyCode == 13 && main_sue.includes("/")) {
            var relative = "";
            var start_add = false;
            var replace_pos = [];
            for (let i = 0;i < main_sue.length;i++) {
                if (start_add) {
                    if (main_sue[i] == " " || main_sue[i] == "\n") { // 遇到空白或換行就不要算之後的
                        start_add = false; // 停止繼續加
                    }
                    else { // 加上 / 後的值
                        relative += main_sue[i];
                        replace_pos.push(i);
                    }
                }
                if (main_sue[i] == "/") {
                    replace_pos.push(i);
                    start_add = true;
                }
            }
            var replace_name;
            for (let i = 0;i < hot_key.length;i++) {
                if (hot_key[i].relative == relative) {
                    getId(check_hot[num]).value += hot_key[i].real_name;
                    replace_name = hot_key[i].real_name;
                }
            }
            if (replace_name == undefined) { // 換短一點的比較好刪
                replace_name = "null";
            };
            var in_replace = false; // 是否在要替換的位置
            var new_mainsue = '';
            var first_replace = false; // 是否是第一個要置換的
            for (let i = 0;i < main_sue.length;i++) {
                in_place = false;
                first_replace = false;
                if (i == replace_pos[0]) {
                    first_replace = true;
                }
                for (let j = 0;j < replace_pos.length;j++) {
                    if (i == replace_pos[j]) {
                        in_replace = true;
                    }
                }
                if (!in_replace) { // 不是要替換的
                    new_mainsue += main_sue[i];
                }
                if (first_replace) {
                    new_mainsue += replace_name;
                }
            }
            getId(check_hot[num]).value = new_mainsue;
            if (check_hot[num] != 'main_sue') { // 快捷鍵不是主訴，就代表是在藥品名稱的欄位用快捷鍵
                mkMedInfo(getId(check_hot[num]).value); // 顯示藥品資訊
            }
        }
    }
});

function listenSubmit() {
    getId('submit_bt').addEventListener('click', async(e) => { // 送出表單
        is_submit = true; // 是送出
        getId('diagnose_code_pass').value = getId('diagnose_code').value; // 放入 value
        // 要回傳的資料
        const data = {
            dId : getId('dId').innerHTML,
            all_self : getId('all_self').value, 
            self_part : getId('self_part').value, 
            regist : getId('regist').value, 
            rId : getId('rId').value, 
            diagnose_code_pass : `${isNum(getId('diagnose_code').value) ? getId('diagnose_code').value : 0}`, 
            main_sue : getId('main_sue').value, 
        }
        // 把開的藥放進去
        for (let i = 0;i < medicine_input_num*2;i++) {
            if (!checkFloat(getId('medi_amount'+i).value)) { // 檢查浮點數是否小數點後超過兩個數字
                return; // 結束
            }
            data['medicines'+i] = {medicines : getId('medicines'+i).value, medi_amount : getId('medi_amount'+i).value, day : getId('day'+i).value, method : getId('method'+i).value, medi_mark : getId('medi_mark'+i).value, put_index : i};
        }
        // 送出看診，顯示 loading 畫面
        getId('light').style.display='block';
        getId('fade').style.display='block';
        const ck_diagnose = await axios.post('/ckPatients', data);
        // 後端跑完就關掉 loading 畫面
        getId('light').style.display='none';
        getId('fade').style.display='none';
        var myInterval = setInterval(function(){ // 等待一下，讓 loading 畫面消失再顯示看診成功
            if (ck_diagnose.data.suc) { // 沒有回傳錯誤
                // 若醫生有改收費，就廣播到聊天室
                if (ck_diagnose.data.had_changed_pay != "") {
                    socket.emit("docMsg", ck_diagnose.data.had_changed_pay);
                }
                alert("看診成功！" + (ck_diagnose.data.return_text ? '\n警告：' + ck_diagnose.data.return_text : ''));
                // send finish message on chat room
                sendFinishMsg(getId('rId').value, (getId('patient_name') ? getId('patient_name').innerHTML : null));
                printPdf(); // 印出 pdf
            }
            else { // 印出錯誤
                //console.log(ck_diagnose.data.suc);
                alert('看診失敗' + (ck_diagnose.data.return_text ? '\n警告：' + ck_diagnose.data.return_text : ''));
                //var error_mes = "text :[" + ck_diagnose.data.error.text + "]。 sql : [" + ck_diagnose.data.error.sql + "]";
                is_submit = false; // 送出錯誤，把是送出改回 fasle
            };
                clearInterval(myInterval);
        },100);
        
    });
}
listenSubmit();

function sendFinishMsg(rId, patient_name) {
    // when doctor finish the record successfully, send a successful finish message on chat room;
    var dId = getId('dId').innerHTML;
    var msg = dId + " 號醫生已完診。第 " + rId + " 號病歷號，病患 : " + patient_name;
    socket.emit("docMsg", msg);
}

function checkFloat(num) { // 檢查浮點數是否小數點後超過兩個數字
    if (!num) {
        return true;
    }
    for (let i = 0;i < num.length;i++) {
        if (num[i] == ".") { // 到小數點，開始檢查
            var start_index = i;
        }
    }
    if (num.length - (start_index+1) > 2) {
        alert('小數點後最多只能兩個數字！');
        return false;
    }
    else {
        return true;
    }
}

function printPdf() { // 印出 pdf 檔
    if (confirm('是否印出？')) {
        var element = document.getElementById('content');
        var opt = { margin: [8, 8, 8, 8],
            filename: 'test',
            image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 , scrollY:0},
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
                pagebreak: { after: '.page-break' }
        }
        html2pdf(element, opt);
        setTimeout(function() { // 等一段時間再跳轉，100 會太少
            window.location.href = "/docMain";
        }, 200);
    }
    else {
        window.location.href = "/docMain";
    }
}

// listen to search last/next time record button
getId('last_records').addEventListener('click', putRecord);
getId('next_records').addEventListener('click', putRecord);
var save_current_record = true;
var save_current_record_content = '';

async function putRecord(e) { // 放入病歷
    if (save_current_record) { // 保存當前病歷
        save_current_record = false;
        cpContent('is_save');
    }
    if (e.target.id == 'next_records') { // 是下次紀錄
        if (!last_times <= 0) { // 到 0 就不要減
            last_times--; // 查看的紀錄索引 -1
        }
        if (last_times <= 0) { // 已經沒有再下次的紀錄，還原原本暫存的紀錄
            pasteContent('is_save');
            save_current_record = true; // 回到最下次，要重新暫存新的紀錄
            recordDetail(todayDate(), rId, '<b>(當前)</b>'); // 放入當前病單號和今日日期
            return;
        }
    }
    else // 是上次紀錄
        last_times++; // 查看紀錄的索引+1
    const {data : all_record} = await axios.post('/docMain/all_record', {rId : rId, aId : getId('dId').innerHTML, pId : pId, last_times : last_times});
    if (!Object.values(all_record)[0]) { // 搜尋失敗
        alert(Object.values(all_record)[1]); // 跳出錯誤訊息
        if (Object.values(all_record)[1] == '已無再之前的病歷紀錄') // 已經到最之前的病歷紀錄, 所以要減一個
            last_times -= 1;
    }
    else {
        if (Object.values(all_record)[1] == 'clear') {
            clearRecords();
        }
        else {
            // 先清理病歷
            clearRecords(); 
            // 插入病歷
            recordDetail(all_record['last_record_times'], all_record['last_rId']); // 顯示該病歷的病單號和完診時間
            insertRecords(Object.values(all_record)[1], Object.values(all_record)[2]);
        }
    }
}

function todayDate() { // 今日日期
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();

    today = yyyy + '-' + mm + '-' + dd;
    return today;
}

var last_times = 0; // 要找的病歷次數

function recordDetail(end_time, last_rId, mark = null) { // 顯示當前病歷內容屬於哪個病單號和完診時間
    getId('record_bt_space').innerHTML = '病單號：' + last_rId + '。' + `${mark ? mark : ''}` +
    '<br/>' + '日期：' + lessTime(end_time) + '。';
}

function lessTime(times) { // 把時間弄得好看一點
    if (times == null) // 如果還沒有時間
        return null;
    var new_time = '';
    for (let i = 0;i < times.length;i++) { // 不要後面五個字元
        if (times[i] == 'T') { // 把 T 換掉
            return new_time;
        }
        new_time += times[i];
    }
    return new_time;
}

async function insertRecords(diagnose_record, medicines_records) { // 把病歷放進去
    if (diagnose_record === undefined) { // 沒有紀錄就結束
        return;
    }
    // 放入診斷紀錄
    if (Object.values(diagnose_record)[2] != 0) { // 為 0 代表上次暫存不是數字
        getId('diagnose_code').value = '\n' + Object.values(diagnose_record)[2];
    }
    getId('main_sue').value = Object.values(diagnose_record)[3];
    outSymptoms(); // 印出症狀
    if (medicines_records === undefined) { // 沒有紀錄就結束
        return;
    }
    // 放入用藥紀錄
    const {data : medicines_normal} = await axios.get("/medicines_normal"); // all medicines data
    new_medicine_input_num = findMaxPutIndex(Object.values(medicines_records)); // 新的藥單的紀錄數量，找最大的 index 值
    if (new_medicine_input_num > medicine_input_num) { // 如果總藥單藥品欄位數 > 預設欄位數(20)
        mkMoreInput(new_medicine_input_num); // 製作額外的(大於預設的)欄位
        medicine_input_num = new_medicine_input_num; // 欄位數就改成以它為準
    }
    let put_index; // 顯示藥品的欄位
    for (let i = 0;i < Object.values(medicines_records).length;i++) { // put this medicines records
        put_index = Object.values(medicines_records)[i].put_index;
        if (Object.values(medicines_records[i])[2] == null) { // 如果 mId 是空的，代表是處方籤
            getId('medicines'+put_index).value = medicines_records[i].subscript;
            continue;
        }
        for (let j = 0;j < medicines_normal.length;j++) { // use the mId to find the medicines name
            if (medicines_normal[j]["mId"] == Object.values(medicines_records[i])[2]) // same mId
                getId('medicines'+put_index).value = medicines_normal[j]["medi_eng"];
        }
        getId('medi_amount'+put_index).value = Object.values(medicines_records[i])[3];
        getId('day'+put_index).value = Object.values(medicines_records[i])[4];
        getId('method'+put_index).value = Object.values(medicines_records[i])[5];
        getId('medi_mark'+put_index).value = Object.values(medicines_records[i])[6];
    }
}

function findMaxPutIndex(new_medicines_records) { // 新的藥單的紀錄數量，找最大的 index 值
    var max = default_medicine_input_num; // 沒有比預設大就用預設的
    for (let i = 0;i < new_medicines_records.length;i++) {
        var put_index = parseInt(new_medicines_records[i].put_index / 2) + 1; // 因為 index 從 0 開始，所以 +1
        if (max < put_index) {
            max = put_index;
        }
    }
    return max;
}

function clearRecords() { // 清理紀錄
    getId('diagnose_code').value = '';
    getId('main_sue').value = '';
    //outSymptoms(); // 印出症狀
    getId('diagnose').innerHTML = '';
    for (let i = 0;i < medicine_input_num*2;i++) {
        getId('medicines'+i).value = '';
        getId('medi_amount'+i).value = '';
        getId('day'+i).value = '';
        getId('method'+i).value = '';
        getId('medi_mark'+i).value = '';
    }
}

getId("copy_bt").addEventListener('click', cpContent); // 當搜尋內容有改變

function getClass(obj_class) {
    return document.getElementsByClassName(obj_class);
}

function cpContent(is_save) { // copy content to clipboard
    var all_need_copy = getClass('copy');
    var total_str = '';
    // add the value needed to be copied
    for (let i = 0;i < all_need_copy.length;i++) {
        total_str += all_need_copy[i].id + "$^$" + all_need_copy[i].value;
        total_str += "<new_element>";
    }
    if (is_save != 'is_save') { // 單純按複製才要提醒複製成功、複製到剪貼簿
        // create a temporary textarea to place the value of copy
        var el = document.createElement('textarea');
        el.value += total_str; // add the value
        // make textarea unseen and unused
        el.setAttribute('readonly', '');
        el.style = {position: 'absolute', left: '‑9999px'};
        document.body.appendChild(el);
        el.select();
        var copy_suc = document.execCommand('copy');
        document.body.removeChild(el); // remove copy textarea
        alert(copy_suc ? '複製成功！'  : '複製失敗！'); //alert successful or failed
    }
    else { // 若是上下病歷就存到區域變數中，不用存到剪貼簿
        save_current_record_content = total_str;
    }
}

getId("paste_bt").addEventListener('click', pasteContent); // paste the clipboard content

async function pasteContent(is_save) { // paste the clipboard content
    clearRecords();
    if (is_save == 'is_save') { // 是上下次病歷暫存，直接從區域變數拿
        var paste_text = save_current_record_content;
    }
    else { // 不是上下次病歷暫存，從剪貼簿拿
        var paste_text = await navigator.clipboard.readText();
    }
    paste_text = paste_text.split("<new_element>");
    // the element need to put in the content of copied 
    if (parseInt((paste_text.length-2)/5)/2 > default_medicine_input_num) { // 如果總藥單藥品欄位數 > 預設
        mkMoreInput(parseInt((paste_text.length-2)/5) / 2); // 製作需要的更多格
        medicine_input_num = parseInt((paste_text.length-2)/5) / 2;
    }
    var all_need_copy = getClass('copy');
    // put clickboard content in
    for (let i = 0;i < paste_text.length;i++) { // 所有要剪貼簿的內容
        paste_select = paste_text[i].split('$^$');
        paste_id = paste_select[0];
        paste_content = paste_select[1];
        if (getId(paste_id) != undefined) { // 有此 id 的元素就貼上去
            getId(paste_id).value = paste_content;
        }
        else {
            console.log(paste_id);
        }
    }
    outSymptoms();
}

function mkInput() { // make the input with format
    var records_form = getId("records_form");
    var records_form1 = getId("records_form1");
    // each row's element
    const all_elements = ['medicines', 'medi_amount', 'day', 'method', 'medi_mark'];
    const all_elements_width = [230, 90, 50, 80, 40]; // input width
    // 第一行
    for (let i = 0;i < medicine_input_num;i++) { // total input num
        var tr_element = document.createElement("tr");
        records_form.appendChild(tr_element);
        for (let j = 0;j < all_elements.length;j++) { // all input of a row
            realPutIn(all_elements[j], tr_element, i*2, all_elements_width[j]);
        }
    }
    // 第二行
    for (let i = 0;i < medicine_input_num;i++) { // total input num
        var tr_element = document.createElement("tr");
        records_form1.appendChild(tr_element);
        for (let j = 0;j < all_elements.length;j++) { // all input of a row
            realPutIn(all_elements[j], tr_element, (i*2)+1, all_elements_width[j]);
        }
    }
    outSymptoms(); // 印出症狀
    if (!getId('submit_bt')) {
        var submit_element = document.createElement("button");
        submit_element.innerHTML = '送出看診';
        submit_element.type = 'button';
        submit_element.id = 'submit_bt';
        //submit_element.className = 'bottom-50';
        body.appendChild(submit_element);
    }
    listenMedInput(); // 監聽藥品輸入，顯示藥品資訊
}

function listenMedInput() { // 監聽藥品輸入，顯示藥品資訊
    var all_input = document.getElementsByTagName('input');
    for (let i = 0;i < all_input.length;i++) {
        all_input[i].addEventListener('click', searchMedInfo);
        all_input[i].addEventListener('input', searchMedInfo);
        all_input[i].addEventListener('keyup', searchMedInfo);
        all_input[i].addEventListener('change', searchMedInfo);
        all_input[i].addEventListener('keydown', searchMedInfo);
    }
    //document.body.addEventListener('keydown', aaa);
}

function searchMedInfo(e) { // 若現在輸入格在藥品那行(包括每日量等等)，找出對應該行的藥品名稱的藥品資訊
    const input_id = e.target.id;
    if (input_id != 'diagnose_code' && input_id != 'msg') { // 是藥品輸入欄位
        var id_num = getNum(input_id); // 只找 id
        var this_row_medicine_name = getId('medicines' + id_num); // 只看那一行的 medicine name
        mkMedInfo(this_row_medicine_name.value); // 依照藥品名稱製作藥品資訊
    }
}

async function mkMedInfo(medicine_name) { // 依照藥品名稱製作藥品資訊
    const {data : result} = await axios.post('ckPatients/getMediInfo', {medi_eng : medicine_name});
    if (result.medi_info.length > 0) {
        var medi_info = result.medi_info[0];
        if (medicine_name) { // 有此藥品名稱的資訊
            getId('medi_info_pos').innerHTML = '英文名稱：' + medicine_name + 
            '。中文名稱：' + medi_info.medi_mand +
            '。懷孕等級：' +
            '。苦等級：。'
        }
        else { // 無此藥品名稱的資訊，清空欄位
            getId('medi_info_pos').innerHTML = '';
        }
    }
    else {
        getId('medi_info_pos').innerHTML = medicine_name + '：查無此藥品資訊。';
    }
}

function getNum(input_id) {
    var only_num = '';
    for (let i = 0;i < input_id.length;i++) {
        if (!isNaN(input_id[i])) { // 是數字
            only_num += input_id[i]; // 就加入字串
        }
    }
    return only_num;
}

function mkMoreInput(new_medicine_input_num) { // make the input with format
    var records_form = getId("records_form");
    var records_form1 = getId("records_form1");
    // each row's element
    const all_elements = ['medicines', 'medi_amount', 'day', 'method', 'medi_mark'];
    const all_elements_width = [230, 90, 50, 80, 40]; // input width
    // 第一行
    for (let i = medicine_input_num;i < new_medicine_input_num;i++) { // 起始是現有的欄位數，到新的紀錄的總欄位數
        var tr_element = document.createElement("tr");
        records_form.appendChild(tr_element);
        for (let j = 0;j < all_elements.length;j++) { // all input of a row
            realPutIn(all_elements[j], tr_element, (i*2), all_elements_width[j]);
        }
    }
    // 第二行
    var index = 0;
    for (let i = medicine_input_num;i < new_medicine_input_num;i++) { // total input num
        index += 1;
        var tr_element = document.createElement("tr");
        records_form1.appendChild(tr_element);
        for (let j = 0;j < all_elements.length;j++) { // all input of a row
            realPutIn(all_elements[j], tr_element, (i*2)+1, all_elements_width[j]);
        }
    }
    listenMedInput() // 監聽藥品輸入，顯示藥品資訊
    moveMedInfo((new_medicine_input_num - medicine_input_num) * 40); // 多一個，藥品資訊就往下 40 px
    /*outSymptoms(); // 印出症狀
    var submit_element = document.createElement("button");
    submit_element.innerHTML = '送出看診';
    submit_element.type = 'button';
    submit_element.id = 'submit_bt';
    //submit_element.className = 'position-absolute start-50';
    body.appendChild(submit_element);*/
}
        
function realPutIn(obj_id, tr_element, i, width) { // real function put the input in form
    // space
    var space_element = document.createElement("span");
    space_element.innerHTML = "&nbsp;&nbsp;";
    //records_form.appendChild(space_element);
    // input text
    var medicine_obj_element= document.createElement("input");
    if (obj_id == 'medi_amount') { // 每天量要小數點
        medicine_obj_element.type = 'number';
        medicine_obj_element.step = '0.1';
    }
    if (obj_id == 'day') { // 天
        medicine_obj_element.type = 'number';
        medicine_obj_element.step = '1';
    }
    medicine_obj_element.tpye = 'text';
    medicine_obj_element.className = "copy"; // class name = copy
    medicine_obj_element.setAttribute("id", obj_id+i);
    medicine_obj_element.setAttribute("name", obj_id+i);
    medicine_obj_element.setAttribute("style", "width:"+width+"px;");
    medicine_obj_element.setAttribute('autocomplete', 'off');
    if (obj_id == 'medicines') {
        medicine_obj_element.setAttribute('list', 'medi_list');
    }
    var td_element = document.createElement("td");
    td_element.appendChild(medicine_obj_element);
    tr_element.appendChild(td_element);
}

function mkAge(birth) { // 製作年齡
    today = new Date();
    var today_year = today.toString().split(' ')[3];
    var birth_year = birth.toString().split('-')[0];
    var age = today_year - birth_year;
    var new_birth_year = today_year;
    for (let i = 1;i < birth.toString().split('-').length;i++) {
        new_birth_year += '-' + birth.toString().split('-')[i];
    }
    //console.log(new_birth_year < today);
    birth = new Date(new_birth_year);
    birth.setHours(0,0,0,0);
    if (!birth < today) {
        age = age - 1;
    }
    return age;
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
        var msg = nId + " 號護士: ";
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
    var msg_title = nId + " 號護士: ";
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

window.addEventListener("beforeunload", async function(e) {
    // 如果診斷已經有資料且不是完診的離開頁面，就要先把內容暫存到資料庫
    if (!is_submit) {
        // 要回傳的資料
        var data = {
            dId : getId('dId').innerHTML,
            all_self : getId('all_self').value, 
            self_part : getId('self_part').value, 
            regist : getId('regist').value, 
            rId : getId('rId').value, 
            diagnose_code_pass : `${isNum(getId('diagnose_code').value) ? getId('diagnose_code').value : 0}`, 
            main_sue : getId('main_sue').value, 
        }
        // 把開的藥放進去
        for (let i = 0;i < medicine_input_num*2;i++) {
            data['medicines'+i] = {medicines : getId('medicines'+i).value, medi_amount : getId('medi_amount'+i).value, day : getId('day'+i).value, method : getId('method'+i).value, medi_mark : getId('medi_mark'+i).value, put_index : i};
        }
        const ck_diagnose = await axios.post('/ckPatients/backup', data);
    }
    e.returnValue = null;
    return null;
})

window.onload = async function(e) { // 載入先確定有沒有暫存的資料
    const {data : pa_num} = await axios.get('/ckPatients/rNum');
    var {data : backup} = await axios.get('/ckPatients/backup', {params : {rId : pa_num.rId}});
    if (backup.data.diagnose.length > 0 || backup.data.medicines.length > 0) { // 暫存其中有一個不是空的集合
        insertRecords(backup.data.diagnose[0], backup.data.medicines);
    }
}

function isNum(n) { // 是不是數字
    return !isNaN(parseFloat(n)) && isFinite(n);
}

getId('add_num').addEventListener('click', (e) => { 
    mkAddInput();
    medicine_input_num += 1;
    moveMedInfo(40); // 把藥品資訊往下移 40 px
});

function moveMedInfo(range) { // 把藥品資訊往下移
    const now_top = parseInt(getComputedStyle(getId('medi_info_pos')).top); // 當前高度
    getId('medi_info_pos').style.top = (now_top + range) + 'px'; // 往下移
}

function mkAddInput() { // make the input with format
    var records_form = getId("records_form");
    var records_form1 = getId("records_form1");
    // each row's element
    const all_elements = ['medicines', 'medi_amount', 'day', 'method', 'medi_mark'];
    const all_elements_width = [230, 90, 50, 80, 40]; // input width
    // 第一行
    var tr_element = document.createElement("tr");
    records_form.appendChild(tr_element);
    for (let j = 0;j < all_elements.length;j++) { // all input of a row
        realPutIn(all_elements[j], tr_element, medicine_input_num*2, all_elements_width[j]);
    }
    // 第二行
    var tr_element = document.createElement("tr");
    records_form1.appendChild(tr_element);
    for (let j = 0;j < all_elements.length;j++) { // all input of a row
        realPutIn(all_elements[j], tr_element, medicine_input_num*2 + 1, all_elements_width[j]);
    }
    outSymptoms(); // 印出症狀
    listenMedInput(); // 監聽藥品輸入，顯示藥品資訊
    /*getId('submit_bt').remove(); // 先把送出按鈕刪除
    var submit_element = document.createElement("button");
    submit_element.innerHTML = '送出';
    submit_element.type = 'button';
    submit_element.id = 'submit_bt';
    submit_element.className = 'position-absolute end-50';
    records_form1.appendChild(submit_element);
    listenSubmit(); // listen to submit button*/
}

// check if vaccine
async function checkVac(rId) { // 檢查是否是打疫苗，若是就印出打哪種
    const ck_vac = await axios.post('/ckPatients/checkVac', {rId : rId});
    if (ck_vac.data.suc) {
        for (let i = 0;i < ck_vac.data.all_vId.length;i++) { // 可能有多種疫苗
            // 若主訴已經有施打疫苗的資訊，就不要重複寫入
            if (!(getId('main_sue').value).includes("施打疫苗: " + ck_vac.data.all_vId[i].vId + "\n")) {
                getId('main_sue').value += "施打疫苗: " + ck_vac.data.all_vId[i].vId + "\n";
            }
        }
    }
    else {
        console.log('查看是否為施打疫苗錯誤');
    }
}

async function findFamily(pId) { // 尋找家屬
    const {data : result} = await axios.post('/docMain/findFamily', {pId : pId});
    const suc = Object.values(result)[0];
    if (suc) { // 成功
        var family_info = Object.values(result)[1];
        var family_relation = Object.values(result)[2];
        var table = document.createElement('table');
        table.id = 'family_table';
        table = familyTableTitle(table); // 製作標頭
        for (let i = 0;i < family_info.length;i++) { // 放進找到的家人
            if (family_info[i].pId == pId) { // 是自己
                continue;
            }
            tr = document.createElement('tr'); // table row
            td_name = document.createElement('td'); // patient's name
            td_name.innerHTML = family_info[i].name;
            tr.appendChild(td_name);
            td_relation = document.createElement('td'); // patient's name
            td_relation.innerHTML = family_relation[i];
            tr.appendChild(td_relation);
            td_birth = document.createElement('td'); // patient's age
            td_birth.innerHTML = mkAge(family_info[i].birth);
            tr.appendChild(td_birth);
            td_pass = document.createElement('td'); // patient's age
            td_pass.innerHTML = family_info[i].pass;
            td_pass.setAttribute('width', '200px');
            td_pass.id = 'pass';
            tr.appendChild(td_pass);
            table.appendChild(tr);
        }
        getId('family_pos').appendChild(table);
    }
}

async function findRecommand(table_name) { // 尋找診斷對應的推薦主訴
    var diagnose_code = getId('diagnose_code').value;
    if (getId(table_name)) { // 如果已經有，就先刪除
        getId(table_name).remove();
    }
    var table = document.createElement('table');
    table.id = table_name;
    table = recommandTableTitle(table, diagnose_code, '主訴：'); // 製作標頭
    if (!(diagnose_code != 0 && isNum(diagnose_code))) { // 診斷空的或是不是數字
        getId('recommand_pos').appendChild(table); // 就不要放推薦
        return;
    }
    var medicines_mainsue = ['test', 'test1', 'test1', 'test1', 'test1', 'test1']; // 所有診斷對應的主訴
    for (let i = 0;i < medicines_mainsue.length;i++) { // 放進找到的家人
        if (i % 3 == 0) { // 一排 3 個 推薦的
            var tr = document.createElement('tr'); // table row
        }
        var td = document.createElement('td'); // column
        td.onclick = function (e) { // 按下推薦，把推薦放入主訴
            insertRecommand(e.target.innerHTML);
        };
        td.innerHTML = medicines_mainsue[i];
        tr.appendChild(td);
        table.appendChild(tr);
    }
    getId('recommand_pos').appendChild(table);
}

async function findMediRecommand(table_name) { // 尋找診斷對應的推薦主訴
    var diagnose_code = getId('diagnose_code').value;
    if (getId(table_name)) { // 如果已經有，就先刪除
        getId(table_name).remove();
    }
    var table = document.createElement('table');
    table.id = table_name;
    table = recommandTableTitle(table, diagnose_code, '藥品：'); // 製作標頭
    if (!(diagnose_code != 0 && isNum(diagnose_code))) { // 診斷空的或是不是數字
        getId('recommand_pos').appendChild(table); // 就不要放推薦
        return;
    }
    var medicines_mainsue = getAllMediName(); // 所有藥品英文名稱
    for (let i = 0;i < medicines_mainsue.length;i++) { // 放進找到的家人
        if (i % 3 == 0) { // 一排 3 個 推薦的
            var tr = document.createElement('tr'); // table row
        }
        var td = document.createElement('td'); // column
        td.onclick = function (e) { // 按下推薦，把推薦放入主訴
            insertRecommandMedi(e.target.innerHTML);
        };
        td.innerHTML = medicines_mainsue[i];
        tr.appendChild(td);
        table.appendChild(tr);
    }
    getId('recommand_pos').appendChild(table);
}

function getAllMediName() {
    const all_medi_eng = getId('medi_list').getElementsByTagName('option');
    var all_medi = [];
    for (let i = 0;i < all_medi_eng.length;i++) {
        all_medi.push(all_medi_eng[i].value);
    }
    return all_medi;
}

function insertRecommandMedi(medi_name) { // 把推薦藥品放入藥品欄位
    // 依照藥品名稱製作藥品資訊
    mkMedInfo(medi_name); 
    // 先優先放入第一行
    for (let i = 0;i < medicine_input_num*2;i++) {
        // 如果是第一行和該格是空的就放入
        if ((i+1) % 2 != 0 && getId('medicines' + i).value == '') {
            getId('medicines' + i).value = medi_name;
            getId('medi_amount' + i).value = getId('patient_weight').innerHTML * 0.1;
            getId('day' + i).value = parseInt(getId('patient_height').innerHTML * 0.02);
            return;
        }
    }
    // 再放入第二行
    for (let i = 0;i < medicine_input_num*2;i++) {
        // 如果是第二行和該格是空的就放入
        if ((i+1) % 2 == 0 && getId('medicines' + i).value == '') {
            getId('medicines' + i).value = medi_name;
            getId('medi_amount' + i).value = Math.round(getId('patient_weight').innerHTML * 0.1 * 100) / 100;
            getId('day' + i).value = parseInt(getId('patient_height').innerHTML * 0.02);
            return;
        }
    }
}

function insertRecommand(td_text) { // 把推薦放入主訴
    getId('main_sue').value += td_text + ' ';
}

// 製作推薦 table 的標頭
function recommandTableTitle(table, diagnose_code, recommand_type) {
    table.setAttribute('border', 2);
    var tr = document.createElement('tr');
    var td = document.createElement('td');
    td.innerHTML = '診斷：' + diagnose_code + '。推薦之' + recommand_type;
    td.colSpan = 5;
    tr.appendChild(td);
    table.appendChild(tr);
    return table;
}

function familyTableTitle(table) { // 製作親屬 table 的標頭
    table.setAttribute('border', 2);
    var tr_title = document.createElement('tr');
    var td_title = document.createElement('td');
    td_title.innerHTML = '此病患家人';
    td_title.colSpan = 5;
    tr_title.appendChild(td_title);
    table.appendChild(tr_title);
    var tr = document.createElement('tr');
    var td_name = document.createElement('td');
    td_name.innerHTML = '姓名';
    tr.appendChild(td_name);
    var td_relation = document.createElement('td');
    td_relation.innerHTML = '關係';
    tr.appendChild(td_relation);
    var td_birth = document.createElement('td');
    td_birth.innerHTML = '年齡';
    tr.appendChild(td_birth);
    var td_pass = document.createElement('td');
    td_pass.innerHTML = '病史';
    tr.appendChild(td_pass);
    table.appendChild(tr);
    return table;
}

function putFoundPatients(all_family) { // 把找到的家人放進去
    // 先清空 table
    result.innerHTML = '';
    putHeader(); // 放標頭
    var i;
    for (index in all_family) { // 把家屬放進去 
        i = all_family[index];
        putData(i, all_index[i], all_name[i], all_birth[i], all_tel1[i], all_tel2[i]);
    }
}

// make medicine list
async function mkMediList() {
    const {data : result} = await axios.get('/ckPatients/medi_normal_eng');
    const all_medi_eng = result.data.all_medi_eng; // 全部的常用藥品的英文名稱
    var option;
    // 把藥品名稱加入 datalist
    for (let i = 0;i < all_medi_eng.length;i++) {
        option = document.createElement('option');
        option.value = all_medi_eng[i].medi_eng;
        getId('medi_list').appendChild(option);
    }
}
mkMediList();

// 查此診斷過去開過的藥單
getId('getMediRecord').addEventListener('click', showMediRecord);

async function showMediRecord() {
    mkMediLight(); // 製作彈出視窗
    openMediWindow();
}

const regist_html = getId('medi_light').innerHTML; // 暫存 page element

async function mkMediLight() { // 製作彈出視窗，顯示藥單紀錄
    const {data : result} = await axios.post('/docMain/get_diagnose_record', {diagnose_code : now_symptom_index});
    const all_same_diagnose_rId = result.same_diagnose_rId;
    // header 
    mkMedHeader();
    
    // body
    getId("medi_light").innerHTML += '<b>loading...</b>';
    for (let i = 0;i < all_same_diagnose_rId.length;i++) {
        var rId = all_same_diagnose_rId[i].rId;
        const {data : result} = await axios.post('/financial/showDetail', {reason_type : 1, rId : rId});
        var record_content = result.result[0];
        if (result.suc && record_content.pId) {
            const pId = record_content.pId;
            var {data : patient_info} = await axios.post('/getSinglePatient', {pId : pId});
            var patient_info = patient_info.result[0];
        }
        else {
            console.log('細項查詢錯誤！');
        }
        // 放入每一筆相同診斷的紀錄
        /*getId('medi_light').innerHTML +=
        '病單號：' + all_same_diagnose_rId[i].rId +
        '。看診日期：' + onlyDate(record_content.start) + 
        '。病人姓名：' + patient_info.name +
        '。性別：' + patient_info.sex + 
        "<button onclick = 'showEachMedDetail(" + rId + ")' id = 'medicine_record_detail'>病單</button>"  + " <br/>";*/
    }
    // tail
    mkPageElement();
    mkDoc('first', all_same_diagnose_rId.length);
}

function mkMedHeader() { // 診斷藥單的 header
    // 診斷的基本資訊、關閉
    getId('medi_light').innerHTML = 
    "<div>診斷代碼：<input id = 'now_symptom_index_input' value = '" + now_symptom_index + "'></input>。" + 
    "診斷英文：<b>" + now_symptom_eng + "</b>" + 
    "<a href = 'javascript:void(0)' id = 'closebt' onclick = 'closeWindow()'>關閉</a>;</div>";
    var setEvent = setInterval(function(){ // 延遲一下再設 listener 才可偵測到
        clearInterval(setEvent); // 跑一次就好，不要一直重複
        // 監聽是否更改搜尋藥單的診斷代碼
        getId('now_symptom_index_input').addEventListener('change', changeInsideDiagnose);
    }, 500);
}

function changeInsideDiagnose() { // 更改搜尋藥單的診斷代碼
    now_symptom_index = getId('now_symptom_index_input').value; // 更改診斷代碼
    resetMediEng(); // 重設診斷的英文名稱
    mkMediLight(); // 重新製作新的診斷代碼的藥單紀錄
}

function resetMediEng() {
    for (let i = 0;i < symptoms.length;i++) {
        if (symptoms[i].index == now_symptom_index) {
            now_symptom_eng = symptoms[i].eng_name;
            return;
        }
    }
    now_symptom_eng = '無';
    return;
}

function mkPageElement() {
    getId('medi_light').innerHTML = regist_html;
}

async function showEachMedDetail(rId) { // 顯示單筆藥單的詳細資訊
    // 給該次病單號的 rId cookie
    const {data : suc} = await axios.post('/docMain/getPa', {view : true, rId : rId, pa_num : rId});
    if (suc) { // 有此病患的已看診紀錄
        getId('each_medi_iframe').src = "/ckPatients?view=true";
    }
    else {
        alert('無此患者的病單！');
        return;
    }
    closeWindow(); // 關掉全部的藥單
    getId('each_medi_light').style.display='block';
    getId('fade').style.display='block';
}

async function closeEachMediWindow() { // 回到上一步，全部相同診斷的紀錄
    // 先給回原本病單號 rId 的 cookie
    const {data : suc} = await axios.post('/docMain/getPa', {view : false, rId : rId, pa_num : rId});
    getId('medi_light').style.display='block';
    getId('each_medi_light').style.display='none';
}

function closeWindow() { // 關閉視窗
    getId('medi_light').style.display='none';
    getId('fade').style.display='none';
}

function openMediWindow() { // 開啟視窗
    getId('medi_light').style.display='block';
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

// page 
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

async function putPageRecord(page) {
    const {data : result} = await axios.post('/docMain/get_diagnose_record', {diagnose_code : now_symptom_index});
    const all_same_diagnose_rId = result.same_diagnose_rId;
    all_same_diagnose_rId.sort(function(a,b){ // 從最後看的開始排序
        return b.rId - a.rId;
    });
    var count_records = 0; // 總共有幾個可以放的紀錄, 不包含看完的
    var count_added_records = 0; // 真正放了幾個紀錄進 table
    total_len = 0; // when reset table, reset the total_len too
    //getId("medi_light").innerHTML = ''; // 每次重新點, 都清空 table
    mkMedHeader(); // 診斷 header
    // body
    for (let i = 0;i < all_same_diagnose_rId.length;i++) {
        var rId = all_same_diagnose_rId[i].rId;
        const {data : result} = await axios.post('/financial/showDetail', {reason_type : 1, rId : rId});
        var record_content = result.result[0];
        if (result.suc && record_content.pId) {
            const pId = record_content.pId;
            var {data : patient_info} = await axios.post('/getSinglePatient', {pId : pId});
            var patient_info = patient_info.result[0];
        }
        else {
            console.log('細項查詢錯誤！');
            continue;
        }
        count_records++; // 計算總共有加了幾筆紀錄
        if (count_records <= (page-1) * limit_records) // 還沒到可以放進去的 index
            continue; // 重找
        if (count_added_records >= limit_records) // 真正放進去的紀錄不能超過限制的次數
            break; // 停止
        count_added_records++; // 真正放進去的次數
        // 放入每一筆相同診斷的紀錄
        getId('medi_light').innerHTML +=
        '病單號：' + all_same_diagnose_rId[i].rId +
        '。看診日期：' + onlyDate(record_content.start) + 
        '。病人姓名：' + patient_info.name +
        '。性別：' + patient_info.sex + 
        "。<button onclick = 'showEachMedDetail(" + rId + ")' id = 'medicine_record_detail'>病單</button>"  + " <br/>";
    }
    getId("medi_light").innerHTML += regist_html; // 每次重新點, 都清空 table
    mkPageListener(total_page_num);
}

var total_len = 0;
let limit_records = 10; // 頁面能顯示最大的列數量

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
    if (e.target.innerHTML == "上一頁") {
        // 不能讓上一頁到 -1
        if (now_page < 1) {
            now_page = 0;
        }
        else {
            now_page -= 1;
        }
    }
    else if (e.target.innerHTML == "下一頁") {
        if (now_page+1 < total_page_num) { // 下一頁不能超過最後一頁
            now_page += 1;
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
    putPageRecord(now_page+1); // 把紀錄放進 table, 現在是第幾個 table, 第幾頁
};

let total_page_num;
async function mkDoc(e, page_num) { // 製作醫生 table
    //now_page = 0;
    if (e == 'first') {
        var tab_id = 1;
    }
    else {
        var tab_id = getDid(e.target.id); // 取得 dId
    }
    now_table = tab_id;
    //mkTable(tab_id); // 製作該 id 的 table
    putPageRecord(tab_id);
    total_page_num = countPageNum(page_num); // total_page_num = all records/limit_records
    mkPageListener(page_num); // make listener of page list 
}

function countPageNum(page_num_result) { // count page num
    let page_num = Math.floor(page_num_result/limit_records); // without float
    let page_less = page_num_result%limit_records; 
    if (page_less != 0) // is float
        page_num += 1; // add one more page
    return page_num;
}