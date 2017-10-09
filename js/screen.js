const { ipcRenderer } = require('electron');

var body = document.getElementById("body");
body.style.height = window.innerHeight + "px";
var splashScreen = document.getElementById("splashScreen");
var overview = document.getElementById("overview");
var newGame = document.getElementById("newGame");
var lottery = document.getElementById("lottery");

var tablesList = document.getElementById("tablesList");
var waitingList = document.getElementById("nextMatches");

let busy = false;
let waitingFunctionList = [];

var Renderer = function() {
  this.startGames = function(games) {
    for(var i = 0; i < games.length; i++) {
      if(busy) {
        waitingFunctionList.push({
          function: startGame,
          data: games[i]
        });
      } else {
        renderer.startGame(games[i]);
      }
    }
    for(var i = 0; i < games.length; i++) {
      renderer.updateTable(games[i]);
    }

    // busy = true;
    // for(var i = 0; i < games.length; i++) {
    //   this.startGame(games[i], i*9500);
    // }
    // setTimeout(function() {
    //   for(var i = 0; i < games.length; i++) {
    //     renderer.updateTable(games[i]);
    //   }
    //   if(waitingFunctionList.length == 0) {
    //     newGame.className = "animated fadeOut";
    //     setTimeout(function(){
    //       newGame.className = "hidden";
    //       endBusy();
    //     }, 1000);
    //   } else {
    //     endBusy();
    //   }
    // }, 9500*games.length);
  }

  this.startGame = function(game) {
    // setTimeout(function() {
      busy = true;
      var cupTable = newGame.querySelector(".cupTable");
      var table = newGame.querySelector(".tableTitle h3");
      var team1 = newGame.querySelector(".team1name");
      var vs = newGame.querySelector(".vs h1");
      var team2 = newGame.querySelector(".team2name");
      table.className = "hideText"
      team1.className = "team1name hidden";
      vs.className = "hideText"
      team2.className = "team2name hidden";
      cupTable.className = "cupTable animated fadeIn";

      setTimeout(function() {
        table.innerHTML = "Table " + game.tableId;
        table.className = "animated flipInY"
        setTimeout(function() {
          team1.innerHTML = game.team1;
          team1.className = "team1name animated jackInTheBox";
          setTimeout(function() {
            vs.className = "animated bounceInDown";
            setTimeout(function() {
              team2.innerHTML = game.team2;
              team2.className = "team2name animated jackInTheBox";
              setTimeout(function() {
                cupTable.className = "cupTable animated fadeOut";
                setTimeout(function() {
                  cupTable.className = "cupTable hidden";
                  endBusy(true);
                }, 1000);
              }, 2000);
            }, 1500);
          }, 1000);
        }, 1500);
      }, 2000);
    // }, time);
  }

  this.finishGame = function(game) {
    busy = true;
    var cupTable = newGame.querySelector(".cupTable");
    var table = newGame.querySelector(".tableTitle h3");
    var team1 = newGame.querySelector(".team1name");
    var vs = newGame.querySelector(".vs h1");
    var team2 = newGame.querySelector(".team2name");
    table.className = ""
    team1.className = "team1name";
    vs.className = ""
    team2.className = "team2name";
    cupTable.className = "cupTable";

    table.innerHTML = "Table " + game.tableId;
    team1.innerHTML = game.team1;
    team2.innerHTML = game.team2;

    cupTable.className = "cupTable animated fadeIn";

    setTimeout(function() {
      if(game.winner == 1) {
        team1.className = "team1name animated pulse winner";
        team2.className = "team2name animated pulse loser";
      } else {
        team1.className = "team1name animated pulse loser";
        team2.className = "team2name animated pulse winner";
      }
      setTimeout(function() {
        if(game.winner == 1) {
          team2.className = "team2name animated hinge loser";
        } else {
          team1.className = "team1name animated hinge loser";
        }
        setTimeout(function() {
          if(game.winner == 1) {
            team1.className = "team1name animated flip winner";
          } else {
            team2.className = "team2name animated flip winner";
          }
          setTimeout(function() {
            cupTable.className = "cupTable animated fadeOut";
            setTimeout(function() {
              cupTable.className = "cupTable hidden";
              endBusy(true);
            }, 1000);
          }, 2000);
        }, 1500);
      }, 1500);
    }, 2000);
  }

  this.playLottery = function(data) {
    busy = true;
    lottery.className = "animated fadeIn";
    var price = data.price;
    var winner = data.winner;
    var emptyPrice = "";
    for(var i = 0; i < price.length; i++) {
      emptyPrice += " ";
    }
    var emptyWinner = "";
    for(var i = 0; i < winner.length; i++) {
      emptyWinner += " ";
    }

    odoo.default({ el:'.animationPrice', from: emptyPrice, to: price, animationDelay: 3000, duration: 5000 });
    odoo.default({ el:'.animationTeam', from: emptyWinner, to: winner, animationDelay: 3000, duration: 7000 });
  }

  this.champions = function(data) {
    var champions = document.getElementById("champions");
    var newChamps = document.getElementById("newChamps");
    var champsTeam = document.getElementById("championsTeam");
    var champsNames = document.getElementById("championsPlayers");
    var champsP1 = document.getElementById("championsP1");
    var champsP2 = document.getElementById("championsP2");
    champsTeam.innerHTML = data.team;
    champsP1.innerHTML = data.player1;
    champsP2.innerHTML = data.player2;
    champions.className = "animated fadeIn";
    setTimeout(function() {
      newChamps.className = "animated zoomIn";
      setTimeout(function() {
        champsTeam.className = "animated flipInY";
        setTimeout(function() {
          champsNames.className = "animated slideInUp";
        }, 1000);
      }, 1000);
    }, 1000);
  }

  this.createTable = function(id, total) {
    var div = document.createElement("div");
    div.className = "col-sm-6 cupTableContainer";
    if(total % 2 == 1) {
      total++;
    }
    div.style.height = (window.innerHeight * (0.9 / (total/2))) + "px";
    var tableId = "table" + id;
    div.id = tableId;

    var cupTable = document.createElement("div");
    cupTable.className = "cupTable";

    var tableTitleDiv = document.createElement("div");
    tableTitleDiv.className = "tableTitle";
    var tableTitle = document.createElement("h3");
    tableTitle.innerHTML = "Table " + id;
    tableTitleDiv.appendChild(tableTitle);
    cupTable.appendChild(tableTitleDiv);

    var tableTeams = document.createElement("div");
    tableTeams.className = "tableTeams";

    var team1 = document.createElement("div");
    team1.className = "team1";
    var team1name = document.createElement("h4");
    team1name.className = "team1name";
    team1name.innerHTML = "Team 1";
    team1.appendChild(team1name);
    tableTeams.appendChild(team1);

    var vs = document.createElement("div");
    vs.className = "vs";
    var vsText = document.createElement("h1");
    vsText.innerHTML = "VS";
    vs.appendChild(vsText);
    tableTeams.appendChild(vs);

    var team2 = document.createElement("div");
    team2.className = "team2";
    var team2name = document.createElement("h4");
    team2name.className = "team2name";
    team2name.innerHTML = "Team 2";
    team2.appendChild(team2name);
    tableTeams.appendChild(team2);

    cupTable.appendChild(tableTeams);
    div.appendChild(cupTable)
    tablesList.appendChild(div);
  }

  this.updateTable = function(game) {
    var id = "table" + game.tableId;
    var table = document.getElementById(id);
    var team1 = table.querySelector(".team1name");
    var team2 = table.querySelector(".team2name");
    team1.innerHTML = game.team1;
    team2.innerHTML = game.team2;
  }

  this.createWaitinglist = function(games) {
    for(var i = 0; i < games.length; i++) {
      this.addToWaitingList(games[i]);
    }
  }

  this.addToWaitingList = function(game) {
    var nextMatch = document.createElement("li");
    nextMatch.className = "nextMatch";

    var team1div = document.createElement("div");
    team1div.className = "team1";
    var team1name = document.createElement("h5");
    team1name.innerHTML = game.team1;
    team1div.appendChild(team1name);
    nextMatch.appendChild(team1div);

    var vsDiv = document.createElement("div");
    vsDiv.className = "vs";
    var vs = document.createElement("h3");
    vs.innerHTML = "VS";
    vsDiv.appendChild(vs);
    nextMatch.appendChild(vsDiv);

    var team2div = document.createElement("div");
    team2div.className = "team2";
    var team2name = document.createElement("h5");
    team2name.innerHTML = game.team2;
    team2div.appendChild(team2name);
    nextMatch.appendChild(team2div);

    waitingList.appendChild(nextMatch);
  }
}
var renderer = new Renderer();

