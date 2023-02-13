var express = require('express');
var session = require('express-session');
var app = express();
var bodyParser = require("body-parser");
var cookieParser = require('cookie-parser');
var jwt = require('jsonwebtoken');
const router = require('express').Router();
const server = require('http').Server(app);
const io = require('socket.io')(server);
var LocalStorage = require('node-localstorage').LocalStorage;
localStorage = new LocalStorage('./scratch');
app.use(session({secret : 'secret', saveUninitialized: false, resave: true}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());
app.set("view engine", "jade");
app.set("views", "jade");
app.use('/addPa', require('./api/addPa'));
app.use('/hot_key', require('./api/hot_key'));
app.use('/viewPa', require('./api/viewPa'));
app.use('/login', require('./api/login'));
app.use('/docMain', require('./api/docMain'));
app.use('/ckVac', require('./api/ckVac'));
app.use('/ckTodayVac', require('./api/ckTodayVac'));
app.use('/ckMed', require('./api/ckMed'));
app.use('/allMed', require('./api/allMed'));
app.use('/addMed', require('./api/addMed'));
app.use('/ckPatients', require('./api/ckPatients'));
app.use('/fullcalendar', require('./api/calendar'));
app.use('/financial', require('./api/financial'));
app.use('/financial_today', require('./api/financial_today'));
app.use('/cardDebt', require('./api/cardDebt'));
app.use('/view_today_pa', require('./api/view_today_pa'));
app.use('/view_history_pa', require('./api/view_history_pa'));
app.use('/done_financial', require('./api/done_financial'));
app.use('/debt', require('./api/debt'));
app.use('/regist', require('./api/regist'));
const db = require("mariadb");
const pool = db.createPool({
    trace : true,
    host : 'localhost',
    user : 'wang',
    password : 'wang313',
    database : 'clinic'
});

var config = require("config"); // 設定檔
var root = config.get('server.root'); // 根目錄位置
app.get('/get', function(req, res) {
    res.end
})

app.post('/post', function(req, res) {
    res.json({name: 'test1'});
    res.end
})


// check each doctor's num
app.get('/', async function (req, res) {
    var path = root + 'templates/index.html';
    res.sendFile(path);
    res.end;
    return;
}); 

app.get('/index_records' , async function (req, res) {
    // only need to supply the few necessary column of record for index.html
    let conn = await pool.getConnection();
    var sql_records = 'select `no`, `dId`, `num`, `pId`, `in` from records where `no` not in (select `rId` from done_records);'
    var records;
    try {
        records = await conn.query(sql_records);
    }
    catch(e) {
        console.log(e);
    }
    conn.release();
    res.json({records : records});
    res.end;
    return;
})

app.get('/index_patients' , async function (req, res) {
    // only need to supply the few necessary column of patients for index.html
    let conn = await pool.getConnection();
    var sql_patients = 'select `pId`, `name` from patients;'
    var records;
    try {
        records = await conn.query(sql_patients);
    }
    catch(e) {
        console.log(e);
    }
    // do not show patients' full name
    records = encryptName(records);
    conn.release();
    res.json({records : records});
    res.end;
    return;
})

function encryptName(records) { // 把名字加密，第二字元改成 O
    // encrypt name, second index change to 'O'
    for (let i = 0;i < records.length;i++) {
        // make encrypt name
        encrypt_name = '';
        for (let j = 0;j < records[i].name.length;j++) {
            // change index 1 char
            if (j == 1)
                encrypt_name += "O";
            else 
                encrypt_name += records[i].name[j];
        }
        records[i].name = encrypt_name;
    }
    return records;
}

app.get('/data', async function(req, res) {
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
    let rows;
    try {
        rows = await conn.query('select * from patients');
    }
    catch(e) {
        console.log(e);
    }
    //let nurses = await conn.query('select `no`, `pass`, `status` from nurses');
    conn.release();
    //rows.push(nurses);
    res.json(rows)
    res.end
});

app.get('/records', async function(req, res) {
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
    let records;
    try {
        records = await conn.query('select * from records where `no` not in (select `rId` from delete_records) order by `num`;');
    }
    catch(e) {
        console.log(e);
    }
    conn.release();
    res.json(records);
    res.end
});
    

app.get('/all_records', async function(req, res) { // all records but not order by num
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
    let records;
    try {
        records = await conn.query('select * from records where `no` not in (select `rId` from delete_records);');
    }
    catch(e) {
        console.log(records);
    }
    conn.release();
    res.json(records);
    res.end
});

app.get('/today_records', async function(req, res) {
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
    // let records = await conn.query('select * from records order by `num`');
    let records;
    try {
        records = await conn.query('select * from records `num` where date(`start`) = curdate() order by `num`;');
    }
    catch(e) {
        console.log(e);
    }
    conn.release();
    res.json(records);
    res.end
});


app.get('/history_records', async function(req, res) {
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
    // let records = await conn.query('select * from records order by `num`');
    let records;
    try {
        records = await conn.query('select * from records `num` where date(`start`) != curdate() order by `num`;');
    }
    catch(e) {
        console.log(e);
    }
    conn.release();
    res.json(records);
    res.end
});

app.get('/vac', async function(req, res) {
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
    let records;
    try {
        records = await conn.query('select * from vac;');
    }
    catch(e) {
        console.log(e);
    }
    conn.release();
    res.json(records);
    res.end
});

app.get('/vac_re', async function(req, res) {
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
    var records;
    try {
        if (req.query["today"]) // today vacines_records
            records = await conn.query('select * from vac_re where date(`time`) = curdate();');
        else // all vaccine records
            records = await conn.query('select * from vac_re;');
    }
    catch(e) {
        console.log(e);
    }
    conn.release();
    res.json(records);
    res.end
});

app.get('/med_inventory_each', async function(req, res) {
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
    var records;
    try {
        if (req.query['aId']) { // 只給該帳號人員負責的藥品
            records = await conn.query('select * from med_inventory_each where `aId` = ?;', req.query['aId']);
        }
        else {
            records = await conn.query('select * from med_inventory_each;');
        }
    }
    catch(e) {
        console.log(e);
    }
    conn.release();
    res.json(records);
    res.end
});

app.get('/medicines', async function(req, res) {
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
    let records;
    try {
        records = await conn.query('select * from medicines;');
    }
    catch(e) {
        console.log(e);
    }
    conn.release();
    res.json(records);
    res.end
});

app.get('/done_records', async function(req, res) {
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
    let done_records;
    try {
        done_records = await conn.query('select * from done_records;');
    }
    catch(e) {
        console.log(e);
    }
    conn.release();
    res.json(done_records);
    res.end;
});

app.get('/symptoms', async function(req, res) {
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
    let symptoms;
    try {
        symptoms = await conn.query('select * from symptoms;');
    }
    catch(e) {
        console.log(e);
    }
    conn.release();
    res.json(symptoms);
    res.end;
});
    
app.get('/medicines_normal', async function(req, res) {
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
    let medicines_normal;
    try {
        medicines_normal = await conn.query('select * from medicines_normal;');
    }
    catch(e) {
        console.log(e);
    }
    conn.release();
    res.json(medicines_normal);
    res.end;
});
    
app.get('/expense', async function(req, res) {
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
    let expense;
    try {
        expense = await conn.query('select * from expense;');
    }
    catch(e) {
        console.log(expense);
    }
    conn.release();
    res.json(expense);
    res.end;
    return;
});
    
app.get('/main_pos', async function(req, res) { // 查看主責
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
    let expense;
    try {
        expense = await conn.query('select * from main_pos;');
    }
    catch(e) {
        console.log(e);
    }
    conn.release();
    res.json(expense);
    res.end;
    return;
});

app.get('/total_financial', async function(req, res) {
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
    let expense;
    try {
        expense = await conn.query('select * from financial;');
    }
    catch(e) {
        console.log(e);
    }
    conn.release();
    res.json(expense);
    res.end;
    return;
});

app.get('/today_financial', async function(req, res) {
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
    let expense;
    try {
        expense = await conn.query('select * from financial_today;');
    }
    catch(e) {
        console.log(e);
    }
    conn.release();
    res.json(expense);
    res.end;
    return;
});

app.get('/updatePa', function(req, res) {
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
        res.sendFile(root + 'templates/updatePa.html');
    }
    res.end;
    return;
});

