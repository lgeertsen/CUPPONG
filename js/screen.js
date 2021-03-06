const { ipcRenderer } = require('electron');

var body = document.getElementById("body");
body.style.height = window.innerHeight + "px";
var splashScreen = document.getElementById("splashScreen");
var overview = document.getElementById("overview");
var bracketsOverview = document.getElementById("bracketsOverview");

var newGame = document.getElementById("newGame");
var lottery = document.getElementById("lottery");

var tablesList = document.getElementById("tablesList");
var roundContainer = document.getElementById("roundContainer");
// var waitingList = document.getElementById("nextMatches");

let busy = false;
let waitingFunctionList = [];

let bracketShown = false;
let bracketWaitingList = [];

var animations = true;

var Renderer = function() {
  this.startGames = function(games) {
    for(var i = 0; i < games.length; i++) {
      var game = games[i];
      if(game.round < 4) {
        if(bracketShown) {
          if(busy) {
            waitingFunctionList.push({
              id: 1,
              function: updateBracketTable,
              data: game
            });
          } else {
            renderer.updateBracketTable(game);
          }
        } else {
          bracketWaitingList.push(game);
        }
        var tableId = "table" + game.tableId;
        var obj = document.getElementById(tableId);
        if(obj) {
          var parent = obj.parentNode;
          parent.removeChild(obj);
          for(var j = 0; j < roundContainer.querySelectorAll(".roundDiv").length; j++) {
            var id = "round" + j;
            var round = document.getElementById(id);
            if(round.childNodes.length < 2) {
              round.className = "row roundDiv hidden";
            } else {
              round.className = "row roundDiv";
            }
          }
        }
      } else {
        if(animations) {
          if(busy) {
            waitingFunctionList.push({
              function: startGame,
              data: game
            });
          } else {
            startGame(game);
          }
        }
        renderer.updateTable(game);
      }
      // if(busy) {
      //   waitingFunctionList.push({
      //     function: startGame,
      //     data: games[i]
      //   });
      // } else {
      //   renderer.startGame(games[i]);
      // }
    }
    // for(var i = 0; i < games.length; i++) {
    //   renderer.updateTable(games[i]);
    // }

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
                }, 500);
              }, 1000);
            }, 750);
          }, 500);
        }, 750);
      }, 1000);
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
            }, 500);
          }, 1000);
        }, 750);
      }, 750);
    }, 1000);
  }

  this.finishBracketGame = function(game) {
    busy = true;
    var id = 'game' + game.round + game.game;
    var table = document.getElementById(id);
    var team1 = table.querySelector(".team1name");
    var team2 = table.querySelector(".team2name");
    var tableTitle = table.querySelector(".tableTitle");

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
            tableTitle.className = "tableTitle animated fadeOut";
            if(game.winner == 1) {
              team2.className = "team2name animated fadeIn loser";
            } else {
              team1.className = "team1name animated fadeIn loser";
            }
            setTimeout(function(){
              tableTitle.className = "tableTitle hideBox";
              var g = game.game;
              var p = true;
              if(g % 2 == 1) {
                g--;
                p = false;
              }
              var gameId = g/2;
              var gameRound = game.round - 1;

              var id = "game" + gameRound + gameId;
              var newTable = document.getElementById(id);
              var newT1 = newTable.querySelector(".team1name");
              var newT2 = newTable.querySelector(".team2name");
              if(p) {
                if(game.winner == 1) {
                  newT1.innerHTML = game.team1;
                  newT1.className = "team1name animated jackInTheBox";
                } else {
                  newT1.innerHTML = game.team2;
                  newT1.className = "team1name animated jackInTheBox";
                }
              } else {
                if(game.winner == 1) {
                  newT2.innerHTML = game.team1;
                  newT2.className = "team2name animated jackInTheBox";
                } else {
                  newT2.innerHTML = game.team2;
                  newT2.className = "team2name animated jackInTheBox";
                }
              }
              endBusy(true);
            }, 500);
          }, 500);
        }, 750);
      }, 750);
    }, 250);
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

  this.lotteryNewTeam = function(data) {
    var winner = data.winner
    var loser = data.loser;
    while(loser.length > winner.length) {
      winner += " ";
      if(loser.length > winner.length) {
        winner = " " + winner;
      }
    }

    odoo.default({ el:'.animationTeam', from: loser, to: winner, animationDelay: 2000, duration: 4000 });
  }

  this.finishLottery = function() {
    lottery.className = "animated fadeOut";
    newGame.className = "hidden";
    setTimeout(function() {
      lottery.className = "hidden";
      endBusy(false);
    }, 500);
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
        }, 500);
      }, 500);
    }, 500);
  }

  this.createRound = function(id) {
    var round = document.createElement("div");
    round.className = "row roundDiv";
    round.id = "round" + id;
    var roundDiv = document.createElement("div");
    roundDiv.className = "col-sm-12";
    var roundName = document.createElement("h1");
    roundName.className = "roundName";
    if(id == 0) {
      roundName.innerHTML = "Finale";
    } else {
      var x = Math.pow(2, id);
      roundName.innerHTML = "1/" + x + " finale";
    }
    roundDiv.appendChild(roundName);
    round.appendChild(roundDiv);
    roundContainer.appendChild(round);
  }

  this.createTable = function(id, total) {
    var div = document.createElement("div");
    div.className = "col-sm-4 cupTableContainer";
    // if(total % 3 == 1) {
    //   total++;
    //   total++;
    // } else if(total % 3 == 2) {
    //   total++;
    // }
    // div.style.height = (window.innerHeight * (1 / (total/3))) + "px";
    var tableId = "table" + id;
    div.id = tableId;
    div.setAttribute("round", -1);
    div.setAttribute("tableId", id);

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

    var next = document.createElement("div");
    next.className = "nextMatch hidden";
    var nextText = document.createElement("div");
    nextText.className = "nextText";
    nextText.innerHTML = "Next:";
    next.appendChild(nextText);
    var nextTeams = document.createElement("div");
    nextTeams.className = "nextTeams";
    nextTeams.innerHTML = "Team1 VS Team2";
    next.appendChild(nextTeams);
    tableTeams.appendChild(next);

    cupTable.appendChild(tableTeams);
    div.appendChild(cupTable)
    tablesList.appendChild(div);
  }

  this.updateTable = function(game) {
    var id = "table" + game.tableId;
    var table = document.getElementById(id);
    var team1 = table.querySelector(".team1name");
    var team2 = table.querySelector(".team2name");
    var next = table.querySelector(".nextMatch");
    var nextTeams = table.querySelector(".nextTeams");
    team1.innerHTML = game.team1;
    team2.innerHTML = game.team2;
    nextTeams.innerHTML = "";
    if(game.nextMatch == null || game.nextMatch.round < 4) {
      next.className = "nextMatch hidden";
    } else {
      next.className = "nextMatch";
      var next1 = document.createElement('span');
      next1.className = "next1";
      next1.innerHTML = game.nextMatch.team1.name + " VS " + game.nextMatch.team2.name;
      nextTeams.appendChild(next1);
      var next2 = document.createElement('span');
      if(game.nextMatch2 != null && game.nextMatch2.round > 3) {
        next2.className = "next2";
        next2.innerHTML += "<br>" + game.nextMatch2.team1.name + " VS " + game.nextMatch2.team2.name;
        nextTeams.appendChild(next2);
      } else {
        next2.innerHTML = "";
        nextTeams.appendChild(next2);
      }
    }

    if(table.getAttribute("round") != game.round) {
      var roundId = "round" + game.round;
      var round = document.getElementById(roundId);
      table.setAttribute("round", game.round);
      if(round.childNodes[1] != undefined) {
        var i = 1;
        var x = parseInt(table.getAttribute("tableId"));
        while(round.childNodes[i] != undefined && x > round.childNodes[i].getAttribute("tableId")) {
          i++;
        }
        round.insertBefore(table, round.childNodes[i]);
      } else {
        round.insertBefore(table, round.childNodes[1]);
      }
    }
    for(var i = 0; i < roundContainer.querySelectorAll(".roundDiv").length; i++) {
      var id = "round" + i;
      var round = document.getElementById(id);
      if(round.childNodes.length < 2) {
        round.className = "row roundDiv hidden";
      } else {
        round.className = "row roundDiv";
      }
    }
  }

  this.correctTable = function(game) {
    if(game.status == "playing") {
      game.tableId = game.table.id;
      game.team1 = game.team1.name;
      game.team2 = game.team2.name;
      this.updateTable(game);
    } else if(game.status == "nextMatch") {
      var tableId = "table" + game.table.id;
      var table = document.getElementById(tableId);
      var next = table.querySelector(".next1");
      next.innerHTML = game.team1.name + " VS " + game.team2.name;
    } else if(game.status == "nextMatch2") {
      var tableId = "table" + game.table.id;
      var table = document.getElementById(tableId);
      var next = table.querySelector(".next2");
      next.innerHTML = '<br>' + game.team1.name + " VS " + game.team2.name;
    }
  }

  this.updateBracketTable = function(game) {
    busy = true;
    var id = "game" + game.round + game.game;
    var table = document.getElementById(id);
    var tableTitle = table.querySelector(".tableTitle");
    var tableText = tableTitle.querySelector("h4");
    var team1 = table.querySelector(".team1name");
    var vs = table.querySelector(".vs");
    var team2 = table.querySelector(".team2name");

    tableText.innerHTML = "Table " + game.tableId;

    setTimeout(function() {
      tableTitle.className = "tableTitle animated slideInUp";
      setTimeout(function() {
        team1.innerHTML = game.team1;
        team1.className = "team1name animated jackInTheBox";
        setTimeout(function() {
          vs.className = "vs animated bounceInDown";
          setTimeout(function() {
            team2.innerHTML = game.team2;
            team2.className = "team2name animated jackInTheBox";
            endBusy(false);
          }, 750);
        }, 500);
      }, 750);
    }, 750);
  }

  this.correctBracketTable = function(game) {
    var id = "game" + game.round + game.game;
    var table = document.getElementById(id);
    var team1 = table.querySelector(".team1name");
    var team2 = table.querySelector(".team2name");
    if(game.status == "finished") {
      if(team1.className == "team1name animated flip winner" ||team1.className == "team1name winner") {
        team1.className = "team1name loser";
        team2.className = "team2name winner";
      } else {
        team1.className = "team1name winner";
        team2.className = "team2name loser";
      }
    } else {
      if(game.team1) {
        team1.innerHTML = game.team1.name;
      }
      if(game.team2) {
        team2.innerHTML = game.team2.name;
      }
    }
  }

  this.loadSave = function(data) {
    for(var i = data.length-1; i >= 0; i--) {
      for(var k = 0; k < data[i].length; k++) {
        var game = data[i][k];
        if(game.table) {
          game.tableId = game.table.id;
        }
        if(game.team1) {
          game.team1 = game.team1.name;
        }
        if(game.team2) {
          game.team2 = game.team2.name;
        }
        if(game.round < 4) {
          if(game.status == "finished" || game.status == "playing") {
            if(bracketShown) {
              if(busy) {
                waitingFunctionList.push({
                  id: 1,
                  function: updateBracketTable,
                  data: game
                });
              } else {
                renderer.updateBracketTable(game);
              }
            } else {
              bracketWaitingList.push(game);
            }
            var tableId = "table" + game.tableId;
            var obj = document.getElementById(tableId);
            if(obj) {
              var parent = obj.parentNode;
              parent.removeChild(obj);
              for(var j = 0; j < roundContainer.querySelectorAll(".roundDiv").length; j++) {
                var id = "round" + j;
                var round = document.getElementById(id);
                if(round.childNodes.length < 2) {
                  round.className = "row roundDiv hidden";
                } else {
                  round.className = "row roundDiv";
                }
              }
            }
          } else if(game.status == "empty") {
            var id = "game" + game.round + game.game;
            var table = document.getElementById(id);
            var team1 = table.querySelector(".team1name");
            var team2 = table.querySelector(".team2name");
            if(game.team1) {
              team1.innerHTML = game.team1;
              team1.className = "team1name animated fadeIn";
            }
            if(game.team2) {
              team2.innerHTML = game.team2;
              team2.className = "team2name animated fadeIn";
            }
          }

        } else {
          if(game.status == "playing") {
            if(animations) {
              if(busy) {
                waitingFunctionList.push({
                  function: startGame,
                  data: game
                });
              } else {
                startGame(game);
              }
            }
            renderer.updateTable(game);
          }
        }
      }
    }
  }

  this.createWaitinglist = function(games) {
    // for(var i = 0; i < games.length; i++) {
    //   this.addToWaitingList(games[i]);
    // }
  }

  // this.addToWaitingList = function(game) {
  //   var nextMatch = document.createElement("li");
  //   nextMatch.className = "nextMatch";
  //
  //   var team1div = document.createElement("div");
  //   team1div.className = "team1";
  //   var team1name = document.createElement("h5");
  //   team1name.innerHTML = game.team1;
  //   team1div.appendChild(team1name);
  //   nextMatch.appendChild(team1div);
  //
  //   var vsDiv = document.createElement("div");
  //   vsDiv.className = "vs";
  //   var vs = document.createElement("h3");
  //   vs.innerHTML = "VS";
  //   vsDiv.appendChild(vs);
  //   nextMatch.appendChild(vsDiv);
  //
  //   var team2div = document.createElement("div");
  //   team2div.className = "team2";
  //   var team2name = document.createElement("h5");
  //   team2name.innerHTML = game.team2;
  //   team2div.appendChild(team2name);
  //   nextMatch.appendChild(team2div);
  //
  //   waitingList.appendChild(nextMatch);
  // }
}
var renderer = new Renderer();

