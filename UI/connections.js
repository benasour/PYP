 var writeCounter=0;
 
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
	//alert('playerListUpdate');
	drawNames(data);
  });
  
  socket.on('finalBoardUpdate', function (data) {
	//debugDiv.innerHTML = JSON.stringify(data);
	receiveData(data);
	//renderBoard(data); // this isnt working, not sure why it doesnt draw the board correctly
	//receiveData(JSON.stringify(data)); // nope doesnt work either
	
  });
  
  socket.on('partialBoardUpdate', function (data) {
	writeCounter++;
	myVar=setTimeout(function(){
		//writeDebug(data);
		receiveData(data);
	},writeCounter*1000);
  });