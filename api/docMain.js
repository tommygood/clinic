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
    if (user.data.aId && (user.data.title == 'doc' || user.data.title == 'super')) { // 醫生登入成功
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
        try {
            await conn.query('update records set `real_start` = ? where `no` = ?', [new Date(), req.body.rId]); 
        }
        catch(e) {
            console.log(e);
        }
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
            var same_records;
            try {
                same_records = await conn.query('select `no`, `end` from records where `no` in (select `rId` from done_records where `rId` not in (select `rId` from delete_records)) and `pId` = ? and `no` in (select `rId` from diagnose_records) order by `end`;', req.body.pId); 
                if (same_records.length == 0) { // 沒有以前的病歷
                    conn.release();
                    res.end;
                    return res.json({suc : false, msg : '該病人沒有之前病歷'});
                }
            }
            catch(e) {
                console.log(e);
            }
            try {
                if (req.body.last_times == 0) { // 要找的次數為 0 ，清空
                    conn.release();
                    res.end;
                    return res.json({suc : true, clear : 'clear'}); 
                }
                var last_rId = same_records[same_records.length-req.body.last_times].no; // 這個病人上次病歷號
                var last_record_times = same_records[same_records.length-req.body.last_times].end; // 這個病人上次病歷完診時間
            }
            catch(e) {
                // 沒有再更之前的病歷紀錄
                console.log('normal: ' + e);
                conn.release();
                res.end;
                return res.json({suc : false, msg : '已無再之前的病歷紀錄'});
            }
            var last_diagnose;
            var last_medicines;
            try {
                last_diagnose = await conn.query('select * from diagnose_records where `rId` = ?', last_rId); // 上次看診的診斷
                last_medicines = await conn.query('select * from medicines_records where `rId` = ?', last_rId); // 上次看診的診斷
            }
            catch(e) {
                console.log(e);
            }
            var all_last_medicines = []; // 該次看診的全部用藥，有可能不止一個用藥
            for (let i = 0;i < last_medicines.length;i++) {
                all_last_medicines.push(last_medicines[i])
            }
        }
        else {
            var last_diagnose;
            var last_medicines;
            try {
                last_diagnose = await conn.query('select * from diagnose_records where `rId` = ?', req.body.rId); // 上次看診的診斷
                last_medicines = await conn.query('select * from medicines_records where `rId` = ?', req.body.rId); // 上次看診的診斷
            }
            catch(e) {
                console.log(e);
            }
            var all_last_medicines = []; // 該次看診的全部用藥，有可能不止一個用藥
            for (let i = 0;i < last_medicines.length;i++) {
                all_last_medicines.push(last_medicines[i])
            }
        }
        conn.release();
        res.end;
        // length == 1, means no record, so return null
        return res.json({suc : true, last_diagnose : last_diagnose.length ? last_diagnose[0] : null, last_medicines : all_last_medicines.length ? all_last_medicines : null, last_record_times : last_record_times, last_rId : last_rId}); 
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
        var last_diagnose;
        var last_medicines;
        var all_last_medicines;
        try {
            last_diagnose = await conn.query('select * from diagnose_records where `rId` = ?', req.body.rId); // 上次看診的診斷
            last_medicines = await conn.query('select * from medicines_records where `rId` = ?', req.body.rId); // 上次看診的診斷
            all_last_medicines = []; // 該次看診的全部用藥，有可能不止一個用藥
            for (let i = 0;i < last_medicines.length;i++) {
                all_last_medicines.push(last_medicines[i]);
            }   
            last_diagnose = last_diagnose[0];
        }
        catch(e) {
            console.log(e);
        }
        conn.release();
        res.end;
        return res.json({suc : true, last_diagnose : last_diagnose, last_medicines : all_last_medicines}); 
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
        var pId;
        try {
            pId = await conn.query('select `pId` from records where `no` = ?', req.query.rId); // 紀錄的 pId
        }
        catch(e) {
            console.log(e);
        }
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
        var fee;
        try {
            fee = await conn.query('select `regist`, `self_part`, `all_self` from records where `no` = ?', req.query.rId); // 紀錄的 pId
        }
        catch(e) {
            console.log(e);
        }
        conn.release();
        res.end;
        return res.json({suc : true, fee : fee}); 
    }
    else {
        return res.json({suc : false, msg : '身份認證失敗'});
    }
});

