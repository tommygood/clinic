//var nId; // nurse id

// 生日的最大值不能大於今日日期
var today = new Date().toISOString().split('T')[0];
getId("birth").setAttribute('max', today);

function getId(id) {
    return document.getElementById(id);
}

function getName(name) {
    return document.getElementsByName(name);
}

(async() => { // 查詢 nId
    const {data : user} = await axios.get('/viewPa/nId');
    var {data : account_info} = await getTitle(user.nId);
    var title = account_info.title;
    var name = account_info.name;
    getId('nId').innerHTML = "<b>" + user.nId + "</b> 號" + title + "：" + name + "";
})();

async function getTitle(nId) { // 用帳號找職位
    var title = axios.get('/getTitle', {params : {aId : nId}});
    console.log(title);
    return title;
}
// 提交表單
/*getId('form').addEventListener('submit', async(e) => {
    e.preventDefault();
    var data;
    // turn paid from on and off to 1 and 0
    var paid_value = (getId('paid').checked) ? 1 : 0;
    if (getId('card').value == "off") { // 有帶卡
        data = {paid : paid_value, nId : getId('nId').innerHTML, card : getId('card').value, vac : getId('vac').value, vId : getId('vId').value, in : getId('in').checked, dId : getId('dId').value, name : getId('name').value, id : getId('id').value, sex : getId('sex').value, birth : getId('birth').value, identity : getId('identity').value, tel1 : getId('tel1').value, tel2 : getId('tel2').value, mom_id : getId('mom').value, parity : getId('parity').value, address : getId('address').value, can_used : getId('can').value, pass : getId('pass').value, allergy : getId('allergy').value, hate : getId('hate').value, mark : getId('mark').value, deposit : getId('deposit').value, regist : getId('regist').value, part_self : getId('part_self').value, all_self : getId('all_self').value} 
        //alert(checkDataSame(data));
        if (!checkDataSame(data)) {
            // not confirm to change the update of patient's info, return 
            return;
        }
    }
    else {
        data = {paid : paid_value, nId : getId('nId').innerHTML, card : getId('card').value, vac : getId('vac').value, vId : getId('vId').value, in : getId('in').checked, dId : getId('dId').value, mark : getId('mark').value, deposit : getId('deposit').value, regist : getId('regist').value, part_self : getId('part_self').value, all_self : getId('all_self').value} 
    }
    const suc = await axios.post('/viewPa', data);
    if (suc.data.suc) {
        alert('新增成功！');
        window.location.href = '/viewPa';
    }
    else {
        console.log(Object.values(suc.data.error)[1]);
        var sql_error_text = Object.values(suc.data.error)[1];
        console.log(suc.data.error);
        alert(`新增失敗`);
    }
})*/

var all_index = [];
var all_name = [];
var all_chart = [];
var all_id = [];
var all_sex = [];
var all_birth = [];
var all_identity = [];
var all_tel1 = [];
var all_tel2 = [];
var all_mom = [];
var all_parity = [];
var all_address = [];
var all_can = [];
var all_pass = [];
var all_allergy = [];
var all_hate = [];
var all_mark = [];
var all_regist = [];
var all_part = [];
var all_depo = [];
var all_all = [];
var all_dId = [];
var all_weight = [];
var all_height = [];

//getId('card').addEventListener('change', hideInput); // 沒帶卡就不用輸入資料

var element = ['name', 'id', 'sex', 'birth', 'identity', 'tel1', 'tel2', 'mom', 'parity', 'address', 'can', 'pass', 'allergy', 'hate', 'mark'] // 全部的元素

async function checkDataSame(data) {
    var {data : patients} = await axios.get('/data');
    var all_differ = ''; // all different column
    var is_changed = false; // whether have change the patients info
    var is_confirm = true; // whether confirm the change
    for (let i = 0;i < patients.length;i++) {
        if (patients[i].id == data.id) {
            for (let j = 1;j < Object.keys(patients[i]).length-6;j++) {
                if (data[Object.keys(patients[i])[j]] != Object.values(patients[i])[j]) {
                    var is_changed = true;
                    all_differ += `${Object.keys(patients[i])[j]} 已欄位更改`;
                    console.log(Object.keys(patients[i])[j]);
                    console.log(data[j]);
                    console.log(Object.values(patients[i])[j]);
                }
            }
            break;
        }
    }
    if (is_changed) {
        is_confirm = confirm(`${all_differ}，確定更新?`);
    }
    return is_confirm;
}

function hideInput() { // 隱藏資料
    if (this.checked) { // 句選沒帶卡
        getId('card').value = 'on';
        for (let i = 0;i < element.length;i++) {
            getId(element[i]).style.display = 'none';
            getId(element[i]+"_text").style.display = 'none';
            getId(element[i]+"_row").style.display = 'none';
        }
    }
    else { // 沒句選沒帶卡
        getId('card').value = 'off';
        for (let i = 0;i < element.length;i++) {
            getId(element[i]).style.display = 'inline';
            getId(element[i]+"_text").style.display = 'inline';
            getId(element[i]+"_row").style.display = 'block';
        }
    }
}

