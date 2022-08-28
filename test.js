var express = require('express');
var app = express();
var bodyParser = require("body-parser");
const router = require('express').Router();
app.use(bodyParser.urlencoded({ extended: false }));
app.set("view engine", "jade");
app.set("views", "jade");
app.use('/addPa', require('./api/addPa'));
app.use('/viewPa', require('./api/viewPa'));
const db = require("mariadb");
const pool = db.createPool({
    host : 'localhost',
    user : 'wang',
    password : 'wang313',
    database : 'clinic'
});

app.get('/get', function(req, res) {
    //res.json({name: 'test'});
    //console.log(req.query);
    res.sendFile(__dirname+'/templates/test.html');  //回應靜態文件
    res.end
})

app.post('/post', function(req, res) {
    res.json({name: 'test1'});
    //return res.sendFile(__dirname+'/templates/test.html');  //回應靜態文件
    //console.log(req.body['name'])
    res.end
})

app.get('/', async function (req, res) {
    //res.sendFile(__dirname+'/templates/test.html', {test:rows});  //回應靜態文件
    var db = require('mariadb');
    const pool = db.createPool({
        host : 'localhost',
        user : 'wang',
        password : 'wang313',
        database : 'clinic'
    });
    let conn = await pool.getConnection();
    let rows = await conn.query('select * from test');
    let a = 3;
    let up = await conn.query('insert into test(`a`) values(?)', a);
    res.render('test',{test:rows});
    res.end
}); 

app.get('/data', async function(req, res) {
    var db = require('mariadb');
    const pool = db.createPool({
        host : 'localhost',
        user : 'wang',
        password : 'wang313',
        database : 'clinic'
    });
    let conn = await pool.getConnection();
    let rows = await conn.query('select * from patients');
    let nurses = await conn.query('select `nId`, `pass`, `status` from nurses');
    rows.push(nurses);
    //console.log(rows[rows.length-1][0].nId);
    res.json(rows)
    //res.render('test',{test:rows});
    res.end
});

app.get('/records', async function(req, res) {
    var db = require('mariadb');
    const pool = db.createPool({
        host : 'localhost',
        user : 'wang',
        password : 'wang313',
        database : 'clinic'
    });
    let conn = await pool.getConnection();
    let records = await conn.query('select * from records');
    res.json(records);
    res.end
});
    
app.get('/no_records', async function(req, res) {
    var db = require('mariadb');
    const pool = db.createPool({
        host : 'localhost',
        user : 'wang',
        password : 'wang313',
        database : 'clinic'
    });
    let conn = await pool.getConnection();
    let records = await conn.query('select * from no_records');
    res.json(records);
    res.end
});

var server = app.listen(5000, function () {
    console.log('Node server is running..');
});

