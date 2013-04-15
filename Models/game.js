var mongoose = require('mongoose');

var gameSchema = mongoose.Schema({
  name:  String
});

//Add Game methos via gameSchema.methods.NAME = function() ...


var Game = mongoose.model('Game', gameSchema);

module.exports = Game;
