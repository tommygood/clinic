const router = require('express').Router();
const fs = require('fs');
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
    await conn.beginTransaction();
    try {
        var update_records = req.body.update_records;
        var update_index = req.body.update_index;
        var change_num = req.body.change_num;
        var nId = req.body.nId;
        //console.log(update_index);
        //console.log(update_records);
        //console.log(change_num);
        for (let i = 0;i < update_records.length;i++) { // 更新全部的紀錄的看診號
            await conn.batch('update records set `num` = ? where `no` = ?;', [update_records[i], update_index[i]]);
            //await conn.query('update records set `num` = ? where `no` = ?;', [update_records[i], update_index[i]]);
        }
        for (let i = 0;i < Object.keys(change_num).length;i++) { // 更新看診號的 log，記錄是誰更動哪些
            await conn.batch('insert into change_num(`aId`, `rId`, `quantity`) values(?, ?, ?)', [nId, Object.keys(change_num)[i], Object.values(change_num)[i]]);
            //await conn.query('insert into change_num(`aId`, `rId`, `quantity`) values(?, ?, ?)', [nId, Object.keys(change_num)[i], Object.values(change_num)[i]]) 
        }
        // commit
        await conn.commit();
    }
    catch(e) {
        console.log(e);
        conn.release();
        // 還原
        await conn.rollback();
    }
    conn.release();
    res.json({suc:true});
    res.end();
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
    var had_changed_pay;
    await conn.beginTransaction(); // start transaction
    sql : try {
        var return_text = ''; // 要回傳的文字
        var suc = true;
        // 檢查醫生有沒有更動患者的收費
        had_changed_pay = await checkUpdateMoney(conn, req.body.regist, req.body.self_part, req.body.all_self, req.body.rId, req.body.dId);
        //console.log("有變更，" + had_changed_pay);
        if (had_changed_pay) { // 有更動
            // 更新 record
            await conn.query('update records set `regist` = ?, `self_part` = ?, `all_self` = ? where `no` = ?', [req.body.regist, req.body.self_part, req.body.all_self, req.body.rId]);
        }
        var all_keys = Object.keys(req.body);
        var all_used_medicines = {}; // 全部醫生開的藥的各個種類及其數量
        for (let i = 0;i < all_keys.length;i++) { // 找每一種藥需要的數量，如果是同一種藥分多次開也會加在一起
            if (all_keys[i].includes('medicines') && !Object.values(req.body[all_keys[i]])[0] == "") {
                const all_this_code = await conn.query('select `index`, `code` from medicines where `medi_eng` = ?', Object.values(req.body[all_keys[i]])[0]); // 全部是這個 code 的藥品
                if (all_this_code.length == 0) { // 藥品資料庫中找不到此款藥品
                    // 就是處方籤
                    continue;
                }
                // 可能有多筆相同英文名字的藥品，最後一個才是正確的
                var true_code = all_this_code[all_this_code.length-1]; 
                // 新增一筆用藥紀錄
                const in_normal = await conn.query('select count(*) from medicines_normal where `code` = ?', true_code.code);
                var code = true_code.code;
                if (in_normal[0]['count(*)']==0) { // 還沒被放入常用的藥品
                    const all_this_code = await conn.query('select * from medicines where `code` = ?', code); // 全部是這個 code 的藥品
                    const true_code = all_this_code[all_this_code.length-1]; // 最後一個才是正確的
                    // 放入常用藥品
                    await conn.query("insert into medicines_normal(`mId`, `new_mark`, `oral_tablet`, `single_two`, `code`, `price`, `price_date`, `price_fin_date`, `medi_eng`, `medi_amount`, `medi_unit`, `ingre`, `ingre_amount`, `ingre_unit`, `dose_form`, `medi_producer`, `medi_sort`, `quality_code`, `medi_mand`, `sort_group`, `fir_ingre`, `fir_medi_amount`, `fir_medi_unit`, `sec_ingre`, `sec_medi_amount`, `sec_medi_unit`, `thi_ingre`, `thi_medi_amount`, `thi_medi_unit`, `four_ingre`, `four_medi_amount`, `four_medi_unit`, `fift_ingre`, `fift_medi_amount`, `fift_medi_unit`, `producer`, `atc_code`, `no_input`) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? , ?, ?, ?, ?)", [true_code.index, true_code.new_mark, true_code.oral_tablet, true_code.single_two, true_code.code, true_code.price, true_code.price_date, true_code.price_fin_date, true_code.medi_eng, true_code.medi_amount, true_code.medi_unit, true_code.ingre, true_code.ingre_amount, true_code.ingre_unit, true_code.dose_form, true_code.medi_producer, true_code.medi_sort, true_code.quality_code, true_code.medi_mand, true_code.sort_group, true_code.fir_ingre, true_code.fir_medi_amount, true_code.fir_medi_unit, true_code.sec_ingre, true_code.sec_medi_amount, true_code.sec_medi_unit, true_code.thi_ingre, true_code.thi_medi_amount, true_code.thi_medi_unit, true_code.four_ingre, true_code.four_medi_amount, true_code.four_medi_unit, true_code.fift_ingre, true_code.fift_medi_amount, true_code.fift_medi_unit, true_code.producer, true_code.atc_code, true_code.no_input]); 
                }
                // 計算花了多少藥品
                let num = parseFloat(Object.values(req.body[all_keys[i]])[1] * Object.values(req.body[all_keys[i]])[2], 10) * -1.0;
                // 新增到全部開的藥，第一次新增要先設值
                if (!Object.keys(all_used_medicines).includes(true_code.code)) { // 第一次新增
                    all_used_medicines[true_code.code] = num;
                }
                else {
                    all_used_medicines[true_code.code] += num;
                }
                // 小數點加減法會自己跑到小數點後很多位，所以要取到小數點第二位才是正確
                all_used_medicines[true_code.code] = Math.round(all_used_medicines[true_code.code] * 100) / 100;
            }
        }
        var over_required = false;
        for (let i = 0;i < Object.keys(all_used_medicines).length;i++) { // 檢查藥品剩餘量是否 > 需求量
            var sql = "select sum(now_quantity) from med_inventory_each where `code` = ? group by `code`;";
            const remain_quantity = await conn.query(sql, Object.keys(all_used_medicines)[i]);
            if (remain_quantity[0] == undefined) { // 檢查是否有此筆藥物
                suc = false;
                return_text = '無此藥品。\n編號：' + Object.keys(all_used_medicines)[i] + '。';
                console.log(return_text);
                over_required = true;
                break;
            }
            if (JSON.stringify(parseFloat(Object.values(remain_quantity[0])[0])) < Object.values(all_used_medicines)[i]*-1.0) {
                // 找出該藥品名字
                sql = "select medi_eng from medicines where `code` = ? order by `index` desc limit 1;"
                const medi_eng = await conn.query(sql, Object.keys(all_used_medicines)[i]);
                return_text = '藥品庫存不足。\n' + '藥名：' + medi_eng[0].medi_eng + '。編號：' + Object.keys(all_used_medicines)[i] + '。\n需求：' + Object.values(all_used_medicines)[i]*-1.0 + '。\n剩餘：' + JSON.stringify(parseFloat(Object.values(remain_quantity[0])[0])) + '。';
                over_required = true;
                suc = false;
                console.log(return_text);
                break;
            }
        }
        if (over_required) { // 如果需求 > 剩餘，就不要執行接下來的完診動作
            break sql;
        }
        // 新增進已完診
        var suc_insert_done = await conn.batch('insert into done_records(`rId`) values(?)', req.body.rId); // 新增至已完成紀錄
        // after finish this record, resort this doctor's current not done record
        reSortNum(req.body.dId, conn);
        for (let i = 0;i < all_keys.length;i++) { // 找是否有藥品需匯入資料庫
            if (all_keys[i].includes('medicines') && !Object.values(req.body[all_keys[i]])[0] == "") {
                const all_this_code = await conn.query('select `index`, `code` from medicines where `medi_eng` = ?', Object.values(req.body[all_keys[i]])[0]); // 全部是這個 code 的藥品
                if (all_this_code.length == 0) { // 藥品資料庫中找不到此款藥品
                    // 就是處方籤
                    await conn.batch('insert into medicines_records(`rId`, `subscript`, `put_index`) values(?, ?, ?)', [req.body.rId, Object.values(req.body[all_keys[i]])[0], Object.values(req.body[all_keys[i]])[5]]);
                    continue;
                }
                // 可能有多筆相同英文名字的藥品，最後一個才是正確的
                var true_code = all_this_code[all_this_code.length-1]; 
                // 新增一筆用藥紀錄
                await conn.batch('insert into medicines_records(`rId`, `medicines_id`, `day_num`, `days`, `rule`, `mark`, `put_index`) values(?, ?, ?, ?, ?, ?, ?)', [req.body.rId, true_code.index, Object.values(req.body[all_keys[i]])[1], Object.values(req.body[all_keys[i]])[2], Object.values(req.body[all_keys[i]])[3], Object.values(req.body[all_keys[i]])[4], Object.values(req.body[all_keys[i]])[5]]);
                const in_normal = await conn.query('select count(*) from medicines_normal where `code` = ?', true_code.code);
                var code = true_code.code;
                if (in_normal[0]['count(*)']==0) { // 還沒被放入常用的藥品
                    const all_this_code = await conn.query('select * from medicines where `code` = ?', code); // 全部是這個 code 的藥品
                    const true_code = all_this_code[all_this_code.length-1]; // 最後一個才是正確的
                    // 放入常用藥品
                    await conn.batch("insert into medicines_normal(`mId`, `new_mark`, `oral_tablet`, `single_two`, `code`, `price`, `price_date`, `price_fin_date`, `medi_eng`, `medi_amount`, `medi_unit`, `ingre`, `ingre_amount`, `ingre_unit`, `dose_form`, `medi_producer`, `medi_sort`, `quality_code`, `medi_mand`, `sort_group`, `fir_ingre`, `fir_medi_amount`, `fir_medi_unit`, `sec_ingre`, `sec_medi_amount`, `sec_medi_unit`, `thi_ingre`, `thi_medi_amount`, `thi_medi_unit`, `four_ingre`, `four_medi_amount`, `four_medi_unit`, `fift_ingre`, `fift_medi_amount`, `fift_medi_unit`, `producer`, `atc_code`, `no_input`) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? , ?, ?, ?, ?)", [true_code.index, true_code.new_mark, true_code.oral_tablet, true_code.single_two, true_code.code, true_code.price, true_code.price_date, true_code.price_fin_date, true_code.medi_eng, true_code.medi_amount, true_code.medi_unit, true_code.ingre, true_code.ingre_amount, true_code.ingre_unit, true_code.dose_form, true_code.medi_producer, true_code.medi_sort, true_code.quality_code, true_code.medi_mand, true_code.sort_group, true_code.fir_ingre, true_code.fir_medi_amount, true_code.fir_medi_unit, true_code.sec_ingre, true_code.sec_medi_amount, true_code.sec_medi_unit, true_code.thi_ingre, true_code.thi_medi_amount, true_code.thi_medi_unit, true_code.four_ingre, true_code.four_medi_amount, true_code.four_medi_unit, true_code.fift_ingre, true_code.fift_medi_amount, true_code.fift_medi_unit, true_code.producer, true_code.atc_code, true_code.no_input]); 
                }
                // 計算花了多少藥品
                var num = parseFloat(Object.values(req.body[all_keys[i]])[1] * Object.values(req.body[all_keys[i]])[2], 10) * -1.0;
                // 新增到全部開的藥
                all_used_medicines[true_code] += num;
                // 記錄一筆藥品使用紀錄
                var the_medicine_id = await conn.query("select `no`, `now_quantity` from med_inventory_each where `code` = ? and `now_quantity`> 0 order by expire", true_code.code);
                //console.log(the_medicine_id);
                // 檢查是否有同時用到多個批次的藥
                for (let i = 0;i < the_medicine_id.length;i++) {
                    if (the_medicine_id[i].now_quantity < num * -1) { // 如果藥品剩餘量 < 需求量，先用完這批藥品，再去找下一批藥
                        await conn.batch('insert into each_use_medicines(`aId`, `quantity`, `reason`, `mark`, `emId`, `code`) values(?, ?, ?, ?, ?, ?);', [req.body.dId, the_medicine_id[i].now_quantity * -1, req.body.dId + "醫生看診", req.body.rId + " 號病歷號", the_medicine_id[i].no, true_code.code]);
                        // 更新被使用的藥的現在數量
                        await conn.batch('update med_inventory_each set `now_quantity` = ? where `no` = ?', [0, the_medicine_id[i].no]);
                        num += the_medicine_id[i].now_quantity // 需求量 -= 減掉這個批次開了的藥
                    }
                    else { // 藥品剩餘量 >= 需求量，這個批次的庫存足夠。
                        //console.log(the_medicine_id[i].now_quantity);
                        //console.log(num);
                        await conn.batch('insert into each_use_medicines(`aId`, `quantity`, `reason`, `mark`, `emId`, `code`) values(?, ?, ?, ?, ?, ?);', [req.body.dId, num, req.body.dId + "醫生看診", req.body.rId + " 號病歷號", the_medicine_id[0].no, true_code.code]);
                        // 更新被使用的藥的現在數量
                        await conn.batch('update med_inventory_each set `now_quantity` = ? where `no` = ?', [parseFloat(the_medicine_id[i].now_quantity) + parseFloat(num), the_medicine_id[i].no]);
                        break;
                    }
                }
                /*
                if (the_medicine_id[0].now_quantity < num * -1) { // 如果藥品剩餘量 < 需求量
                    return_text = '藥碼：' + true_code.code + '，已無庫存。';
                    over_required = true; // 需求量 > 庫存
                }
                await conn.query('insert into each_use_medicines(`aId`, `quantity`, `reason`, `mark`, `emId`) values(?, ?, ?, ?, ?);', [req.body.dId, num, req.body.dId + "醫生看診", req.body.rId + " 號病歷號", the_medicine_id[0].no]);
                // 更新被使用的藥的現在數量
                await conn.query('update med_inventory_each set `now_quantity` = ? where `no` = ?', [the_medicine_id[0].now_quantity + num, the_medicine_id[0].no]);
                */
            }
        }
        await conn.batch('insert into diagnose_records(`rId`, `diagnose_code`, `main_sue`) values(?, ?, ?)', [req.body.rId, req.body.diagnose_code_pass, req.body.main_sue])
        await conn.batch('update records set `end` = ? where `no` = ?', [new Date(), req.body.rId]); 
        await conn.commit(); // commit
    }
    catch(error) {
        console.log(error);
        conn.release();
        res.json({suc : false, error : error});
        // 還原
        await conn.rollback();
        res.end;
        return;
    }
    conn.release();
    res.json({suc: suc, return_text : return_text, had_changed_pay : had_changed_pay});
    res.end;
    return;
});

