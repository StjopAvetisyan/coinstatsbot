const crypto = require('crypto');
const https = require('https');
const qus = require('qs');

const getSignature = function (string, secret) {
    return crypto.createHmac('SHA256', secret).update(string).digest('hex')
};

const getSigned = function (url, obj, callback) {
    const dataQueryString = qus.stringify(obj.data);
    const signature = getSignature(dataQueryString, obj.env.secret);
    let options = {
        host: process.env.BINACE_BASE_URL,
        headers: {"X-MBX-APIKEY": obj.env.key},
        path: url + '?' + dataQueryString + '&signature=' + signature
    };

    return req(options, callback)
};

const getSimple = function (url, obj, callback) {
    const dataQueryString = qus.stringify(obj);

    let options = {
        host: process.env.BINACE_BASE_URL,
        headers: {"X-MBX-APIKEY": process.env.BKEY},
        path: url + '?' + dataQueryString
    };
    return req(options, callback)

};
const req = function (options, callback) {
    return https.get(options, (resp) => {
        let data = '';
        resp.on('data', (chunk) => {
            data += chunk;
        });
        resp.on('end', () => {
            callback(JSON.parse(data))
        });
    }).on("error", (err) => {
        callback({err: "Error: " + err.message});
    });
};

const  getTradesFromJSON = function(arr)
{
    return arr.map(obj=>'\n' +[obj.symbol.slice(0,3),'/'+obj.symbol.slice(3)].join('') + ' - ' + obj.price).toString()
};



module.exports = {
    getSigned,
    getSimple,
    getTradesFromJSON
};
