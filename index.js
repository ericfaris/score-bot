const DiscordJS = require('discord.js')
const WOKCommands = require('wokcommands')
const cron = require('node-cron');
const responseHelper = require('./helpers/responseHelper');
const path = require('path')
require('dotenv').config()

const client = new DiscordJS.Client()
const PRODUCTION = 'production';
const TEST = 'test';

console.log(`TEST_ONLY: ${process.env.TEST_ONLY}`);
console.log(`ENVIRONMENT: ${process.env.ENVIRONMENT}`);
console.log(`GUILD_ID: ${process.env.GUILD_ID}`);

client.on('ready', () => {
  if (process.env.ENVIRONMENT === this.PRODUCTION) {
    new WOKCommands(client, {
      commandsDir: path.join(__dirname, process.env.COMMANDS_DIR),
      showWarns: false,
      del: process.env.SECONDS_TO_DELETE_MESSAGE
    })
  } else {
    new WOKCommands(client, {
      commandsDir: path.join(__dirname, process.env.COMMANDS_DIR),
      testServers: [process.env.GUILD_ID],
      showWarns: false,
      del: process.env.SECONDS_TO_DELETE_MESSAGE
    })
  }
})

client.login(process.env.BOT_TOKEN)

//post JSON files to data-backup channel
cron.schedule('15 0 * * *', function() {
  responseHelper.postJsonDataFiles(client);
});