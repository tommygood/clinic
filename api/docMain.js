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
var config = require("config"); // 設定檔
var root = config.get('server.root'); // 根目錄位置

router.get('/', function(req, res) {
	try { // 驗證 token
		const user = jwt.verify(req.cookies.token, 'my_secret_key');
	}
	catch(e) { //
        res.redirect("/login");
        res.end();
		console.log(e);
		return;
	}
	const user = jwt.verify(req.cookies.token, 'my_secret_key');
    if (user.data.aId && user.data.title == 'doc') { // 醫生登入成功
		//console.log(user.data.aId);
        res.sendFile(root + 'templates/docMain.html')
        res.end;
        return;
    }
    else {
        res.redirect("/login");
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
    if (user.data.aId) { // 登入中
		const data = {pa_num : req.body.pa_num};
        const data_rId = {rId : req.body.rId};
        //console.log(req.body);
        //console.log(data_rId);
		const pa_num = jwt.sign({data, exp: Math.floor(Date.now() / 1000) + (60 * 15) }, 'my_secret_key');
		const rId = jwt.sign({data_rId, exp: Math.floor(Date.now() / 1000) + (60 * 15) }, 'my_secret_key');
        res.cookie('pa_num', pa_num,  { httpOnly: false, secure: false, maxAge: 3600000 });
        res.cookie('rId', rId, { httpOnly: false, secure: false, maxAge: 3600000 });
		return res.json({suc : true});
		res.end();
    }
	return res.json({suc : false});
	res.end();
});

router.post('/patStart', async function(req, res) { // 設置看診開始時間
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
    	let conn = await pool.getConnection();
		await conn.query('update records set `real_start` = ? where `no` = ?', [new Date(), req.body.rId]); 
		conn.release();
		res.end;
		return res.json({suc : true}); 
	}
	else {
		return res.json({suc : false});
	}
});

router.post('/all_record', async function(req, res) { // 回傳該次病歷紀錄
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
    	let conn = await pool.getConnection();
        if (!req.body.check_first) { // not the first check
            // 找出已完成, 不在刪除的紀錄, 病人代號相同, 有在診斷紀錄的 records，並用完診時間排序
            var same_records = await conn.query('select `no` from records where `no` in (select `rId` from done_records where `rId` not in (select `rId` from delete_records)) and `pId` = ? and `no` in (select `rId` from diagnose_records) order by `end`;', req.body.pId); 
            if (same_records.length == 0) { // 沒有以前的病歷
                conn.release();
                res.end;
                return res.json({suc : false, msg : '該病人沒有之前病歷'});
            }
            try {
                if (req.body.last_times == 0) { // 要找的次數為 0 ，清空
                    conn.release();
                    res.end;
                    return res.json({suc : true, clear : 'clear'}); 
                }
                var last_rId = same_records[same_records.length-req.body.last_times].no; // 這個病人上次病歷號
            }
            catch(e) {
                // 沒有再更之前的病歷紀錄
                console.log('normal: ' + e);
                conn.release();
                res.end;
                return res.json({suc : false, msg : '已無再之前的病歷紀錄'});
            }
            var last_diagnose = await conn.query('select * from diagnose_records where `rId` = ?', last_rId); // 上次看診的診斷
            var last_medicines = await conn.query('select * from medicines_records where `rId` = ?', last_rId); // 上次看診的診斷
            var all_last_medicines = []; // 該次看診的全部用藥，有可能不止一個用藥
            for (let i = 0;i < last_medicines.length;i++) {
                all_last_medicines.push(last_medicines[i])
            }
        }
        else {
            var last_diagnose = await conn.query('select * from diagnose_records where `rId` = ?', req.body.rId); // 上次看診的診斷
            var last_medicines = await conn.query('select * from medicines_records where `rId` = ?', req.body.rId); // 上次看診的診斷
            var all_last_medicines = []; // 該次看診的全部用藥，有可能不止一個用藥
            for (let i = 0;i < last_medicines.length;i++) {
                all_last_medicines.push(last_medicines[i])
            }
        }
		conn.release();
		res.end;
        // length == 1, means no record, so return null
		return res.json({suc : true, last_diagnose : last_diagnose.length ? last_diagnose[0] : null, last_medicines : all_last_medicines.length ? all_last_medicines : null}); 
	}
	else {
		return res.json({suc : false, msg : '身份認證失敗'});
	}
});

router.post('/check_record', async function(req, res) { // 回傳該次病歷紀錄
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
        let conn = await pool.getConnection();
		var last_diagnose = await conn.query('select * from diagnose_records where `rId` = ?', req.body.rId); // 上次看診的診斷
		var last_medicines = await conn.query('select * from medicines_records where `rId` = ?', req.body.rId); // 上次看診的診斷
		var all_last_medicines = []; // 該次看診的全部用藥，有可能不止一個用藥
		for (let i = 0;i < last_medicines.length;i++) {
			all_last_medicines.push(last_medicines[i])
		}
		conn.release();
		res.end;
		return res.json({suc : true, last_diagnose : last_diagnose[0], last_medicines : all_last_medicines}); 
	}
	else {
		return res.json({suc : false, msg : '身份認證失敗'});
	}
});

router.get('/getPId', async function(req, res) { // 回傳該次病歷紀錄
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
        let conn = await pool.getConnection();
        var pId = await conn.query('select `pId` from records where `no` = ?', req.query.rId); // 紀錄的 pId
		conn.release();
		res.end;
		return res.json({suc : true, pId : pId}); 
	}
	else {
		return res.json({suc : false, msg : '身份認證失敗'});
	}
});

router.get('/getFee', async function(req, res) { // 回傳該次病歷紀錄
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
        let conn = await pool.getConnection();
        var fee = await conn.query('select `regist`, `self_part`, `all_self` from records where `no` = ?', req.query.rId); // 紀錄的 pId
		conn.release();
		res.end;
		return res.json({suc : true, fee : fee}); 
	}
	else {
		return res.json({suc : false, msg : '身份認證失敗'});
	}
});

module.exports = router;