ipcRenderer.on('createTables', (event, data) => {
  for(var i = 0; i < data.nbRounds; i++) {
    renderer.createRound(i);
  }
  for(var i = 0; i < data.nbTables; i++) {
    renderer.createTable(i+1, data.nbTables);
  }
  // if(data.nbTables % 3 == 1) {
  //   var table = tablesList.querySelector(".cupTableContainer:last-child");
  //   table.className = "col-sm-4 col-sm-offset-4 cupTableContainer";
  // } else if(data.nbTables % 3 == 2) {
  //   var tables = document.querySelectorAll(".cupTableContainer");
  //   tables[tables.length-2].className = "col-sm-4 col-sm-offset-2 cupTableContainer";
  //   tables[tables.length-1].className = "col-sm-4 cupTableContainer";
  // }
  // newGame.className = "";
});

ipcRenderer.on('startGames', (event, data) => {

  overview.className = "animated fadeIn";
  setTimeout(function() {
    splashScreen.className = "hidden";
  }, 1500);
  renderer.startGames(data);
});

ipcRenderer.on('waitingList', (event, data) => {
  renderer.createWaitinglist(data);
});

ipcRenderer.on('showBracket', (event) => {
  bracketsOverview.className = "animated fadeIn";
  bracketShown = true;
  setTimeout(function() {
    overview.className = "hidden";
    while(bracketWaitingList.length > 0) {
      var g = bracketWaitingList.shift();
      if(busy) {
        waitingFunctionList.push({
          id: 1,
          function: updateBracketTable,
          data: g
        });
      } else {
        renderer.updateBracketTable(g);
      }
    }
  }, 500);
});

