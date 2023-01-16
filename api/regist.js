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

router.get('/', async function(req, res) { // 回傳 html
    try {
        const user = jwt.verify(req.cookies.token, 'my_secret_key');
        console.log(user.data.title);
        if (user.data.title != 'super') { // 此頁面只有超級管理員才能用
            res.redirect('/login');
            res.end();
            return;
        }
    }
    catch(e) {
        console.log(e);
        res.redirect('/login');
        res.end();
        return;
    };
    res.sendFile(root + 'templates/regist.html');  //回應靜態文件
    res.end;
    return;
});

router.get('/account', async function(req, res) { // 回傳所有帳號
    try {
        const user = jwt.verify(req.cookies.token, 'my_secret_key');
        if (user.data.title != 'super') { // 此頁面只有超級管理員才能用
            res.redirect('/login');
            res.end();
            return;
        }
    }
    catch(e) {
        console.log(e);
        res.redirect('/login');
        res.end();
        return;
    };
    let conn = await pool.getConnection();
    let accounts;
    try {
        accounts = await conn.query('select * from accounts;');
    }
    catch(e) {
        console.log(e);
    }
    conn.release();
    res.json({accounts : accounts});
    res.end;
    return;
});

router.post('/checkAddAccount', async function(req, res) { // 回傳所有帳號
    try {
        const user = jwt.verify(req.cookies.token, 'my_secret_key');
        if (user.data.title != 'super') { // 此頁面只有超級管理員才能用
            res.redirect('/login');
            res.end();
            return;
        }
    }
    catch(e) {
        console.log(e);
        res.redirect('/login');
        res.end();
        return;
    };
    let conn = await pool.getConnection();
    var suc = true; // 是否可以新增此筆帳號
    var error_text = ''; // 錯誤訊息
    try {
        total_titles = ['doc', 'nur', 'medi', 'others', 'super']; // 目前所有帳號權限種類
        const same_account = await conn.query('select count(*) from accounts where `aId` = ?;', req.body.account);
        if (same_account[0]['count(*)'] != 0) { // 先檢查帳號有沒有重複
            suc = false;
            error_text = '錯誤：帳號重複！';
        }
        else if (!total_titles.includes(req.body.title)) { // 此帳號權限的種類不包含在目前種類
            suc = false;
            error_text = '錯誤：無此種帳號權限！';
        }
        if (suc) { // 通過檢查
            // 新增此筆帳號
            await conn.query('insert into accounts values(?, ?, ?, ?)', [req.body.account, req.body.passwd, req.body.title, req.body.name]);
        }
    }
    catch(e) {
        console.log(e);
        suc = false;
    }
    conn.release();
    res.json({suc : suc, error_text : error_text});
    res.end;
    return;
});

module.exports = router;