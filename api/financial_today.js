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
        // Start Transaction
        await conn.beginTransaction();
        try {
            //console.log(all_changed);
            for (let i = 0;i < Object.keys(all_changed).length;i++) {
                var fId = await conn.batch('select `fId`, `money` from financial_today where `no` = ?', Object.keys(all_changed)[i]); // get the record's fId and original money
                //console.log(fId);
                // update the changed money to financial and financial_today
                var update_today_suc = await conn.batch('update financial_today set `money` = ? where `no` = ?', [Object.values(all_changed)[i][0], Object.keys(all_changed)[i]])
                var update_all_suc = await conn.batch('update financial set `money` = ? where `no` = ?', [Object.values(all_changed)[i][0], fId[0].fId])
                // record the changed log, insert into changed_expenses_log
                var insert_log_suc = await conn.batch("insert into change_expenses_log(`aId`, `fId`, `original_money`, `changed_money`, `reason`) values(?, ?, ?, ?, ?)", [aId, fId[0].fId, fId[0].money, Object.values(all_changed)[i][0], Object.values(all_changed)[i][1]]) 
            }
            // commit
            await conn.commit();
        }
        catch(e) {
            console.log(e);
            // 還原
            await conn.rollback();
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
    var suc = true;
    if (user.data.aId == aId && user.data.title == 'nur') { // 登入中
        let conn = await pool.getConnection();
        try {
            // 先新增一筆上個班次要留給下個班次的金額
            await lastRecord(conn, req.body.aId, req.body.last_money, true);
            // 找出所有當班的收支紀錄
            var origin_num = await conn.query('select `fId` from financial_today;');
            var all_settle_no = allSettleNo(origin_num).toString(); // now's all financial_today no
            // insert into done_financial
            final_settle_money = req.body.total_money - req.body.last_money; // 結算金額要減掉留給下一班的
            var insert_suc = await conn.query("insert into done_financial(`money`, `details`, `origin_aId`, `origin_log`) values(?, ?, ?, ?)", [final_settle_money, all_settle_no, req.body.aId, req.body.origin_log]);
            if (!insert_suc) { // insert failed
                error.push('insert into done_financial failed !');
                suc = false;
            }
            else { // only when insert successful can truncate financial_today
                var del_suc = await conn.query('truncate financial_today;'); // reset the financial today
                // 先新增一筆上個班次要留給下個班次的金額
                await lastRecord(conn, req.body.aId, req.body.last_money, false);
                //console.log(del_suc.affectedRows);
                //await conn.query('insert into financial_today')
                if (!del_suc) { // delete failed
                    error.push('truncate financial_today failed !');
                    suc = false;
                }
                else {
                    suc = true;
                }
            }
        }
        catch(e) {
            console.log(e);
            suc = false;
            error.push(e);
        }
        conn.release();
        res.json({suc : suc, error : error});
        res.end;
        return;
    }
    else {
        error.push('authenticaion failed, wrong identification !');
        //conn.release();
        res.json({suc : false, error : error});
        res.end;
        return;
    }
})

async function lastRecord(conn, aId, total_money, is_minus) {
    // 先新增一筆上個班次要留給下個班次的金額，可能是增或減，因為要同時加一筆和減一筆，收支才會對
    // Start Transaction
    await conn.beginTransaction();
    try {
        var last_reason;
        if (is_minus && total_money > 0) { // 是要減的(留給下一個班的錢)
            last_reason = '留給下一個班的。';
            total_money = total_money * -1;
            console.log(last_reason);
            var fId = await conn.batch('insert into financial(`aId`, `reason`, `money`, `mark`) values(?, ?, ?, ?);', [aId, last_reason, total_money, null]); // 新增到總帳務
            await conn.batch('insert into financial_today(`aId`, `reason`, `money`, `fId`, `mark`) values(?, ?, ?, ?, ?);', [aId, last_reason, total_money, fId.insertId, null]); // 新增到今日帳務
        }
        if (!is_minus && total_money > 0) { // 要加的(上一個班留的錢)
            last_reason = '上一個班留的。';
            var fId = await conn.batch('insert into financial(`aId`, `reason`, `money`, `mark`) values(?, ?, ?, ?);', [aId, last_reason, total_money, null]); // 新增到總帳務
            await conn.batch('insert into financial_today(`aId`, `reason`, `money`, `fId`, `mark`) values(?, ?, ?, ?, ?);', [aId, last_reason, total_money, fId.insertId, null]); // 新增到今日帳務
        }
        // commit
        await conn.commit();
    }
    catch(e) {
        console.log(e);
        // 還原
        await conn.rollback();
    }
}

function allSettleNo(origin_num) { // make an array have all settle no
    var all_settle_no = []; // all settle no array
    for (let i = 0;i < origin_num.length;i++)
        all_settle_no.push(origin_num[i].fId);
    return all_settle_no;
}

router.post('/addFinancial', async function(req, res) { // 新增帳務記錄
    try {
        const user = jwt.verify(req.cookies.token, 'my_secret_key');
    }
    catch(e) {
        console.log(e);
        res.json({suc : false});
        res.end;
        return;
    };
    var suc = true; // 是否成功新增
    var error_txt = ''; // 錯誤訊息
    const all_reason = req.body.all_reason;
    const all_money = req.body.all_money;
    const all_mark = req.body.all_mark;
    const aId = req.body.aId;
    let conn = await pool.getConnection();
    // Start Transaction
    await conn.beginTransaction();
    try { // 新增到今日帳務、總帳務
        var reason;
        var money;
        var mark;
        for (let i = 0;i < all_reason.length;i++) { // 可能一次新增多筆帳務
            reason = all_reason[i];
            money = minus(all_money[i]);
            mark = all_mark[i];
            var fId = await conn.batch('insert into financial(`aId`, `reason`, `money`, `mark`) values(?, ?, ?, ?);', [aId, reason, money, mark]); // 新增到總帳務
            await conn.batch('insert into financial_today(`aId`, `reason`, `money`, `fId`, `mark`) values(?, ?, ?, ?, ?);', [aId, reason, money, fId.insertId, mark]); // 新增到今日帳務
        }
        await conn.commit();
    }
    catch(e) {
        console.log(e);
        suc = false;
        error_txt = e;
        // 還原
        await conn.rollback();
    }
    conn.release();
    res.json({suc : suc, error_txt : error_txt});
    res.end;
    return;
})

function minus(money) { // 把錢變成負的
    money = Math.abs(money); // 先變正的
    return money * -1;
}


module.exports = router;