async function checkUpdateMoney(conn, regist, self_part, all_self, rId, dId) { // 檢查醫生有沒有更動患者的收費
    // 先查患者原本的收費
    var origin_record_pay = await conn.query("select `regist`, `self_part`, `all_self` from records where `no` = ?", rId);
    var origin_regist = origin_record_pay[0].regist;
    var origin_self_part = origin_record_pay[0].self_part;
    var origin_all_self = origin_record_pay[0].all_self;
    var changed = ""; // 是否有被醫生更動
    var changed_num; // 更動多少
    // 其中有一個不一樣就是有更動
    if (regist != origin_regist) { // 掛號費有更動
        changed_num = parseInt(regist) - parseInt(origin_regist);
        //console.log("regist " + changed_num);
        // 記錄到帳務紀錄
        updateFinancialRecord(conn, dId, rId, changed_num, '醫生更動。掛號費');
        changed += "醫生更動。掛號費：" + changed_num + "\n";
    }
    if (self_part != origin_self_part) { // 部分負擔有更動
        changed_num = parseInt(self_part) - parseInt(origin_self_part);
        //console.log("self part " + changed_num);
        // 記錄到帳務紀錄
        updateFinancialRecord(conn, dId, rId, changed_num, '醫生更動。部分負擔');
        changed += "醫生更動。部分負擔：" + changed_num + "\n";
    }
    if (all_self != origin_all_self) { // 自費有更動
        changed_num = parseInt(all_self) - parseInt(origin_all_self);
        //console.log("all self " + changed_num);
        // 記錄到帳務紀錄
        updateFinancialRecord(conn, dId, rId, changed_num, '醫生更動。自費');
        changed += "醫生更動。自費：" + changed_num + "\n";
    }
    return changed;
}

