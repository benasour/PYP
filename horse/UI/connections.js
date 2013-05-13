 var writeCounter=-1;
 
 function resetWriteCounter(){ 
  writeCounter=-1; return;
 }
 
 function requestPlayers(){
  socket.emit('horse-requestPlayers');
 }
 
 function requestStart(){
  socket.emit('horse-startGame');
 }
 
 function sendChat(data){
  socket.emit('horse-sendChatMsg', data);
 }
 
 function sendLeave(){
  socket.emit('horse-leave', myName);
 }
 
 //socket function for communication and event handling from the server
 var socket = io.connect();
 
  socket.on('horse-connect', function (data) {
    //alert('client is connected');
  });
  
  socket.on('horse-room', function(data) {
    joinRoom('horse-' + data["room"]);
  });
  
  socket.on('horse-chatNameUpdate', function(data) {
    drawChatNames(data["names"]);
  });
  
  socket.on('horse-playerListUpdate', function (data) {
    //document.getElementById("debugDiv").innerHTML = JSON.stringify(data);
    playerUpdate(data);
  });
  
  //forward status related update to user
  socket.on('horse-start', function (data) {
    startGame();
  });
  
  //forward the server's game-related update to user
  socket.on('horse-partialBoardUpdate', function (data, flip) {
    if (!flip) //don't increment if we're flipping so we can get a 1/4s delay
      writeCounter++;
    myVar=setTimeout(function(){
      receiveCards(data);
    },writeCounter*1000+(flip ? 250:0));
  });
  
  //pass along the winner
  socket.on('horse-winner', function(data) {
    writeCounter++;
    myvar = setTimeout(function(){
      showResults(data);
    },writeCounter*1000);
  });
  
  socket.on('horse-chatMsg', function(data) {
    receiveMsg(data);
  });
  