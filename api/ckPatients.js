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

router.post('/', async function(req, res) {
	try {
		const user = jwt.verify(req.cookies.token, 'my_secret_key');
		const pa_num = jwt.verify(req.cookies.pa_num, 'my_secret_key');
	}
	catch(e) {
		console.log(e);
		return res.redirect('/login');
		res.end();
		return;
	};
    let conn = await pool.getConnection();
	try {
		//await conn.query('insert into done_records(`r_num`) values(?)', req.body.r_num); // 新增至已完成紀錄
		await conn.query('insert into diagnose_records(`r_num`, `diagnose_code`, `main_sue`, `science`) values(?, ?, ?, ?)', [req.body.r_num, req.body.diagnose_code_pass, req.body.main_sue, req.body.science])
		if (req.body.rId=='undefined') { // 未帶健保卡
			await conn.query('update no_records set `end` = ? where `r_num` = ?', [new Date(), req.body.r_num]); 
		}
		else {
			await conn.query('update records set `end` = ? where `r_num` = ?', [new Date(), req.body.r_num]); 
		}
	}
	catch(e) {
		res.json({suc : false, error : e});
		res.end;
		conn.release();
		return;
	}
	conn.release();
	res.json({suc: true});
	res.end;
	return;
});

router.get('/', function(req, res) {
	try {
		const user = jwt.verify(req.cookies.token, 'my_secret_key');
		const pa_num = jwt.verify(req.cookies.pa_num, 'my_secret_key');
	}
	catch(e) {
		console.log(e);
		return res.json({error:'未登入'});
		res.end();
		return;
	};
	const user = jwt.verify(req.cookies.token, 'my_secret_key');
	const pa = jwt.verify(req.cookies.pa_num, 'my_secret_key');
    if (user.data.aId && (pa.data.pa_num != null) && user.data.title == 'doc') { // 登入中
		return res.sendFile('/home/wang/nodejs/templates/patients.html');
		res.end();
	}
	else {
		return res.redirect('/login');
		res.end();
	}
});

router.get('/rNum', async function(req, res) {
	try {
		const user = jwt.verify(req.cookies.token, 'my_secret_key');
		const pa_num = jwt.verify(req.cookies.pa_num, 'my_secret_key');
	}
	catch(e) {
		console.log(e);
		return res.json({error:'未登入'});
		res.end();
		return;
	};
	const user = jwt.verify(req.cookies.token, 'my_secret_key');
	const pa = jwt.verify(req.cookies.pa_num, 'my_secret_key');
    if (user.data.aId && (pa.data.pa_num != null) && user.data.title == 'doc') { // 登入中
		res.json({pa_num : pa.data.pa_num});
		res.end();
        return;
    }
    else {
		res.json({pa_num : null});
        res.end();
        return;
    }
});

module.exports = router;
