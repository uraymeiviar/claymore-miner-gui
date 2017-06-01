"use strict";
var http        = require("http");
var express     = require("express");
var bodyParser  = require('body-parser');
var compression = require('compression');
var websocket   = require('socket.io');
var cors        = require('cors');
var fs          = require('fs');
var app         = require("./claymore-client-app");
var server      = {
    config          : JSON.parse(fs.readFileSync('config.json', 'utf8')),
    httpRouter      : express(),
    httpServer      : null,
    websocketServer : null
};

server.httpServer = http.createServer(server.httpRouter);
server.httpRouter.use(compression());
server.httpRouter.use(bodyParser.json());
server.httpRouter.use(cors());
server.httpRouter.use('/', express.static('./www'));

function exitHandler(app, options, err) {
    console.log("terminating node because of "+options.signal+" signal");
    if(options.signal === 'exception'){
        console.trace("Here where the node is fucked up");
        console.log(err.stack);
    }
    if(app !== null){
        console.log("cleaning app resources");
        app.destroy();
        app = null;

    }
    process.exit();
}

process.on('exit', function(){
    console.log("server now exit");
});
process.on('SIGINT', exitHandler.bind(null,app, {signal:"SIGINT"}));
process.on('SIGTERM', exitHandler.bind(null,app, {signal:"SIGTERM"}));
process.on('SIGHUP', exitHandler.bind(null,app, {signal:"SIGHUP"}));
process.on('uncaughtException', function(error){
    exitHandler(app , {signal:"exception"}, error);
});

server.httpServer.listen(server.config.nodePort, function(err){
    if (err) {
        console.log("failed to start http server");
        return;
    }
    else{
        server.websocketServer = websocket(server.httpServer);
        console.log("http server listening on port: " + server.config.nodePort);        
        app.init(server, function(){
            console.log("node started, fetching data from "+server.config.minerIP+" port "+server.config.minerPort);
        });
    }
});

module.exports = server;

process.stdin.resume();