ipcRenderer.on('createTables', (event, data) => {
  for(var i = 0; i < data.nbTables; i++) {
    renderer.createTable(i+1, data.nbTables);
  }
  if(data.nbTables % 2 != 0) {
    var table = tablesList.querySelector(".cupTableContainer:last-child");
    table.className = "col-sm-6 col-sm-offset-3 cupTableContainer";
  }
  splashScreen.className = "hidden";
  newGame.className = "";
  overview.className = "";
});

ipcRenderer.on('startGames', (event, data) => {
  // for(var i = 0; i < data.length; i++) {
  //   console.log(data[i].round);
  // }
  renderer.startGames(data);
});

ipcRenderer.on('waitingList', (event, data) => {
  renderer.createWaitinglist(data);
});

ipcRenderer.on('finishGame', (event, data) => {
  //console.log(data.newGame.round);
  if(busy) {
    waitingFunctionList.push({
      function: finishGame,
      data: data.finishedGame
    });
    waitingFunctionList.push({
      function: startGame,
      data: data.newGame
    });
  } else {
    finishGame(data.finishedGame);
    waitingFunctionList.push({
      function: startGame,
      data: data.newGame
    });
  }
  var obj = waitingList.querySelector('.nextMatch:first-child');
  setTimeout(function() {
    if(obj) {
      obj.parentNode.removeChild(obj);
    }
    renderer.updateTable(data.newGame);
  });
});

