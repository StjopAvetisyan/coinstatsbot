
const {getSimple,getTradesFromJSON} = require('./helpers/req');
const {Telegraf,session,Stage} = require('telegraf');
const SceneGenerator = require('./helpers/scenes');
const {toggleAlertForChat} = require('./helpers/alerts');
const rateLimit = require('telegraf-ratelimit');
const  bot = new Telegraf(process.env.BOTTOKEN);
const { Keyboard, Key } = require('telegram-keyboard');


const  initStages=  function ()
    {
        const curScene = new SceneGenerator();
        return   new Stage([
            curScene.alertScene,
            curScene.pairNameScene,
            curScene.alertUpDownScene,
            curScene.pairPriceScene,
            curScene.balanceScene,
            curScene.apiKeyScene,
            curScene.apiSecretScene,
        ]);
    };
const initBot = function (bot)
    {

        const limitConfig = {
            window: 3000,
            limit: 1,
            onLimitExceeded: (ctx, next) => ctx.reply('Rate limit exceeded')
        };

        bot.use(Telegraf.log());
        bot.catch((err, ctx) => {
            console.log(`Ooops, encountered an error for ${ctx.updateType}`, err);
            ctx.reply(err.responseText || 'Something went wrong')
        });
        bot.use(session());
        bot.use(initStages().middleware());
        bot.use(rateLimit(limitConfig));



        addBotCommands(bot);

    };
   const addBotCommands = function (bot)
    {
        bot.start(async (ctx) =>
        {  await ctx.reply('Welcome to bot');
            const keyboard = Keyboard.make([ '/exchangeInfo','/balance','/setAlert','/toggleAlerts'], {
                columns:2
            }).reply();
            await ctx.reply('Please choose one of Actions',keyboard)

        });

        bot.command('setAlert', (ctx) => {
            ctx.scene.enter('alerts')
        });
        bot.command('toggleAlerts',   (ctx) => {
           let alertsIsOn =  toggleAlertForChat(ctx.message.chat.id);
            ctx.reply(!alertsIsOn? "Your Alerts is on" : "Your Alerts is off");
        });
        bot.command('exchangeInfo',  async (ctx) => {
            // ctx.scene.enter('alerts')
            await getSimple("/api/v3/ticker/price", null, function (data) {
                ctx.reply(getTradesFromJSON(data.slice(0,10)));
            });
        });
        bot.command('balance',   (ctx) => {
            ctx.scene.enter('balance')
        });
        bot.on('callback_query', async  (ctx) => {
            if(ctx.callbackQuery.data ==='alerts')
            {
                return  await ctx.reply('dalerts')
            }

        });
    };

const launchBot = function (bot)
    {
        initBot(bot);
          bot.launch();
    };


module.exports = {
    launchBot,
    bot
};
