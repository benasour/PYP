//store global variable
var namesArray={};
var cards={};
var trackLength = 8;
var started=false;
var suits={0:"\u2660", 1:"\u2665", 2:"\u2663", 3:"\u2666"};

//function to print data (presumably from server) to a div on html page
function writeDebug(data)
{
	var debugDiv = document.getElementById('debugDiv');
	debugDiv.innerHTML += JSON.stringify(data) + '<br/>';
	return;
}

//init function sets up the inital layout of the page and get our variables started
function init()
{
	document.getElementById('init').classList.remove("hidden");
	document.getElementById('game').classList.add("hidden");
	document.getElementById('results').classList.add("hidden");
	document.getElementById('players').classList.remove("hidden");
	resetWriteCounter();

	//TODO: tell the server that we're starting a new round
	if (started) //if this is still set from last game we're the first to hit new game
		socket.emit('new');	//so tell the server!
	
	cards = {0:0, 1:0, 2:0, 3:0};
	started = false;
	socket.emit('requestPlayers');
}

/*  takes in data from the server, processes it into namesArray, 
	then calls render for the data to be used
*/
function receiveData(gameObject)
{
	//gameObject = JSON.parse(gameObject); //needed for fakeData, but not server apparently
	
	/*thinking a new format is in order!
	  {type: {data}}
	 	{status: start}
		{status: end, winner: ...? }
			use winner:name, winner:index, or namesArray?
	    {names: {asdf:0, jkl: 1, qwerty: 6, ... } }
	*/
	var type = Object.keys(gameObject)[0];
	var val = gameObject[type];
	
	if (type == "status")
	{
		/* game status message, tells if game started/ended/etc */
		switch (val)
		{
			case "start":
				started=true; //sent from server so we don't need to tell it
				startGame();
				break;
			case "new":
				started = false; //stops from emitting once they're done viewing results
				break
			case "end": //not needed, but probably should do -- work on server, display on client
				
				
				showResults();
				break;
		}
	}
	else if (type == "players")
	{
		/* game object data, has all the names/positions */
		namesArray = {};
		//go through the data, deep copy to namesArray
		//also checks for win condition while we're at it, and sets a flag accordingly
		var winner = -1;
		//document.getElementById("debugDiv").innerHTML = JSON.stringify(gameObject) + "<br>" + JSON.stringify(val);
		for (var i = 0; i<Object.keys(val).length; i++)
		{
			namesArray[Object.keys(val)[i]] = val[Object.keys(val)[i]];
			if (namesArray[Object.keys(namesArray)[i]] >= trackLength)
				winner=i;
			//if this client hasn't started but a piece moved, start.
			if (!started && namesArray[Object.keys(namesArray)[i]] != 0)
			{
				started = true;
				startGame();
			}
		}
		
		//use the results appropriately
		drawNames();
		renderBoard();
		if (winner != -1)
		{
			setTimeout(function(){
				showResults(winner);
			}, 1000);
		}
	}
	else
	{
		//TODO: ERROR HANDLING
	}
	
	
}

/*	simple function to deep copy our data, then increment one piece at 
	random to simulate real gameplay. Output is JSON to emulate server
*/
function fakeData()
{
	var data = {};
	for (var i = 0; i<Object.keys(namesArray).length; i++)
		data[Object.keys(namesArray)[i]] = namesArray[Object.keys(namesArray)[i]];
	var rnd = Math.floor(Math.random()*Object.keys(namesArray).length);
	data[Object.keys(data)[rnd]]++;
	receiveData(JSON.stringify(data));
}

