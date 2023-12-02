function getId(id) {
    return document.getElementById(id);
}

(async() => { // 查詢 nId
    const {data : user} = await axios.get('/viewPa/nId');
    getId('account_info').innerHTML += user.nId;
})();

getId('addMed').addEventListener('submit', async(e) => {
    e.preventDefault();
    const today = new Date();
    const input_date = new Date(getId('expire').value);
    if (today > input_date) { // 新增藥品的過期日期 < 今日
        alert('過期日期請大於今日日期！');
        return;
    }
    const {data : user} = await axios.get('/viewPa/nId');
    const data = {
        code : getId('code').value,
        expire : getId('expire').value,
        aId : user.nId,
        quantity : getId('quantity').value,
        reason : getId('reason').value,
        mark : getId('mark').value,
        expense : getId('expense').value
    };
    const checked_data = await axios.post('/addMed/check', data);
    if (checked_data.data.suc) {
        alert('新增成功！');
    }
    else {
        alert('新增失敗！\n' + checked_data.data.return_text);
    }
    window.location.reload();
});

getId('reason').addEventListener('change', async(e) => {
    var plus = ['購入', '借入', '被還']; // 增加的動作
    var need_expense = ['購入', '賣出']; // 需要費用的動作
    is_plus = false;
    for (let i = 0;i < plus.length;i++) {
        if (getId('reason').value == plus[i]) { // 增加的動作
            getId('expire').style.display = 'inline'; // 要顯示過期
            getId('expire_text').style.display = 'inline'; 
            is_plus = true;
        }
    }
    if (!is_plus) { // 不是進貨的
        getId('expire').style.display = 'none';
        getId('expire_text').style.display = 'none';
    }
    is_expense = false;
    for (let i = 0;i < need_expense.length;i++) {
        if (getId('reason').value == need_expense[i]) {
            getId('expense').style.display = 'inline';
            getId('expense_text').style.display = 'inline';
            is_expense = true;
        }
    }
    if (!is_expense) { // 不是進貨的
        getId('expense').style.display = 'none';
        getId('expense_text').style.display = 'none';
    }
})

async function makeMedTable() { // 把相同但是不同批次的藥加起來
    const {data : med_inventory_each} = await axios.get('/med_inventory_each');
    const {data : medicines} = await axios.get('/medicines_normal');

    var combine_inventory = mkCombine(med_inventory_each); // 把重複的藥的數量加起來
    // 把全部重複的藥加總(不限批次)
    for (let i = 0;i < combine_inventory.length;i++) {
        for (let k = 0;k < medicines.length;k++) {
            if (combine_inventory[i].code == medicines[k].code) { // 藥碼相同  
                tab.innerHTML += "<tr id = 'log_row'" + i + "/><td/>" + combine_inventory[i].no + 
                "<td>" + combine_inventory[i].code + "</td>" +
                "<td>" + medicines[k].medi_mand + "</td>" +
                // 因為 js 小數點加法會怪怪的，所以要四捨五入到小數點後第二位
                "<td>" + Math.round(combine_inventory[i].now_quantity * 100) / 100 + "</td></tr>"
                break;
            }
        }
    }
}
makeMedTable();

function mkCombine(med_inventory_each) { // 把重複的藥(同個藥但不同時間進)加成同一種藥
    var combine_inventory = [];
    for (let i = 0;i < med_inventory_each.length;i++) {
        var is_new = true; // 先假設為不是重複的藥
        for (let j = 0;j < combine_inventory.length;j++) {
            if (med_inventory_each[i].code == combine_inventory[j].code) { // 重複的藥
                combine_inventory[j].now_quantity = parseFloat(combine_inventory[j].now_quantity); // 從字串變成小數點型態，才能和下一個相加
                combine_inventory[j].now_quantity += parseFloat(med_inventory_each[i].now_quantity); // 新增數量
                combine_inventory[j].now_quantity = parseFloat(combine_inventory[j].now_quantity); // 從字串變成小數點型態，才能和下一個相加
                is_new = false; // 不是新的藥
            }
        }
        if (is_new) { // 新的藥
            combine_inventory.push(med_inventory_each[i]);
        }
        //console.log(med_inventory_each[i].now_quantity);
    }
    return combine_inventory;
}