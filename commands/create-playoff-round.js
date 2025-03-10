require('dotenv').config()
const path = require('path');
const date = require('date-and-time');
const outputHelper = require('../helpers/outputHelper');
const mongoHelper = require('../helpers/mongoHelper');
const { PermissionHelper } = require('../helpers/permissionHelper');

module.exports = {
  commandName: path.basename(__filename).split('.')[0],
  slash: true,
  testOnly: true,
  guildOnly: true,
  hidden: true,
  description: 'Creates a new playoff round',
  roles: [process.env.BOT_CONTEST_ADMIN_ROLE_NAME],
  channels: [process.env.COMPETITION_CHANNEL_NAME],
  minArgs: 2,
  expectedArgs: '<roundName> <gameList>',
  callback: async ({ args, client, channel, interaction, instance }) => {
    const [roundName, games] = args;
    let permissionHelper = new PermissionHelper();
    let retVal;

    // Check if the User has a valid Role
    retVal = await permissionHelper.hasRole(client, interaction, module.exports.roles, module.exports.commandName);
    if (retVal) {interaction.reply({content: retVal, ephemeral: true}); return;}

    // Check if the Channel is valid
    retVal = await permissionHelper.isValidChannel(module.exports.channels, interaction, module.exports.commandName);
    if (retVal) {interaction.reply({content: retVal, ephemeral: true}); return;}

    try {
      const currentSeason = await mongoHelper.findOne({ channelName: channel.name, isArchived: false }, 'seasons');
      await mongoHelper.updateOne({ seasonNumber: parseInt(currentSeason.seasonNumber), isArchived: false }, { $set: { isArchived: true } }, null, 'rounds');

      let round = {
        'channelName' : channel.name,
        'seasonNumber' : parseInt(currentSeason.seasonNumber),
        'roundName' : roundName,
        'games' : games.split(',').map(x => parseInt(x)),
        'isArchived' : false
      }

      await mongoHelper.insertOne(round, 'rounds');

      return "New playoff round created successfully."
    } catch(e) {
      logger.error(e);
      interaction.reply({content: e.message, ephemeral: false});
    }
  },
}
 