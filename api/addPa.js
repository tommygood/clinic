var express = require('express');
var app = express();
const router = require('express').Router();
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
var config = require("config");
var root = config.get('server.root');
var jwt = require('jsonwebtoken');

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
    res.sendFile(root + 'templates/addPatients.html');
});

/*router.post('/add', async function(req, res) {
    var db = require('mariadb');
    const pool = db.createPool({
        host : 'localhost',
        user : 'wang',
        password : 'wang313',
        database : 'clinic'
    });
    let conn = await pool.getConnection();
    var sql_pat = 'insert into patients(name,chart_num, id, sex, birth, identity, tel1, tel2, mom_id, parity, address, can_used, pass, allergy, hate, mark, regist, part_self, deposit, all_self) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);'
    let up = await conn.query(sql_pat, [req.body.name, req.body.chart_num, req.body.id, req.body.sex, req.body.birth, req.body.identity, req.body.tel1, req.body.tel2, req.body.mom_id, req.body.parity, req.body.address, req.body.can_used, req.body.pass, req.body.allergy, req.body.hate, req.body.mark, req.body.regist, req.body.part_self, req.body.deposit, req.body.all_self], 
        (err, results, fields) => {
            if (err)
                console.error(err.message);
            console.log(results);
        }
    );
    console.log(req.body.name);
    //res.sendFile('/home/wang/nodejs/templates/addPatients.html');
    router.use('./addPa', function(req, res) {
        res.sendFile('/home/wang/nodejs/templates/addPatients.html');
        console.log('123');
    });
    res.end
});*/
module.exports = router;
