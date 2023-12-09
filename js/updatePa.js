function getId(id) {
    return document.getElementById(id);
}

function getName(name) {
    return document.getElementsByName(name);
}

(async() => { // 查詢 nId
    const {data : user} = await axios.get('/viewPa/nId');
    const {data : up_rId} = await axios.get('viewPa/getUpdatePa');
    getId('rId').innerHTML = Object.values(up_rId);
    getId('nId').innerHTML = user.nId;
})();

getId('form').addEventListener('submit', async(e) => {
    e.preventDefault();
    var data = {rId : getId('rId').innerHTML, nId : getId('nId').innerHTML, name : getId('name').value, id : getId('id').value, sex : getId('sex').value, birth : getId('birth').value, identity : getId('identity').value, tel1 : getId('tel1').value, tel2 : getId('tel2').value, mom_id : getId('mom').value, parity : getId('parity').value, address : getId('address').value, can_used : getId('can').value, pass : getId('pass').value, allergy : getId('allergy').value, hate : getId('hate').value, mark : getId('mark').value} 
    const suc = await axios.post('/viewPa/submitUpdatePa', data);
    if (suc.data.suc) {
        alert('新增成功！');
        window.location.href = '/viewPa';
    }
    else {
        alert('新增失敗');
    }
})

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

//getId('card').addEventListener('change', hideInput);

var element = ['name', 'id', 'sex', 'birth', 'identity', 'tel1', 'tel2', 'mom', 'parity', 'address', 'can', 'pass', 'allergy', 'hate', 'mark']

function hideInput() {
    if (this.checked) {
        getId('card').value = 'on';
        for (let i = 0;i < element.length;i++) {
            getId(element[i]).style.display = 'none';
            getId(element[i]+"_text").style.display = 'none';
            getId(element[i]+"_row").style.display = 'none';
        }
    }
    else {
        getId('card').value = 'off';
        for (let i = 0;i < element.length;i++) {
            getId(element[i]).style.display = 'inline';
            getId(element[i]+"_text").style.display = 'inline';
            getId(element[i]+"_row").style.display = 'block';
        }
    }
}

function alertLog(response) { // 登入
    for (let i = 0;i < response.data[response.data.length-1].length;i++) {
        if (response.data[response.data.length-1][i].status)
            return;
        }
    var name = prompt("請輸入您的帳號", ""); //將輸入的內容賦給變數 name ，
    var pass = prompt("請輸入您的密碼", ""); //將輸入的內容賦給變數 name ，
    var log_suc = 0;
    for (let i = 0;i < response.data[response.data.length-1].length;i++) {
        if (response.data[response.data.length-1][i].nId==name && response.data[response.data.length-1][i].pass==pass) {
            getId('nId').value = name;
            alert('登入成功');
            log_suc = 1;

        }
    }
    if (log_suc == 0) {
        alert('登入失敗');
        location.reload();
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
    }
    getId("search").addEventListener('change', test); // 當搜尋內容有改變
    getId("code").addEventListener('change', inText); // 當病人代碼改變
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

function inText() { // 填入代號的資料
    getId('name').value = '';
    for (i in all_index) {
        if (getId('code').value != ' ' && getId('code').value != '' && getId('code').value == parseInt(i)+1) { // index 從 0 開始
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
        }
    }
}

test = function() {
    result.innerHTML = '';
    if (getId('cond').value == 'b') // 條件為生日
        var chose = all_birth;
    else if (getId('cond').value == 'n') // 條件為姓名
        var chose = all_name;
    else 
        return; // 沒有輸入條件
    for (i in chose) {
        if (i == 0 && getId('search').value != ' ' && getId('search').value != '') // 表頭，沒有搜索時不要 
            result.innerHTML = '代號 姓名 生日<br/>';
        if (chose[i].includes(getId('search').value) && getId('search').value != ' ' && getId('search').value != '') { 
            result.innerHTML += all_index[i];
            result.innerHTML += all_name[i];
            result.innerHTML += all_birth[i] + "<br/>";
        }
    }
    setTimeout(test, 1000);
}