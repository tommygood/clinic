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

module.exports = router;