/*	Prints out our game board to the appropriate div
	Uses namesArray to determine where to place each player
		numbers used to represent them
*/
function renderBoard(inputNamesArray)
{
	//TEMPORARY NOTE: \u2660 - \u2667 TO GET CARD SUITS

	//override for namesArray (TESTING ONLY)
	if (inputNamesArray)
	{
		namesArray = inputNamesArray;
	}
	var grid = document.getElementById('gameBoard');
	grid.innerHTML = "";
	
	
	//now construct our table
	//for now hardcode it to be 8 rows and n columns
		// Object.keys(namesArray).length is n
	//horse position determined by 8-m where m is value associated with player
	
	//set up some formatting on our table so it looks nice
	for (var i = 0; i < trackLength; i++)
		grid.innerHTML += "<col width= '30px'>";
	grid.innerHTML += "<tbody id='tableBody'></tbody>";
	var gridTest = document.getElementById("tableBody");
	var html = "";
	
	//merge cells in top row and print out finish line of appropriate length
	html += "<tr><td class='border' colspan='" + Object.keys(cards).length + "'>";
	for( var k = 0; k < Object.keys(cards).length ; k++)
		html += "------";
	html += "</td></tr>";
	
	//now the bulk of the work -- print out the grid and player locations
	gridTest.innerHTML += html;  
	for (var i = 0; i <= trackLength; i++) //for tracklength
	{
		gridTest.innerHTML += "<tr>";
		html = "";
		for (var j = 0; j < Object.keys(cards).length; j++) //for all players
		{
			//if a player is in this cell, print their number and add class for styling
			if (cards[Object.keys(cards)[j]] == trackLength-i)
			{
				html += "<td>";
				html +=  "|  <a class='hasPlayer'>" + suits[j] + "</a>|" ;
			}
			else //no player, so just a cell with a placeholder dot
			{
				html += "<td>";
				html += "| . |";
			}
			html += "</td>";
		}
		gridTest.innerHTML += html + "</tr>";
	}
	
	//merge cells in bottom row and print out bottom border line of appropriate length
	html = "";
	html += "<tr><td class='border' colspan='" + Object.keys(cards).length + "'>";
	for( var k = 0; k < Object.keys(cards).length ; k++)
		html += "------";
	html += "</td></tr>";
	gridTest.innerHTML += html; 
		
	//return just in case there was more processing of results to be done  
	return;
}

// Take a submitted name and add it to our data/init the player
// now the namesArray number portion will contain the bet instead of position
function addName ()
{
	var name = document.getElementById('nameInputBox');
	var bet = document.getElementById('betInputBox');
	//check if we have too many players or if this player exists
	if (Object.keys(namesArray).length>=6)
	{
		alert("Sorry, this game has a max of 6 players.");
	}
	else if (name.value in namesArray)
	{
		alert("Sorry, no duplicate names allowed.");
	}
	else if (name.value.length<=0 || bet.value.length<=0)
	{
		alert("Sorry, you must fill out both your name and your bet to proceed.");
	}
	else //if conditions for adding are met, upload it
	{
		//grab name from doc, send it to server
		
		socket.emit('join',name.value, bet.value);
		
		//updates local vars (REMOVE? since we use server data to update list now)
		namesArray[name.value]=bet.value;
		name.value = "";
		bet.value = "";
		drawNames();
	}
}

// outputs a list of player names with their corresponding numbers
function drawNames(inputNamesArray)
{
	//overwrite namesArray with param (DEBUG ONLY)
	if (inputNamesArray)
	{
		namesArray = inputNamesArray;
	}
	
	//use namesArray to output list of all players in appropriate div
	var namesList = document.getElementById('namesList');
	namesList.innerHTML = "";
	for (var i = 0; i<Object.keys(namesArray).length; i++) //for all players
		namesList.innerHTML += "<li>" + Object.keys(namesArray)[i] + " - " + namesArray[Object.keys(namesArray)[i]] + "</li>";	
}

// switch from player adding view to game view
function startGame()
{
	//tell the server we want to start!
	if (!started){
		// but make sure that the player isn't racing alone first
		if (Object.keys(namesArray).length <=1)
		{
			alert("Need at least two players to play!");
			exit;
		}
		socket.emit('startGame');
	}
	started=true; //just to be safe
	resetWriteCounter();
	
	//works in html5
	document.getElementById('init').classList.add("hidden");
	document.getElementById('game').classList.remove("hidden");
	document.getElementById('results').classList.add("hidden");
	document.getElementById('players').classList.remove("hidden");
	
	renderBoard();
	//send list of all player objects to server
	//alert(JSON.stringify(namesArray));
	return;
}

// switch from game view to results view (displays winner)
function showResults(winnerVal)
{
	//works in html5
	document.getElementById('game').classList.add("hidden");
	document.getElementById('results').classList.remove("hidden");
	document.getElementById('init').classList.add("hidden");
	document.getElementById('players').classList.add("hidden");
	
	//show the winning player and set the an <a> tag with id for style
	document.getElementById('winner').innerHTML = "Winner was: <a id='winningPlayer'>" + Object.keys(namesArray)[winnerVal] + "</a>";
}