router.get('/getDeposit', async function(req, res) { // 回傳是否有押卡
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
        var is_depo;
        let conn = await pool.getConnection();
        try {
            var is_deposit = await conn.query('select count(*) from no_card where `rId` = ?', req.query.rId); // 該病歷號是否押單
            is_depo = is_deposit[0]['count(*)'].toString();
        }
        catch(e) {
            console.log(e);
        }
        conn.release();
        res.end;
        return res.json({suc : true, is_depo : is_depo}); 
    }
    else {
        return res.json({suc : false, msg : '身份認證失敗'});
    }
});

router.post('/findFamily', async function(req, res) { // 找出家屬
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
    let conn = await pool.getConnection();
    var patient_info;
    var is_mom;
    var is_his_mom;
    var tel_same;
    var address_same;
    try {
        patient_info = await conn.query('select * from patients where `pId` = ?', [req.body.pId]); 
        // 自己是他們的媽媽
        is_mom = await conn.query('select * from patients where `mom_id` = (select `id` from patients where `pId` = ?);', [req.body.pId]);
        // 相同的媽媽
        is_same_mom = await conn.query('select * from patients where `mom_id` = (select `mom_id` from patients where pId = ?);', [req.body.pId]);
        // 相同電話
        tel_same = await conn.query('select * from patients where `tel1` = (select tel1 from patients where `pId` = ?) or `tel1` = (select tel2 from patients where `pId` = ?) or `tel2` = (select tel1 from patients where `pId` = ?) or `tel2` = (select tel2 from patients where `pId` = ?);', [req.body.pId, req.body.pId, req.body.pId, req.body.pId]);
        // 相同地址
        address_same = await conn.query('select * from patients where `address` = (select address from patients where `pId` = ?);', [req.body.pId]);
    }
    catch(e) {
        console.log(e);
    }
    conn.release();
    var suc = true;
    if (patient_info) {
        //console.log(req.body.pId);
        var all_family = []; // 全部的家人的詳細資訊
        var all_added_pId = []; // 已經加入的 pId
        var all_relation = []; // 全部的親屬關係
        all_family.push(patient_info[0]); // 先加自己
        all_added_pId.push(patient_info[0].pId); // 先加自己
        all_relation.push('本人');
        if (is_mom) { // 自己是他們的媽媽
            for (let i = 0;i < is_mom.length;i++) {
                if (!(all_added_pId.includes(is_mom[i].pId))) {
                    all_added_pId.push(is_mom[i].pId);
                    all_family.push(is_mom[i]);
                    all_relation.push(`${is_mom[i].sex == '男' ? '兒子' : '女兒'}`);
                }
            }
        }
        if (is_same_mom) { // 相同的媽媽
            for (let i = 0;i < is_same_mom.length;i++) {
                if (!(all_added_pId.includes(is_same_mom[i].pId))) {
                    all_added_pId.push(is_same_mom[i].pId);
                    all_family.push(is_same_mom[i]);
                    all_relation.push('相同母親');
                }
                
            }
        }
        if (address_same) { // 相同地址
            for (let i = 0;i < address_same.length;i++) {
                if (!(all_added_pId.includes(address_same[i].pId))) {
                    all_added_pId.push(address_same[i].pId);
                    all_family.push(address_same[i]);
                    all_relation.push('地址相同');
                }
            }
        }
        if (tel_same) { // 相同電話
            for (let i = 0;i < tel_same.length;i++) {
                if (!(all_added_pId.includes(tel_same[i].pId))) {
                    all_added_pId.push(tel_same[i].pId);
                    all_family.push(tel_same[i]);
                    all_relation.push('電話相同');
                }
            }
        }
    }
    else {
        suc = false;
    }
    return res.json({suc : suc, all_family : all_family, all_relation : all_relation});
    res.end;
});


router.post('/get_diagnose_record', async function(req, res) { // 找出家屬
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
    try {
        const sql = 'select `rId` from diagnose_records where `diagnose_code` = ?;';
        var same_diagnose_rId;
        var suc = true;
        same_diagnose_rId = await conn.query(sql, req.body.diagnose_code); 
    }
    catch(e) {
        suc = false;
        console.log(e);
    }
    conn.release();
    return res.json({suc : suc, same_diagnose_rId : same_diagnose_rId});
    res.end;
});



module.exports = router;
