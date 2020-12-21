const Scene = require('telegraf/scenes/base');
const {addAlert} = require('./alerts');
const {getSigned} = require('./req');
const { Keyboard, Key } = require('telegram-keyboard');
const { callback } = Key;

class SceneGenerator {
    alertScene;
    pairNameScene;
    pairPriceScene;
    alertUpDownScene;
    balanceScene;
    apiKeyScene  ;
    apiSecretScene;
    overallAlertData = {};
    overallBalanceData = {};

    genAlertsScene() {
        const alertScene = new Scene('alerts');
        alertScene.enter(async (ctx) => {
            this.overallAlertData.chatId = ctx.message.chat.id;
            await ctx.reply("HI you are going to create alert for pairs");
            await ctx.scene.enter('alert-pair-name');
        });
        return alertScene;
    }
    genPairNameScene() {
        const pairNameScene = new Scene('alert-pair-name');
        pairNameScene.enter(async (ctx) => {
            await ctx.reply("Please enter  name of pair");
        });
        pairNameScene.on('text', async (ctx) => {
            this.overallAlertData.name = ctx.message.text.toUpperCase();
            await ctx.reply(`Thanks you entered ${ this.overallAlertData.name}`)
            await ctx.scene.enter('alert-up-down')
        });
        pairNameScene.on('message', async (ctx) => {
            await ctx.reply(`Pleas only pair name`);
            await ctx.scene.reenter();
        });
        return pairNameScene
    }

    genAlertUpDown() {
        const pairUpDownScene = new Scene('alert-up-down');
        pairUpDownScene.enter(({reply}) => {
            const keyboard = Keyboard.make([
                [callback('UP', 'true')],
                [callback('DOWN', 'false')],
            ]).inline();
            return reply("Please enter up or down  for alert", keyboard)
        });
        pairUpDownScene.on('callback_query', async (ctx) => {
            this.overallAlertData.isUp = ctx.callbackQuery.data === 'true';
            await ctx.scene.enter('alert-price')
        });

        pairUpDownScene.on('message', async (ctx) => {
            await ctx.reply(`Pleas use only keyboard`);
            await ctx.scene.reenter();
        });
        return pairUpDownScene
    }
    genAlertPriceScene() {
        const pairPriceScene = new Scene('alert-price');
        pairPriceScene.enter(async (ctx) => {
            await ctx.reply("Please enter price for alert");

        });
        pairPriceScene.on('text', async (ctx) => {
            this.overallAlertData.price = ctx.message.text;
            if (Number(this.overallAlertData.price )) {

                addAlert( this.overallAlertData );

                let text = `Thanks ! Your alert created for ${this.overallAlertData.name} on  ${this.overallAlertData.isUp? ' UP ':' DOWN ' } of this price ${this.overallAlertData.price}`;
                await ctx.reply(text);
                await ctx.scene.leave();
            } else {
                await ctx.reply(`Pleas only number`)
            }

        });
        pairPriceScene.on('message', async (ctx) => {
            await ctx.reply(`Pleas only number`);
            await ctx.scene.reenter();
        });
        return pairPriceScene
    }

    genBalanceScene() {
        const balanceScene = new Scene('balance');
        balanceScene.enter(async (ctx) => {
            this.overallBalanceData.chatid = ctx.message.chat.id;
            await ctx.reply("Help me to get our balance");
            await ctx.scene.enter('apiKey');
        });
        return balanceScene;
    }
    genAPIKeyScene() {
        const apiKeyScene = new Scene('apiKey');
        apiKeyScene.enter(async (ctx) => {
            await ctx.reply("Give me your api key")
        });
        apiKeyScene.on('text', async (ctx) => {
            if(ctx.message.text.startsWith('/') ){
                await ctx.reply(`Do Not play With me`);
                await ctx.reply(`Please only API KEY`);
                await ctx.scene.reenter();
            }
            else {
                this.overallBalanceData.apiKey = ctx.message.text;
                await ctx.reply(`Thanks  for API KEY`);
                await ctx.scene.enter('apiSecret')
            }
        });
        return apiKeyScene
    }
    genAPISecretScene() {
        const apiSecretScene = new Scene('apiSecret');
        apiSecretScene.enter(async (ctx) => {
            await ctx.reply("Give me your api secret")
        });
        apiSecretScene.on('text', async (ctx) => {
            if(ctx.message.text.startsWith('/') ){
                await ctx.reply(`Do Not play With me`)
                await ctx.reply(`Please only API Secret`)
                await ctx.scene.reenter();
            }
            else {
                this.overallBalanceData.apiSecret = ctx.message.text;
                await ctx.reply(`Thanks  for API Secret`);
                let opts = {
                    data: {timestamp: Date.now(), recvWindow: 20000},
                    env: {key: this.overallBalanceData.apiKey, secret: this.overallBalanceData.apiSecret}
                };
                getSigned("/api/v3/account", opts, function (data) {
                    if(data.code)                {
                        ctx.reply("Something went wrong \nTry Again");
                        ctx.scene.leave()
                    }
                    else {
                        let balances = data.balances;
                        if (balances && balances.length>0)
                        {
                            let reply = balances.map(obj=>`\n ${obj.asset} \n  = Free - ${obj.free}  \n = Locked - ${obj.locked}  `).toString()
                            ctx.reply(reply);
                        }
                        else
                        {
                            ctx.reply(`Sorry. You have no balances`)
                        }
                    }
                });
                await  ctx.scene.leave()
            }
        });
        apiSecretScene.on('message', async (ctx) => {
            await ctx.reply(`Please only API Secret`);
            await ctx.scene.reenter();
        });
        return apiSecretScene;
    }


    constructor() {
        this.pairNameScene = this.genPairNameScene();
        this.alertScene = this.genAlertsScene();
        this.alertUpDownScene = this.genAlertUpDown();
        this.pairPriceScene = this.genAlertPriceScene();

        this.balanceScene = this.genBalanceScene();
        this.apiKeyScene = this.genAPIKeyScene();
        this.apiSecretScene = this.genAPISecretScene();
    }

}

module.exports = SceneGenerator;
