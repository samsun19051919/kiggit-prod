var util = require('util'),
	teams = require('../../model/teams.js');

var squad = function (data, cb) {
	//console.log(util.inspect(data, false, null));
	var updated = data.$.generatedAt;
	for(Sport of data.Sport) {
		for(Teams of Sport.Teams){
			for (Team of Teams.Team) {
				var team = {};
				team.gender = Team.$.gender;
				team.name = Team.$.name;
				team.id = Team.$.id;
				team.players = []
				if(typeof Team.Players !== 'undefined'){
				    for(Players of Team.Players){
				    	for(Player of Players.Player){
				    		team.players.push(Player.$.playerName);
				    	}
				    }
				    teams.updateTeam(team, cb);
				} else {
					cb();
				}
			}
		}
	}     
};
module.exports = squad;
