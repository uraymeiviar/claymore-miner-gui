"result": [
  "9.2 - ETH",
  "6", //uptime in minutes
  "138579;14;0",////total eth hashrate, eth share,
  "27530;27657;27994;27630;27765",//individual hashrate eth
  "2328530;22;0",////total dcr hash, dcr share,
  "412962;497841;503893;497346;416488", //individual hashrate dec
  "72;100;71;100;67;100;68;100;73;100", //temp, fan
  "asia1.ethpool.org:3333;dcr.suprnova.cc:3252",//ethpool; dcr pool
  "0;0;0;0" //incorrecy eth, eth pool switch, incorrect dcr, dcr pool switch
 ]

 "Name" - miner name.
"IP:port" - miner IP and port for remote management.
"Running time" - miner running time, also number of miner restarts.
"Ethereum Stats" - current miner speed for Ethereum, number of accepted shares, 
number of rejected shares, number of incorrectly calculated shares, rejected/accepted ratio.
"Decred Stats: - same statistics for Decred.
"GPU Temperature" - GPU temperatures and fans speed.
"Pool" - current Ethereum and Decred pools, number of failovers.
"Version" - miner version.
"Comments" - miner comments that you can set in the miner properties dialog.

accepted/rejected/incorrect (rejected/accepted) ratio

{" id":0,"jsonrpc": "2.0","method":" miner_getstat1"}
{" id":0,"jsonrpc": "2.0","method":" miner_reboot"}
{" id":0,"jsonrpc": "2.0","method":" miner_restart"}
{" id":0,"jsonrpc": "2.0","method":" miner_getfile"," params":["config.txt"]}
{" id":0,"jsonrpc": "2.0","method":" miner_file"," params":["epools.txt","..."]}