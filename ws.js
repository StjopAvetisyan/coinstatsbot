const WebSocket = require('ws');
const ws = new WebSocket('wss://stream.binance.com:9443/ws/!miniTicker@arr@3000ms');

const {processAlerts} = require('./helpers/alerts');


module.exports = function (bot) {

        ws.on('message',  function incoming(data) {

                processAlerts(data,bot)
        });
}