async function updateFinancialRecord(conn, aId, rId, money, reason) { // 記錄到帳務紀錄
    reason += "," + rId; // 帳務理由
    // Start Transaction
    await conn.beginTransaction();
    try { // 記錄到總帳務及今日帳務
        var fId = await conn.batch('insert into financial(`aId`, `reason`, `money`) values(?, ?, ?);', [aId, reason, money]); // 新增到總帳務
        await conn.batch('insert into financial_today(`aId`, `reason`, `money`, `fId`) values(?, ?, ?, ?);', [aId, reason, money, fId.insertId]); // 新增到今日帳務
        await conn.commit();
    }
    catch(e) {
        // 還原
        await conn.rollback();
        console.log(e);
    }
}

router.post('/backup', async function(req, res) {
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
    // Start Transaction
    await conn.beginTransaction();
    try {
        //var suc_insert_done = await conn.query('insert into done_records(`rId`) values(?)', req.body.rId); // 新增至已完成紀錄
        // after finish this record, resort this doctor's current not done record
        //reSortNum(req.body.dId, conn);
        //await conn.query('update records set `regist` = ?, `self_part` = ?, `all_self` = ? where `no` = ?', [req.body.regist, req.body.self_part, req.body.all_self, req.body.rId]);
        var all_keys = Object.keys(req.body);
        // 先刪掉同個 medicines record 的暫存
        await conn.batch('delete from backup_medicines_records where `rId` = ?;', req.body.rId);
        for (let i = 0;i < all_keys.length;i++) { // 找是否有藥品需匯入資料庫
            if (all_keys[i].includes('medicines') && !Object.values(req.body[all_keys[i]])[0] == "") {
                const all_this_code = await conn.query('select `index`, `code` from medicines where `medi_eng` = ?', Object.values(req.body[all_keys[i]])[0]); // 全部是這個 code 的藥品
                if (all_this_code.length != 0) { // 藥品名稱有在資料庫，不是處方簽
                    var true_code = all_this_code[all_this_code.length-1]; // 最後一個才是正確的
                    const day_num = Object.values(req.body[all_keys[i]])[1] ? Object.values(req.body[all_keys[i]])[1] : null;
                    const days = Object.values(req.body[all_keys[i]])[2] ? Object.values(req.body[all_keys[i]])[2] : null;
                    await conn.batch('insert into backup_medicines_records(`rId`, `medicines_id`, `day_num`, `days`, `rule`, `mark`, `put_index`) values(?, ?, ?, ?, ?, ?, ?)', [req.body.rId, true_code.index, day_num, days, Object.values(req.body[all_keys[i]])[3], Object.values(req.body[all_keys[i]])[4], Object.values(req.body[all_keys[i]])[5]]);
                    const in_normal = await conn.query('select count(*) from medicines_normal where `code` = ?', true_code.code);
                    var code = true_code.code;
                    if (in_normal[0]['count(*)']==0) { // 還沒被放入常用的藥品
                        const all_this_code = await conn.query('select * from medicines where `code` = ?', code); // 全部是這個 code 的藥品
                        const true_code = all_this_code[all_this_code.length-1]; // 最後一個才是正確的
                        // 放入常用藥品
                        await conn.batch("insert into medicines_normal(`mId`, `new_mark`, `oral_tablet`, `single_two`, `code`, `price`, `price_date`, `price_fin_date`, `medi_eng`, `medi_amount`, `medi_unit`, `ingre`, `ingre_amount`, `ingre_unit`, `dose_form`, `medi_producer`, `medi_sort`, `quality_code`, `medi_mand`, `sort_group`, `fir_ingre`, `fir_medi_amount`, `fir_medi_unit`, `sec_ingre`, `sec_medi_amount`, `sec_medi_unit`, `thi_ingre`, `thi_medi_amount`, `thi_medi_unit`, `four_ingre`, `four_medi_amount`, `four_medi_unit`, `fift_ingre`, `fift_medi_amount`, `fift_medi_unit`, `producer`, `atc_code`, `no_input`) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? , ?, ?, ?, ?)", [true_code.index, true_code.new_mark, true_code.oral_tablet, true_code.single_two, true_code.code, true_code.price, true_code.price_date, true_code.price_fin_date, true_code.medi_eng, true_code.medi_amount, true_code.medi_unit, true_code.ingre, true_code.ingre_amount, true_code.ingre_unit, true_code.dose_form, true_code.medi_producer, true_code.medi_sort, true_code.quality_code, true_code.medi_mand, true_code.sort_group, true_code.fir_ingre, true_code.fir_medi_amount, true_code.fir_medi_unit, true_code.sec_ingre, true_code.sec_medi_amount, true_code.sec_medi_unit, true_code.thi_ingre, true_code.thi_medi_amount, true_code.thi_medi_unit, true_code.four_ingre, true_code.four_medi_amount, true_code.four_medi_unit, true_code.fift_ingre, true_code.fift_medi_amount, true_code.fift_medi_unit, true_code.producer, true_code.atc_code, true_code.no_input]); 
                    }
                }
                else { // 處方簽，只記錄寫在藥品名稱的
                    await conn.batch('insert into backup_medicines_records(`rId`, `subscript`, `put_index`) values(?, ?, ?)', [req.body.rId, Object.values(req.body[all_keys[i]])[0], Object.values(req.body[all_keys[i]])[5]]);
                }
                //var num = parseInt(Object.values(req.body[all_keys[i]])[1] * Object.values(req.body[all_keys[i]])[2], 10) * -1;
                //await conn.query('insert into med_inventory_each(`code`, `expire`, `aId`, `quantity`, `reason`, `mark`) values(?, ?, ?, ?, ?, ?);', [true_code.code, null, req.body.dId, num, '醫生看診', req.body.rId + " 號病歷號"]);
            }
        }
        // 先刪掉同個 diagnose record 的暫存
        await conn.batch('delete from backup_diagnose_records where `rId` = ?;', req.body.rId);
        await conn.batch('insert into backup_diagnose_records(`rId`, `diagnose_code`, `main_sue`) values(?, ?, ?)', [req.body.rId, req.body.diagnose_code_pass, req.body.main_sue])
        //await conn.query('update records set `end` = ? where `no` = ?', [new Date(), req.body.rId]); 
        // commit
        await conn.commit();
    }
    catch(error) {
        console.log(error);
        conn.release();
        // 還原
        await conn.rollback();
        res.json({suc : false, error : error});
        res.end;
        return;
    }
    conn.release();
    res.json({suc: true});
    res.end;
    return;
});

