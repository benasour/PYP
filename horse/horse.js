var socket = require('socket.io');

var curRoom = 1;
var players = new Array();
var lastPlayer = {};
var started = false;
var clients = 0;
var trackLength = 8;
game = function(socket, io) {
    console.log('A new connection has been created'); 
    var toSend = {};
    if (started && clients > 0) // if a game is in progress, tell this person!
    {
      //new game instance, new player set 
      //(doesn't get sent after game start so this won't affect previous clients)
      players = new Array(); 
      players.push(lastPlayer); //due to order server goes in
      clients = 0;
      started = false;
      curRoom++;
      socket.join('horse-' + curRoom);
      socket.emit('horse-room' + curRoom);
      //toSend["status"] = "started";
      //socket.emit('horse-sendStatus', toSend);
    }
    socket.join('horse-' + curRoom);
    socket.emit('horse-room', curRoom);
    clients++;
    toSend = {};
    toSend["players"] = players;
    console.log("room horse-" + curRoom + ": " + toSend);
    io.sockets.in('horse-'+curRoom).emit('horse-playerListUpdate', toSend);
    
    socket.on('horse-disconnect', function(data) {
      clients--;
      console.log("disconnect, clients: " + clients);
      if (clients == 0)
      {
        cards = {};
        players = new Array();
        started = false;
      }
    });
    
    socket.on('horse-leave', function(data) {
      //leave the room it was in (not sure how to do this since we change the rooms)
      ;
    });
    
    socket.on('horse-requestPlayers', function(){
      var toSend = {};
      toSend["players"] = players;
      console.log(toSend);
      io.sockets.in('horse-'+curRoom).emit('horse-playerListUpdate', toSend);
    });
    
    socket.on('horse-join', function (name, choice, bet) {
      console.log('I am the Join function!');

      players.push({"name":name, "choice":choice, "bet":bet});
      //wrap in another layer to format it as a type for interactions.js
      var toSend = {};
      toSend["players"] = players;
      console.log(toSend);
      io.sockets.in('horse-'+curRoom).emit('horse-playerListUpdate', toSend);
    });
    
    socket.on('horse-new', function () {
    console.log('I am the new game function!');
      started = false;
      //reset the players!
      //players = new Array();
    
      //tell other clients that a new game is being prepared
      var toSend = {};
      toSend["status"] = "new";  
      io.sockets.in('horse-'+curRoom).emit('horse-playerListUpdate', toSend);
    
      //reset everyone's player lists
      toSend = {};
      toSend["players"] = players;
      console.log(toSend);
      io.sockets.in('horse-'+curRoom).emit('horse-playerListUpdate', toSend);
    });
    
    socket.on('horse-startGame', function () {
      started = true;
      console.log('I am the Start Game function!');
      var status = {};
      status["status"] = "start";
      console.log(status);
      io.sockets.in('horse-'+curRoom).emit('horse-sendStatus', status); 
    
      //this is where we loop
      var cards = {0:0, 1:0, 2:0, 3:0};
      var sideLane = {};
      for (var i = 0; i < trackLength; i++)
        sideLane[i] = -1;
      
      //send initial states
      io.sockets.in('horse-'+curRoom).emit('horse-partialBoardUpdate', {"cards":cards, "sideLane":sideLane});
      
      finished = false;
      var curSide = 1;
      var curCard;
      //loop through game operations untill full game sequence has been sent
      while (!finished)
      {
        var rnd = Math.floor(Math.random()*4);
        cards[Object.keys(cards)[rnd]]++;
        curCard=rnd;
        
        //tell client to increment this card
        console.log("incrementing: " + JSON.stringify({"card":rnd}));
        io.sockets.in('horse-'+curRoom).emit('horse-partialBoardUpdate', {"cards":cards, "sideLane":sideLane});
        
        //check if every player passed the next line and flip a card if so
        var flip = true;
        for (var i = 0; i < Object.keys(cards).length; i++)
          if (cards[Object.keys(cards)[i]] < curSide)
            flip = false;
        
        //last horse crossed step, so flip a card and decrement (and tell clients)
        if (flip) 
        {
          var rnd2 = Math.floor(Math.random()*4);
          sideLane[trackLength-curSide] = rnd2;
          curSide++;
          cards[Object.keys(cards)[rnd2]]--; //decrementing the appropriate horse to maintain position
          console.log("Flipping: " + JSON.stringify({"card":rnd2}));
          //boolean after data to tell that flip happened
          io.sockets.in('horse-'+curRoom).emit('horse-partialBoardUpdate', {"cards":cards, "sideLane":sideLane}, true);
          }
      
        //check for end game conditions
        for (var j = 0; j<Object.keys(cards).length; j++)
          if (cards[Object.keys(cards)[j]] >= trackLength)
            finished=true;
      } //end while
      
      //send winner (last card incremented)
      console.log({"winner":curCard});
      io.sockets.in('horse-'+curRoom).emit('horse-winner', {"winner":curCard});
      
      //reset everyone's board
      var cards = {0:0, 1:0, 2:0, 3:0};
      var sideLane = {};
      for (var i = 0; i < trackLength; i++)
        sideLane[i] = -1;
      io.sockets.in('horse-'+curRoom).emit('horse-partialBoardUpdate', {"cards":cards, "sideLane":sideLane});
      
      
    }); //end 'start game'
    
    socket.on('horse-chatMsg', function (data) {
      var msg = data["msg"];
      //var rooms = io.sockets.manager.roomClients[socket.id];
      //var room = Object.keys(rooms)[1];
      //room = room.substring(1, room.length);
      var room = data["room"];
      io.sockets.in(room).emit('horse-chatMsg', {"msg":msg});
    });
    
  };

exports.game = game;

exports.joinGame = function(name, suit, bet) {
  lastPlayer = {name: name, choice: suit, bet: bet}
  players.push(lastPlayer);
}
