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
    if (user.data.aId && user.data.title == 'nur') { // 醫生登入成功
        res.sendFile('/home/wang/nodejs/templates/viewPa.html')
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

router.post('/', async function(req, res) {
    try { // 是否是登出
        if (req.body.logout=='1') { // 登出
			res.clearCookie('token'); // 清除 cookie
			res.redirect('/login');
			res.end;
            return false;
        }
    } catch(error) {
        console.log(error);
    }
	var not_null = ['dId'] // 不能為 null
	for (let j = 0;j < Object.keys(req.body).length;j++) { // 檢查特定欄位是否為空值 
		for (let i = 0;i < not_null.length;i++) { 
			if (Object.keys(req.body)[j] == not_null[i] && Object.values(req.body)[j] == "") {
            	console.log(not_null[i] + ' 為空值');
				return res.json({suc:false});
				res.end()
			}
		}
	}
    let conn = await pool.getConnection();
	if (req.body.in[0] == undefined) // 是否在場
		var is_in = 0;
	else 
		var is_in = 1;
	if (req.body.card == "off") { // 有帶卡
    	var sql_ck_same = 'select * from patients where id = ?';
    	var ck_per = await conn.query(sql_ck_same, req.body.id);
    	if (ck_per[0] == null) { // 新的病患, 新增到病患 table
        	var sql_pat = 'insert into patients(name, id, sex, birth, identity, tel1, tel2, mom_id, parity, address, can_used, pass, allergy, hate, mark, regist, part_self, deposit, all_self) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);'
        	let up = await conn.query(sql_pat, [req.body.name, req.body.id, req.body.sex, req.body.birth, req.body.identity, req.body.tel1, req.body.tel2, req.body.mom_id, req.body.parity, req.body.address, req.body.can_used, req.body.pass, req.body.allergy, req.body.hate, req.body.mark, req.body.regist, req.body.part_self, req.body.deposit, req.body.all_self, req.body.dId]) 
    	}
    	var pa_id = await conn.query('select * from patients where id = ?;', req.body.id); // 拿出患者的資料
	}
    var up_num = 'update doctors set `pa_num` = `pa_num` + 1 where aId = ?;'
    await conn.query(up_num, req.body.dId); // 醫生的看診數+1
    //let order = await conn.query('select pa_num from doctors where aId = ?;', req.body.dId); //  找現在醫生的看診數
	let order = await conn.query('select * from records where `dId` = ? and `no` not in (select `rId` from done_records);', req.body.dId); // 看診號 = 該醫生的非完診看診數 + 1
    // 插入到紀錄 log1
    /*if (req.body.card=='on') { // 如果是未帶健保卡的人就要再輸入進 no_records
        let r_num = await conn.query('select count(*) from records');
        let nr_num = await conn.query('select count(*) from no_records');
        var sql_nore = 'insert into no_records(pId, r_num, mark, regist, self_part, all_self, deposit, dId, `in`, `num`) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        await conn.query(sql_nore, [null, r_num[0]['count(*)']+nr_num[0]['count(*)']+BigInt(1), req.body.mark, req.body.regist, req.body.part_self, req.body.all_self, req.body.deposit, req.body.dId, is_in, order[0].pa_num]);
    }
    else { // 有帶健保卡, 輸進 records
        let r_num = await conn.query('select count(*) from records');
        let nr_num = await conn.query('select count(*) from no_records');
		console.log(r_num[0]['count(*)']+nr_num[0]['count(*)']+BigInt(1));
        var sql_re = 'insert into records(pId, r_num, mark, regist, self_part, all_self, deposit, dId, `in`, `num`) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    }*/
	if (pa_id==undefined) { // 沒有帶卡，pId 為 null
		var pId = null;
	}
	else 
		var pId = pa_id[0].pId;
	//let r_num = await conn.query('select count(*) from records');
	try {
    	var sql_re = 'insert into records(pId, mark, regist, self_part, all_self, deposit, dId, `in`, `num`, `nId`) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    	var rId = await conn.query(sql_re, [pId, req.body.mark, req.body.regist, req.body.part_self, req.body.all_self, req.body.deposit, req.body.dId, is_in, order.length+1, req.body.nId]); // 新增到病人紀錄
		rId = rId.insertId; // 取得 rId 
		if (pId == null) { // 沒帶卡，新增到 no_card
			await conn.query('insert into no_card(`rId`) values(?)', rId);
		}
		if (req.body.regist != 0) { // 掛號費不為 0
			await conn.query('insert into financial(`aId`, `reason`, `money`) values(?, ?, ?);', [req.body.nId, '掛號費,' + rId, req.body.regist]); // 新增到總帳務
			await conn.query('insert into financial_today(`aId`, `reason`, `money`) values(?, ?, ?);', [req.body.nId, '掛號費,' + rId, req.body.regist]); // 新增到今日帳務
		}
		if (req.body.part_self != 0) { // 部份負擔不為 0
			await conn.query('insert into financial(`aId`, `reason`, `money`) values(?, ?, ?);', [req.body.nId, '部份負擔,' + rId, req.body.part_self]); // 新增到總帳務
			await conn.query('insert into financial_today(`aId`, `reason`, `money`) values(?, ?, ?);', [req.body.nId, '部份負擔,' + rId, req.body.part_self]); // 新增到今日帳務
		}
		if (req.body.all_self != 0) { // 自費不為 0
			await conn.query('insert into financial(`aId`, `reason`, `money`) values(?, ?, ?);', [req.body.nId, '自費,' + rId, req.body.all_self]); // 新增到總帳務
			await conn.query('insert into financial_today(`aId`, `reason`, `money`) values(?, ?, ?);', [req.body.nId, '自費,' + rId, req.body.all_self]); // 新增到今日帳務
		}
	}
	catch(e) {
		console.log(e);
    	await conn.query('update doctors set `pa_num` = `pa_num` - 1 where aId = ?;', req.body.dId); // 新增到病人紀錄失敗，醫生的看診數 -1
	}
	//await conn.query('insert into expense(`aId`, `rId`, `emId`, `cost`, `sort`, `mark`) values(?, ?, ?, ?, ?, ?);', r
	console.log(req.body.vac);
    if (req.body.vac == 'on') { // 打疫苗
        try { // 寫入疫苗紀錄
            await conn.query('insert into vac_re(`pId`, `vId`) values(?, ?);', [pa_id[0].pId, req.body.vId]);
        }
        catch(e) {
			conn.release();
			return res.json({suc:false});
			res.end()
            console.log(e);
        }
    }
    //let up_order = await conn.query('update patients set chart_num = ? where id = ?;', [order[0].pa_num, req.body.id]);
	conn.release();
	return res.json({suc:true});
    //res.sendFile('/home/wang/nodejs/templates/viewPa.html');  //回應靜態文件
    res.end();
});

router.get('/nId', function(req, res) {
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
	return res.json({nId : user.data.aId});
});

router.post('/del', async function(req, res) {
	try { // 驗證 token
		const user = jwt.verify(req.cookies.token, 'my_secret_key');
	}
	catch(e) { //
		console.log(e);
		res.redirect('/login');
		res.end();
		return;
	}
	const user = jwt.verify(req.cookies.token, 'my_secret_key');
    if (user.data.aId && user.data.title == 'nur') { // 醫生登入成功
		var suc;
    	let conn = await pool.getConnection();
		try { 
			await conn.query('insert into done_records(`rId`) values(?)', req.body.rId);
			await conn.query('insert into delete_records(`aId`, `rId`) values(?, ?)', [user.data.aId, req.body.rId]);
			suc = true;
		}
		catch(e) {
			console.log(e);
        	res.end;
			suc = false;
		}
		conn.release();
		return res.json({suc : suc});
        res.end;
    }
    else {
		res.redirect('/login');
        res.end();
        return;
    }
});

router.post('/updatePa', function(req, res) {
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
		const data = {update_rId : req.body.rId};
		const update_rId = jwt.sign({data, exp: Math.floor(Date.now() / 1000) + (60 * 15) }, 'my_secret_key');
		res.cookie('update_rId', update_rId,  { httpOnly: false, secure: false, maxAge: 3600000 });
		return res.json({suc : true});
		res.end();
    }
	return res.json({suc : false});
	res.end();
});


router.get('/getUpdatePa', function(req, res) {
	try {
		const user = jwt.verify(req.cookies.token, 'my_secret_key');
	}
	catch(e) {
		console.log(e);
		res.redirect('/login');
		res.end();
		return;
	};
	const {data : user} = jwt.verify(req.cookies.update_rId, 'my_secret_key');
	return res.json({rId : user.update_rId});
});

router.post('/submitUpdatePa', async function(req, res) { // 送出還卡
	try {
		const user = jwt.verify(req.cookies.token, 'my_secret_key');
	}
	catch(e) {
		console.log(e);
		res.json({suc : false});
		res.end();
		return;
	};
    let conn = await pool.getConnection();
	try {
		var pId = await conn.query('select pId from patients where id = ?', req.body.id); // 先找出 pId
	}
	catch(e) {
		console.log(e);
	}
	try {
		await conn.query('update records set `pId` = ? where `no` = ?', [pId[0].pId, req.body.rId]); // 更新 pId
		await conn.query('update no_card set `status` = 1 where `rId` = ?', req.body.rId);
	}
	catch(e) {
		console.log(e);
	}
	conn.release();
	res.json({suc : true});
	return res.end;
});

module.exports = router;
