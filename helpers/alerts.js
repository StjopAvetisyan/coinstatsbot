const chatAlerts = [
    // {
    //     chatId: 635569038, alerts: [
    //         {name: 'LTCBTC', isUp: false, price: '0.01471700'},
    //         {name: 'BNBBTC', isUp: true, price: '0.01134890'},
    //         {name: 'BNBBTC', isUp: true, price: '0.01134890'},
    //         {name: 'NEOBTC', isUp: true, price: '22940'},
    //         {name: 'BNTBTC', isUp: true, price: '22940'},
    //     ]
    // },
    {
        chatId: 635569038, alerts: [
            {name: 'LTCBTC', isUp: false, price: '0.01471700'},
            {name: 'BNBBTC', isUp: true, price: '0.01134890'},
            {name: 'NEOBTC', isUp: true, price: '22940'},
            {name: 'BNTBTC', isUp: true, price: '22940'},
        ],
        alertsOn:true

    },


];
const processAlerts = function (data, bot) {
    let filters = getAlertedPairs();
    if (filters) {
        if (filters.length > 0) {
            let datap = JSON.parse(data);
            filterArray(datap, filters)
                .map(obj => ({name: obj.s, current: obj.c})).forEach(obj => {
                chatAlerts.filter(f => f.alertsOn).forEach(user => {
                    let must = user.alerts.filter(
                        ua => ua.name === obj.name &&
                            (ua.isUp ? (obj.current > ua.price) : (obj.current < ua.price)));
                    if (must && must.length) {
                        must.forEach(m =>
                            notifyUser({chatId: user.chatId, name: m.name, current: obj.current}, bot));
                    }
                })
            });
        }
    }
};

const filterArray = (data, filter) => {
    return data.filter(obj => {
        if (filter.includes(obj.s)) {
            return obj
        }
    });
};
const notifyUser = function (data, bot) {
    bot.telegram.sendMessage(data.chatId, `Hey your ${data.name} is ${data.current}`)
};
const getAlertedPairs = function () {
    let result= [];
    chatAlerts.forEach(obj=> {
        let p=obj.alerts.map(alert=>alert.name);
        result = result.concat(p.filter((item) =>result.indexOf(item) < 0))
    });
    result  = [...new Set(result)];
    return result

};
const addAlert = function (chatId,alert) {
   let  user = chatAlerts.find(obj=>obj.chatId === chatId);
    if (user)
    {
        user.alerts.push(alert)
    }
    else chatAlerts.push( { chatId:chatId , alerts: [alert] })
};
const toggleAlertForChat = function (chatId) {
   chatAlerts.find(obj=>obj.chatId===chatId).alertsOn = !chatAlerts.find(obj=>obj.chatId===chatId).alertsOn;
 return !chatAlerts.find(obj=>obj.chatId===chatId).alertsOn;
};

module.exports = {
    addAlert,
    processAlerts,
    toggleAlertForChat
};
