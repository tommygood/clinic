const router = require('express').Router();
var bodyParser = require("body-parser");
var db = require('mariadb');
var func = require('../module/func');
var jwt = require('jsonwebtoken');
const pool = db.createPool({
    trace : true,
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
    try {
        var conn = await pool.getConnection();
        var result = await conn.query('select * from hot_key;');
    }
    catch(e) {
        console.log(e);
        conn.release();
    }
    finally {
        conn.release();
        res.json(result);
        res.end;
    }
});

router.get('/relation', async function(req, res) {
    try {
        const user = jwt.verify(req.cookies.token, 'my_secret_key');
    }
    catch(e) {
        console.log(e);
        res.redirect('/login');
        res.end();
        return;
    };
    res.sendFile(root + 'templates/keyRelation.html');  //回應靜態文件
    res.end;
    return;
});

router.post('/', async function(req, res) {
    try {
        const user = jwt.verify(req.cookies.token, 'my_secret_key');
    }
    catch(e) {
        console.log(e);
        res.redirect('/login');
        res.end();
        return;
    };
    var suc = true;
    try {
        var conn = await pool.getConnection();
        var sql = 'insert into hot_key(`real_name`, `relative`) values(?, ?);'
        for (let i = 0;i < req.body.data.length;i++) {
            await conn.query(sql, [req.body.data[i][0], req.body.data[i][1]]);
        }
    }
    catch(e) {
        conn.release();
        console.log(e);
        suc = false;
    }
    conn.release();
    res.json({suc : suc});
    res.end;
});

module.exports = router;
