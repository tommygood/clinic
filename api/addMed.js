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

router.get('/', function(req, res) {
	try {
		const user = jwt.verify(req.cookies.token, 'my_secret_key');
	}
	catch(e) {
		console.log(e);
		return res.json({error:'未登入'});
		res.end();
		return;
	};
	const user = jwt.verify(req.cookies.token, 'my_secret_key');
    if (user.data.aId && user.data.title == 'nur') { // 登入中
        res.sendFile('/home/wang/nodejs/templates/addMed.html');  //回應靜態文件
        return;
    }
    else {
        res.statusCode = 302;
        res.setHeader("Location", "http://localhost:8080/login");
        res.end();
        return;
    }
});

router.post('/check', async function(req, res) {
	const {code, expire, aId, quantity} = req.body;
	if (code.length == 0 || expire.length == 0 || aId.length == 0 || quantity.length == 0) {
		return res.json({error:'請勿輸入空值'});
		res.end();
	};
    let conn = await pool.getConnection();
    await conn.query('insert into med_inventory_each(`code`, `expire`, `aId`, `quantity`) values(?, ?, ?, ?);', [code, expire, aId, quantity]);
    conn.release();
	return res.json({error:null});
	res.end();
});

module.exports = router;