app.get('/no_card', async function(req, res) {
    try {
        const user = jwt.verify(req.cookies.token, 'my_secret_key');
    }
    catch(e) {
        console.log(e);
        res.redirect('/login');
        res.end;
        return;
    };
    const user = jwt.verify(req.cookies.token, 'my_secret_key');
    if (user.data.aId && user.data.title == 'nur') { // 登入中
        let conn = await pool.getConnection();
        let no_card;
        try {
            no_card = await conn.query('select * from no_card where `rId` not in (select `rId` from delete_records);'); // 找出沒有帶卡且不在被刪除的名單中的病歷號
        }
        catch(e) {
            console.log(e);
        }
        conn.release();
        res.json({no_card : no_card});
    }
    res.end;
    return;
});

app.get('/getPageNum', async function(req, res) { // 回傳需計算分頁的紀錄的數量
    let conn = await pool.getConnection();
    var records_num;
    try {
        if (req.query["history"] && req.query["dId"]) // history records, not filter the done records
            records_num = await conn.query('select count(*) from records where `dId` = ? and `no` not in (select `rId` from delete_records);', req.query["dId"]);
        else if (req.query["debt"]) // 全部疫苗
            records_num = await conn.query('select count(*) from debt where `turned` = 0;');
        else if (req.query['all_financial'])
            records_num = await conn.query('select count(*) from financial;');
        else if (req.query["all_vac"]) // 全部疫苗
            records_num = await conn.query('select count(*) from vac_re;');
        else if (req.query["today_vac"]) // 今日疫苗
            records_num = await conn.query('select count(*) from vac_re where date(`time`) = curdate();');
        else if (req.query["all_med"]) // 該護士管理之藥品庫存
            records_num = await conn.query('select count(*) from med_inventory_each where `aId` = ?;', req.query['aId']);
        else if (req.query["today"] && req.query["dId"]) // today records, not filter the done records
            records_num = await conn.query('select count(*) from records where `dId` = ? and DATE(`start`) = CURDATE() and `no` not in (select `rId` from delete_records);', req.query["dId"]);
        else if (!req.query["history"] &&req.query["dId"]) // 候診清單, filter the done records
            records_num = await conn.query('select count(*) from records where `dId` = ? and `no` not in (select `rId` from done_records) and `no` not in (select `rId` from delete_records);', req.query["dId"]);
    }
    catch(e) {
        console.log(e);
    }
    conn.release();
    try {
        page_num = records_num[0]['count(*)'].toString();
    }
    catch(e) {
        page_num = null;
        console.log(e);
    }
    res.json({page_num : page_num});
    res.end
});

