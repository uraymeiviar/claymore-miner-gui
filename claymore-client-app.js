var request = require('request');
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

        self.fetchPromise = setTimeout(function(){
            self.fetchData(self.onNewData.bind(self));
        }, self.config.fetchInterval);

        if(typeof done === 'function'){
        	done(this);
        }
    },

    onNewData : function(data){
        var self = this;
        try{
            var firstJsonChar = data.indexOf('{');
            var lastJsonChar = data.lastIndexOf('}');
            var jsonString = data.substring(firstJsonChar,lastJsonChar+1);
            var jsonData = JSON.parse(jsonString);
        }
        catch(e){}    

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

    fetchData : function(callback){
        var self = this;
        request("http://"+self.config.minerIP+":"+self.config.minerPort, function(err, res, body){
            if(err === null){
                callback(body);
            }
            if(self.loopFetch === true){
                self.fetchPromise = setTimeout(function(){
                    self.fetchData(self.onNewData.bind(self));
                }, self.config.fetchInterval);
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