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

router.get('/', function(req, res) {
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
    if (user.data.aId) { // 登入中
        res.sendFile(root + 'templates/debt.html');  //回應靜態文件
        return;
    }
    else {
        res.redirect('/login');
        res.end();
        return;
    }
});

router.get('/records', async function(req, res) {
    // get all debts
    try {
        const user = jwt.verify(req.cookies.token, 'my_secret_key');
    }
    catch(e) {
        console.log(e);
        res.redirect('/login');
        res.end();
        return;
    };
    let conn = await pool.getConnection();
    var suc = true;
    try {
        var debt_records = await conn.query('select * from debt;');
    }
    catch(e) {
        suc = false;
        console.log(e);
    }
    conn.end();
    res.json({suc : suc, debt_records : debt_records});
    res.end;
    return;
})

router.post('/turned', async function(req, res) {
    // get all debts
    try {
        const user = jwt.verify(req.cookies.token, 'my_secret_key');
    }
    catch(e) {
        console.log(e);
        res.redirect('/login');
        res.end();
        return;
    };
    let conn = await pool.getConnection();
    var suc = true;
    var error = null;
    try {
        // update turned = 1 
        var update_debt = await conn.query('update debt set `turned` = 1 where `no` = ?;', req.body.no);
        // insert into financial
        var fId = await conn.query('insert into financial(`aId`, `reason`, `money`) values(?, ?, ?);', [req.body.aId, req.body.reason, req.body.money]); // 新增到總帳務
        // insert into financial_today
        await conn.query('insert into financial_today(`aId`, `reason`, `money`, `fId`) values(?, ?, ?, ?);', [req.body.aId, req.body.reason, req.body.money, fId.insertId]); // 新增到今日帳務
    }
    catch(e) {
        suc = false;
        var error = e;
        console.log(e);
    }
    conn.end();
    res.json({suc : suc, error : error});
    res.end;
    return;
})

module.exports = router;
