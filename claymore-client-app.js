var request = require('request');
var net = require('net');

var App = {
	server : null,
	config : null,
    fetchPromise : null,
    loopFetch : true,
    minerData : [],

    init : function(server, done){
    	var self = this;
        this.server = server;
        this.config = server.config;
        
        self.fetchJSONRPCData();
        //self.fetchHTTPData();

        if(typeof done === 'function'){
        	done(this);
        }
    },

    jsonRPCGetStat : function(callback){
        var self = this;
        var tcpClient = new net.Socket();
        var jsonReply = null;
        tcpClient.on('data', function(data) {
            var reply = data.toString('utf8');
            try{
                jsonReply = JSON.parse(reply);
            }catch(e){
                console.log("failed to parse JSON object from reply");
            }
        });

        tcpClient.on('error', function() {
            console.log("JSON-RPC socket error");
            jsonReply = null;
        });

        tcpClient.on('timeout', function() {
            console.log("JSON-RPC socket timeout");
            jsonReply = null;
            tcpClient.end();
        });

        tcpClient.on('close', function() {
            if(jsonReply === null){
                callback(true, null);
            }
            else{
                callback(false,jsonReply);
            }
            tcpClient.destroy();
        });

        tcpClient.connect(self.config.minerPort, self.config.minerIP, function() {
            console.log('connected to miner at '+self.config.minerIP+":"+self.config.minerPort);
            tcpClient.write('{"id":1337,"jsonrpc": "2.0","method":"miner_getstat1"}\r\n');
        });
    },

    addMinerStat : function(jsonData){
        var self = this;
        if(jsonData.hasOwnProperty('result')){
            var stat = {
                version     : jsonData.result[0],
                uptime      : jsonData.result[1],
                gpu         : {
                    temp : [],
                    fanSpeed : []
                },
                pools       : {
                    ethPool : {},
                    altPool : {}
                }
            };

            var ethStatSplits = jsonData.result[2].split(';');                
            stat.ethStats = {
                totalHashrate : ethStatSplits[0],
                acceptedShares : ethStatSplits[1],
                rejectedShares : ethStatSplits[2],
                incorrectShares : 0,
                gpuHashrate : []
            };
            var ethGPUStatSplits  = jsonData.result[3].split(';');
            for(var i=0 ; i<ethGPUStatSplits.length ; i++){
                stat.ethStats.gpuHashrate.push(ethGPUStatSplits[i]);
            }

            var altStatSplits = jsonData.result[4].split(';');                
            stat.altStats = {
                totalHashrate : altStatSplits[0],
                acceptedShares : altStatSplits[1],
                rejectedShares : altStatSplits[2],
                incorrectShares : 0,
                gpuHashrate : []
            };
            var altGPUStatSplits  = jsonData.result[5].split(';');
            for(var i=0 ; i<altGPUStatSplits.length ; i++){
                stat.altStats.gpuHashrate.push(altGPUStatSplits[i]);
            }                

            var gpuMonSplits = jsonData.result[6].split(';');
            for(var i=0 ; i<gpuMonSplits.length ; i+=2){
                stat.gpu.temp.push(gpuMonSplits[i]);
                stat.gpu.fanSpeed.push(gpuMonSplits[i+1]);
            }

            var poolSplits = jsonData.result[7].split(';');
            stat.pools.ethPool = {
                target : poolSplits[0],
                poolSwitch : 0
            }
            if(poolSplits.length > 1){
                stat.pools.altPool = {
                    target : poolSplits[1],
                    poolSwitch : 0
                }
            }

            var errStatSplits = jsonData.result[8].split(';');
            stat.ethStats.incorrectShares = errStatSplits[0];
            stat.pools.ethPool.poolSwitch = errStatSplits[1];

            if(errStatSplits.length > 3){
                stat.altStats.incorrectShares = errStatSplits[2];
                stat.pools.altPool.poolSwitch = errStatSplits[3];
            }

            self.minerData.push(stat);
            if(self.minerData.length > self.config.dataHistory){
                self.minerData = self.minerData.shift();
            }
            console.log(JSON.stringify(stat,null,2));
        }  
    },

    fetchJSONRPCData : function(){
        var self = this;
        self.jsonRPCGetStat(function(error, data){
            if(error === false){
                self.addMinerStat(data);
            }            
            if(self.loopFetch === true){
                self.fetchPromise = setTimeout(self.fetchJSONRPCData.bind(self), self.config.fetchInterval);
            }
        });
    },

    fetchHTTPData : function(){
        var self = this;
        request("http://"+self.config.minerIP+":"+self.config.minerPort, function(err, res, data){
            if(err === null){
                try{
                    var firstJsonChar = data.indexOf('{');
                    var lastJsonChar = data.lastIndexOf('}');
                    var jsonString = data.substring(firstJsonChar,lastJsonChar+1);
                    var jsonData = JSON.parse(jsonString);
                }
                catch(e){}    

                self.addMinerStat(jsonData);   
            }
            if(self.loopFetch === true){
                self.fetchPromise = setTimeout(self.fetchHTTPData.bind(self), self.config.fetchInterval);
            }
        });
    },

    destroy : function(){ 
        var self = this;
        self.loopFetch = false;
        if(self.fetchPromise !== null){
            clearTimeout(self.fetchPromise);
            self.fetchPromise = null;
        }
    }
};

module.exports = App;