ipcRenderer.on('hideBracket', (event) => {
  overview.className = "";
  bracketsOverview.className = "animated fadeOut";
  bracketShown = false;
  setTimeout(function() {
    bracketsOverview.className = "hidden";
  }, 500);
});

ipcRenderer.on('finishGame', (event, data) => {
  if(data.finishedGame.round < 4) {
    if(bracketShown) {
      if(busy) {
        waitingFunctionList.push({
          id: 1,
          function: finishBracketGame,
          data: data.finishedGame
        });
      } else {
        renderer.finishBracketGame(data.finishedGame);
      }
    }
  } else {
    if(animations) {
      if(busy) {
        waitingFunctionList.push({
          function: finishGame,
          data: data.finishedGame
        });
      } else {
        finishGame(data.finishedGame);
      }
    }
  }
  if(data.newGame.round < 4) {
    if(bracketShown) {
      if(busy) {
        waitingFunctionList.push({
          id: 1,
          function: updateBracketTable,
          data: data.newGame
        });
      } else {
        renderer.updateBracketTable(data.newGame);
      }
    } else {
      bracketWaitingList.push(data.newGame);
    }
    var tableId = "table" + data.newGame.tableId;
    var obj = document.getElementById(tableId);
    if(obj) {
      var parent = obj.parentNode;
      parent.removeChild(obj);
      for(var i = 0; i < roundContainer.querySelectorAll(".roundDiv").length; i++) {
        var id = "round" + i;
        var round = document.getElementById(id);
        if(round.childNodes.length < 2) {
          round.className = "row roundDiv hidden";
        } else {
          round.className = "row roundDiv";
        }
      }
    }
  } else {
    if(animations) {
      waitingFunctionList.push({
        function: startGame,
        data: data.newGame
      });
    }
    setTimeout(function() {
      renderer.updateTable(data.newGame);
    });
  }
});

