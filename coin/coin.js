var socket = require('socket.io');

var players = new Array();
var started = false;
var clients = 0;
var gameLength = 1;
game = function(socket) {
    console.log('A new connection has been created');
    var toSend = {};
    if (started && clients > 0) // if a game is in progress, tell this person!
    {
      toSend["status"] = "started";
      socket.emit('coin-sendStatus', toSend);
    }
    clients++;
    toSend = {};
    toSend["players"] = players;
    console.log(toSend);
    socket.emit('coin-playerListUpdate', toSend);
    socket.broadcast.emit('coin-playerListUpdate', toSend);
    
    socket.on('coin-disconnect', function(data) {
      clients--;
      console.log("disconnect, clients: " + clients);
      if (clients == 0)
      {
        cards = {};
        players = new Array();
        started = false;
      }
    });
    
    socket.on('coin-requestPlayers', function(){
      var toSend = {};
      toSend["players"] = players;
      console.log(toSend);
      socket.emit('coin-playerListUpdate', toSend);
      socket.broadcast.emit('coin-playerListUpdate', toSend);
    });
    
    socket.on('coin-join', function (name, choice, bet) {
    console.log('I am the Join function!');

    players.push({"name":name, "choice":choice, "bet":bet});
    //wrap in another layer to format it as a type for interactions.js
    var toSend = {};
    toSend["players"] = players;
    console.log(toSend);
    socket.emit('coin-playerListUpdate', toSend);
    socket.broadcast.emit('coin-playerListUpdate', toSend);
    });
    
    socket.on('coin-new', function () {
    console.log('I am the new game function!');
      started = false;
      //reset the players!
      //players = new Array();
    
      //tell other clients that a new game is being prepared
      var toSend = {};
      toSend["status"] = "new";  
      socket.emit('coin-playerListUpdate', toSend);
      socket.broadcast.emit('coin-playerListUpdate', toSend);
    
      //reset everyone's player lists
      toSend = {};
      toSend["players"] = players;
      console.log(toSend);
      socket.emit('coin-playerListUpdate', toSend);
      socket.broadcast.emit('coin-playerListUpdate', toSend);
    });
    
    socket.on('coin-startGame', function () {
      started = true;
      console.log('I am the Start Game function!');
      var status = {};
      status["status"] = "start";
      console.log(status);
      socket.emit('coin-sendStatus', status); 
      socket.broadcast.emit('coin-sendStatus', status); 
      
      //Begin game logic
      var coin = {0:0, 1:0};
      
      //send initial states
      socket.emit('coin-partialBoardUpdate', {"coin":coin});
      socket.broadcast.emit('coin-partialBoardUpdate', {"coin":coin});      
      
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
        socket.emit('coin-partialBoardUpdate', {"coin":coin});
        socket.broadcast.emit('coin-partialBoardUpdate', {"coin":coin});      
      
        //check for end game conditions
        for (var j = 0; j<Object.keys(coin).length; j++)
          if (coin[Object.keys(coin)[j]] >= gameLength)
            finished=true;
      } //end while
      
      //send winner (last card incremented)
      console.log({"winner":curFlip});
      socket.emit('coin-winner', {"winner":curFlip});
      socket.broadcast.emit('coin-winner', {"winner":curFlip}); 
      
      //reset everyone's board
      var coin = {0:0, 1:0};
      socket.emit('coin-partialBoardUpdate', {"coin":coin});
      socket.broadcast.emit('coin-partialBoardUpdate', {"coin":coin});      
      
      
    }); //end 'start game'
    
    socket.on('coin-chatMsg', function (data) {
      var msg = data["msg"];
      
      socket.emit('coin-chatMsg', {"msg":msg});
      socket.broadcast.emit('coin-chatMsg', {"msg":msg});
    });
  };


exports.game = game;

exports.joinGame = function(name, side, bet) {
  players.push({name: name, choice: side, bet: bet});
}