var express = require('express');
var session = require('express-session');
var app = express();
var bodyParser = require("body-parser");
var cookieParser = require('cookie-parser');
var jwt = require('jsonwebtoken');
const router = require('express').Router();
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
app.use('/ckMed', require('./api/ckMed'));
app.use('/allMed', require('./api/allMed'));
app.use('/addMed', require('./api/addMed'));
app.use('/ckPatients', require('./api/ckPatients'));
const db = require("mariadb");
const pool = db.createPool({
    host : 'localhost',
    user : 'wang',
    password : 'wang313',
    database : 'clinic'
});

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
    let records = await conn.query('select * from records');
    conn.release();
    res.json(records);
    res.end
});
    
app.get('/no_records', async function(req, res) {
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
});

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
    let records = await conn.query('select * from vac_re;');
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
	

var server = app.listen(5000, function () {
    console.log('Node server is running..');
});