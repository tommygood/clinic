var express = require('express');
var app = express();
const router = require('express').Router();
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
var db = require('mariadb');
var jwt = require('jsonwebtoken');
const pool = db.createPool({
    trace: true,
    host : 'localhost',
    user : 'wang',
    password : 'wang313',
    database : 'clinic'
});
var config = require("config"); // 設定檔
var root = config.get('server.root'); // 根目錄位置
var fs = require('fs'); 


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
    if (user.data.aId && user.data.title == 'nur') { // 醫生登入成功
        res.sendFile(root + 'templates/viewPa.html')
        res.end;
        return;
    }
    else {
        res.redirect("/login");
        res.end();
        return;
    }
});

async function checkFinancial() { // check whether still have financial_today records
    let conn = await pool.getConnection();
    var is_clear = await conn.query("select count(*) from financial_today;");
    conn.release();
    console.log(is_clear[0]['count(*)']);
    return is_clear[0]['count(*)'];
}

router.post('/logoutCheck', async function(req, res) {
    try { // 驗證 token
        const user = jwt.verify(req.cookies.token, 'my_secret_key');
    }
    catch(e) { //
        res.redirect("/login");
        res.end();
        console.log(e);
        return;
    }
    try { // 是否是登出
            checkFinancial().then(function(remaining) { // check if today_financial is clear
                if (remaining) { // not clear
                    console.log(`當班帳務尚未結算，還有 ${remaining} 筆記錄`);   
                    var remaining_log = (`當班帳務尚未結算，還有 ${remaining} 筆記錄，確定登出 ?`);
                    res.json({suc : false, log : remaining_log});
                    res.end;
                    return;
                }
                else {
                    res.json({suc : true});
                    res.end;
                    return;
                }
            });    
    } catch(error) {
        console.log(error);
    }
})

router.post('/logout', async function(req, res) {
    try { // 驗證 token
        const user = jwt.verify(req.cookies.token, 'my_secret_key');
    }
    catch(e) { //
        res.redirect("/login");
        res.end();
        console.log(e);
        return;
    }
    res.clearCookie('token'); // 清除 cookie
    res.end();
    return;
})

