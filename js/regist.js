function getId(id) {
    return document.getElementById(id);
}

const all_title = {super : '管理員', doc : '醫生', nur : '護士', medi : '藥師', others : '其他員工'}; // 所有職位 value 對應中文名稱

getId('submit_bt').addEventListener('click', submitAccount);

async function submitAccount() { // 送出新增帳號
    const confirm_text = '確定新增此筆帳號？\n職位：' + all_title[getId('title').value] + "。\n姓名：" + getId('name').value + "。\n帳號：" + getId('account').value + '。\n密碼：' + getId('passwd').value + '。'
    if (!confirm(confirm_text)) { // 不確定要新增，取消
        alert('新增取消！');
        return;
    }
    // 送出並檢查
    data = {name : getId('name').value, title : getId('title').value, account : getId('account').value, passwd : getId('passwd').value};
    const {data : result} = await axios.post('/regist/checkAddAccount', data);
    if (result.suc) {
        alert('新增帳號成功！');
    }
    else { // 新增帳號失敗
        alert('新增帳號失敗！' + result.error_text);
    }
    window.location.reload();
}

(async() => { // 先放入所有帳號資訊
    const {data : result} = await axios.get('/regist/account');
    const accounts = result.accounts;
    for (let i = 0;i < accounts.length;i++) {
        tab.innerHTML +=  
        "<tr/><td/>"+ accounts[i].name + 
            "<td>" + all_title[accounts[i].title] + "</td>" +
            "<td>" + accounts[i].aId + "</td>" +
            "<td>" + accounts[i].pass + "</td></tr>";
    }
    // 先把新的帳號 value 放進去
    getId('account').value = accounts.length + 1; // 帳號 = 現在的帳號數量 + 1
})(); 

(async() => { // 查詢 nId
    const {data : user} = await axios.get('/viewPa/nId');
    var {data : account_info} = await getTitle(user.nId);
    var title = account_info.title;
    var name = account_info.name;
    getId('account_info').innerHTML = "<b>" + user.nId + "</b> 號" + title + "：" + name + "";
})();

async function getTitle(nId) { // 用帳號找職位
    var title = axios.get('/getTitle', {params : {aId : nId}});
    console.log(title);
    return title;
}