router.get('/backup', async function(req, res) {
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
        var diagnose = await conn.query('select * from backup_diagnose_records where `rId` = ?', req.query.rId)
        var medicines = await conn.query('select * from backup_medicines_records where `rId` = ?', req.query.rId)
    }
    catch(error) {
        console.log(error);
        conn.release();
        res.json({suc : false, error : error});
        res.end;
        return;
    }
    conn.release();
    res.json({suc: true, data : {diagnose : diagnose, medicines : medicines}});
    res.end;
    return;
});

async function reSortNum(dId, conn) {
    // after doctor finish this patient, the others records' num need to be resort
    var sql_select = "select * from records where `dId` = ? and `no` not in (select `rId` from done_records) order by `num`;"
    var resort = await conn.query(sql_select, dId);
    // update sql
    var sql_update = "update records set `num` = ? where `no` = ?";
    // update each num in records, which is this doctor and not in done_records
    for (let i = 0;i < resort.length;i++) {
        try {
            // update
            await conn.query(sql_update, [i+1, resort[i].no]);
        }
        catch(e) {
            console.log(e);
        }
    }
}

router.get('/', function(req, res) {
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
    const user = jwt.verify(req.cookies.token, 'my_secret_key');
    const pa = jwt.verify(req.cookies.pa_num, 'my_secret_key');
    makeUploadXml(1);
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
        res.redirect('/login');
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

router.post('/updateIn', async function(req, res) { // 更新是否在場
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
            //console.log(total_in[i]);
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
    conn.release();
    res.json({suc:true});
    res.end();
    return;
})  

router.post('/updatePaid', async function(req, res) { // 更新是否在場
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
            //console.log(total_in[i]);
            if (total_in[i]) 
                console.log(await conn.query('update records set `paid` = ? where `no` = ?;', [1, total_rId[i]]));
            else 
                console.log(await conn.query('update records set `paid` = ? where `no` = ?;', [0, total_rId[i]]));
        }
    }
    catch(e) {
        console.log(e);
    }
    conn.release();
    res.json({suc:true});
    res.end();
    return;
})  

