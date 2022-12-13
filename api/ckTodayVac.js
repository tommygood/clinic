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
pool.end();
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
    if (user.data.aId && user.data.title == 'nur') { // 登入中
        res.sendFile(root + 'templates/ckTodayVac.html');  //回應靜態文件
        return;
    }
    else {
        res.redirect('/login');
        res.end();
        return;
    }
});

module.exports = router;