axios.get('/data').then(function(response) {
    //alertLog(response);
    for (let i = 0;i < response.data.length;i++) {
        all_index.push(response.data[i].pId);
        all_name.push(response.data[i].name);
        all_chart.push(response.data[i].chart_num);
        all_id.push(response.data[i].id);
        all_sex.push(response.data[i].sex);
        all_birth.push(response.data[i].birth);
        all_identity.push(response.data[i].identity);
        all_tel1.push(response.data[i].tel1);
        all_tel2.push(response.data[i].tel2);
        all_mom.push(response.data[i].mom_id);
        all_parity.push(response.data[i].parity);
        all_address.push(response.data[i].address);
        all_can.push(response.data[i].can_used);
        all_pass.push(response.data[i].pass);
        all_allergy.push(response.data[i].allergy);
        all_hate.push(response.data[i].hate);
        all_mark.push(response.data[i].mark);
        all_regist.push(response.data[i].regist);
        all_part.push(response.data[i].part_self);
        all_depo.push(response.data[i].deposit);
        all_all.push(response.data[i].all_self);
        all_dId.push(response.data[i].dId);
        all_weight.push(response.data[i].weight);
        all_height.push(response.data[i].height);
    }
    //getId("search").addEventListener('change', checkSearch); // 當搜尋內容有改變
})

function form(obj) { // 把多餘的符號去掉
    var n_obj = '';
    //return obj+'a';
    while (obj.includes('o')) {
        obj = obj.replace('o','');
    }
    console.log(obj);
    return obj;
}