app.get('/medRec', async function(req, res) {
    try {
        const user = jwt.verify(req.cookies.token, 'my_secret_key');
    }
    catch(e) {
        console.log(e);
        res.redirect('/login');
        res.end;
        return;
    };
    const user = jwt.verify(req.cookies.token, 'my_secret_key');
    if (user.data.aId) { // 登入中
        let conn = await pool.getConnection();
        let med_rec;
        try {
            med_rec = await conn.query('select `rId` from medicines_records group by `rId`;'); // 找出沒有帶卡且不在被刪除的名單中的病歷號
        }
        catch(e) {
            console.log(e);
        }
        conn.release();
        res.json({med_rec : med_rec});
    }
    res.end;
    return;
});

app.get('/get_account', async function(req, res) { // 找帳號清單
    try {
        const user = jwt.verify(req.cookies.token, 'my_secret_key');
    }
    catch(e) {
        console.log(e);
        res.redirect('/login');
        res.end;
        return;
    };
    const user = jwt.verify(req.cookies.token, 'my_secret_key');
    if (user.data.aId) { // 登入中
        let conn = await pool.getConnection();
        let records;
        try {
            records = await conn.query('select `aId`, `title`, `name` from accounts;'); // 找帳號清單
        }
        catch(e) {
            console.log(e);
        }
        conn.release();
        res.json({records : records});
    }
    res.end;
    return;
});

app.get('/each_use_medicines', async function(req, res) {
    try {
        const user = jwt.verify(req.cookies.token, 'my_secret_key');
    }
    catch(e) {
        console.log(e);
        res.redirect('/login');
        res.end;
        return;
    };
    const user = jwt.verify(req.cookies.token, 'my_secret_key');
    if (user.data.aId) { // 登入中
        let conn = await pool.getConnection();
        let records;
        try {
            records = await conn.query('select * from each_use_medicines;'); // 找出沒有帶卡且不在被刪除的名單中的病歷號
        }
        catch(e) {
            console.log(e);
        }
        conn.release();
        res.json({records});
    }
    res.end;
    return;
});

app.get('/getTitle', async function(req, res) { // 回傳帳號資訊
    let conn = await pool.getConnection();
    var title; // 職位
    var name; // 名稱
    try {
        var result = await conn.query('select title, name from accounts where `aId` = ?', req.query['aId']);
        title = result[0].title;
        name = result[0].name; 
        result = await conn.query('select real_name from title_relation where `abbreviation` = ?;', title);
        //console.log(result[0].real_name);
        title = result[0].real_name;
    }
    catch(e) {
        console.log(e);
    }
    conn.release();
    res.json({title : title, name : name});
    res.end;
})

app.post('/getSinglePatient', async function(req, res) { // 回傳帳號資訊
    let conn = await pool.getConnection();
    var result;
    var suc = true;
    try {
        result = await conn.query('select * from patients where `pId` = ?', [req.body.pId]);
    }
    catch(e) {
        suc = false;
        console.log(e);
    }
    conn.release();
    res.json({suc : suc, result : result});
    res.end;
})

var doc_msg;

async function keepDb(msg) {
    // insert into keep_messages
    let conn = await pool.getConnection();
    var insert_keep_messages = await conn.query('insert into keep_messages(`content`) values(?)', msg);
    conn.release();
    // return keep messages id
    return insert_keep_messages.insertId;
}

async function getKeepMsg() {
    // get keep messages
    let conn = await pool.getConnection();
    var keep_msg = await conn.query("select * from keep_messages;");
    conn.release();
    return keep_msg;
}
    

io.on('connection', (socket) => {
    socket.on('disconnect', () => {
        //console.log('Bye~');  // 顯示 bye~
    });
    
    socket.on("docMsg", (msg) => {
        io.emit("msg", msg);
    });
    
    socket.on("saveKeepMsg", (msg) => {
        // save keep message to db
        var kmId = keepDb(msg); 
        kmId.then(function(kmId) {
            // return message and kmId
            io.emit("keepMsg", msg, kmId.toString());
        })
    });
});

server.listen(5000, function () {
    console.log('Node server is running..');
});
