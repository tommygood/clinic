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
    if (user.data.aId && user.data.title == 'doc') { // 醫生登入成功
		console.log(user.data.aId);
        res.sendFile('/home/wang/nodejs/templates/docMain.html')
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

router.post('/', function(req, res) {
    if (req.body.logout=='1') { // 登出
		res.clearCookie('token'); // 清除 cookie
		res.redirect('/login');
		res.end;
        return;
    }
});

router.get('/dId', function(req, res) {
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
	return res.json({dId : user.data.aId});
});
	
router.post('/getPa', function(req, res) {
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
    if (user.data.aId && user.data.title == 'doc') { // 登入中
		const data = {pa_num : req.body.pa_num};
		const pa_num = jwt.sign({data, exp: Math.floor(Date.now() / 1000) + (60 * 15) }, 'my_secret_key');
		res.cookie('pa_num', pa_num,  { httpOnly: false, secure: false, maxAge: 3600000 });
		return res.json({suc : true});
		res.end();
    }
	return res.json({suc : false});
	res.end();
});
module.exports = router;