router.post('/updateIn', async function(req, res) { // 更新是否在場
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
            //console.log(total_in[i]);
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
    conn.release();
    res.json({suc:true});
    res.end();
    return;
})  

router.post('/checkVac', async function(req, res) { // 更新是否在場
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
    suc = true;
    try {
        const rId = req.body.rId;
        //console.log(rId);
        sql = 'select vId from vac_re where `rId` = ?;'
        all_vId = await conn.query(sql, rId);
        //console.log(all_vId);
    }
    catch(e) {
        suc = false;
        console.log(e);
    }
    conn.release();
    res.json({suc:suc, all_vId : all_vId});
    res.end();
    return;
})  

router.get('/medi_normal_eng', async function(req, res) { // 回傳所有常用藥品的英文名稱
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
        var all_medi_eng;
        all_medi_eng = await conn.query('select medi_eng from medicines_normal;');
    }
    catch(error) {
        console.log(error);
        conn.release();
        res.json({suc : false, error : error});
        res.end;
        return;
    }
    conn.release();
    res.json({suc: true, data : {all_medi_eng : all_medi_eng}});
    res.end;
    return;
});

router.post('/getMediInfo', async function(req, res) { // 查看單個藥品資訊
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
    var suc = true;
    var medi_info;
    try {
        const medi_eng = req.body.medi_eng;
        sql = 'select * from medicines_normal where `medi_eng` = ? ORDER BY `index` DESC LIMIT 1;';
        medi_info = await conn.query(sql, medi_eng);
    }
    catch(e) {
        suc = false;
        console.log(e);
    }
    conn.release();
    res.json({suc:suc, medi_info : medi_info});
    res.end();
    return;
}) 