ipcRenderer.on('finishDelete', (event, data) => {
  if(data.round < 4) {
    if(bracketShown) {
      if(busy) {
        waitingFunctionList.push({
          id: 1,
          function: finishBracketGame,
          data: data
        });
      } else {
        renderer.finishBracketGame(data);
      }
    }
  } else {
    if(animations) {
      if(busy) {
        waitingFunctionList.push({
          function: finishGame,
          data: data
        });
      } else {
        finishGame(data);
      }
    }
  }
  var tableId = "table" + data.tableId;
  var obj = document.getElementById(tableId);
  if(obj) {
    var parent = obj.parentNode;
    setTimeout(function() {
      parent.removeChild(obj);
      // var tables = parent.querySelectorAll(".cupTableContainer");
      // for(var i = 0; i < tables.length; i++) {
      //   tables[i].style.height = (window.innerHeight * (0.9 / (tables.length/2))) + "px";
      // }
      // if(tables.length % 3 == 0) {
      //   tables[tables.length-2].className = "col-sm-4 cupTableContainer";
      //   tables[tables.length-1].className = "col-sm-4 cupTableContainer";
      // } else if(tables.length % 3 == 1) {
      //   tables[tables.length-2].className = "col-sm-4 cupTableContainer";
      //   tables[tables.length-1].className = "col-sm-4 col-sm-offset-4 cupTableContainer";
      // } else {
      //   tables[tables.length-2].className = "col-sm-4 col-sm-offset-2 cupTableContainer";
      //   tables[tables.length-1].className = "col-sm-4 cupTableContainer";
      // }
    }, 500);
  }
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

ipcRenderer.on('lotteryNewTeam', (event, data) => {
  renderer.lotteryNewTeam(data);
});

ipcRenderer.on('finishLottery', (event) => {
  renderer.finishLottery();
});

ipcRenderer.on('skipAnimations', (event) => {
  var i = 0;
  while(i < waitingFunctionList.length) {
    if(waitingFunctionList[i].id != 1) {
      waitingFunctionList.splice(i, 1);
    } else {
      i++;
    }
  }
});

ipcRenderer.on('enableAnimations', (event) => {
  animations = true;
});

ipcRenderer.on('disableAnimations', (event) => {
  animations = false;
  var i = 0;
  while(i < waitingFunctionList.length) {
    if(waitingFunctionList[i].id != 1) {
      waitingFunctionList.splice(i, 1);
    } else {
      i++;
    }
  }
});

ipcRenderer.on('correctScore', (event, game) => {
  if(game.round > 3) {
    renderer.correctTable(game);
  } else {
    renderer.correctBracketTable(game);
  }
});

ipcRenderer.on('loadSave', (event, data) => {
  overview.className = "animated fadeIn";
  setTimeout(function() {
    splashScreen.className = "hidden";
  }, 1500);

  renderer.loadSave(data);
});

function startGame(game) {
  if(newGame.className == "hidden") {
    newGame.className = "animated fadeIn";
  }
  renderer.startGame(game);
}

function updateBracketTable(game) {
  renderer.updateBracketTable(game);
}

function finishGame(data) {
  if(newGame.className == "hidden") {
    newGame.className = "animated fadeIn";
  }
  renderer.finishGame(data);
}

function finishBracketGame(data) {
  renderer.finishBracketGame(data);
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
    }, 500);
  } else {
    newGame.className = "hidden";
  }
}
