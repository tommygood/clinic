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
var config = require("config");
var root = config.get('server.root');

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
    try {
        if (user.data.aId) { // 登入中
            let conn = await pool.getConnection();
            try { // 新增查看 log
                await conn.query('insert into look_medicines_inventory(`aId`) values(?)', user.data.aId);
            }
            catch(e) {
                console.log(e);
            }
            conn.release();
            res.sendFile(root + 'templates/allMed.html');  //回應靜態文件
            return;
        }
        else {
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
    }
});

module.exports = router;
