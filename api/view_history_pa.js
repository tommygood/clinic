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
	try { // 驗證 token
		const user = jwt.verify(req.cookies.token, 'my_secret_key');
	}
	catch(e) { //
        res.statusCode = 302;
        res.setHeader("Location", "http://localhost:8080/login");
        res.end();
		console.log(e);
		return;
	}
	const user = jwt.verify(req.cookies.token, 'my_secret_key');
    if (user.data.aId) { // 醫生登入成功
        res.sendFile(root + 'templates/view_history_pa.html')
        res.end;
        return;
    }
    else {
        res.statusCode = 302;
        res.setHeader("Location", "http://localhost:8080/login");
        res.end();
        return;
    }
});

module.exports = router;
