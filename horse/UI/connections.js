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
 
  socket.on('connect', function (data) {
    //alert('client is connected');
  });
  
  socket.on('playerListUpdate', function (data) {
    //document.getElementById("debugDiv").innerHTML = JSON.stringify(data);
    playerUpdate(data);
  });
  
  //forward status related update to user
  socket.on('sendStatus', function (data) {
    receiveStatus(data);
  });
  
  //forward the server's game-related update to user
  socket.on('partialBoardUpdate', function (data, flip) {
    if (!flip) //don't increment if we're flipping so we can get a 1/4s delay
      writeCounter++;
    myVar=setTimeout(function(){
      receiveCards(data);
    },writeCounter*1000+(flip ? 250:0));
  });
  
  //pass along the winner
  socket.on('winner', function(data) {
    writeCounter++;
    myvar = setTimeout(function(){
      showResults(data);
    },writeCounter*1000);
  });
  
  socket.on("chatMsg", function(data) {
    receiveMsg(data);
  });
  