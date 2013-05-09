var socket = require('socket.io');
var request = require('request');

var curRoom = 0;

//TODO: make these public vars into arrays so that we have instances for each room
var players = new Array();
var lastPlayer = {}; //needed since joinGame happens before connection (bulk of code)
var started = false;
var clients = 0;
var trackLength = 8;
var idsToNames = {};

game = function(socket, io) {
    console.log('A new connection has been created'); 
    idsToNames[socket.id] = lastPlayer.name;
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
    }
    socket.join('horse-' + curRoom);
    socket.emit('horse-room', {"room":curRoom});
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
        curRoom = 0;
        cards = {};
        players = new Array();
        started = false;
      }
    });
    
    socket.on('horse-leave', function(data) {
      //leave the room it was in (not sure how to do this since we change the rooms)
      //get clients to remove them from the chatting list
      
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
          io.sockets.in(room).emit('horse-chatNameUpdate', toSend);
        }
      }
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
    
    socket.on('horse-startGame', function () {
      if (started) 
        return; //you aren't the first to click it
      started = true;
      console.log('I am the Start Game function!');
      var status = {};
      status["status"] = "start";
      console.log(status);
      io.sockets.in('horse-'+curRoom).emit('horse-start', status); 
    
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

      // Change each player's bet to negative if they didn't guess right and
      // call rest service to save results on PYP Profile App
      for (var i = 0; i < players.length; i++) {
        var player = players[i];
        if (choiceToInt(player.choice) != curCard) {
          player.bet = -player.bet;
        }

        var pypBaseUrl = process.env.PYP_BASE_URL || "http://localhost:62438/";
        request.post(pypBaseUrl + 'api/history', {form: {GameName: "Horse", UserName: player.name, Score: player.bet}});
            
      }
      
    }); //end 'start game'
    
    socket.on('horse-sendChatMsg', function (data) {
      var msg = data["msg"];
      var room = data["room"];
      io.sockets.in(room).emit('horse-chatMsg', {"msg":msg});
    });
    
  };

exports.game = game;

exports.joinGame = function(name, suit, bet) {
  lastPlayer = {name: name, choice: suit, bet: bet}
  players.push(lastPlayer);
}

function choiceToInt(suitChoice) {
  switch (suitChoice) {
    case "Spades":
      return 0;
    case "Hearts":
      return 1;
    case "Clubs":
      return 2;
    case "Diamonds":
      return 3;
  }
}
