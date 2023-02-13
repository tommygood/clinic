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
var config = require("config");
var root = config.get('server.root');

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
    var path = root + "templates/financial.html";
    res.sendFile(path);
    res.end;
    return;
});

router.post('/showDetail', async function(req, res) {
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
    var result;
    try {
        if (req.body.reason_type == 1) {
            result = await conn.query('select * from records where `no` = ?', req.body.rId);
        }
        else if (req.body.reason_type == 2) {
            result = await conn.query('select * from each_use_medicines where `no` = ?', req.body.rId);
        }
        else if (req.body.reason_type == 3) {
            result = await conn.query('select * from med_inventory_each where `no` = ?', req.body.rId);
        }
    }
    catch(e) {
        suc = false;
        console.log(e);
    }
    conn.release();
    res.json({'suc' : suc, result : result});
    res.end();
    return;
});

module.exports = router;
