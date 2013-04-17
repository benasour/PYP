var express = require('express');
var http = require('http');
var socket = require('socket.io');
var express = require('express');
var jade = require('jade');
var mongoose = require('mongoose');

var app = express();
var server = http.createServer(app);
var io = socket.listen(server);

var horse = require('./horse/horse.js');

//heroku suggestion to use port 8080
var port = process.env.PORT || 8080;
server.listen(port);

//Models and db connection
var Game = require('./Models/game');
mongoose.connect(process.env.MONGOLAB_URI || 'mongodb://localhost/PYP');

var gameChoice;

//configuration settings for express and socket.io
//production environment only
io.configure('production', function () {
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 10);
  io.enable('browser client minification');
});

//development  environment only
app.configure('development', function() {
  app.locals.pretty = true;
});

//all environments
app.set('views', __dirname + '/UI');
app.set('view engine', 'jade');

//controller routes
app.get('/', function(req, res) {
  Game.find({}, function(err, games) {
    if (!err) {
      res.render('games', {games: games});
    }
  });
});

app.get('/games', function(req, res) {
  Game.find({}, function(err, games) {
    if (!err) {
      res.render('games', {games: games});
    }
  });
});

app.get('/horse', function(req, res) {
  gameChoice = '/horse/';
  app.set('views', __dirname + gameChoice + '/UI');
  res.render('index');
  //horse.myFn(io);
});


//look into using express.static
app.get('/style.css', function(req, res) {
  res.sendfile(__dirname + gameChoice + '/UI/style.css');
});

app.get('/connections.js', function(req, res) {
  res.sendfile(__dirname + gameChoice + '/UI/connections.js');
});

app.get('/interactions.js', function(req, res) {
  res.sendfile(__dirname + gameChoice + '/UI/interactions.js');
});
