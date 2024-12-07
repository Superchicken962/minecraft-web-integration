var fs = require('fs');
var http = require('http');
var https = require('https');

const privateKey = fs.readFileSync("/etc/letsencrypt/live/babygamers.minecraftr.us/privkey.pem", "utf8");
const certificate = fs.readFileSync("/etc/letsencrypt/live/babygamers.minecraftr.us/fullchain.pem", "utf8");

var express = require('express');
var app = express();

// your express configuration here

app.get("/", (req, res) => {
    res.send("Hi");
})

var httpServer = http.createServer(app);
var httpsServer = https.createServer({key: privateKey, cert: certificate}, app);

httpServer.listen(80, () => {
    console.log("http server up");
});
httpsServer.listen(443, () => {
    console.log("https server up");
});