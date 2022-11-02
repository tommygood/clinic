var express = require('express');
var session = require('express-session');
var app = express();
var bodyParser = require("body-parser");
var cookieParser = require('cookie-parser');
var jwt = require('jsonwebtoken');
const router = require('express').Router();
const server = require('http').Server(app);
const io = require('socket.io')(server);
app.use(session({secret : 'secret', saveUninitialized: false, resave: true}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());
app.set("view engine", "jade");
app.set("views", "jade");
app.use('/addPa', require('./api/addPa'));
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
const db = require("mariadb");
const pool = db.createPool({
    host : 'localhost',
    user : 'wang',
    password : 'wang313',
    database : 'clinic'
});

var html_home = "/home/wang/nodejs/templates/";

app.get('/get', function(req, res) {
    res.end
})

app.post('/post', function(req, res) {
    res.json({name: 'test1'});
    res.end
})

app.get('/', async function (req, res) {
    let conn = await pool.getConnection();
    let rows = await conn.query('select * from test');
    let a = 3;
    let up = await conn.query('insert into test(`a`) values(?)', a);
    conn.release();
    res.render('test',{test:rows});
    res.end
}); 

app.get('/data', async function(req, res) {
	try {
		const user = jwt.verify(req.cookies.token, 'my_secret_key');
	}
	catch(e) {
		console.log(e);
		return res.json({error:'未登入'});
		res.end();
		return;
	};
    let conn = await pool.getConnection();
    let rows = await conn.query('select * from patients');
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
		return res.json({error:'未登入'});
		res.end();
		return;
	};
    let conn = await pool.getConnection();
	let records = await conn.query('select * from records where `no` not in (select `rId` from delete_records) order by `num`;');
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
		return res.json({error:'未登入'});
		res.end();
		return;
	};
    let conn = await pool.getConnection();
	let records = await conn.query('select * from records where `no` not in (select `rId` from delete_records);');
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
		return res.json({error:'未登入'});
		res.end();
		return;
	};
    let conn = await pool.getConnection();
	// let records = await conn.query('select * from records order by `num`');
    let records = await conn.query('select * from records `num` where date(`start`) = curdate() order by `num`;');
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
		return res.json({error:'未登入'});
		res.end();
		return;
	};
    let conn = await pool.getConnection();
	// let records = await conn.query('select * from records order by `num`');
    let records = await conn.query('select * from records `num` where date(`start`) != curdate() order by `num`;');
    conn.release();
    res.json(records);
    res.end
});

/*app.get('/no_records', async function(req, res) {
	try {
		const user = jwt.verify(req.cookies.token, 'my_secret_key');
	}
	catch(e) {
		console.log(e);
		return res.json({error:'未登入'});
		res.end();
		return;
	};
    let conn = await pool.getConnection();
    let records = await conn.query('select * from no_records');
    conn.release();
    res.json(records);
    res.end
});*/

app.get('/vac', async function(req, res) {
	try {
		const user = jwt.verify(req.cookies.token, 'my_secret_key');
	}
	catch(e) {
		console.log(e);
		return res.json({error:'未登入'});
		res.end();
		return;
	};
    let conn = await pool.getConnection();
    let records = await conn.query('select * from vac;');
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
		return res.json({error:'未登入'});
		res.end();
		return;
	};
    let conn = await pool.getConnection();
	if (req.query["today"]) // today vacines_records
    	var records = await conn.query('select * from vac_re where date(`time`) = curdate();');
	else // all vaccine records
    	var records = await conn.query('select * from vac_re;');
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
		return res.json({error:'未登入'});
		res.end();
		return;
	};
    let conn = await pool.getConnection();
    let records = await conn.query('select * from med_inventory_each;');
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
		return res.json({error:'未登入'});
		res.end();
		return;
	};
    let conn = await pool.getConnection();
    let records = await conn.query('select * from medicines;');
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
		return res.json({error:'未登入'});
		res.end();
		return;
	};
    let conn = await pool.getConnection();
    let done_records = await conn.query('select * from done_records;');
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
		return res.json({error:'未登入'});
		res.end();
		return;
	};
    let conn = await pool.getConnection();
    let symptoms = await conn.query('select * from symptoms;');
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
		return res.json({error:'未登入'});
		res.end();
		return;
	};
    let conn = await pool.getConnection();
    let medicines_normal = await conn.query('select * from medicines_normal;');
	conn.release();
	res.json(medicines_normal);
	res.end;
});

app.get('/hot_key', async function(req, res) {
	try {
		const user = jwt.verify(req.cookies.token, 'my_secret_key');
	}
	catch(e) {
		console.log(e);
		return res.json({error:'未登入'});
		res.end();
		return;
	};
    let conn = await pool.getConnection();
    let medicines_normal = await conn.query('select * from hot_key;');
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
		return res.json({error:'未登入'});
		res.end();
		return;
	};
    let conn = await pool.getConnection();
    let expense = await conn.query('select * from expense;');
	conn.release();
	res.json(expense);
	res.end;
});
	
app.get('/main_pos', async function(req, res) {
	try {
		const user = jwt.verify(req.cookies.token, 'my_secret_key');
	}
	catch(e) {
		console.log(e);
		return res.json({error:'未登入'});
		res.end();
		return;
	};
    let conn = await pool.getConnection();
    let expense = await conn.query('select * from main_pos;');
	conn.release();
	res.json(expense);
	res.end;
});

app.get('/total_financial', async function(req, res) {
	try {
		const user = jwt.verify(req.cookies.token, 'my_secret_key');
	}
	catch(e) {
		console.log(e);
		return res.json({error:'未登入'});
		res.end();
		return;
	};
    let conn = await pool.getConnection();
    let expense = await conn.query('select * from financial;');
	conn.release();
	res.json(expense);
	res.end;
});

app.get('/today_financial', async function(req, res) {
	try {
		const user = jwt.verify(req.cookies.token, 'my_secret_key');
	}
	catch(e) {
		console.log(e);
		return res.json({error:'未登入'});
		res.end();
		return;
	};
    let conn = await pool.getConnection();
    let expense = await conn.query('select * from financial_today;');
	conn.release();
	res.json(expense);
	res.end;
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
		res.sendFile(html_home + 'updatePa.html');
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
		res.json({error:'未登入'});
		res.end;
		return;
	};
	const user = jwt.verify(req.cookies.token, 'my_secret_key');
    if (user.data.aId && user.data.title == 'nur') { // 登入中
    	let conn = await pool.getConnection();
   	 	let no_card = await conn.query('select * from no_card where `rId` not in (select `rId` from delete_records);'); // 找出沒有帶卡且不在被刪除的名單中的病歷號
		conn.release();
		res.json({no_card : no_card});
    }
	res.end;
	return;
});

var doc_msg;

io.on('connection', (socket) => {
	console.log('Hello!');  // 顯示 Hello!
	socket.on('disconnect', () => {
		console.log('Bye~');  // 顯示 bye~
	});
	
	socket.on("docMsg", (msg) => {
		console.log(msg);
		io.emit("msg", msg);
	});
});

server.listen(5000, function () {
    console.log('Node server is running..');
});
