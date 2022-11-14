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
	var path = root + 'templates/financial_today.html';
	res.sendFile(path);
	res.end;
	return;
});

router.post('/', async function(req, res) {
	try {
		const user = jwt.verify(req.cookies.token, 'my_secret_key');
	}
	catch(e) {
		console.log(e);
		res.json({suc : false});
		res.end;
		return;
	};
	const user = jwt.verify(req.cookies.token, 'my_secret_key');
    if (user.data.aId && user.data.title == 'nur') { // 登入中
    	let conn = await pool.getConnection();
		all_changed = req.body.final_all; // all changed data
		aId = req.body.aId; // nId
		try {
			console.log(all_changed);
			for (let i = 0;i < Object.keys(all_changed).length;i++) {
				var fId = await conn.query('select `fId`, `money` from financial_today where `no` = ?', Object.keys(all_changed)[i]); // get the record's fId and original money
				console.log(fId);
				// update the changed money to financial and financial_today
				var update_today_suc = await conn.query('update financial_today set `money` = ? where `no` = ?', [Object.values(all_changed)[i][0], Object.keys(all_changed)[i]])
				var update_all_suc = await conn.query('update financial set `money` = ? where `no` = ?', [Object.values(all_changed)[i][0], fId[0].fId])
				// record the changed log, insert into changed_expenses_log
				var insert_log_suc = await conn.query("insert into change_expenses_log(`aId`, `fId`, `original_money`, `changed_money`, `reason`) values(?, ?, ?, ?, ?)", [aId, fId[0].fId, fId[0].money, Object.values(all_changed)[i][0], Object.values(all_changed)[i][1]]) 
			}
		}
		catch(e) {
			console.log(e);
		}
		var error = [] // error msg
		//console.log(update_today_suc);
		//console.log(update_all_suc);
		//console.log(insert_log_suc);
		if (!update_today_suc || update_today_suc.affectedRows == 0) { // if update financial today failed
			suc = false;
			error.push('update financial today failed, as no match item');
			console.log('update financial today failed, as no match item');
		}
		else if (!update_all_suc || update_all_suc.affectedRows == 0) { // if update financial failed
			suc = false;
			error.push('update financial failed, as no match item');
			console.log('update financial failed, as no match item');
		}
		else if (!insert_log_suc || insert_log_suc.affectedRows == 0) { // if update financial failed
			suc = false;
			error.push('insert into change_expenses_log failed');
			console.log('insert into change_expenses_log failed');
		}
		else {
			suc = true;
		}
		conn.release();
		res.json({suc : suc, error : error});
		res.end;
		return;
	}
	else {
		console.log(e);
		res.json({suc : false});
		res.end;
		return;
	};
})


router.post('/settle', async function(req, res) { // the nurse settle the financial records
	try {
		const user = jwt.verify(req.cookies.token, 'my_secret_key');
	}
	catch(e) {
		console.log(e);
		res.json({suc : false});
		res.end;
		return;
	};
	const user = jwt.verify(req.cookies.token, 'my_secret_key');
	const aId = req.body.aId; // nId
	var error = [] // error msg
    if (user.data.aId == aId && user.data.title == 'nur') { // 登入中
    	let conn = await pool.getConnection();
        //var insert_suc = await conn.query("insert into done_financial(`money`, `origin_aId`, `origin_log`) values(?, ?, ?)",);
		//var del_suc = await conn.query('truncate financial_today;'); // reset the financial today
		del_suc = true;
        console.log(del_suc);
        console.log(req.body);
		//console.log(del_suc.affectedRows);
		if (!del_suc) { // delete failed
			error.push('delete failed !');
			suc = false;
		}
		else {
			suc = true;
		}
		res.json({suc : suc, error : error});
		res.end;
		return;
	}
	else {
		error.push('authenticaion failed, wrong identification !');
		res.json({suc : false, error : error});
		res.end;
		return;
	}
})

module.exports = router;
