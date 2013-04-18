 var writeCounter=0;
 
 function resetWriteCounter(){ 
  writeCounter=0; return;
 }
 
 //socket functions for communication and event handling from the server
 //PRD
  var socketConnectionURL = "http://boiling-meadow-5174.herokuapp.com/";
  if (window.location.toString().indexOf("localhost")>=0)
  {
    //localhost
    socketConnectionURL ="http://localhost:8080";
  }
 var socket = io.connect(socketConnectionURL);
 
  socket.on('coin-connect', function (data) {
    //alert('client is connected');
  });
  
  socket.on('coin-playerListUpdate', function (data) {
    //document.getElementById("debugDiv").innerHTML = JSON.stringify(data);
    playerUpdate(data);
  });
  
  //forward status related update to user
  socket.on('coin-sendStatus', function (data) {
    receiveStatus(data);
  });
  
  //forward the server's game-related update to user
  socket.on('coin-partialBoardUpdate', function (data, flip) {
    if (!flip) //don't increment if we're flipping so we can get a 1/4s delay
      writeCounter++;
    myVar=setTimeout(function(){
      receiveCards(data);
    },writeCounter*1000+(flip ? 250:0));
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
  