require('dotenv').config()
const path = require('path');
const Table = require('easy-table')
const permissionHelper = require('../helpers/permissionHelper');
const mongoHelper = require('../helpers/mongoHelper');

module.exports = {
  commandName: path.basename(__filename).split('.')[0],
  slash: true,
  testOnly: true,
  guildOnly: true,
  hidden: true,
  description: 'Create teams for Competition Corner (MANAGE_GUILD)',
  permissions: ['MANAGE_GUILD'],
  roles: ['Competition Corner Mod'],
  minArgs: 1,
  expectedArgs: '<team>',
  callback: async ({ args, channel, interaction, client, instance }) => {
    let retVal;
    let ephemeral = false

    if (!(await permissionHelper.hasRole(client, interaction, module.exports.roles))) {
      console.log(`${interaction.member.user.username} DOES NOT have the correct role or permission to run ${module.exports.commandName}.`)
      retVal = `The ${module.exports.commandName} slash command can only be executed by an admin.`;
      ephemeral = true;
    }else if (channel.name !== process.env.COMPETITION_CHANNEL_NAME) {
      retVal = `The ${module.exports.commandName} slash command can only be used in the <#${process.env.COMPETITION_CHANNEL_ID}> channel.`;
      ephemeral = true;
    } else {

      const t = new Table;
      const [team] = args || {};

      const teamName = team.substring(0, team.indexOf(":"));
      const members = team.substring(team.indexOf(":") + 1).split(",");

      const existingTeam = await mongoHelper.findOne({ channelName: channel.name, isArchived: false, 'teams.name': teamName }, 'weeks');

      // update or add teams
      if (existingTeam) {
        existingTeam.members = team.members;
        await mongoHelper.updateOne({ channelName: channel.name, isArchived: false, 'teams.name': teamName }, { $push: { 'teams': existingTeam } }, null, 'weeks');
      } else {
        const newTeam = new Object();
        newTeam.name = teamName;
        newTeam.members = members;
        await mongoHelper.updateOne({ channelName: channel.name, isArchived: false }, { $push: { 'teams': newTeam } }, null, 'weeks');
      }

      // create text table
      var i = 0;
      members.forEach(function (member) {
        t.cell(teamName, member)
        t.newRow()
      })

      // return text table string
      retVal = 'Team created successfully. \n\n' + t.toString();
    }

    interaction.reply({content: retVal, ephemeral: ephemeral});
  },
}