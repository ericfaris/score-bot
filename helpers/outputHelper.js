require('dotenv').config()
var Table = require('easy-table')
var numeral = require('numeral');
const { MessageEmbed } = require('discord.js');
const { string } = require('easy-table');

module.exports = {

    createTableRow: (i, t, score, expandedLayout) => {
        t.cell('Rank', i, Table.leftPadder(' '))
        t.cell('User', score.username, Table.rightPadder(' '))
        t.cell('Score', score.score, (val, width) => {
          var str = numeral(val).format('0,0');
          return width ? Table.padLeft(str, width) : str;
        })
        if(expandedLayout) {
          t.cell('+/- Last Score', score.diff, (val, width) => {
            var str = numeral(val).format('0,0');
            return width ? Table.padLeft('(' + (val > 0 ? '+' : '') + str + ')', width) : '(' + (val > 0 ? '+' : '') + str + ')';
          })
          t.cell('Posted', score.posted)
        }
        t.newRow()
    },

    createTableRowTeam: (i, t, team, expandedLayout) => {
      t.cell('Rank', i, Table.leftPadder(' '))
      t.cell('Team', team.teamName, Table.rightPadder(' '))
      t.cell('Score', team.totalScore, (val, width) => {
        var str = numeral(val).format('0,0');
        return width ? Table.padLeft(str, width) : str;
      })
      t.newRow()
    },

    createTableRowSeason: (i, t, player, expandedLayout) => {
      t.cell('Rank', i, Table.leftPadder(' '))
      t.cell('User', player.username, Table.rightPadder(' '))
      t.cell('Points', player.points, (val, width) => {
        var str = numeral(val).format('0,0');
        return width ? Table.padLeft(str, width) : str;
      })
      if(expandedLayout) {
        t.cell('Score', player.score, (val, width) => {
          var str = numeral(val).format('0,0');
          return width ? Table.padLeft(str, width) : str;
        })
      }
      t.newRow()
  },

    printLeaderboard: (scores, numOfScoresToShow, expandedLayout) => {
      var strText = '**Leaderboard:**\n';

      var i = 0;
      var t = new Table;
  
      if(!numOfScoresToShow) {
        numOfScoresToShow = scores.length;
      }
  
      scores.forEach(function (score) {
        i++
        if (i < numOfScoresToShow + 1) {
          module.exports.createTableRow(i, t, score, expandedLayout);
        }
      })
  
      strText += '`' + t.toString() + '`';

      return strText;
    },

    printSeasonLeaderboard: (weeks, numOfScoresToShow, expandedLayout) => {
      var strText;
      let tableArray = [];

      if (weeks.length === 0) {
        return '**NO SEASON LEADERBOARD CURRENTLY POSTED**\n';
      }

      strText = '**Season Leaderboard:**\n';
      leaderboard = []
      var i = 1;
      var t = new Table;
   
      weeks.forEach(function (week) {
        if(week.scores) {
          scores = JSON.parse(week.scores);
          scores.forEach( function(score) {
            player = leaderboard.find(x => x.username === score.username);
            if(player) {
              player.points += parseInt(score.points);
              player.score += parseInt(score.score);
            } else {
              leaderboard.push({"username": score.username, "score": score.score, "points": parseInt(score.points)})
            }
          })
        }
      })
  
      // sort descending
      leaderboard.sort((a, b) => {
        if(a.points === b.points) {
          return (a.score > b.score) ? -1 : (a.score < b.score) ? 1 : 0;
        } else {
          return (a.points < b.points) ? 1 : -1;
        }
      });

      if(numOfScoresToShow) {
        while(i <= numOfScoresToShow) {
          module.exports.createTableRowSeason(i, t, leaderboard[i], expandedLayout);
          i++;
        };
      } else {
        leaderboard.forEach( function(player) {
          module.exports.createTableRowSeason(i, t, player, expandedLayout);
          i++;
        })  
      }

      strText += '`' + t.toString() + '`';
      tableArray = module.exports.splitPosts(leaderboard, strText, 30);

      return tableArray;
  },

    printTeamSummary: (teams, scores) => {
      var strText = '**Team Summary:**\n';
      
      module.exports.calculateTeamTotals(teams, scores)

      // sort descending
      teams.sort((a, b) => (a.totalScore < b.totalScore) ? 1 : -1);

      var i = 0;
      var t = new Table;
      teams.forEach(function (team) {
        i++
        module.exports.createTableRowTeam(i, t, team);
      })

      strText += '`' + t.toString() + '`';
    
      return strText;
    },

    printTeamLeaderboard: (scores, teams, expandedLayout) => {

      var strText = '**Team Leaderboard**:\n\n';

      teams.forEach((team) => {
        const teamMembersScores = [];
        team.members.forEach((member) => {
          const foundMember = scores.find(x => x.username === member);
          if (foundMember) {
            teamMembersScores.push(foundMember);
          } else {
            teamMembersScores.push(
              {
                'username': member,
                'score': 0,
                'posted': ''
              });
          }
        })

        // sort descending
        teamMembersScores.sort((a, b) => (a.score < b.score) ? 1 : -1);

        var i = 0;
        var t = new Table;

        strText += '**Team:** ' + team.teamName + '\n';
        teamMembersScores.forEach(function (score) {
          i++
          module.exports.createTableRow(i, t, score, expandedLayout);
        })
    
        t.total('Score', {
          printer: function (val, width) {
            var str = 'Total: ' + numeral(val).format('0,0');
            return width ? Table.padLeft(str, width) : str;
          }
        });
        
        strText += '`' + t.toString() + '`\n';
      });

      return strText;
    },

    printCombinedLeaderboard: (scores, numOfScoresToShow, teams, showTeamDetails, expandedLayout) => {
      let textTableAsString = '\n';
      let tableArray = [];

      if (scores.length === 0) {
        return '**NO SCORES CURRENTLY POSTED**\n';
      } else {    
        if(teams && teams.length > 0) {
          textTableAsString += module.exports.printTeamSummary(teams, scores) + '\n';
          if(showTeamDetails) {   
            textTableAsString += module.exports.printTeamLeaderboard(scores, teams, expandedLayout) + '\n';
          }
        }

        textTableAsString += module.exports.printLeaderboard(scores, null, expandedLayout) + '\n';
        tableArray = module.exports.splitPosts(scores, textTableAsString, 40);

        return tableArray;
      }
    },

    splitPosts: (records, textTableAsString, numOfScoresToShow) => {
      var startIndex = 0;
      var scoresProcessed = 0;
      var padding = 0;
      var i = 0;
      var endIndex = 0;
      let tableArray = [];

      while(records.length > scoresProcessed) {
        if(i > 0) {
          textTableAsString = textTableAsString.substr(startIndex);
        }
        endIndex = textTableAsString.search(" " + (numOfScoresToShow + scoresProcessed + 1) + " ") != -1 ? textTableAsString.search(" " + (numOfScoresToShow + scoresProcessed + 1) + " ") : textTableAsString.length;
        var lastLineBreakIndex = textTableAsString.substr(endIndex - 8, endIndex).search('\n', startIndex) + (endIndex - 8);

        var post = textTableAsString.substr(0, endIndex + 1 - padding)
        if(scoresProcessed == 0) {
          post = post + '`';
        } else {
          post = '`' + new Array(padding + 1).join(' ') + post.replace('`', '') + '`';
        }
        scoresProcessed += numOfScoresToShow;
        padding = textTableAsString.substring(lastLineBreakIndex + 1, endIndex).length;

        startIndex = endIndex + 1;
        endIndex = textTableAsString.search(" " + (scoresProcessed + 1) + " ") != -1 ? textTableAsString.search(" " + (scoresProcessed + 1) + " ") : textTableAsString.length;
        tableArray.push(post);
        i++;
      }
  
      return tableArray;  
    },

    calculateTeamTotals: (teams, scores) => {
      teams.forEach((team) => {

        const teamMembersScores = [];
        team.members.forEach((member) => {
          const foundMember = scores.find(x => x.username === member);
          if (foundMember) {
            teamMembersScores.push(foundMember);
          } else {
            teamMembersScores.push(
              {
                'username': member,
                'score': 0,
                'posted': ''
              });
          }
        })

        // sort descending
        teamMembersScores.sort((a, b) => (a.score < b.score) ? 1 : -1);
        team.totalScore = teamMembersScores.reduce((a, b) => a + (b['score'] || 0), 0);
      })
    },
  
    createEmbed: (title, description, color, fields) => {
      const embed = new MessageEmbed()
        .setColor(color)
        .setTitle(title)
        .setDescription(description)

      fields.forEach(field => {
        embed.addField(field.key, field.value)
      });  

      embed.setFooter();

      return embed;
    },

    editWeeklyCompetitionCornerMessage: async(scores, client, details, teams) => { 
      const channel = await client.channels.fetch(process.env.COMPETITION_CHANNEL_ID);
      const message = await channel.messages.fetch(process.env.COMPETITION_WEEKLY_POST_ID);
  
      message.edit(module.exports.generateWeeklyBoilerPlateText(
        scores, teams, details.week, details.periodStart, details.periodEnd, 
        details.table, details.tableUrl, details.romUrl, details.notes));
      message.suppressEmbeds(true);
    },
  
    generateWeeklyBoilerPlateText: (scores, teams, week, periodStart, periodEnd, table, tableUrl, romUrl, notes) => {
      var bp = '\n\n';
  
      bp += '**WEEKLY LEADERBOARD**\n\n';
      bp += '**Week:** ' + week + '\n';
      bp += '**Dates:** ' + periodStart + " - " + periodEnd + '\n';
      bp += '\n';
      bp += '**Current Table:** ' + table + "\n";
      bp += '**Table Url:** ' + tableUrl + "\n";
      bp += '**Rom Url:** ' + romUrl + "\n";
      bp += '**Notes:** ' + notes + "\n\n";
      bp += module.exports.printCombinedLeaderboard(scores, 40, teams, false, false);
      bp += '** \* Only the Top 40 scores will displayed due to Discord character limitations.  Please use the "/show-leaderboard" command for full results.**\n';
      bp += '\n';
      bp += '**All Current & Historical Results:**\n';
      bp += 'https://www.iscored.info/?mode=public&user=ED209 \n';
  
      return bp;
    },

    editSeasonCompetitionCornerMessage: async(season, weeks, client) => { 
      const channel = await client.channels.fetch(process.env.COMPETITION_CHANNEL_ID);
      const message = await channel.messages.fetch(process.env.COMPETITION_SEASON_POST_ID);
  
      message.edit(module.exports.generateSeasonBoilerPlateText(season, weeks));
      message.suppressEmbeds(true);
    },
  
    generateSeasonBoilerPlateText: (season, weeks) => {
      var bp = '\n\n';
  
      bp += '**SEASON LEADERBOARD**\n\n';
      bp += '**Name:** ' + season.storage.description + '\n';
      bp += '**Dates:** ' + season.storage.period + '\n';
      bp += '\n';
      bp += module.exports.printSeasonLeaderboard(weeks, 40, false);
      bp += '\n';
      bp += '** \* Only the Top 40 positions will displayed due to Discord character limitations.  Please use the "/show-season-leaderboard" command for full results.**\n';
  
      return bp;
    },

}