var vac_dId; // 暫存打疫苗的醫生
var vac_num; // 暫存打疫苗的病患的 index
var record_mark; // 暫存打疫苗的病患的註解
var is_all_self; // 打疫苗是否是自費
async function inText(num, status) { // 一般看診，找出對應患者的資料
    if (!checkChargeType(num)) { // 檢查收費欄位有沒有不是數字型態的
        alert('收費欄位請填寫數字！');
        return;
    }
    for (i in all_index) {
        if (num == i) { 
            var name = all_name[i];
            var id = all_id[i];
            var sex = all_sex[i];
            var birth = all_birth[i];
            var identity = all_identity[i];
            var tel1 = all_tel1[i];
            var tel2 = all_tel2[i];
            var mom = all_mom[i];
            var parity = all_parity[i];
            var address = all_address[i];
            var can = all_can[i];
            var pass = all_pass[i];
            var allergy = all_allergy[i];
            var hate = all_hate[i];
            var mark = all_mark[i];
        }
    }
    // 全部的收費類型
    var deposit;
    var regist;
    var part_self;
    var all_self;
    // 掛號狀態
    var paid_value = (getId('is_paid'+num).checked) ? 1 : 0; // 是否付款，換成 0,1
    var in_value = (getId('is_in'+num).checked) ? 1 : 0; // 是否在場，換成 0,1
    // 此病人的註解
    record_mark = prompt('此病人的註解');
    if (record_mark === null) {
        alert('掛號取消！');
        return;
    }
    var doc_num = prompt("請輸入醫生代碼"); // 輸入醫生代碼
    // 檢查醫生代碼為正確
    const checked_doc = await checkDoc(doc_num);
    if (!checked_doc) { // 取消輸入醫生代碼，或查無此醫生代號
        alert('醫生代碼有誤，掛號取消！');
        return;
    }
    const {data : user} = await axios.get('/viewPa/nId'); // 查 nId
    nId = user.nId;
    if (status == 0) { // 健保，只要收掛號費和部分負擔
        data = {paid : paid_value, nId : nId, card : true, in : in_value, dId : doc_num, name : name, id : id, sex : sex, birth : birth, identity : identity, tel1 : tel1, tel2 : tel2, mom_id : mom, parity : parity, address : address, can_used : can, pass : pass, allergy : allergy, hate : hate, mark : record_mark, deposit : 0, regist : getId('regist_'+num).value, part_self : getId('part_'+num).value, all_self : 0} 
        var total_expense = parseInt(getId('regist_'+num).value) + parseInt(getId('part_'+num).value);
    }
    else if (status == 1) { // 押單，只要收押金和掛號費和部分負擔
        //setDeposit(i); // 設定預設押金
        data = {paid : paid_value, nId : nId, card : false, in : in_value, dId : doc_num, name : name, id : id, sex : sex, birth : birth, identity : identity, tel1 : tel1, tel2 : tel2, mom_id : mom, parity : parity, address : address, can_used : can, pass : pass, allergy : allergy, hate : hate, mark : record_mark, deposit : getId('deposit_'+num).value, regist : getId('regist_'+num).value, part_self : getId('part_'+num).value, all_self : 0} 
        var total_expense = parseInt(getId('deposit_'+num).value) + parseInt(getId('regist_'+num).value) + parseInt(getId('part_'+num).value);
    }
    else if (status == 2) { // 打疫苗
        is_all_self = false; // 不是自費
        // 叫出疫苗選單
        light.style.display='block';
        fade.style.display='block';
        vac_dId = doc_num;
        vac_num = num;
        /*var vId = prompt("請輸入疫苗代碼"); // 輸入疫苗代碼
        if (!vId) { // 取消輸入疫苗代碼
            alert('掛號取消！');
            return;
        }*/
        return;
        //data = {vac : 'on', vId : vId, paid : paid_value, nId : nId, card : false, in : in_value, dId : doc_num, name : name, id : id, sex : sex, birth : birth, identity : identity, tel1 : tel1, tel2 : tel2, mom_id : mom, parity : parity, address : address, can_used : can, pass : pass, allergy : allergy, hate : hate, mark : mark, deposit : 0, regist : getId('regist_'+num).value, part_self : getId('part_'+num).value, all_self : 0} 
        //var total_expense = parseInt(getId('regist_'+num).value) + parseInt(getId('part_'+num).value);
    }
    else if (status == 3) { // 自費
        //data = {vac : 'on', vId : vId, paid : paid_value, nId : nId, card : false, in : in_value, dId : doc_num, name : name, id : id, sex : sex, birth : birth, identity : identity, tel1 : tel1, tel2 : tel2, mom_id : mom, parity : parity, address : address, can_used : can, pass : pass, allergy : allergy, hate : hate, mark : record_mark, deposit : 0, regist : 0, part_self : 0, all_self : getId('all_'+num)} 
        //var total_expense = parseInt(getId('all_'+num).value);
        is_all_self = true; // 是自費
        var all_self_choice = prompt("一般看診，輸入 1。\n施打疫苗，輸入 2。\n買營養食品，輸入 3。");
        if (all_self_choice == 1) { // 一般看診
            // 只收自費
            deposit = 0;
            regist = 0;
            part_self = 0;
            all_self = parseInt(getId('self_' + num).value);
            var total_expense = deposit + regist + part_self + all_self;
            console.log(part_self);
            data = {paid : paid_value, nId : nId, card : true, in : in_value, dId : doc_num, name : name, id : id, sex : sex, birth : birth, identity : identity, tel1 : tel1, tel2 : tel2, mom_id : mom, parity : parity, address : address, can_used : can, pass : pass, allergy : allergy, hate : hate, mark : record_mark, deposit : deposit, regist : regist, part_self : part_self, all_self : all_self};
        }
        else if (all_self_choice == 2) { // 打疫苗
            // 叫出疫苗選單
            light.style.display='block';
            fade.style.display='block';
            vac_dId = doc_num;
            vac_num = num;
            return;
        }
        else if (all_self_choice == 3) { // 買營養食品
            buyOthers();
            return;
        }
        else { // 輸入其他的，取消掛號
            alert('請輸入正常的代碼！掛號取消！');
            return;
        }
    }
    else if (status == 4) { // 加藥
        // 收部分負擔和自費
        deposit = 0;
        regist = 0;
        part_self = parseInt(getId('part_' + num).value);
        all_self = parseInt(getId('self_' + num).value);
        var total_expense = deposit + regist + part_self + all_self;
        // 要還卡
        data = {paid : paid_value, nId : nId, card : false, in : in_value, dId : doc_num, name : name, id : id, sex : sex, birth : birth, identity : identity, tel1 : tel1, tel2 : tel2, mom_id : mom, parity : parity, address : address, can_used : can, pass : pass, allergy : allergy, hate : hate, mark : record_mark, deposit : deposit, regist : regist, part_self : part_self, all_self : all_self};
    }
    var is_paid_text = (getId('is_paid'+num).checked) ? '已' : '未';
    var is_in_text = (getId('is_in'+num).checked) ? '有' : '沒有';
    // 算總金額
    //var total_expense = parseInt(getId('deposit_'+num).value) + parseInt(getId('regist_'+num).value) + parseInt(getId('part_'+num).value) + parseInt(getId('self_'+num).value)
    var is_confirm = confirm(`醫生代碼 : ${doc_num}。\n${is_paid_text}付款。\n${is_in_text}在場。\n應收金額 : ${total_expense}`);
    if (!is_confirm) { // not confirm
        alert('掛號取消！');
        return;
    }
    const suc = await axios.post('/viewPa', data);
    if (suc.data.suc) {
        alert('新增成功！');
        window.location.href = '/viewPa';
    }
    else {
        console.log(Object.values(suc.data.error)[1]);
        var sql_error_text = Object.values(suc.data.error)[1];
        console.log(suc.data.error);
        alert(`新增失敗`);
    }
}

async function checkDoc(dId) { // 檢查是否有此醫生代碼
    if (!dId) { // 醫生代碼為空值
        return false;
    }
    // 檢查此代碼對應職位
    const {data : result} = await axios.post('/viewPa/checkDoc', {dId : dId});
    if (result.title == 'doc') { // 是醫生
        return true;
    }
    else {
        return false;
    }
}

function checkChargeType(num) { // 檢查收費欄位有沒有不是數字型態的
    return (isNum(getId('deposit_'+num).value) && isNum(getId('regist_'+num).value) && isNum(getId('part_'+num).value) && isNum(getId('self_'+num).value));
}

