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

router.post('/updateNum', async function(req, res) { // 更新看診號
	try {
		const user = jwt.verify(req.cookies.token, 'my_secret_key');
	}
	catch(e) {
		console.log(e);
		res.json({suc:false});
		res.end();
		return;
	};
    let conn = await pool.getConnection();
	try {
		var update_records = req.body.update_records;
		var update_index = req.body.update_index;
		var change_num = req.body.change_num;
		var nId = req.body.nId;
		//console.log(update_index);
		//console.log(update_records);
		console.log(change_num);
		for (let i = 0;i < update_records.length;i++) { // 更新全部的紀錄的看診號
			await conn.query('update records set `num` = ? where `no` = ?;', [update_records[i], update_index[i]]);
		}
		for (let i = 0;i < Object.keys(change_num).length;i++) { // 更新看診號的 log
			await conn.query('insert into change_num(`aId`, `rId`, `quantity`) values(?, ?, ?)', [nId, Object.keys(change_num)[i], Object.values(change_num)[i]]) 
		}
	}
	catch(e) {
		console.log(e);
		conn.release();
	}
	res.json({suc:true});
	res.end();
	conn.release();
	return;
})	
	

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
		await conn.query('insert into done_records(`rId`) values(?)', req.body.rId); // 新增至已完成紀錄
		await conn.query('update records set `regist` = ?, `self_part` = ?, `all_self` = ? where `no` = ?', [req.body.regist, req.body.self_part, req.body.all_self, req.body.rId]);
		var all_keys = Object.keys(req.body);
		for (let i = 0;i < all_keys.length;i++) { // 找是否有藥品需匯入資料庫
			if (all_keys[i].includes('medicines') && !Object.values(req.body[all_keys[i]])[0] == "") {
				const all_this_code = await conn.query('select `index`, `code` from medicines where `medi_eng` = ?', Object.values(req.body[all_keys[i]])[0]); // 全部是這個 code 的藥品
				var true_code = all_this_code[all_this_code.length-1]; // 最後一個才是正確的
				await conn.query('insert into medicines_records(`rId`, `medicines_id`, `day_num`, `days`, `rule`, `mark`) values(?, ?, ?, ?, ?, ?)', [req.body.rId, true_code.index, Object.values(req.body[all_keys[i]])[1], Object.values(req.body[all_keys[i]])[2], Object.values(req.body[all_keys[i]])[3], Object.values(req.body[all_keys[i]])[4]]);
				const in_normal = await conn.query('select count(*) from medicines_normal where `code` = ?', true_code.code);
				var code = true_code.code;
				if (in_normal[0]['count(*)']==0) { // 還沒被放入常用的藥品
					const all_this_code = await conn.query('select * from medicines where `code` = ?', code); // 全部是這個 code 的藥品
					const true_code = all_this_code[all_this_code.length-1]; // 最後一個才是正確的
					// 放入常用藥品
					await conn.query("insert into medicines_normal(`mId`, `new_mark`, `oral_tablet`, `single_two`, `code`, `price`, `price_date`, `price_fin_date`, `medi_eng`, `medi_amount`, `medi_unit`, `ingre`, `ingre_amount`, `ingre_unit`, `dose_form`, `medi_producer`, `medi_sort`, `quality_code`, `medi_mand`, `sort_group`, `fir_ingre`, `fir_medi_amount`, `fir_medi_unit`, `sec_ingre`, `sec_medi_amount`, `sec_medi_unit`, `thi_ingre`, `thi_medi_amount`, `thi_medi_unit`, `four_ingre`, `four_medi_amount`, `four_medi_unit`, `fift_ingre`, `fift_medi_amount`, `fift_medi_unit`, `producer`, `atc_code`, `no_input`) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? , ?, ?, ?, ?)", [true_code.index, true_code.new_mark, true_code.oral_tablet, true_code.single_two, true_code.code, true_code.price, true_code.price_date, true_code.price_fin_date, true_code.medi_eng, true_code.medi_amount, true_code.medi_unit, true_code.ingre, true_code.ingre_amount, true_code.ingre_unit, true_code.dose_form, true_code.medi_producer, true_code.medi_sort, true_code.quality_code, true_code.medi_mand, true_code.sort_group, true_code.fir_ingre, true_code.fir_medi_amount, true_code.fir_medi_unit, true_code.sec_ingre, true_code.sec_medi_amount, true_code.sec_medi_unit, true_code.thi_ingre, true_code.thi_medi_amount, true_code.thi_medi_unit, true_code.four_ingre, true_code.four_medi_amount, true_code.four_medi_unit, true_code.fift_ingre, true_code.fift_medi_amount, true_code.fift_medi_unit, true_code.producer, true_code.atc_code, true_code.no_input]); 
				}
				var num = parseInt(Object.values(req.body[all_keys[i]])[1] * Object.values(req.body[all_keys[i]])[2], 10) * -1;
				await conn.query('insert into med_inventory_each(`code`, `expire`, `aId`, `quantity`, `reason`, `mark`) values(?, ?, ?, ?, ?, ?);', [true_code.code, null, req.body.dId, num, '醫生看診', req.body.rId + " 號病歷號"]);
			}
		}
		await conn.query('insert into diagnose_records(`rId`, `diagnose_code`, `main_sue`, `science`) values(?, ?, ?, ?)', [req.body.rId, req.body.diagnose_code_pass, req.body.main_sue, req.body.science])
		await conn.query('update records set `end` = ? where `no` = ?', [new Date(), req.body.rId]); 
		/*if (req.body.rId=='undefined') { // 未帶健保卡
			await conn.query('update no_records set `end` = ? where `rId` = ?', [new Date(), req.body.rId]); 
		}
		else {
			await conn.query('update records set `end` = ? where `r_num` = ?', [new Date(), req.body.r_num]); 
		}*/
	}
	catch(error) {
		console.log(error);
		res.json({suc : false, error : error});
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
    if (user.data.aId && (pa.data.pa_num != null)) { // 登入中
        if (req.query.view) // view the record
            return res.sendFile(root + 'templates/viewPatients.html');
        else // 醫生看診
            return res.sendFile(root + 'templates/patients.html');
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
        const rId = jwt.verify(req.cookies.rId, 'my_secret_key');
	}
	catch(e) {
		console.log(e);
		return res.json({error:'未登入'});
		res.end();
		return;
	};
	const user = jwt.verify(req.cookies.token, 'my_secret_key');
	const pa = jwt.verify(req.cookies.pa_num, 'my_secret_key');
    const rId_cookie = jwt.verify(req.cookies.rId, 'my_secret_key');
    if (user.data.aId && (pa.data.pa_num != null) && user.data.title == 'doc') { // 登入中
		res.json({pa_num : pa.data.pa_num, rId : rId_cookie.data_rId.rId});
		res.end();
        return;
    }
    else {
		res.json({pa_num : null});
        res.end();
        return;
    }
});

router.post('/updateIn', async function(req, res) { // 更新看診號
	try {
		const user = jwt.verify(req.cookies.token, 'my_secret_key');
	}
	catch(e) {
		console.log(e);
		res.json({suc:false});
		res.end();
		return;
	};
    let conn = await pool.getConnection();
	try {
		var total_rId = req.body.total_rId;
		var total_in = req.body.total_in;
		for (let i = 0;i < total_rId.length;i++) { // 更新全部的紀錄的看診號
			console.log(total_in[i]);
			if (total_in[i]) 
				console.log(await conn.query('update records set `in` = ? where `no` = ?;', [1, total_rId[i]]));
			else 
				console.log(await conn.query('update records set `in` = ? where `no` = ?;', [0, total_rId[i]]));
		}
	}
	catch(e) {
		console.log(e);
		conn.release();
	}
	res.json({suc:true});
	res.end();
	conn.release();
	return;
})	
module.exports = router;
