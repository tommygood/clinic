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
	var path = root + 'templates/calendar.html';
	res.sendFile(path);
	res.end;
	return;
});

router.get('/main.css', function(req, res) {
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
	var path = root + 'node_modules/fullcalendar/main.css';
	res.sendFile(path);
	res.end;
	return;
});

router.get('/main.js', function(req, res) {
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
	var path = root + 'node_modules/fullcalendar/main.js';
	res.sendFile(path);
	res.end;
	return;
});

router.post('/update', async function(req, res) {
	try {
		const user = jwt.verify(req.cookies.token, 'my_secret_key');
	}
	catch(e) {
		console.log(e);
		res.json({suc: false});
		res.end();
		return;
	};
	var suc;
	var start = req.body.start;
	var end = req.body.end;
	var aId = req.body.aId;
	var is_main = req.body.is_main;
    let conn = await pool.getConnection();
	console.log(start);
	console.log(end);
	try {
		await conn.query('insert into main_pos(`start_time`, `end_time`, `aId`, `status`) values(?, ?, ?, ?)', [start, end, aId, is_main]);
		suc = true;
	}
	catch(e) {
		console.log(e);
		suc = false;
	}
	conn.release();
	res.json({suc : suc});
	res.end;
	return;
})

router.get('/getMain', async function(req, res) {
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
	now_date = new Date();
	var aId;
	try {
		aId = await conn.query('select aId from main_pos where `start_time` <= ? and `end_time` >= ? and `status` = 1;', [now_date, now_date]);
	}
	catch(e) {
		console.log(e);
		aId = false;
	}
	res.json({aId : aId});
	res.end;
	return;
});
module.exports = router;
