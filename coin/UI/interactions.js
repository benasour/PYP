//store global variable
var gameLength = 1;
var side={0:"H", 1:"T"};
var myName; //to prepend on chat messages
var myRoom; //to give as a param with chat messages (to tell who to send to)

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
  myName = document.getElementById('name').value;
  document.getElementById('init').classList.remove("hidden");
  document.getElementById('game').classList.add("hidden");
  document.getElementById('results').classList.add("hidden");
  document.getElementById('players').classList.remove("hidden");
  resetWriteCounter();

  //and ask for our init data to set up the board
  requestPlayers();
}

//process any event involving coin/card movement
function receiveCoin(data)
{
  var coin = data["coin"];
  
  renderBoard(coin);
}

//process any changes involving the list of players
function playerUpdate(data)
{
  var val = data["players"];
  if (val != undefined) //joining first or when no players are listed results in this
  {
    var namesArray = new Array();
    // go through the data, deep copy to namesArray
    for (var i = 0; i<val.length; i++)
      namesArray[i] = val[i];
    
    // use the results appropriately
    drawNames(namesArray);
  }
}

/*  simple function to deep copy our data, then increment one piece at 
    random to simulate real gameplay. Output is JSON to emulate server
*/
function fakeData()
{
  var data = {};
  for (var i = 0; i<2; i++)
    data[i] = coin[i];
  var rnd = Math.floor(Math.random()*2);
  data[Object.keys(data)[rnd]]++;
  
  var toSend = {};
  
  toSend["side"] = rnd;
  incrementCoin(toSend);
}

/*  Prints out our game board to the appropriate div
    Uses namesArray to determine where to place each player
    numbers used to represent them
*/
function renderBoard(coin)
{
  var grid = document.getElementById('gameBoard');
  grid.innerHTML = "";
  
  //now construct our table
 
  //set up some formatting on our table so it looks nice
  for (var i = 0; i < gameLength; i++)
    grid.innerHTML += "<col width= '30px'>";
  grid.innerHTML += "<tbody id='tableBody'></tbody>";
  var gridTest = document.getElementById("tableBody");
  var html = "";
  
  //merge cells in top row and print out finish line of appropriate length
  html += "<tr><td class='border' colspan='" + Object.keys(coin).length + "'>";
  html += "-------";
  html += "</td></tr>";
  
  //now the bulk of the work -- print out the grid and player locations
  gridTest.innerHTML += html;  
  for (var i = 0; i <= gameLength; i++) //for gameLength
  {
    gridTest.innerHTML += "<tr>";
    html = "";
    for (var j = 0; j < Object.keys(coin).length; j++) //for all players
    {
      //if a coin is in this cell, print the corresponding letter and add class for styling
      //coin position determined by gameLength-i where i is position of coin
      if (coin[j] == gameLength-i)
      {
        html += "<td>";
        html +=  "|  <a class='hasPlayer'>" + side[j] + "</a>|" ;
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
  html += "<tr><td class='border' colspan='" + Object.keys(coin).length + "'>";
  html += "-------";
  html += "</td></tr>";
  gridTest.innerHTML += html; 
  
  //return just in case there was more processing of results to be done  
  return;
}

// outputs a list of player names with their corresponding numbers
function drawNames(namesArray)
{
  //use namesArray to output list of all players in appropriate div
  var namesList = document.getElementById('namesList');
  var chatNames = document.getElementById('chatNames');
  namesList.innerHTML = "<tbody id='nameBody'></tbody>";
  var nameTBody = document.getElementById('nameBody');
  nameTBody.innerHTML = "<tr id='header'><td><b>Name</b></td><td><b>Side</b></td><td><b>Bet</b></td></tr>";
  chatNames.options.length = 0;
  
  for (var i = 0; i < namesArray.length; i++) //for all players
  {
    var curElement = namesArray[i];
    nameTBody.innerHTML += "<tr><td>" + curElement["name"] + "</td><td>" + curElement["choice"] +"</td><td class='bet'>" + curElement["bet"] + "</td></tr>";  
    chatNames.add(new Option(curElement["name"]));
  }
}

function drawChatNames(names)
{
  var chatNames = document.getElementById('chatNames');
  chatNames.options.length = 0;
  for (var i = 0; i<names.length; i++) //for all players
  {
    chatNames.add(new Option(names[i]));
  }
}

// tell the server we want to start the game
function sendStart()
{
  requestStart();
}

// switch from player adding view to game view
function startGame()
{
  //reset the delays on receives (how we get the game to go 1fps instead of instantly finishing)
  resetWriteCounter();
  
  //works in html5
  document.getElementById('init').classList.add("hidden");
  document.getElementById('game').classList.remove("hidden");
  document.getElementById('results').classList.add("hidden");
  document.getElementById('players').classList.remove("hidden");
  
  return;
}

// switch from game view to results view (displays winner)
function showResults(data)
{
  var winnerVal = data["winner"];
  console.log(winnerVal);

  //works in html5
  document.getElementById('game').classList.add("hidden");
  document.getElementById('results').classList.remove("hidden");
  document.getElementById('init').classList.add("hidden");
  document.getElementById('players').classList.remove("hidden");
  
  //show the winning player and set the an <a> tag with id for style
  var color = ((winnerVal%2==0) ? "black" : "red");
  document.getElementById('winner').innerHTML = "Winner was: <a id='winningPlayer' class= '" + color + "'>" + side[winnerVal] + "</a>";
}

// send message to server so other players can see it
function sendMsg()
{
  var chatOut = document.getElementById('chatMsg');
  var msg = chatOut.value;
  chatOut.value = "";
  
  var data = {"msg":myName + ": " + msg, "room":myRoom};
  sendChat(data);
}

// received message, so take data and display it to user
function receiveMsg(data)
{
  msg = data["msg"];
  var chatBox = document.getElementById('chatBox');
  
  chatBox.value += msg + "\n";
  console.log("receive msg: " + chatBox.value)
  chatBox.scrollTop = chatBox.scrollHeight; //set to bottom of chatbox
}

function joinRoom(room)
{
  myRoom = room;
}

// tell the server we left, then leave the game room, and redirect to PYP Profile Games list 
function leaveGame(returnBaseUrl)
{
  sendLeave();
  document.location = returnBaseUrl + "Game";
}
