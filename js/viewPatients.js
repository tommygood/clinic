var rId;                                                                      
var pId;
var default_medicine_input_num = 10;
var medicine_input_num = default_medicine_input_num; // total medicines row number

(async() => {
    const {data : rec} = await axios.get('/records');
    const {data : pa_num} = await axios.get('/ckPatients/rNum');
    const {data : info} = await axios.get('/data');
    const {data : dId} = await axios.get('/docMain/dId');
    const {data : done_records} = await axios.get('/done_records'); // done records
    getId('dId').innerHTML = Object.values(dId);
    mkInput();
    for (let i = 0;i < done_records.length;i++) { // 先檢查這筆紀錄是否已經看完, 因有可能是醫生檢查已看診病歷
        if (pa_num.rId == done_records[i].rId) { // 看完的
            const {data : all_record} = await axios.post('/docMain/all_record', {rId : pa_num.rId, check_first : true});
            if (Object.values(all_record)[1] && Object.values(all_record)[2]) { // whether both record not empty
                //await mkInput(Object.values(Object.values(all_record)[2]).length);
                insertRecords(Object.values(all_record)[1], Object.values(all_record)[2]); // put the record in
            }
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
    document.getElementById('rId').value = this_doc[pa_num.pa_num].no;
    rId = this_doc[pa_num.pa_num].no; // rId
    patientInfo(rId); // put the fee of the records and info of patient in
    const {data : check_record} = await axios.post('/docMain/check_record', {rId : rId, aId : getId('dId').innerHTML, pId : pId});
})();

async function patientInfo(rId) { // put patient info, record fee in
    const {data : info} = await axios.get('/data');
    const {data : getFee} = await axios.get('docMain/getFee', {params : {rId : rId}});
    const {data : getPId} = await axios.get('/docMain/getPId', {params : {rId : rId}});
    pId = getPId.pId[0].pId; // pId
    const fee = getFee.fee[0]; // three kinds of fee
    var not_null = true; // 是否沒有 pId
    const {data : getDeposit} = await axios.get('/docMain/getDeposit', {params : {rId : rId}});
    is_deposit = parseInt(getDeposit.is_depo);
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
                in_patients = true;
            //document.getElementById('r_num').value = this_doc[pa_num.pa_num].r_num;
                //document.getElementById('rId').value = this_doc[pa_num.pa_num].no;
            //document.getElementById('nrId').value = this_doc[pa_num.pa_num].nrId;
                //checkVac(rId);
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
                "<td>" + info[j].weight + "</td>" +
                "<td>" + info[j].height + "</td>" +
                "<td ><input type = 'text' id = 'regist' style = 'width:50px' value = '" + fee.regist + "' readonly></input></td>" +
                "<td><input type = 'text' id = 'self_part' style = 'width:50px' value = '" + fee.self_part + "' readonly></input></td>" +
                "<td><input type = 'text' id = 'all_self' style = 'width:50px' value = '" + fee.all_self + "' readonly></input></td></tr>"
                break;
            }
        }
    }
}

function getId(id) {
    return document.getElementById(id);
}

function getClass(id) {
    return document.getElementsByClassName(id);
}

getId("diagnose_code").addEventListener('change', outSymptoms); // 當搜尋內容有改變

var symptoms = null; // 所有症狀，先設 null
async function outSymptoms() { // 印出症狀
    if (symptoms == null) { // 第一次讀取症狀
        const {data : symptoms_data} = await axios.get('/symptoms');
        symptoms = symptoms_data // 放入檔案
        for (let i = 0;i < symptoms.length;i++) { // 找出對應症狀
            if (symptoms[i].index == getId('diagnose_code').value) {
                getId('diagnose').innerHTML = symptoms[i].eng_name;
            }
        }
    }
    else {
        for (let i = 0;i < symptoms.length;i++) {
            if (symptoms[i].index == getId('diagnose_code').value) {
                getId('diagnose').innerHTML = symptoms[i].eng_name;
            }
        }
    }
}


/*document.addEventListener("keyup", async(event) => {
    // 總共需要檢查快捷的格
    var check_hot = ["main_sue"]
    // append medicine in hot_key array with total medicine input num
    for (let i = 0;i < medicine_input_num*2;i++) 
        check_hot.push('medicines'+i);
    for (let num = 0;num < check_hot.length;num++) {
        const {data : hot_key} = await axios.get('hot_key');
        console.log(check_hot[num]);
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
            //console.log(new_mainsue);
            getId(check_hot[num]).value = new_mainsue;
        }
    }
});*/

// listen the next and last bt
//getId('last_records').addEventListener('click', putRecord);
//getId('next_records').addEventListener('click', putRecord);

async function putRecord(e) { // 放入病歷
    if (e.target.id == 'next_records') {
        if (!last_times <= 0) // 到 0 就不要再加上去了
            last_times--;
    }
    else 
        last_times++;
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
            insertRecords(Object.values(all_record)[1], Object.values(all_record)[2]);
        }
    }
}

var last_times = 0; // 要找的病歷次數

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
    /*outSymptoms(); // 印出症狀
    var submit_element = document.createElement("button");
    submit_element.innerHTML = '送出看診';
    submit_element.type = 'button';
    submit_element.id = 'submit_bt';
    //submit_element.className = 'position-absolute start-50';
    body.appendChild(submit_element);*/
}

function clearRecords() { // 清理紀錄
    getId('diagnose_code').value = '';
    getId('main_sue').value = '';
    //getId('science').value = ''; 
    //outSymptoms(); // 印出症狀
    getId('diagnose').innerHTML = '';
    for (let i = 0;i < 5;i++) {
        getId('medicines'+i).value = '';
        getId('medi_amount'+i).value = '';
        getId('day'+i).value = '';
        getId('method'+i).value = '';
        getId('medi_mark'+i).value = '';
    }
}

getId("copy_bt").addEventListener('click', cpContent); // 當搜尋內容有改變

function cpContent() { // copy content to clipboard
    var all_need_copy = getClass('copy');
    var total_str = '';
    // add the value needed to be copied
    for (let i = 0;i < all_need_copy.length;i++) {
        total_str += all_need_copy[i].id + "$^$" + all_need_copy[i].value;
        total_str += "<new_element>";
    }
        // create a temporary textarea to place the value of copy
    var el = document.createElement('textarea');
    el.value += total_str; // add the value
    // make textarea unseen and unused
    el.setAttribute('readonly', '');
    el.style = {position: 'absolute', left: '‑9999px'};
    document.body.appendChild(el);
    el.select();
    var copy_suc = document.execCommand('copy');
    alert(copy_suc ? '複製成功！'  : '複製失敗！'); //alert successful or failed
    document.body.removeChild(el); // remove copy textarea
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
}
        
function realPutIn(obj_id, tr_element, i, width) { // real function put the input in form
    // space
    var space_element = document.createElement("span");
    space_element.innerHTML = "&nbsp;&nbsp;";
    //records_form.appendChild(space_element);
    // input text
    var medicine_obj_element= document.createElement("input");
    medicine_obj_element.setAttribute("readonly", ""); // 不能修改
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