var express = require('express');
var app = express();
const router = require('express').Router();
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
router.get('/', function(req, res) {
    var options = {
        'x-timestamp': Date.now(),
        'x-sent': true,
        'name': 'MattDionis',
    };
    //res.send({name:'t'});
    res.sendFile('/home/wang/nodejs/templates/test.html', options);  //回應靜態文件
    res.end
})

router.post('/', async function(req, res) {
    var db = require('mariadb');
    const pool = db.createPool({
        host : 'localhost',
        user : 'wang',
        password : 'wang313',
        database : 'clinic'
    });
    let conn = await pool.getConnection();
    try { // 是否是登出
        if (req.body.logout=='1') {
            await conn.query('update nurses set status = 0');
            res.sendFile('/home/wang/nodejs/templates/test.html');  //回應靜態文件
            res.end
            return
        }
    } catch(error) {
        console.log(error);
    }
    var sql_ck_same = 'select * from patients where id = ?';
    var ck_per = await conn.query(sql_ck_same, req.body.id);
    if (ck_per[0] == null) { // 新的病患, 新增到病患 table
        var sql_pat = 'insert into patients(name, id, sex, birth, identity, tel1, tel2, mom_id, parity, address, can_used, pass, allergy, hate, mark, regist, part_self, deposit, all_self, dId) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);'
        let up = await conn.query(sql_pat, [req.body.name, req.body.id, req.body.sex, req.body.birth, req.body.identity, req.body.tel1, req.body.tel2, req.body.mom_id, req.body.parity, req.body.address, req.body.can_used, req.body.pass, req.body.allergy, req.body.hate, req.body.mark, req.body.regist, req.body.part_self, req.body.deposit, req.body.all_self, req.body.dId]) 
    }
    var up_num = 'update doctors set `pa_num` = `pa_num` + 1 where dId = ?;'
    await conn.query(up_num, req.body.dId); // 醫生的看診數+1
    var pa_id = await conn.query('select * from patients where id = ?;', req.body.id); // 拿出患者的資料
    let order = await conn.query('select pa_num from doctors where dId = ?;', req.body.dId); //  找現在醫生的看診數
    // 插入到紀錄 log
    if (req.body.card=='on') { // 如果是未帶健保卡的人就要再輸入進 no_records
        let r_num = await conn.query('select count(*) from records');
        let nr_num = await conn.query('select count(*) from no_records');
        var rId = await conn.query('select count(*) from records;');
        var sql_nore = 'insert into no_records(pId, r_num, mark, regist, self_part, all_self, deposit, dId, `in`, `num`) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        await conn.query(sql_nore, [pa_id[0].pId, r_num[0]['count(*)']+nr_num[0]['count(*)']+BigInt(1), req.body.mark, req.body.regist, req.body.part_self, req.body.all_self, req.body.deposit, req.body.dId, req.body.in, order[0].pa_num]);
    }
    else { // 有帶健保卡, 輸進 records
        let r_num = await conn.query('select count(*) from records');
        let nr_num = await conn.query('select count(*) from no_records');
        var sql_re = 'insert into records(pId, r_num, mark, regist, self_part, all_self, deposit, dId, `in`, `num`) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        await conn.query(sql_re, [pa_id[0].pId, r_num[0]['count(*)']+nr_num[0]['count(*)']+BigInt(1), req.body.mark, req.body.regist, req.body.part_self, req.body.all_self, req.body.deposit, req.body.dId, req.body.in, order[0].pa_num]); // 新增到紀錄
    }
    let up_order = await conn.query('update patients set chart_num = ? where id = ?;', [order[0].pa_num, req.body.id]);
    console.log(req.body.nId);
    await conn.query('update nurses set status = 1 where nId = ?', req.body.nId);
    res.sendFile('/home/wang/nodejs/templates/test.html');  //回應靜態文件
    res.end
});

module.exports = router;
