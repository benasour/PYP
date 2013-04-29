 var writeCounter = -1;
 
 function resetWriteCounter(){ 
  writeCounter=-1; return;
 }
 
 function requestPlayers(){
  socket.emit('coin-requestPlayers');
 }
 
 function requestStart(){
  socket.emit('coin-startGame');
 }
 
 function sendChat(data){
  socket.emit('coin-chatMsg', data);
 }
 
 function sendLeave(){
  socket.emit('coin-leave', myName);
 }
 
 //socket function for communication and event handling from the server
 var socket = io.connect();
 
  socket.on('coin-connect', function (data) {
    //alert('client is connected');
  });
  
  socket.on('coin-room', function(data) {
    joinRoom('coin-' + data["room"]);
  });
  
  socket.on('coin-chatNameUpdate', function(data) {
    drawChatNames(data["names"]);
  });
  
  socket.on('coin-playerListUpdate', function (data) {
    //document.getElementById("debugDiv").innerHTML = JSON.stringify(data);
    playerUpdate(data);
  });
  
  //forward status related update to user
  socket.on('coin-start', function (data) {
    startGame();
  });
  
  //forward the server's game-related update to user
  socket.on('coin-partialBoardUpdate', function (data) {
    writeCounter++;
    myVar=setTimeout(function(){
      receiveCoin(data);
    },writeCounter*1000);
  });
  
  //pass along the winner
  socket.on('coin-winner', function(data) {
    writeCounter++;
    myvar = setTimeout(function(){
      showResults(data);
    },writeCounter*1000);
  });
  
  socket.on('coin-chatMsg', function(data) {
    receiveMsg(data);
  });
  