ipcRenderer.on('finishDelete', (event, data) => {
  if(busy) {
    waitingFunctionList.push({
      function: finishGame,
      data: data
    });
  } else {
    finishGame(data);
  }
  var tableId = "table" + data.tableId;
  var obj = document.getElementById(tableId);
  var parent = obj.parentNode;
  setTimeout(function() {
    parent.removeChild(obj);
    var tables = parent.querySelectorAll(".cupTableContainer");
    for(var i = 0; i < tables.length; i++) {
      tables[i].style.height = (window.innerHeight * (0.9 / (tables.length/2))) + "px";
    }
    if(tables.length % 2 == 0) {
      tables[tables.length-1].className = "col-sm-6 cupTableContainer";
    } else {
      tables[tables.length-1].className = "col-sm-6 col-sm-offset-3 cupTableContainer";
    }
  }, 1000)
});

ipcRenderer.on('champions', (event, data) => {
  if(busy) {
    waitingFunctionList.push({
      function: finishGame,
      data: data.finishedGame
    });
    waitingFunctionList.push({
      function: champions,
      data: data.champions
    });
  } else {
    finishGame(data.finishedGame);
    waitingFunctionList.push({
      function: champions,
      data: data.champions
    });
  }
});

ipcRenderer.on('playLottery', (event, data) => {
  if(busy) {
    waitingFunctionList.push({
      function: playLottery,
      data: data
    });
  } else {
    playLottery(data);
  }
});

function startGame(game) {
  if(newGame.className == "hidden") {
    newGame.className = "animated fadeIn";
  }
  renderer.startGame(game);
}

function finishGame(data) {
  if(newGame.className == "hidden") {
    newGame.className = "animated fadeIn";
  }
  renderer.finishGame(data);
}

function champions(data) {
  renderer.champions(data);
}

function playLottery(data) {
  renderer.playLottery(data);
}

function callFunction(callback, data) {
  callback(data);
}

function endBusy(fade) {
  busy = false;
  if(waitingFunctionList.length > 0) {
    var f = waitingFunctionList.shift();
    callFunction(f.function, f.data);
  } else if(fade) {
    newGame.className = "animated fadeOut";
    setTimeout(function(){
      newGame.className = "hidden";
    }, 1000);
  } else {
    newGame.className = "hidden";
  }
}