function isNum(n) { // 是不是數字
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function buyOthers() { // 買營養食品
    console.log('營養');
}

function findPatient(num) { // 用當前排序
    for (i in all_index) {
        if (num == i) { 
            return [all_index[i], all_name[i]];
        }
    }
    return false;
}

async function returnCard(num) { // 該病人還卡
    patient_info = findPatient(num);
    var pId = patient_info[0];
    var patient_name = patient_info[1];
    if (!pId) {
        alert('查無此病患');
        return;
    }
    var is_confirm = confirm(`還單，病人姓名 : ${patient_name}\n確認無誤？`);
    // not confirm
    if (!is_confirm)
        return;
    const {data : user} = await axios.get('/viewPa/nId');
    const {data : result} = await axios.post('/viewPa/submitUpdatePa', {pId : pId, aId : user.nId});
    if (result.suc && result.had_this_patient > 0) { // 沒有 error 且 有此病患
        // 提醒總共還了幾筆欠單紀錄
        alert(`還單成功！\n病患-${patient_name}，總共還清 ${result.had_this_patient} 筆欠單紀錄`);
    }
    else { // 還單失敗
        if (result.e_text != "") {
            alert('還單失敗！' + result.e_text);
        }
        else if (result.had_this_patient == 0) { // affectrows = 0，無此病患
            alert('還單失敗，查無此病患有欠卡紀錄！');
        }
        else { // 有 error
            alert('還單失敗！');
        }
    }
}

getId('search').addEventListener('change', checkSearch);
function checkSearch() { // 用條件找病人
    // 先清空 table
    result.innerHTML = '';
    // 搜尋條件是否為空的
    if (getId('search').value == "" || getId('search').value == " ") 
        return; // 沒有輸入條件
    // 表頭
    var is_put = []; // 已經放進去的
    // 先放表頭
    if (getId('search').value != ' ' && getId('search').value != '') {
        /*getId('result').innerHTML = 
        "<tr><td colspan = '18'><b>病人資訊</b></td><td colspan = '2'><b>狀態</b></td><td colspan = '4'><b>費用</b></td><td colspan = '5'><b>看診選項</b></td></tr>" + 
        "<tr><td>代號</td><td>身分證字號</td><td id = 'name_col'>姓名</td><td>生日</td><td>身分</td><td>電話1</td><td>電話2</td><td>母身分證</td>" + 
        "<td>胎次</td><td>地址</td><td>病史</td><td>過敏</td><td>不喜</td><td>註記</td><td>體重</td><td>身高</td><td>編輯</td><td>尋親</td><td>付款</td>" +
        "<td>在場</td><td>押金</td><td>掛號費</td><td>部分負擔</td><td>自費</td>" +
        "<td>健保</td><td>押單</td><td>打疫苗</td><td>自費</td><td>還單</td></tr>";
        */
        putHeader();
    }
    // 條件一 : 姓名
    for (i in all_name) {
        // 有符合的字串
        if (all_name[i].includes(getId('search').value) && getId('search').value != ' ' && getId('search').value != '') { 
            is_put.push(i);
            putData(i, all_index[i], all_name[i], all_birth[i], all_tel1[i], all_tel2[i]);
        }
    }
    // 條件二 : 生日
    for (i in all_birth) {
        // 還沒放過且有符合的字串
        if (!(is_put.includes(i)) && all_birth[i].includes(getId('search').value) && getId('search').value != ' ' && getId('search').value != '') { 
            is_put.push(i);
            putData(i, all_index[i], all_name[i], all_birth[i], all_tel1[i], all_tel2[i]);
        }
    }
    // 條件三 : 電話1
    for (i in all_tel1) {
        // 還沒放過且有符合的字串
        if (!(is_put.includes(i)) && all_tel1[i].includes(getId('search').value) && getId('search').value != ' ' && getId('search').value != '') { 
            is_put.push(i);
            putData(i, all_index[i], all_name[i], all_birth[i], all_tel1[i], all_tel2[i]);
        }
    }
    // 條件四 : 電話2
    for (i in all_tel2) {
        // 還沒放過且有符合的字串
        if (!(is_put.includes(i)) && all_tel2[i].includes(getId('search').value) && getId('search').value != ' ' && getId('search').value != '') { 
            is_put.push(i);
            putData(i, all_index[i], all_name[i], all_birth[i], all_tel1[i], all_tel2[i]);
        }
    }
    // 條件五 : 身分證
    for (i in all_id) {
        // 還沒放過且有符合的字串
        if (!(is_put.includes(i)) && all_id[i].includes(getId('search').value) && getId('search').value != ' ' && getId('search').value != '') { 
            is_put.push(i);
            putData(i, all_index[i], all_name[i], all_birth[i], all_tel1[i], all_tel2[i]);
        }
    }
    // 條件六 : 地址
    for (i in all_address) {
        // 還沒放過且有符合的字串
        if (!(is_put.includes(i)) && all_address[i].includes(getId('search').value) && getId('search').value != ' ' && getId('search').value != '') { 
            is_put.push(i);
            putData(i, all_index[i], all_name[i], all_birth[i], all_tel1[i], all_tel2[i]);
        }
    }
    setExpense(all_identity[i], is_put);
}

function btListener(total_len) {
    for (let i = 0;i < total_len;i++) {
        getId('put_'+i).addEventListener('click', inText);
    }
}

function putData(i, index, name , birth, tel1, tel2) { // 放入病患資訊
        getId('result').style.display = '';
        getId('form').style.display = 'none';
        getId('result').innerHTML += 
        "<tr id = 'log_row" + i + "'/><td/>" + index + 
        "<td>" + all_id[i] + "</td>" + 
        "<td>" + name + "</td>" +
        "<td id = 'show_birth'>" + lessBirth(birth) + "</td>" +
        "<td>" + all_identity[i] + "</td>" +
        "<td>" + tel1 + "</td>" +
        "<td>" + tel2 + "</td>" +
        "<td>" + all_mom[i] + "</td>" +
        "<td>" + all_parity[i] + "</td>" +
        "<td>" + all_address[i] + "</td>" +
        "<td>" + all_pass[i] + "</td>" +
        "<td>" + all_allergy[i] + "</td>" +
        "<td>" + all_hate[i] + "</td>" +
        "<td>" + all_mark[i] + "</td>" +
        "<td>" + all_weight[i] + "</td>" +
        "<td>" + all_height[i] + "</td>" +
        "<td><button onclick = 'editPatients(" + i + ")' id = 'edit_" + "'>編輯</button></td>" +
        "<td><button onclick = 'findFamily(" + i + ")' id = 'find_" + "'>尋親</button></td>" +
        "<td><input type = 'checkbox' id = 'is_paid" + i + "' checked></input></td>" +
        "<td><input type = 'checkbox' id = 'is_in" + i + "' checked></input></td>" +
        "<td><input type = 'text' class = 'expense' name = 'deposit' id = 'deposit_" + i + "' value = '0' required/></td>" +
        "<td><input type = 'text' class = 'expense' name = 'regist' id = 'regist_" + i + "' value = '0' required/></td>" +
        "<td><input type = 'text' class = 'expense' name = 'part' id = 'part_" + i + "' value = '0' required/></td>" +
        "<td><input type = 'text' class = 'expense' name = 'self' id = 'self_" + i + "' value = '0' required/></td>" +
        "<td><button onclick = 'inText(" + i + ", 0)' id = 'put_" + "'>看診</button></td>" +
        "<td><button onclick = 'inText(" + i + ", 1)' id = 'card_" + "'>押單</button></td>" + 
        "<td><button onclick = 'inText(" + i + ", 2)' class = 'vac' id = 'vac_" + "'>疫苗</button></td>" + 
        "<td><button onclick = 'inText(" + i + ", 3)' id = 'self_" + "'>自費</button></td>" + 
        "<td><button onclick = 'inText(" + i + ", 4)' id = 'add_medicines" + "'>加藥</button></td>" + 
        "<td><button onclick = 'returnCard(" + i + ")' id = 'return_" + "'>還單</button></td></tr>";
}

function findFamily(i) { // 尋找家屬
    all_family = [i]; // 家庭裡的成員，先放自己
    if (!all_id[i] == "") {
        // 用自己身分證找
        for (let j = 0;j < all_mom.length;j++) {
            if (all_id[i] == all_mom[j]) { // 母親身份證字號和自己相同，自己是他媽
                //console.log(all_name[j] + " 自己是他媽");
                all_family.push(j);
            }
        }
    }
    if (!all_mom[i] == "") {
        // 用母親身分證找
        for (let j = 0;j < all_id.length;j++) {
            if (!all_family.includes(j) && all_mom[i] == all_id[j]) { // 母親身份證字號和自己相同，是他媽
                //console.log(all_name[j] + " 是他媽");
                all_family.push(j);
            }
        }
    }
    // 用電話1找
    if (!all_tel1[i] == "") {
        for (let j = 0;j < all_tel1.length;j++) {
            if (!all_family.includes(j) && all_tel1[i] == all_tel1[j]) { 
                //console.log(all_name[j] + " 電話1");
                all_family.push(j);
            }
        }
    }
    // 用電話2找
    if (!all_tel2[i] == "") {
        for (let j = 0;j < all_tel2.length;j++) {
            if (!all_family.includes(j) && all_tel2[i] == all_tel2[j]) {
                //console.log(all_name[j] + " 電話2");
                all_family.push(j);
            }
        }
    }
    // 用地址找
    if (!all_address[i] == "") {
        for (let j = 0;j < all_address.length;j++) {
            if (!all_family.includes(j) && all_address[i] == all_address[j]) {
                all_family.push(j);
            }
        }
    }
    putFoundPatients(all_family); // 把找到的家人放進去
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

function putHeader() { // table 標頭
    if (getId('search').value != ' ' && getId('search').value != '') {
        getId('result').innerHTML = 
        "<tr><td colspan = '18'><b>病人資訊</b></td><td colspan = '2'><b>狀態</b></td><td colspan = '4'><b>費用</b></td><td colspan = '6'><b>看診選項</b></td></tr>" + 
        "<tr><td>代號</td><td>身分證字號</td><td id = 'name_col'>姓名</td><td>生日</td><td>身分</td><td>電話1</td><td>電話2</td><td>母身分證</td>" + 
        "<td>胎次</td><td>地址</td><td>病史</td><td>過敏</td><td>不喜</td><td>註記</td><td>體重</td><td>身高</td><td>編輯</td><td>尋親</td><td>付款</td>" +
        "<td>在場</td><td>押金</td><td>掛號費</td><td>部分負擔</td><td>自費</td>" +
        "<td>健保<br/>看診</td><td>押單</td><td>健保<br/>疫苗</td><td>自費</td><td>加藥</td><td>還單</td></tr>";
    }
}

async function editPatients(i) { // 編輯病人
    // 防呆，驗證該帳號密碼
    var confirm_passwd = prompt(`編輯病患資料。\n身份證字號：${all_id[i]}。\n姓名：${all_name[i]}。\n請輸入密碼。`);
    if (!confirm_passwd) { // 取消編輯
        alert('取消編輯！');
        return;
    }
    else { // 驗證密碼
        //console.log(confirm_passwd);
        const {data : user} = await axios.get('/viewPa/nId'); // 查 nId
        nId = user.nId;
        const {data : suc} = await axios.post('/login/check', {account : nId, pass : confirm_passwd});
        if (suc.error != undefined) { // 密碼錯誤
            alert(`編輯失敗，${suc.error}。`);
            return;
        }
    }
    getId('result').style.display = 'none';
    getId('form').style.display = 'block';
    getId('id').readOnly = true;
    getId('search').value = ''; // 把搜尋欄位清空
    putEditData(i); // put the edit data
    getId('form').removeEventListener("submit", sendAppend); // 刪除聆聽新增病患，不然會重疊
    getId('info_table_title').innerHTML = '編輯病患';
    getId('form').addEventListener('submit', sendEdit);
}

async function sendEdit(e) { // 送出編輯資料
    e.preventDefault();
    const {data : user} = await axios.get('/viewPa/nId'); // 查 nId
    nId = user.nId;
    data = {height : getId('height').value, weight : getId('weight').value, nId : nId, name : getId('name').value, id : getId('id').value, sex : getId('sex').value, birth : getId('birth').value, identity : getId('identity').value, tel1 : getId('tel1').value, tel2 : getId('tel2').value, mom_id : getId('mom').value, parity : getId('parity').value, address : getId('address').value, can_used : getId('can').value, pass : getId('pass').value, allergy : getId('allergy').value, hate : getId('hate').value, mark : getId('mark').value} 
    const {data : suc} = await axios.post('/viewPa/editPatients', data);
    if (suc.suc) { // 新增成功
        alert('編輯成功！');
    }
    else { // 新增失敗
        alert(`編輯失敗！${suc.e_text}`);
    }
    window.location.reload();
}

function putEditData(i) { // 放入要編輯的病人的資訊
    getId('name').value = all_name[i];
    getId('id').value = all_id[i];
    getId('sex').value = all_sex[i];
    getId('birth').value = all_birth[i];
    getId('identity').value = all_identity[i];
    getId('tel1').value = all_tel1[i];
    getId('tel2').value = all_tel2[i];
    getId('mom').value = all_mom[i];
    getId('parity').value = all_parity[i];
    getId('address').value = all_address[i];
    getId('can').value = all_can[i];
    getId('pass').value = all_pass[i];
    getId('allergy').value = all_allergy[i];
    getId('hate').value = all_hate[i];
    getId('mark').value = all_mark[i];
    getId('weight').value = all_weight[i];
    getId('height').value = all_height[i];
}

/*document.querySelector('#vac').addEventListener('change', function() {
    if (this.checked) {
        getId('vac').value = 'on';
        getId('vId').style.visibility = 'visible';
    } 
    else {
        getId('vac').value = 'off';
        getId('vId').style.visibility = 'hidden';
    }
});*/

//getId('card').addEventListener('click', setDeposit);

function setDeposit(i) { 
    // set deposit default value depend on have/no card
    var default_deposit = 300;
    getId('deposit_'+i).value = default_deposit;
}

function setExpense(identity, is_put) { // 設身分對應的費用
    var all_kinds_name = ["健保", "勞保", "親友"]; // 總共身分
    var identity_regist = [150, 50, 10]; // 對應的掛號費
    var identity_deposit = [300, 150, 10]; // 對應的押金
    for (let j = 0;j < is_put.length;j++) { // 每一筆放進搜尋到的病患
        for (let i = 0;i < all_kinds_name.length;i++) {
            if (all_identity[is_put[j]] == all_kinds_name[i]) { // 對應身分放入收費
                getId('regist_' + is_put[j]).value = identity_regist[i];
                getId('deposit_' + is_put[j]).value = identity_deposit[i];
            }
        }
    }
}

getId('append_patients').addEventListener('click', appendPatients);

async function appendPatients() {
    getId('result').style.display = 'none';
    getId('form').style.display = 'block';
    getId('id').readOnly = false;
    getId('search').value = ''; // 把搜尋欄位清空
    getId('info_table_title').innerHTML = '新增病患';
    getId('form').removeEventListener("submit", sendEdit); // 刪除聆聽編輯病患，不然會重疊
    getId('form').addEventListener('submit', sendAppend);
}

async function sendAppend(e) {
    e.preventDefault();
    const {data : user} = await axios.get('/viewPa/nId'); // 查 nId
    nId = user.nId;
    data = {height : getId('height').value, weight : getId('weight').value, nId : nId, name : getId('name').value, id : getId('id').value, sex : getId('sex').value, birth : getId('birth').value, identity : getId('identity').value, tel1 : getId('tel1').value, tel2 : getId('tel2').value, mom_id : getId('mom').value, parity : getId('parity').value, address : getId('address').value, can_used : getId('can').value, pass : getId('pass').value, allergy : getId('allergy').value, hate : getId('hate').value, mark : getId('mark').value} 
    const {data : suc} = await axios.post('/viewPa/addPatients', data);
    if (suc.suc) { // 新增成功
        alert('新增成功！');
    }
    else { // 新增失敗
        alert(`新增失敗！${suc.e_text}`);
    }
    window.location.reload();
}

var light=document.getElementById('light');
var fade=document.getElementById('fade');

getId('vac_cancel_bt').addEventListener('click', cancelVac);
getId('vac_confirm_bt').addEventListener('click', sendVac);

function cancelVac() { // 取消輸入疫苗代碼 
    light.style.display='none';
    fade.style.display='none';
    alert('掛號取消！');
}

async function sendVac() { // 送出疫苗
    light.style.display='none';
    fade.style.display='none';
    const {data : all_vac} = await axios.get('/viewPa/allVac');
    var vId; // 疫苗代號
    var total_vId = []; // 全部要打的疫苗
    var had_vac = false; // 是否有勾選一筆疫苗
    for (let i = 0;i < all_vac.all_vac.length;i++) {
        if (getId('vac_input'+i).checked) {
            had_vac = true;
            vId = all_vac.all_vac[i].vId;
            total_vId.push(vId);
        }
    }
    if (!had_vac) { // 一筆疫苗都沒勾選
        alert('掛號取消，請勾選至少一筆疫苗！');
        return;
    }
    var paid_value = (getId('is_paid'+vac_num).checked) ? 1 : 0; // 是否付款，換成 0,1
    var in_value = (getId('is_in'+vac_num).checked) ? 1 : 0; // 是否在場，換成 0,1
    // 要送出的資料
    if (!is_all_self) { // 不是自費
        // 只收掛號費和部分負擔
        deposit = 0;
        regist = parseInt(getId('regist_'+vac_num).value);
        part_self = parseInt(getId('part_'+vac_num).value);
        all_self = 0;
    }
    else {
        // 只收自費
        deposit = 0;
        regist = 0;
        part_self = 0;
        all_self = parseInt(getId('self_' + vac_num).value);
    }
    const {data : user} = await axios.get('/viewPa/nId'); // 查 nId
    nId = user.nId;
    var data = {total_vId : total_vId, mark : record_mark, id : all_id[vac_num], vac : 'on', vId : vId, paid : paid_value, nId : nId, card : true, in : in_value, dId : vac_dId, regist : regist, deposit : deposit, part_self : part_self, all_self : all_self} 
    // 總收費
    var total_expense = deposit + regist + part_self + all_self;
    // 要印出的文字
    var is_paid_text = (getId('is_paid'+vac_num).checked) ? '已' : '未';
    var is_in_text = (getId('is_in'+vac_num).checked) ? '有' : '沒有';
    var is_confirm = confirm(`醫生代碼 : ${vac_dId}。\n${is_paid_text}付款。\n${is_in_text}在場。\n應收金額 : ${total_expense}`);
    if (!is_confirm) { // not confirm
        alert('掛號取消！');
        return;
    }
    // 新增 record
    const suc = await axios.post('/viewPa', data);
    if (suc.data.suc) {
        alert('新增成功！');
        window.location.href = '/viewPa';
    }
    else {
        console.log(Object.values(suc.data.error)[1]);
        var sql_error_text = Object.values(suc.data.error)[1];
        console.log(suc.data.error);
        alert(`新增失敗`);
    }
}

async function addVacElement() { // 製作勾選疫苗的畫面
    const {data : all_vac} = await axios.get('/viewPa/allVac');
    all_vac.all_vac.sort(function(a,b){ // 順序一開始要倒過來，因為新增元素會往下新增
        return b.vId - a.vId;
    });
    // 全部的疫苗種類
    for (let i = 0;i < all_vac.all_vac.length;i++) {
        // 新增每筆疫苗元素
        var vac_text = document.createElement("div");
        vac_text.innerHTML = '疫苗編號：' + all_vac.all_vac[i].vId +'，疫苗別：' + all_vac.all_vac[i].a_code + "。";
        var vac = document.createElement("input");
        vac.id = 'vac_input' + i;
        vac.type = 'checkbox';
        vac_text.appendChild(vac);
        getId('light').insertBefore(vac_text, getId('light').firstChild);
    }
}
addVacElement();

// 地址索引

const twzipcode = new TWzipcode('.twzipcode');
getId('address').addEventListener('input', changeTai); // 若地址輸入框更動，把 "台" 取代成 "臺

async function roadFile() { // 路名的 json。key = 區名，value = [全部路名]
    const road = await axios.get('/viewPa/roadFile');
    all_road = road.data.data.replaceAll("'", '"');
    all_road = JSON.parse(all_road); // 轉 string to json
    //console.log(all_road);
}
roadFile();

var all_county = []; // 所有的縣市
function mkAddress() { // 製作包含縣市名稱 + (縣市名稱+區名) 的 array
    var all_address_list = Object.keys(twzipcode.database);
    for (let i = 0;i < Object.keys(twzipcode.database).length;i++) {
        all_county.push(Object.keys(twzipcode.database)[i]);
        for (let j = 0;j < Object.keys(Object.values(twzipcode.database)[i]).length;j++) {
            all_address_list.push(Object.keys(twzipcode.database)[i] + Object.keys(Object.values(twzipcode.database)[i])[j]);
        }
    }
    putRoad(all_county); // 一開始先放入全部的縣市
    return all_address_list;
}
const all_address_list = mkAddress(); // 製作包含縣市名稱 + (縣市名稱+區名) 的 array
//console.log(all_address_list);

function checkAddress(e) { // 檢查地址輸入框有沒有符合資料庫裡的地址
    getId('address_list').innerHTML = '';
    const now_address = getId('address').value;
    // 在城市的索引
    const all_index_in_city = indexInCity(now_address);
    if (now_address ===  "") { // 輸入框是空的
        putRoad(all_county); // 放入全部的縣市
        return;
    }
    if (all_index_in_city.length == 0) { // 沒有符合的地址
        const in_road = findInRoad(now_address); // 就再去找路名
        if (in_road.length > 0) { // 有相符的路名。ex. 新北市新莊區中
            console.log(in_road);
            putRoad(in_road);
        }
        else { // 沒有任何匹配的路名
            return;
        }
    }
    if (typeof(all_index_in_city) == 'string') { // 輸入為區，顯示路名。ex. 新北市新莊區
        putRoad(all_road[all_index_in_city]);
        return;
    }
    for (let i = 0;i < all_index_in_city.length;i++) { // 可能會有多個符合
        var index_in_city = all_index_in_city[i]; // 一個一個拿出來
        if (index_in_city < Object.keys(twzipcode.database).length) { // 是縣市，列出全部區
            for (let i = 0;i < Object.keys(Object.values(twzipcode.database)[index_in_city]).length;i++) {
                // 縣市名 + 區名
                var city_add_section_name = Object.keys(twzipcode.database)[index_in_city] + Object.keys(Object.values(twzipcode.database)[index_in_city])[i]
                var option = document.createElement('option');
                option.value = city_add_section_name;
                getId('address_list').appendChild(option);
            }
            console.log(getId('address_list').appendChild(option));
        }
        else { // 單一區，非縣市。ex. 輸入 新北市新 ，就要出現新北市新莊區、新北市新店區
            var option = document.createElement('option');
            option.value = all_address_list[index_in_city];
            getId('address_list').appendChild(option);
        }
    }
}

function findInRoad(now_address) { // 找是否有在路名裡
    all_matched = []; // 所有符合的路
    for (let i = 0;i < Object.keys(all_road).length;i++) { // 所有的區
        this_array = Object.values(all_road[Object.keys(all_road)[i]]);
        for (let j = 0;j < this_array.length;j++) { // 該區所有的路
            if (this_array[j].includes(now_address)) { // 有包含在此路
                all_matched.push(this_array[j]);
            }
        }
    }
    return all_matched;
}

function putRoad(all_this_road) { // 把路名放進框框
    for (let i = 0;i < all_this_road.length;i++) {
        var option = document.createElement('option');
        option.value = all_this_road[i];
        getId('address_list').appendChild(option);
    }
}

function indexInCity(now_address) { // 回傳所有符合的地址的 index 的 array
    if (all_address_list.indexOf(now_address) >= 0 && all_address_list.indexOf(now_address) <= Object.keys(twzipcode.database).length) { // 單一縣市
        return [all_address_list.indexOf(now_address)];
    }
    else if (all_address_list.indexOf(now_address) >= 0 && all_address_list.indexOf(now_address) > Object.keys(twzipcode.database).length) { // 完整區
        return now_address;
    }
    else { // 不是單一縣市，檢查是否是在 縣市+區
        all_matched = []; // 可能會有多個區符合
        for (let i = Object.keys(twzipcode.database).length;i < all_address_list.length;i++) {
            if (all_address_list[i].includes(now_address)) {
                all_matched.push(i);
            }
        }
    }
    return all_matched;
}

function checkAddressChange() { // 當地址 onchange 觸發，就再檢查一次。因為只有 keydown 會偵測不到使用者按下 option 後改的 value
    checkAddress();
}

function changeTai() {
    // 把 "台" 改成 "臺"
    getId('address').value = getId('address').value.replaceAll('台', '臺');
}

function lessBirth(birth) { // 把生日用的好看一點
    var new_birth = '';
    var first_dash = false;
    console.log(birth);
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