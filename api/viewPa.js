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
		console.log(user.data.aId);
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
            return
        }
    } catch(error) {
        console.log(error);
    }
    let conn = await pool.getConnection();
    var sql_ck_same = 'select * from patients where id = ?';
    var ck_per = await conn.query(sql_ck_same, req.body.id);
    if (ck_per[0] == null) { // 新的病患, 新增到病患 table
        var sql_pat = 'insert into patients(name, id, sex, birth, identity, tel1, tel2, mom_id, parity, address, can_used, pass, allergy, hate, mark, regist, part_self, deposit, all_self, dId) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);'
        let up = await conn.query(sql_pat, [req.body.name, req.body.id, req.body.sex, req.body.birth, req.body.identity, req.body.tel1, req.body.tel2, req.body.mom_id, req.body.parity, req.body.address, req.body.can_used, req.body.pass, req.body.allergy, req.body.hate, req.body.mark, req.body.regist, req.body.part_self, req.body.deposit, req.body.all_self, req.body.dId]) 
    }
    var up_num = 'update doctors set `pa_num` = `pa_num` + 1 where dId = ?;'
    await conn.query(up_num, req.body.dId); // 醫生的看診數+1
    var pa_id = await conn.query('select * from patients where id = ?;', req.body.id); // 拿出患者的資料
    let order = await conn.query('select pa_num from doctors where aId = ?;', req.body.dId); //  找現在醫生的看診數
    // 插入到紀錄 log
    if (req.body.card=='on') { // 如果是未帶健保卡的人就要再輸入進 no_records
        let r_num = await conn.query('select count(*) from records');
        let nr_num = await conn.query('select count(*) from no_records');
		console.log(r_num[0]['count(*)']+nr_num[0]['count(*)']+BigInt(1));
        var rId = await conn.query('select count(*) from records;');
        var sql_nore = 'insert into no_records(pId, r_num, mark, regist, self_part, all_self, deposit, dId, `in`, `num`) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        await conn.query(sql_nore, [pa_id[0].pId, r_num[0]['count(*)']+nr_num[0]['count(*)']+BigInt(1), req.body.mark, req.body.regist, req.body.part_self, req.body.all_self, req.body.deposit, req.body.dId, req.body.in, order[0].pa_num]);
    }
    else { // 有帶健保卡, 輸進 records
        let r_num = await conn.query('select count(*) from records');
        let nr_num = await conn.query('select count(*) from no_records');
		console.log(r_num[0]['count(*)']+nr_num[0]['count(*)']+BigInt(1));
        var sql_re = 'insert into records(pId, r_num, mark, regist, self_part, all_self, deposit, dId, `in`, `num`) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        await conn.query(sql_re, [pa_id[0].pId, r_num[0]['count(*)']+nr_num[0]['count(*)']+BigInt(1), req.body.mark, req.body.regist, req.body.part_self, req.body.all_self, req.body.deposit, req.body.dId, req.body.in, order[0].pa_num]); // 新增到紀錄
    }
    if (req.body.vac == 'on') { // 打疫苗
        try { // 寫入疫苗紀錄
            await conn.query('insert into vac_re(`pId`, `vId`) values(?, ?);', [pa_id[0].pId, req.body.vId]);
        }
        catch(e) {
            console.log(e);
        }
    }
    let up_order = await conn.query('update patients set chart_num = ? where id = ?;', [order[0].pa_num, req.body.id]);
    res.sendFile('/home/wang/nodejs/templates/viewPa.html');  //回應靜態文件
    res.end
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
module.exports = router;
