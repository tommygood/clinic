const router = require('express').Router();
var bodyParser = require("body-parser");
var db = require('mariadb');
var func = require('../module/func');
var fs = require('fs');
var jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = db.createPool({
    trace : true,
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
		res.sendFile(root + 'templates/login.html');
		//res.redirect('/login');
		res.end;
		return;
	};
	const user = jwt.verify(req.cookies.token, 'my_secret_key');
    if (user.data.aId && user.data.title == 'doc') { // 登入中
		res.redirect('/docMain');
		res.end();
    }
	else if (user.data.aId && user.data.title == 'nur') {
		res.redirect('/viewPa');
		res.end();
	}
	//res.end;
	return;
})

router.post('/check', async function(req, res) {
	const {account, pass} = req.body;
	if (account.length == 0 || pass.length == 0) {
		return res.json({error:'請勿輸入空值'});
	};
    let conn = await pool.getConnection();
	try {
		var fail_counts = await conn.query('select count(*) from login_log where `ip` = ? and `aId` is null and `times` >= current_timestamp - interval 5 minute', req.ip); // 五分鐘內相同 ip 的登入失敗次數
		if (fail_counts[0]['count(*)'] >= 3) { // 在五分鐘內登入失敗超過三次
            conn.release();
			return res.json({error : '在五分鐘內登入失敗超過三次，請稍候再試'});
		}
	}
	catch(e) {
		console.log(e);
	}
		try {
            var login_suc = false;
            let user = await conn.query('select aId, pass, title from accounts');
            //var account = req.body.account.trim();
            //var pass = req.body.pass.trim();
            for (let i = 0;i < user.length;i++) {
                if (account == user[i].aId && pass == user[i].pass) { // 護士, 密碼正確
					try {
						await conn.query('insert into login_log(`ip`, `aId`) values(?, ?)', [req.ip, account]);
					}
					catch(e) {
						console.log(e);
					}
                    if (user[i].title == 'nur') { // 護士
                        conn.release();
						const data = {title : 'nur', aId : account}
						const token = jwt.sign({ data, exp: Math.floor(Date.now() / 1000) + (6000 * 15) }, 'my_secret_key');
						res.cookie('token', token,  { httpOnly: false, secure: false, maxAge: 3600000 });
						return res.json({'title' : 'nur', 'aId' : account});
                    }
                    else {
                        conn.release();
						const data = {title : 'doc', aId : account}
						const token = jwt.sign({ data, exp: Math.floor(Date.now() / 1000) + (6000 * 15) }, 'my_secret_key');
						res.cookie('token', token,  { httpOnly: false, secure: false, maxAge: 3600000 });
						return res.json({'title' : 'doc', 'aId' : account});
                    }
                    login_suc = true; // 登入成功
                }
            }
            if (!login_suc) { // 登入失敗
				try {
					await conn.query('insert into login_log(`ip`) values(?)', req.ip);
				}
				catch(e) {
					console.log(e);
				}
                conn.release();
                return res.json({ error: `帳號密碼錯誤` });
            }
		}
		catch(e) {
			console.log(e);
		}
    conn.release();
	return res.json({error:null, token:token});
	res.end();
});


module.exports = router;