function makeUploadXml(data_type) { // 製作 xml 檔
    // 先依照不同看診型別，區分共用變數值
    if (data_type == 1) { // 一般看診
        m23 = 0; // M23 處方調劑方式, 先設為是 自行調劑 才能開藥
    }
    else if (data_type == 2) { // 疫苗接種
        m23 = 2; // M23 處方調劑方式, 因為打疫苗所以不用開藥
    }
    else {
        console.log('尚未提供此資料型態的上傳功能！');
        return;
    }
    // 先定義不同看診型別的共用變數
    // MSG 標頭
    // H00 = data_type
    h01 = 'A'; // H01 資料格式, A = 正常上傳, B = 異常上傳, C = 註銷未調劑慢連箋處方, D = 整筆刪除
    // MB1 健保資料
    m01 = 'x12345678912'; // M01 安全模組代碼
    m02 = 'aaaaaaaaaaaa'; // M02 卡片號碼
    m03 = 'f123456789'; // M03 身分證號或身分證明文件號碼
    m04 = ''; // M04 出生日期
    m05 = 'xxxxxxxxxx' // M05 醫療院所代碼
    m06 = 'g123456789' // M06 醫事人員身分證號
    m07 = '01' // M07 就醫類別
    m11 = 'xxxxxxxxxxxxx'; // M11 就診日期時間, R
    m12 = '1'; // M12 是否有帶健保卡, 1(有帶卡) or 2(補卡)
    m13 = '1234'; // M13 就醫序號, HC
    m14 = 'security_sign'; // M14 安全簽章, S
    m15 = 'identifiy_code'; // M15 就醫識別碼, S
    m35 = '123456'; // M35 主要診斷碼
    // M36~40 次要診斷碼，可以填或不填
    m44 = 150; // M44 門診醫療費用(當次)
    m45 = 200; // M45 門診部分負擔費用(當次)
    m51 = 4; // M51 給付類別, 一般應該是 3(普通傷害), 4(普通疾病)
    
    // 先輸入標頭和健保資料
    content = ''; // 要回傳的 xml 檔的內容
    content = addXmlElement(content, '<?xml version="1.0" encoding="Big5"?>', true, true); // 定義 xml
    content = addXmlElement(content, '<RECS>', true, true);
    content = addXmlElement(content, '<REC>', true, true);
    // message header
    content = addXmlElement(content, '<MSH>', true, true);
    // H00
    content = addXmlElement(content, '<H00>', false, true, true);
    content = addXmlElement(content, data_type, false, false); // 資料型別
    content = addXmlElement(content, '</H00>', true, true);
    // H01
    content = addXmlElement(content, '<H01>', false, true, true);
    content = addXmlElement(content, h01, false, false); // 先預設正常上傳
    content = addXmlElement(content, '</H01>', true, true);
    content = addXmlElement(content, '</MSH>', true, true);
    // message body
    content = addXmlElement(content, '<MB>', true, true);
    // MB1 健保資料
    content = addXmlElement(content, '<MB1>', true, true);
    // M01
    content = addXmlElement(content, '<M01>', false, true, true);
    content = addXmlElement(content, m01, false, false); 
    content = addXmlElement(content, '</M01>', true, true);
    // M02
    content = addXmlElement(content, '<M02>', false, true, true);
    content = addXmlElement(content, m02, false, false); 
    content = addXmlElement(content, '</M02>', true, true);
    // M03
    content = addXmlElement(content, '<M03>', false, true, true);
    content = addXmlElement(content, m03, false, false); 
    content = addXmlElement(content, '</M03>', true, true);
    // M04
    content = addXmlElement(content, '<M04>', false, true, true);
    content = addXmlElement(content, m04, false, false); 
    content = addXmlElement(content, '</M04>', true, true);
    // M05
    content = addXmlElement(content, '<M05>', false, true, true);
    content = addXmlElement(content, m05, false, false); 
    content = addXmlElement(content, '</M05>', true, true);
    // M06
    content = addXmlElement(content, '<M06>', false, true, true);
    content = addXmlElement(content, m06, false, false); 
    content = addXmlElement(content, '</M06>', true, true);
    // M07
    content = addXmlElement(content, '<M07>', false, true, true);
    content = addXmlElement(content, m07, false, false); 
    content = addXmlElement(content, '</M07>', true, true);
    // M11
    content = addXmlElement(content, '<M11>', false, true, true);
    content = addXmlElement(content, m11, false, false); 
    content = addXmlElement(content, '</M11>', true, true);
    // M12
    content = addXmlElement(content, '<M12>', false, true, true);
    content = addXmlElement(content, m12, false, false); 
    content = addXmlElement(content, '</M12>', true, true);
    // M13
    content = addXmlElement(content, '<M13>', false, true, true);
    content = addXmlElement(content, m13, false, false); 
    content = addXmlElement(content, '</M13>', true, true);
    // M14
    content = addXmlElement(content, '<M14>', false, true, true);
    content = addXmlElement(content, m14, false, false); 
    content = addXmlElement(content, '</M14>', true, true);
    // M15
    content = addXmlElement(content, '<M15>', false, true, true);
    content = addXmlElement(content, m15, false, false); 
    content = addXmlElement(content, '</M15>', true, true);
    // M35
    content = addXmlElement(content, '<M35>', false, true, true);
    content = addXmlElement(content, m35, false, false); 
    content = addXmlElement(content, '</M35>', true, true);
    // M44
    content = addXmlElement(content, '<M44>', false, true, true);
    content = addXmlElement(content, m44, false, false); 
    content = addXmlElement(content, '</M44>', true, true);
    // M45
    content = addXmlElement(content, '<M45>', false, true, true);
    content = addXmlElement(content, m45, false, false); 
    content = addXmlElement(content, '</M45>', true, true);
    // M51
    content = addXmlElement(content, '<M51>', false, true, true);
    content = addXmlElement(content, m51, false, false); 
    content = addXmlElement(content, '</M51>', true, true);
    // close MB1
    content = addXmlElement(content, '</MB1>', true, true);
    
    // 再依照不同看診型別，區分醫令專區變數值
    if (data_type == 1) { // 一般看診
        d01 = m11 // D01 same as M11
        d02 = 1; // D02 醫令類別, 1 = 藥品主檔
        d03 = 1; // D03 醫令序號, 第一筆 MB2 = 1, 第二筆 MB2 = 2 以此類推
        d04 = 'A'; // D04 處方種類, 7 日以下 = A, 30 日以下 = B
        d05 = 0; // D05 醫令調劑方式, 0 = 自行調劑, 1 = 交付調劑
        d06 = 'a123456789'; // D06 診療項目代號, 若 d02 = 1 就填藥碼, d02 = 2 就填支付標準代碼
        d08 = 'Q3D'; // D08 用法(藥品使用頻率), Q3D = 每三天一次
        d09 = '7'; // D09 天數
        d10 = '30.5'; // D10 總量, 四捨五入到小數點後第一位
        d11 = 'xxx'; // D11 處方簽章, S
        d14 = 'PO'; // D14 給藥途徑/作用部位, PO = 口服
        // 寫入到 xml
        // MB2 醫令專區
        content = addXmlElement(content, '<MB2>', true, true);
        // D01
        content = addXmlElement(content, '<D01>', false, true, true);
        content = addXmlElement(content, d01, false, false); 
        content = addXmlElement(content, '</D01>', true, true);
        // D02
        content = addXmlElement(content, '<D02>', false, true, true);
        content = addXmlElement(content, d02, false, false); 
        content = addXmlElement(content, '</D02>', true, true);
        // D03
        content = addXmlElement(content, '<D03>', false, true, true);
        content = addXmlElement(content, d03, false, false); 
        content = addXmlElement(content, '</D03>', true, true);
        // D04
        content = addXmlElement(content, '<D04>', false, true, true);
        content = addXmlElement(content, d04, false, false); 
        content = addXmlElement(content, '</D04>', true, true);
        // D05
        content = addXmlElement(content, '<D05>', false, true, true);
        content = addXmlElement(content, d05, false, false); 
        content = addXmlElement(content, '</D05>', true, true);
        // D06
        content = addXmlElement(content, '<D06>', false, true, true);
        content = addXmlElement(content, d06, false, false); 
        content = addXmlElement(content, '</D06>', true, true);
        // D08
        content = addXmlElement(content, '<D08>', false, true, true);
        content = addXmlElement(content, d08, false, false); 
        content = addXmlElement(content, '</D08>', true, true);
        // D09
        content = addXmlElement(content, '<D09>', false, true, true);
        content = addXmlElement(content, d09, false, false); 
        content = addXmlElement(content, '</D0>', true, true);
        // D10
        content = addXmlElement(content, '<D10>', false, true, true);
        content = addXmlElement(content, d10, false, false); 
        content = addXmlElement(content, '</D10>', true, true);
        // D11
        content = addXmlElement(content, '<D11>', false, true, true);
        content = addXmlElement(content, d11, false, false); 
        content = addXmlElement(content, '</D11>', true, true);
        // D14
        content = addXmlElement(content, '<D14>', false, true, true);
        content = addXmlElement(content, d14, false, false); 
        content = addXmlElement(content, '</D14>', true, true);
        content = addXmlElement(content, '</MB2>', true, true);
    }
    else if (data_type == 2) { // 疫苗接種
        
    }
    else {
        
    }
    
    content = addXmlElement(content, '</MB>', true, true);
    content = addXmlElement(content, '</REC>', true, true);
    content = addXmlElement(content, '</RECS>', false, true); // 最後一個標籤不用換行
    console.log(content);
    
    // 寫入並存到 .xml 
    fs.writeFile("upload/test.xml", content, function(err) {
        if(err) {
            return console.log(err);
        }
        //console.log("The file was saved!");
    }); 
}

