require('dotenv').config()
const Logger = require('../helpers/loggingHelper');
const path = require('path');
const responseHelper = require('../helpers/responseHelper');
const { PermissionHelper } = require('../helpers/permissionHelper');
const { VPCDataService } = require('../services/vpcDataService')
const { ArgHelper } = require('../helpers/argHelper');

BigInt.prototype.toJSON = function () {
  return this.toString();
};

module.exports = {
  commandName: path.basename(__filename).split('.')[0],
  slash: true,
  testOnly: true,
  guildOnly: true,
  hidden: true,
  description: 'Search table high scores.',
  channels: [process.env.HIGH_SCORES_CHANNEL_NAME],
  minArgs: 1,
  expectedArgs: '<tablesearchterm> <vpsid> <isephemeral>',
  callback: async ({ args, channel, interaction, instance, message, user }) => {
    let retVal;
    const logger = (new Logger(user)).logger;
    const vpcDataService = new VPCDataService();
    const permissionHelper = new PermissionHelper();
    const argHelper = new ArgHelper();

    try{
      const tableSearchTerm = argHelper.getArg(interaction?.options?.data, 'string', 'tablesearchterm');
      const vpsId = argHelper.getArg(interaction?.options?.data, 'string', 'vpsid');
      const isEphemeral = argHelper.getArg(interaction?.options?.data, 'bool', 'isephemeral');
      let tables = null;

      if(tableSearchTerm) {
        tables = await vpcDataService.getScoresByTableAndAuthorUsingFuzzyTableSearch(tableSearchTerm);
      }

      if(vpsId) {
        tables = await vpcDataService.getScoresByVpsId(vpsId);
      }
      
      interaction.channel = channel; 
      logger.info('show-table-high-score: interaction: ' + JSON.stringify(interaction));
      responseHelper.showHighScoreTables(tables, tableSearchTerm ?? vpsId, interaction, isEphemeral ?? true)
    } catch(e) {
      logger.error(e);
      interaction.reply({content: e.message, ephemeral: true});
    }
  },
}