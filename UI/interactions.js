//store global variable
var namesArray=new Array();
var cards={};
var trackLength = 8;
var sideLane = {};
var curCard = 0;
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
    socket.emit('new');  //so tell the server!
  
  curCard = 0;
  cards = {0:0, 1:0, 2:0, 3:0};
  for (var i = 0; i < trackLength; i++)
    sideLane[i] = "*";
  started = false;
  socket.emit('requestPlayers');
}

//card data format: {card: <0-3>}
//take the card and increase value by 1
function incrementCard(data)
{
  var suit = data["card"];
  cards[suit] += 1;
  renderBoard();
  
  //only need to see if this one card won since it was the only one that moved
  if (cards[suit] >= trackLength)
    setTimeout(function(){
      showResults(suit);
    }, 1000);
}

//take the card and reveal it as the next card on the side, then decrement it's suit
function flipCard(data)
{
  var suit = data["card"];
  cards[suit] -= 1;
  curCard++;
  
  sideLane[trackLength-curCard] = suits[suit];
  renderBoard();
  return;
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
  
  switch(type) //CONSIDER REFACTORING THIS SO EACH CASE JUST CALLS A METHOD
  {
    case "status":  /* game status message, tells if game started/ended/etc */
      switch (val)
      {
        case "start":
          cards = {0:0, 1:0, 2:0, 3:0};
          started=true; //sent from server so we don't need to tell it
          startGame();
          break;
        case "new":
          document.getElementById("addButton").disabled = false;
          document.getElementById("startButton").disabled = false;
          cards = {0:0, 1:0, 2:0, 3:0};
          started = false; //stops from emitting once they're done viewing results
          break
        case "started":
          document.getElementById("addButton").disabled = true;
          document.getElementById("startButton").disabled = true;
          break;
        case "end": //not needed, but probably should do -- work on server, display on client
          
          showResults();
          break;
      }
      break;
     case "players": //type: players, so update namesArray then call renderBoard
      /* game object data, has all the names/positions */
      namesArray = new Array();
      // go through the data, deep copy to namesArray
      // document.getElementById("debugDiv").innerHTML = JSON.stringify(gameObject) + "<br>" + JSON.stringify(val);
      for (var i = 0; i<val.length; i++)
        namesArray[i] = val[i];
      
      // use the results appropriately
      drawNames();
      renderBoard();
      
      break;
    default:
      //TODO: ERROR HANDLING
      break;
  }
}

/*  simple function to deep copy our data, then increment one piece at 
    random to simulate real gameplay. Output is JSON to emulate server
*/
function fakeData()
{
  var data = {};
  for (var i = 0; i<4; i++)
    data[i] = cards[i];
  var rnd = Math.floor(Math.random()*4);
  data[Object.keys(data)[rnd]]++;
  
  var toSend = {};
  
  var flip = true;
  for (var i = 0; i < 4; i++)
    if (data[i] < curCard+1)
      flip=false;
  if (flip)
  {
    var rnd2 = Math.floor(Math.random()*4);
    toSend["card"] = rnd2;
    flipCard(toSend);
  }
  toSend["card"] = rnd;
  incrementCard(toSend);
  
  //receiveData(JSON.stringify(data));
}

/*  Prints out our game board to the appropriate div
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
  //horse position determined by trackLength-m where m is value associated with player
  
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
      if (cards[j] == trackLength-i)
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
    
  
  //do the sidetrack in a separate table for simplicity's sake
  var sideTrack = document.getElementById("sideTrack");
  sideTrack.innerHTML = "<tbody id='sideTrackBody'></tbody>";
  sideTrack = document.getElementById('sideTrackBody');
  sideTrack.innerHTML += "<tr><td style='color: white'>.</td></tr>";
  for (var i = 0; i < trackLength; i++)
    if (sideLane[i] == "*")
      sideTrack.innerHTML += "<tr><td>" + sideLane[i] + "</tr></td>";
    else if (sideLane[i] == suits[0] || sideLane[i] == suits[2])
      sideTrack.innerHTML += "<tr><td class='black'>" + sideLane[i] + "</tr></td>";
    else
      sideTrack.innerHTML += "<tr><td class='red'>" + sideLane[i] + "</tr></td>";
  //put some blanks in so our float doesn't mess up the alignment
  sideTrack.innerHTML += "<tr><td style='color: white'>.</td></tr>";
  sideTrack.innerHTML += "<tr><td style='color: white'>.</td></tr>";
  
  //return just in case there was more processing of results to be done  
  return;
}

// Take a submitted name and add it to our data/init the player
// now the namesArray number portion will contain the bet instead of position
function addName ()
{
  var name = document.getElementById('nameInputBox');
  var betChoice = document.getElementById('betChoice');
  var bet = document.getElementById('betInputBox');
  //check if we have too many players or if this player exists
  /*if (Object.keys(namesArray).length>=6)
  {
    alert("Sorry, this game has a max of 6 players.");
  }*/
  if (name.value in namesArray)
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
    
    socket.emit('join',name.value, betChoice.value, bet.value);
    
    //updates local vars (REMOVE? since we use server data to update list now)
    var newName = {};
    newName["name"]=name.value;
    newName["choice"]=betChoice.value;
    newName["bet"]=bet.value;
    namesArray.push(newName);
    name.value = "";
    bet.value = "";
    betChoice.value = "Spades";
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
  for (var i = 0; i<namesArray.length; i++) //for all players
  {
    var curElement = namesArray[i];
    namesList.innerHTML += "<li>" + curElement["name"] + " - " + curElement["choice"] +" - " + curElement["bet"] + "</li>";  
  }
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
  document.getElementById('players').classList.remove("hidden");
  
  //show the winning player and set the an <a> tag with id for style
  var color = ((winnerVal%2==0) ? "black" : "red");
  document.getElementById('winner').innerHTML = "Winner was: <a id='winningPlayer' class= '" + color + "'>" + suits[winnerVal] + "</a>";
}