function addXmlElement(content, obj, need_newline, is_tag, add_space) {
    obj = obj.toString(); // 先轉換成字串等等才能相加
    // 不是標籤，要過濾內容
    if (!is_tag) { 
        obj = filterXmlObj(obj, add_space); // 過濾掉不能出現在內容的字元
    }
    // 並檢查字元前是否需要新增空間
    if (add_space) {
        obj = addSpaceBeforeAll(obj);
    }
    // 是否需要在最後面換行
    if (need_newline) {
        last_element = '\n';
    }
    else {
        last_element = '';
    }
    
    return content + obj + last_element;
}

function addSpaceBeforeAll(obj) {
    new_obj = '  ';
    for (let i = 0;i < obj.length;i++) {
        new_obj += obj[i];
    }
    return new_obj;
}

function filterXmlObj(obj, add_space) { // 過濾掉不能出現在內容的字元
    new_obj = '';
    // 過濾掉不能出現在內容的字元
    can_not_use = ['>', '<', '&', '"', "'"]; // 不能使用的字元
    relative_fulltype = ['＞', '＜', '＆', '＂', "＇"] // 如果有，要轉成對應的全形
    for (let i = 0;i < obj.length;i++) {
        if (can_not_use.includes(obj[i])) { // 有不能使用的字元
            new_obj += relative_fulltype[can_not_use.indexOf(obj[i])]; // 要轉成對應的全形
        }
        else {
            new_obj += obj[i];
        }
    }
    return new_obj;
}

module.exports = router;
