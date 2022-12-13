const router = require('express').Router();
var bodyParser = require("body-parser");
var db = require('mariadb');
var func = require('../module/func');
var jwt = require('jsonwebtoken');
const pool = db.createPool({
    host : 'localhost',
    user : 'wang',
    password : 'wang313',
    database : 'clinic'
});
var config = require("config"); // 設定檔
var root = config.get('server.root'); // 根目錄位置

router.get('/', async function(req, res) {
    try {
        const user = jwt.verify(req.cookies.token, 'my_secret_key');
    }
    catch(e) {
        console.log(e);
        res.redirect('/login');
        res.end();
        return;
    };
    const user = jwt.verify(req.cookies.token, 'my_secret_key');
    if (user.data.aId && user.data.title == 'nur') { // 登入中
        let conn = await pool.getConnection();
        await conn.query('insert into look_medicines_inventory(`aId`) values(?)', user.data.aId);
        conn.release();
        res.sendFile(root + 'templates/addMed.html');  //回應靜態文件
        return;
    }
    else {
        res.statusCode = 302;
        res.setHeader("Location", "http://localhost:8080/login");
        res.end();
        return;
    }
});

router.post('/check', async function(req, res) {
    try {
        const user = jwt.verify(req.cookies.token, 'my_secret_key');
    }
    catch(e) {
        console.log(e);
        res.redirect('/login');
        res.end();
        return;
    };
    const {code, expire, aId, quantity, reason, mark, expense} = req.body;
    console.log(req.body);
    // 檢查不能輸入空值的欄位
    if (code.length == 0 || aId.length == 0 || quantity.length == 0 || reason.length == 0 || mark.length == 0) {
        return res.json({error:'請勿輸入空值'});
        res.end();
    };
    try {
        let conn = await pool.getConnection();
        var minus = ['借出', '遺失', '賣出', '還出']; // 減少數量的動作
        var in_minus = false;
        var return_text = ''; // 要回傳的訊息
        const in_normal = await conn.query('select count(*) from medicines_normal where `code` = ?', code);
        if (in_normal[0]['count(*)']==0) { // 還沒被放入常用的藥品
            const all_this_code = await conn.query('select * from medicines where `code` = ?', code); // 全部是這個 code 的藥品
            const true_code = all_this_code[all_this_code.length-1]; // 最後一個才是正確的
            // 放入常用藥品
            await conn.query("insert into medicines_normal(`mId`, `new_mark`, `oral_tablet`, `single_two`, `code`, `price`, `price_date`, `price_fin_date`, `medi_eng`, `medi_amount`, `medi_unit`, `ingre`, `ingre_amount`, `ingre_unit`, `dose_form`, `medi_producer`, `medi_sort`, `quality_code`, `medi_mand`, `sort_group`, `fir_ingre`, `fir_medi_amount`, `fir_medi_unit`, `sec_ingre`, `sec_medi_amount`, `sec_medi_unit`, `thi_ingre`, `thi_medi_amount`, `thi_medi_unit`, `four_ingre`, `four_medi_amount`, `four_medi_unit`, `fift_ingre`, `fift_medi_amount`, `fift_medi_unit`, `producer`, `atc_code`, `no_input`) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? , ?, ?, ?, ?)", [true_code.index, true_code.new_mark, true_code.oral_tablet, true_code.single_two, true_code.code, true_code.price, true_code.price_date, true_code.price_fin_date, true_code.medi_eng, true_code.medi_amount, true_code.medi_unit, true_code.ingre, true_code.ingre_amount, true_code.ingre_unit, true_code.dose_form, true_code.medi_producer, true_code.medi_sort, true_code.quality_code, true_code.medi_mand, true_code.sort_group, true_code.fir_ingre, true_code.fir_medi_amount, true_code.fir_medi_unit, true_code.sec_ingre, true_code.sec_medi_amount, true_code.sec_medi_unit, true_code.thi_ingre, true_code.thi_medi_amount, true_code.thi_medi_unit, true_code.four_ingre, true_code.four_medi_amount, true_code.four_medi_unit, true_code.fift_ingre, true_code.fift_medi_amount, true_code.fift_medi_unit, true_code.producer, true_code.atc_code, true_code.no_input]); 
        }
        for (let i = 0;i < minus.length;i++) {
            if (reason == minus[i]) { // 是減少藥物數量, 數量 * -1
                //var emId = await conn.query('insert into med_inventory_each(`code`, `expire`, `aId`, `quantity`, `reason`, `mark`) values(?, ?, ?, ?, ?, ?);', [code, expire, aId, parseInt(quantity, 10) * -1, reason, mark]);
                // 記錄一筆藥品使用紀錄
                var the_medicine_id = await conn.query("select `no`, `now_quantity` from med_inventory_each where `code` = ? order by expire", code);
                if (the_medicine_id[0].now_quantity < parseInt(quantity, 10)) { // 如果藥品剩餘量 < 需求量
                    return_text = '藥碼：' + true_code.code + '，已無庫存。';
                }
                var emId = await conn.query('insert into each_use_medicines(`aId`, `quantity`, `reason`, `mark`, `emId`) values(?, ?, ?, ?, ?);', [aId, parseInt(quantity, 10) * -1, reason, mark, the_medicine_id[0].no]);
                // 更新被使用的藥的現在數量
                await conn.query('update med_inventory_each set `now_quantity` = ? where `no` = ?', [the_medicine_id[0].now_quantity + parseInt(quantity, 10) * -1, the_medicine_id[0].no]);
                in_minus = true;
            }
        }
        if (!in_minus) // 是增加藥物數量
            var emId = await conn.query('insert into med_inventory_each(`code`, `expire`, `aId`, `quantity`, `reason`, `mark`, `now_quantity`) values(?, ?, ?, ?, ?, ?, ?);', [code, expire, aId, parseInt(quantity, 10), reason, mark, parseInt(quantity, 10)]);
        if (expense) {
            if (reason == "購入") { // 有花費且是購入
                //await conn.query("insert into expense(`aId`, `cost`, `emId`, `mark`) values(?, ?, ?, ?)", [aId, parseInt(expense, 10), emId.insertId, mark]);
                var fId = await conn.query('insert into financial(`aId`, `reason`, `money`, `mark`) values(?, ?, ?, ?);', [aId, '購買藥物,' + emId.insertId, parseInt(expense, 10) * -1, mark]); // 新增到總帳務
                await conn.query('insert into financial_today(`aId`, `reason`, `money`, `mark`, `fId`) values(?, ?, ?, ?, ?);', [aId, '購買藥物,' + emId.insertId, parseInt(expense, 10) * -1, mark, fId.insertId]); // 新增到總帳務
            }
            else { // 售出
                //await conn.query("insert into expense(`aId`, `cost`, `emId`, `mark`) values(?, ?, ?, ?)", [aId, parseInt(expense, 10) * -1, emId.insertId, mark]);
                var fId = await conn.query('insert into financial(`aId`, `reason`, `money`, `mark`) values(?, ?, ?, ?);', [aId, '售出藥物,' + emId.insertId, parseInt(expense, 10) * 1, mark]); // 新增到總帳務
                await conn.query('insert into financial_today(`aId`, `reason`, `money`, `mark`, `fId`) values(?, ?, ?, ?, ?);', [aId, '售出藥物,' + emId.insertId, parseInt(expense, 10) * 1, mark, fId.insertId]); // 新增到總帳務
            }
        }
        conn.release();
    }
    catch(e) {
        //conn.release();
        console.log(e);
    }
    //conn.release();
    return res.json({error:null, return_text : return_text});
    res.end();
});

module.exports = router;