router.post('/', async function(req, res) {
    try { // 驗證 token
        const user = jwt.verify(req.cookies.token, 'my_secret_key');
    }
    catch(e) { //
        console.log(e);
        res.json({suc : 'false', error : '身分認證失敗!'});
        res.end();
        return;
    }
    var suc = true; // default sql successful
    var error = ''; // default error empty
    var not_null = ['dId'] // 不能為 null
    for (let j = 0;j < Object.keys(req.body).length;j++) { // 檢查特定欄位是否為空值 
        for (let i = 0;i < not_null.length;i++) { 
            if (Object.keys(req.body)[j] == not_null[i] && Object.values(req.body)[j] == "") {
                var error = not_null[i] + ' 為空值';
                console.log(error);
                return res.json({suc:false, error : error});
                res.end()
            }
        }
    }
    let conn = await pool.getConnection();
    //if (req.body.card) { // 有帶卡
    // 找對應的病患
    var sql_ck_same = 'select * from patients where id = ?';
    var ck_per = await conn.query(sql_ck_same, req.body.id);
    if (ck_per[0] == null) { // 新的病患, 新增到病患 table
        var sql_pat = 'insert into patients(name, id, sex, birth, identity, tel1, tel2, mom_id, parity, address, can_used, pass, allergy, hate, mark, regist, part_self, deposit, all_self) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);'
        let up = await conn.query(sql_pat, [req.body.name, req.body.id, req.body.sex, req.body.birth, req.body.identity, req.body.tel1, req.body.tel2, req.body.mom_id, req.body.parity, req.body.address, req.body.can_used, req.body.pass, req.body.allergy, req.body.hate, req.body.mark, req.body.regist, req.body.part_self, req.body.deposit, req.body.all_self, req.body.dId]) 
    }
    var pa_id = await conn.query('select * from patients where id = ?;', req.body.id); // 拿出患者的資料
    var up_num = 'update doctors set `pa_num` = `pa_num` + 1 where aId = ?;'
    await conn.query(up_num, req.body.dId); // 醫生的看診數+1
    //let order = await conn.query('select pa_num from doctors where aId = ?;', req.body.dId); //  找現在醫生的看診數
    let order = await conn.query('select * from records where `dId` = ? and `no` not in (select `rId` from done_records);', req.body.dId); // 看診號 = 該醫生的非完診看診數 + 1
    /*if (pa_id==undefined) { // 沒有帶卡，pId 為 null
        var pId = null;
    }
    else*/ 
    var pId = pa_id[0].pId;
    //let r_num = await conn.query('select count(*) from records');
    try {
        // insert records
        var sql_re = 'insert into records(`paid`, pId, mark, regist, self_part, all_self, deposit, dId, `in`, `num`, `nId`) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        var rId = await conn.query(sql_re, [req.body.paid, pId, req.body.mark, req.body.regist, req.body.part_self, req.body.all_self, req.body.deposit, req.body.dId, req.body.in, order.length+1, req.body.nId]); // 新增到病人紀錄
        rId = rId.insertId; // 取得 rId 
        if (!req.body.card) { // 沒帶卡，新增紀錄到 no_card
            await conn.query('insert into no_card(`rId`, `pId`) values(?, ?)', [rId, pId]);
        }
        var record_suc = true; // successful insert record
    }
    catch(e) {
        console.log(e);
        suc = false;
        error = e;
        // 新增到病人紀錄失敗, 看診號 - 1
        await conn.query('update doctors set `pa_num` = `pa_num` - 1 where aId = ?;', req.body.dId);
    }
    try {
        if (record_suc) { // insert record successfully
            if (req.body.paid) { // is paid
                // insert financial records
                if (req.body.regist != 0) { // 掛號費不為 0
                    var fId = await conn.query('insert into financial(`aId`, `reason`, `money`) values(?, ?, ?);', [req.body.nId, '掛號費,' + rId, req.body.regist]); // 新增到總帳務
                    await conn.query('insert into financial_today(`aId`, `reason`, `money`, `fId`) values(?, ?, ?, ?);', [req.body.nId, '掛號費,' + rId, req.body.regist, fId.insertId]); // 新增到今日帳務
                }
                if (req.body.part_self != 0) { // 部份負擔不為 0
                    var fId = await conn.query('insert into financial(`aId`, `reason`, `money`) values(?, ?, ?);', [req.body.nId, '部份負擔,' + rId, req.body.part_self]); // 新增到總帳務
                    await conn.query('insert into financial_today(`aId`, `reason`, `money`, `fId`) values(?, ?, ?, ?);', [req.body.nId, '部份負擔,' + rId, req.body.part_self, fId.insertId]); // 新增到今日帳務
                }
                if (req.body.all_self != 0) { // 自費不為 0
                    var fId = await conn.query('insert into financial(`aId`, `reason`, `money`) values(?, ?, ?);', [req.body.nId, '自費,' + rId, req.body.all_self]); // 新增到總帳務
                    await conn.query('insert into financial_today(`aId`, `reason`, `money`, `fId`) values(?, ?, ?, ?);', [req.body.nId, '自費,' + rId, req.body.all_self, fId.insertId]); // 新增到今日帳務
                }
                if (req.body.deposit != 0) { // 押金不為 0
                    var fId = await conn.query('insert into financial(`aId`, `reason`, `money`) values(?, ?, ?);', [req.body.nId, '押金,' + rId, req.body.deposit]); // 新增到總帳務
                    await conn.query('insert into financial_today(`aId`, `reason`, `money`, `fId`) values(?, ?, ?, ?);', [req.body.nId, '押金,' + rId, req.body.deposit, fId.insertId]); // 新增到今日帳務
                }
            }
            else { // not paid
                // insert into debt
                if (req.body.regist != 0) { // 掛號費不為 0
                    var debt_id = await conn.query('insert into debt(`aId`, `reason`, `money`) values(?, ?, ?);', [req.body.nId, '掛號費,' + rId, req.body.regist]); // 新增到總帳務
                }
                if (req.body.part_self != 0) { // 部份負擔不為 0
                    var debt_id = await conn.query('insert into debt(`aId`, `reason`, `money`) values(?, ?, ?);', [req.body.nId, '部份負擔,' + rId, req.body.part_self]); // 新增到總帳務
                }
                if (req.body.all_self != 0) { // 自費不為 0
                    var debt_id = await conn.query('insert into debt(`aId`, `reason`, `money`) values(?, ?, ?);', [req.body.nId, '自費,' + rId, req.body.all_self]); // 新增到總帳務
                }
                if (req.body.deposit != 0) { // 自費不為 0
                    var debt_id = await conn.query('insert into debt(`aId`, `reason`, `money`) values(?, ?, ?);', [req.body.nId, '押金,' + rId, req.body.deposit]); // 新增到總帳務
                }
            }
        }
    }
    catch(e) {
        console.log(e);
    }
    //await conn.query('insert into expense(`aId`, `rId`, `emId`, `cost`, `sort`, `mark`) values(?, ?, ?, ?, ?, ?);', r
    if (req.body.vac == 'on') { // 打疫苗
        try { // 寫入疫苗紀錄
            const total_vId = req.body.total_vId;
            for (let i = 0;i < total_vId.length;i++) {
                await conn.query('insert into vac_re(`pId`, `vId`, `rId`) values(?, ?, ?);', [pa_id[0].pId, total_vId[i], rId]);
            }
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
    return res.json({suc:suc, error : error});
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
    // 刪除病歷
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
    suc = true;
    e_text = ''; // error text;
    try {
        if (!req.body.rId && req.body.pId) { // 沒有 rId, 有病人 id, 去找此病患有沒有欠卡
            // 還單一次只能還一筆(一天只能還一次)，所以會檢查當天是否有掛過號、還過卡
            var today_return_record = await conn.query("select count(*) from no_card WHERE `pId` = ? and (DATE(`time`) = CURDATE() or DATE(`return_time`) = CURDATE() or `pId` in (select `pId` from records where DATE(`start`) = CURDATE()));", req.body.pId);
            if (today_return_record[0]['count(*)'] > 0) { // 今天已有掛押單或還單紀錄
                suc = false;
                e_text = '病人一天只能掛一次號！';
            }
            if (suc) { // 如果有錯就不能還卡
                // 還卡，更新狀態為還卡、設還卡時間。
                var all_this_patient = await conn.query('update no_card set `status` = 1, `return_time` = ? where `status` = 0 and `pId` = ? limit 1;', [new Date(), req.body.pId]);
            }
        }
        else {
            // 更新狀態為已還卡，並記錄負責還卡人
            await conn.query('update no_card set `status` = 1, `aId` = ? where `rId` = ?', [req.body.aId, req.body.rId]);
        }
    }
    catch(e) {
        console.log(e);
    }
    conn.release();
    // 避免不是從掛號頁面還卡出錯
    try {
        had_this_patient = all_this_patient.affectedRows;
    }
    catch(e) {
        had_this_patient = 0;
    }
    res.json({suc : suc, had_this_patient : had_this_patient, e_text : e_text});
    return res.end;
});

router.post('/delKeepMsg', async function(req, res) {
    // delete keep message
    try { // 驗證 token
        const user = jwt.verify(req.cookies.token, 'my_secret_key');
    }
    catch(e) { //
        console.log(e);
        res.json({suc : 'false', error : '身分認證失敗!'});
        res.end();
        return;
    }
    let conn = await pool.getConnection();
    // default insert successful
    var suc = true;
    try {
        var insert_suc = await conn.query('insert into del_keep_messages(`aId`, `kmId`) values(?, ?)', [req.body.aId, req.body.del_id]); // 先找出 pId
    }
    catch(e) {
        suc = false;
        console.log(e);
    }
    conn.release();
    res.json({suc : suc});
    res.end;
    return;
})

router.get('/delKeepMsg', async function(req, res) {
    // get delete keep message
    try { // 驗證 token
        const user = jwt.verify(req.cookies.token, 'my_secret_key');
    }
    catch(e) { //
        console.log(e);
        res.json({suc : 'false', error : '身分認證失敗!'});
        res.end();
        return;
    }
    let conn = await pool.getConnection();
    var suc = true;
    try {
        var del_keep_msg = await conn.query('select * from del_keep_messages where `aId` = ?', req.query.aId); // 先找出 pId
    }
    catch(e) {
        suc = false;
        console.log(e);
    }
    conn.release();
    res.json({suc : suc, del_keep_msg : del_keep_msg});
    res.end;
    return;
})

router.get('/getKeepMsg', async function(req, res) {
    // get delete keep message
    try { // 驗證 token
        const user = jwt.verify(req.cookies.token, 'my_secret_key');
    }
    catch(e) { //
        console.log(e);
        res.json({suc : 'false', error : '身分認證失敗!'});
        res.end();
        return;
    }
    let conn = await pool.getConnection();
    var suc = true;
    try {
        var keep_messages = await conn.query('select * from keep_messages;'); // 先找出 pId
    }
    catch(e) {
        suc = false;
        console.log(e);
    }
    conn.release();
    res.json({suc : suc, keep_messages : keep_messages});
    res.end;
    return;
})

router.post('/addPatients', async function(req, res) {
    // delete keep message
    try { // 驗證 token
        const user = jwt.verify(req.cookies.token, 'my_secret_key');
    }
    catch(e) { //
        console.log(e);
        res.json({suc : 'false', error : '身分認證失敗!'});
        res.end();
        return;
    }
    let conn = await pool.getConnection();
    // default insert successful
    var suc = true;
    try {
        var sql_ck_same = 'select * from patients where id = ?';
        var ck_per = await conn.query(sql_ck_same, req.body.id);
        var e_text;
        if (ck_per[0] == null) { // 新的病患, 新增到病患 table
            var sql_pat = 'insert into patients(weight, height, name, id, sex, birth, identity, tel1, tel2, mom_id, parity, address, can_used, pass, allergy, hate, mark) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);'
            let up = await conn.query(sql_pat, [req.body.weight, req.body.height, req.body.name, req.body.id, req.body.sex, req.body.birth, req.body.identity, req.body.tel1, req.body.tel2, req.body.mom_id, req.body.parity, req.body.address, req.body.can_used, req.body.pass, req.body.allergy, req.body.hate, req.body.mark]) 
        }
        else { // 此病患已經在資料庫了
            suc = false;
            e_text = '此病患已經新增過了';
        }
    }
    catch(e) {
        suc = false;
        console.log(e);
    }
    conn.release();
    res.json({suc : suc, e_text : e_text});
    res.end;
    return;
})

router.post('/editPatients', async function(req, res) {
    // delete keep message
    try { // 驗證 token
        const user = jwt.verify(req.cookies.token, 'my_secret_key');
    }
    catch(e) { //
        console.log(e);
        res.json({suc : 'false', error : '身分認證失敗!'});
        res.end();
        return;
    }
    let conn = await pool.getConnection();
    // default insert successful
    var suc = true;
    try {
        var sql_ck_same = 'select * from patients where id = ?';
        var ck_per = await conn.query(sql_ck_same, req.body.id);
        var e_text;
        if (ck_per[0] != null) { // 是有在資料庫的舊病患
            // 備份舊資料
            await conn.query("insert into backup_patients(`pId`, `name`, `id`, `sex`, `birth`, `identity`, `tel1`, `tel2`, `mom_id`, `parity`, `address`, `can_used`, `pass`, `allergy`, `hate`, `mark`, `origin_times`, `weight`, `height`, `aId`) select *, ? from patients where `pId` = ?;", [req.body.nId, ck_per[0].pId]);
            // 更新主要資料
            var sql_pat = 'update patients set weight=?, height=?, name=?, id=?, sex=?, birth=?, identity=?, tel1=?, tel2=?, mom_id=?, parity=?, address=?, can_used=?, pass=?, allergy=?, hate=?, mark=? where id = ?;'
            let up = await conn.query(sql_pat, [req.body.weight, req.body.height, req.body.name, req.body.id, req.body.sex, req.body.birth, req.body.identity, req.body.tel1, req.body.tel2, req.body.mom_id, req.body.parity, req.body.address, req.body.can_used, req.body.pass, req.body.allergy, req.body.hate, req.body.mark, req.body.id]) 
            //console.log(up);
        }
        else { // 此病患沒在資料庫
            suc = false;
            e_text = '不能修改，因尚未有此病患資料';
        }
    }
    catch(e) {
        suc = false;
        console.log(e);
    }
    conn.release();
    res.json({suc : suc, e_text : e_text});
    res.end;
    return;
})

router.get('/allVac', async function(req, res) {
    try {
        const user = jwt.verify(req.cookies.token, 'my_secret_key');
    }
    catch(e) {
        console.log(e);
        res.redirect('/login');
        res.end();
        return;
    };
    let conn = await pool.getConnection();
    // default insert successful
    var suc = true;
    try {
        var all_vac = await conn.query('select * from vac;') 
    }
    catch(e) {
        suc = false;
        console.log(e);
    }
    conn.release();
    res.json({suc : suc, all_vac : all_vac});
    res.end;
    return;
});

router.post('/inNoCard', async function(req, res) { // 查看是否未還卡
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
        var no_card_num = await conn.query('select count(*) from no_card where status = 0 and rId = ?', [req.body.rId]);
    }
    catch(e) {
        console.log(e);
    }
    conn.release();
    res.json({no_card_num : no_card_num[0]['count(*)'].toString()});
    return res.end;
});

router.get('/roadFile', async function(req, res) { // 路名檔
    try {
        const user = jwt.verify(req.cookies.token, 'my_secret_key');
    }
    catch(e) {
        console.log(e);
        res.redirect('/login');
        res.end();
        return;
    };
    data = '';
    // 記得要先去把 road.txt 轉成 utf-8
    fs.readFile('road.txt', 'utf-8', function (err, data) {
        if (err) throw err;
        data = data.toString();
        res.json({data : data});
    });
    res.end;
    return;
});

router.post('/canDeleted', async function(req, res) { // 查詢是否可以被刪除
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
        var can_deleted; // 是否可被刪除，只要是押金(rId 有在還卡清單中)就可以
        var in_no_card = await conn.query('select count(*) from no_card where rId = ?', [req.body.rId]);
        in_no_card = in_no_card[0]['count(*)'];
        if (in_no_card) {
            can_deleted = true;
        }
        else {
            can_deleted = false;
        }
    }
    catch(e) {
        console.log(e);
    }
    conn.release();
    res.json({can_deleted : can_deleted});
    return res.end;
});

module.exports = router;
