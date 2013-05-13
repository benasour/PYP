var socket = require('socket.io');
var request = require('request');

var curRoom = 0;

// Suggestion: Change these vars to arrays to have a full instance per room.
var players = new Array();
var lastPlayer = {};
var started = false;
var clients = 0;
var gameLength = 1;
var idsToNames = {};

game = function(socket, io) {
    idsToNames[socket.id] = lastPlayer.name;
    var toSend = {};
    if (started && clients > 0) // if a game is in progress, tell this person!
    {
      // New Game -- clear all existing instance variables
      
      players = new Array(); 
      players.push(lastPlayer); //due to order server goes in
      clients = 0;
      started = false;
      curRoom++;
    }
    socket.join('coin-' + curRoom);
    socket.emit('coin-room', {"room":curRoom});
    clients++;
    toSend = {};
    toSend["players"] = players;
    console.log("room coin-" + curRoom + ": " + JSON.stringify(toSend));
    io.sockets.in('coin-'+curRoom).emit('coin-playerListUpdate', toSend);
    
    socket.on('disconnect', function(data) {
      clients--;
      console.log("disconnect, clients: " + clients);
      if (clients == 0)
      {
        curRoom = 0;
        cards = {};
        players = new Array();
        started = false;
      }
    });
    
    socket.on('coin-leave', function(data) {
      
      
      
      var rooms = io.sockets.manager.roomClients[socket.id];
      idsToNames[socket.id] = "";
      for (room in rooms)
      {
        if (room != '/ ' && room != '')
        {
          room = room.substring(1, room.length); //get rid of the '/'
          socket.leave(room);
          var clients = io.sockets.clients(room);
            
          var names = new Array();
          for (var i = 0; i< clients.length; i++)
          {
            if (idsToNames[clients[i].id] != "")
            {
              //console.log("pushing: " + idsToNames[clients[i].id]);
              names.push(idsToNames[clients[i].id]);
            }
          }
          var toSend = {"names": names};
          io.sockets.in(room).emit('coin-chatNameUpdate', toSend);
        }
      }
    });
    
    socket.on('coin-requestPlayers', function(){
      var toSend = {};
      toSend["players"] = players;
      console.log(toSend);
      io.sockets.in('coin-'+curRoom).emit('coin-playerListUpdate', toSend);;
    });
    
    socket.on('coin-join', function (name, choice, bet) {
      console.log('I am the Join function!');

      players.push({"name":name, "choice":choice, "bet":bet});
      //wrap in another layer to format it as a type for interactions.js
      var toSend = {};
      toSend["players"] = players;
      console.log(toSend);
      io.sockets.in('coin-'+curRoom).emit('coin-playerListUpdate', toSend);
    });
    
    socket.on('coin-startGame', function () {
      started = true;
      console.log('I am the Start Game function!');
      var status = {};
      status["status"] = "start";
      console.log(status);
      io.sockets.in('coin-'+curRoom).emit('coin-start', status);  
      
      //Begin game logic
      var coin = {0:0, 1:0};
      
      //send initial states
      io.sockets.in('coin-'+curRoom).emit('coin-partialBoardUpdate', {"coin":coin});
      
      finished = false;
      var curFlip;
      
      //loop through game operations until full game sequence has been sent
      while (!finished)
      {
        var rnd = Math.floor(Math.random()*2);
        coin[Object.keys(coin)[rnd]]++;
        curFlip=rnd;
        
        //tell client to increment this result
        console.log("incrementing: " + JSON.stringify({"coin":rnd}));
        io.sockets.in('coin-'+curRoom).emit('coin-partialBoardUpdate', {"coin":coin});
        
        //check for end game conditions
        for (var j = 0; j<Object.keys(coin).length; j++)
          if (coin[Object.keys(coin)[j]] >= gameLength)
            finished=true;
      }
      
      //send winner (last card incremented)
      console.log({"winner":curFlip});
      io.sockets.in('coin-'+curRoom).emit('coin-winner', {"winner":curFlip});

      // Change each player's bet to negative if they didn't guess right and
      // call rest service to save results on PYP Profile App
      for (var i = 0; i < players.length; i++) {
        var player = players[i];
        if (choiceToInt(player.choice) != curFlip) {
          player.bet = -player.bet;
        }

        var pypBaseUrl = process.env.PYP_BASE_URL || "http://localhost:62438/";
        request.post(pypBaseUrl + 'api/history', {form: {GameName: "Coin", UserName: player.name, Score: player.bet}});
      }
    });
    
    socket.on('coin-chatMsg', function (data) {
      var msg = data["msg"];
      var room = data["room"];
      io.sockets.in(room).emit('coin-chatMsg', {"msg": msg});
    });
  };


exports.game = game;

exports.joinGame = function(name, side, bet) {
lastPlayer = {name: name, choice: side, bet: bet}
  players.push(lastPlayer);
}

function choiceToInt(sideChoice) {
  return sideChoice == "Heads" ? 0 : 1;
}
