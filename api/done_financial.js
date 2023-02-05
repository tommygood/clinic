var express = require('express');
var app = express();
const router = require('express').Router();
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
var db = require('mariadb');
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
    var path = root + 'templates/done_financial.html';
    res.sendFile(path);
    res.end;
    return;
});

router.get('/records', async function(req, res) {
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
    var records;
    try {
        records = await conn.query("select * from done_financial;");
    }
    catch(e) {
        console.log(e);
    }
    conn.release();
    res.json({'records' : records});
    res.end();
    return;
})

router.post('/submit', async function(req, res) {
    try {
        const user = jwt.verify(req.cookies.token, 'my_secret_key');
    }
    catch(e) {
        console.log(e);
        res.json({'error' : '未登入'});
        res.end();
        return;
    };
    let conn = await pool.getConnection();
    var suc = true;
    try {
        // update done_financial set is_true = 1
        var up_suc = await conn.query("update done_financial set `is_true` = 1, `next_aId` = ?, `next_log` = ? where `no` = ?", [req.body.aId, req.body.next_log, req.body.no]);
    }
    catch(e) {
        suc = false;
        console.log(e);
    }
    conn.release();
    res.json({'suc' : suc});
    res.end();
    return;
})


module.exports = router;
