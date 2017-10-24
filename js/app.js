const { ipcRenderer } = require('electron');
const {dialog} = require('electron').remote;
var fs = require('fs');
var convertExcel = require('excel-as-json').processFile;

var body = document.getElementById("body");
body.style.height = window.innerHeight + "px";
var teamList = document.getElementById("teamList");
teamList.style.height = (window.innerHeight * 0.85) + "px";
var roundContainer = document.getElementById("roundContainer");

var lotteryDiv = document.getElementById("lottery");
lotteryDiv.style.maxHeight = (window.innerHeight - 40) + "px";
var priceList = document.getElementById("priceList");
priceList.style.maxHeight = (window.innerHeight - 180) + "px";
var loadSaveLottery = document.getElementById("loadSaveLottery");
var lotteryEdit = document.getElementById("lotteryEdit");
var lotteryPlay = document.getElementById("lotteryPlay");
var lotteryPlayBtn = document.getElementById("lotteryPlayBtn");
var lotteryWin = document.getElementById("lotteryWin");

var main = document.getElementById("main");

var overview = document.getElementById("overview");
var tablesList = document.getElementById("tablesList");
tablesList.style.height = window.innerHeight + "px";
// var roundNb = document.getElementById("roundNb");
var nextMatches = document.getElementById("nextMatches");
nextMatches.style.height = (window.innerHeight - 0.9) + "px";

var teamNameInput = document.getElementById("teamName");
var player1NameInput = document.getElementById("player1Name");
var player2NameInput = document.getElementById("player2Name");
var player1LicenceInput = document.getElementById("player1Licence");
var player2LicenceInput = document.getElementById("player2Licence");

var priceNameInput = document.getElementById("priceName");
var priceProbInput = document.getElementById("priceProb");

var messageBox = document.getElementById("messageBox");

var Team = function(id, name, p1, p2, p1L, p2L, present) {
  this.id = id;
  this.name = name;
  this.player1 = p1;
  this.player2 = p2;
  this.player1Licence = p1L;
  this.player2Licence = p2L;
  this.present = present;

  Team.list.push(this);
}
Team.list = [];
// new Team(0, "βΔΞ", "Lee Geertsen", "Valerio Ripperino", true);
// for (var i = 1; i < 8; i++) {
//   var name = "TEAM" + (i+1);
//   new Team(i, name, "lol", "lol", true);
// }

var Table = function(id) {
  this.id = id;
  this.inUse = false;

  this.game;

  return this;
}

var Game = function() {
  this.table;
  this.team1;
  this.team2;
  this.round;
  this.game;
  this.finished = false;

  return this;
}

var Price = function(id, name, prob) {
  this.id = id;
  this.name = name;
  this.prob = prob;

  Price.list.push(this);
}
Price.list = [];

var Lottery = function() {
  this.prices = [];
  this.teams = [];
  this.probTable = [];
  this.inPlay = false;
  this.winner;

  this.play = function() {
    if(!this.inPlay) {
      this.inPlay = true;
      var priceId = random(0, this.probTable.length-1);
      var price = this.prices[this.probTable[priceId]].name;
      var winnerId = random(0, this.teams.length-1);
      var winner = this.teams[winnerId].name;
      this.winner = winner;
      this.teams.splice(winnerId, 1);
      var emptyPrice = "";
      for(var i = 0; i < price.length; i++) {
        emptyPrice += " ";
      }
      var emptyWinner = "";
      for(var i = 0; i < winner.length; i++) {
        emptyWinner += " ";
      }
      lotteryPlayBtn.className = "hidden";
      lotteryWin.className = "";

      var data = { price: price, winner: winner };
      ipcRenderer.send('playLottery', data);

      odoo.default({ el:'.animationPrice', from: emptyPrice, to: price, animationDelay: 1000, duration: 2000 });
      odoo.default({ el:'.animationTeam', from: emptyWinner, to: winner, animationDelay: 1000, duration: 2000 });
    }
  }

  this.newTeam = function() {
    var winnerId = random(0, this.teams.length-1);
    var winner = this.teams[winnerId].name;
    var loser = this.winner;
    this.teams.splice(winnerId, 1);
    while(loser.length > winner.length) {
      winner += " ";
      if(loser.length > winner.length) {
        winner = " " + winner;
      }
    }
    this.winner = winner;
    var data = { loser: loser, winner: winner };
    ipcRenderer.send('lotteryNewTeam', data);

    odoo.default({ el:'.animationTeam', from: loser, to: winner, animationDelay: 1000, duration: 2000 });
  }

  this.finish = function() {
    this.inPlay = false;
    lotteryPlayBtn.className = "btn";
    lotteryWin.className = "hidden";
    ipcRenderer.send('finishLottery');
  }

  this.makeTable = function() {
    var total = 0;
    for(var i = 0; i < this.prices.length; i++) {
      var p = this.prices[i];
      for(var j = 0; j < p.prob; j++) {
        this.probTable.push(p.id);
      }
    }
  }
}
let lottery = new Lottery();

var GameMaking = function() {
  this.teamsList = [];
  this.waitingList = [];
  this.nbTables;
  this.tables = [];
  this.teams = 0;
  this.games = 0;
  this.gameTree = [];
  //this.inGame = [];
  this.totalRounds = 0;

  this.round = 0;
  this.roundLength = 0;
  this.roundGame = 0;

  this.start = function() {

    this.shuffle();
    this.teams = this.teamsList.length;
    this.games = this.teams-1;
    this.makeTree();

    this.createRounds();
    this.createTables();

    var data = { nbTables: this.nbTables, nbRounds: this.totalRounds };
    ipcRenderer.send('createTables', data);

    this.round++;
    // this.showRound();
    main.className = "hidden";
    overview.className = "";
    this.startGames();
    this.showWaitingList();
  }

  this.startGames = function() {
    this.assignTeamsToGame();
    var games = [];
    for(var i in this.tables) {
      var game = this.startGame(this.tables[i]);
      games.push({ round: game.round, tableId: game.table.id, team1: game.team1.name, team2: game.team2.name });
    }
    ipcRenderer.send('startGames', games);
  }

  this.startGame = function(table) {
    // if(this.waitingList.length > 0) {
      var game = this.waitingList.shift();
      game.table = table;
      this.updateTable(game);
    // }
    return game;
  }

  this.assignTeamsToGame = function() {
    while(this.teamsList.length > 0) {
      var game = this.gameTree[this.totalRounds - this.round][this.roundGame];
      if(game.team1 == undefined) {
        game.round = this.totalRounds - this.round;
        game.game = this.roundGame;
        game.team1 = this.teamsList.shift();
        game.team1.round = this.round;
      } else if (game.team2 == undefined) {
        game.team2 = this.teamsList.shift();
        game.team2.round = this.round;
        game.complete = true;
        this.waitingList.push(game);
      } else {
        this.roundGame++;
        if(this.roundGame == this.roundLength && this.round < this.totalRounds) {
          this.roundGame = 0;
          this.round++;
          this.roundLength = this.gameTree[this.totalRounds-this.round].length;
        }
      }
    }
  }

  this.assignTeamToGame = function(team) {
    var assigned = false;
    var i = 0;
    var roundLength = this.gameTree[this.totalRounds - team.round].length;
    while(!assigned) {
      game = this.gameTree[this.totalRounds - team.round][i];
      if(game.team1 == undefined) {
        game.round = this.totalRounds - team.round;
        game.game = i;
        game.team1 = team;
        assigned = true;
      } else if(game.team2 == undefined) {
        game.team2 = team;
        game.complete = true;
        this.waitingList.push(game);
        this.addToWaitingList(game.team1, game.team2);
        assigned = true;
      } else {
        i++;
      }
    }
  }

  this.finishGame = function(button) {
    var chooseDiv = button.parentNode.parentNode;
    var winner = chooseDiv.querySelector("input:checked");
    if(winner) {
      winner.checked = false;
      var game = this.gameTree[button.getAttribute("round")][button.getAttribute("game")];
      if (game.round == 0) {
        var data = {};
        var champs = document.getElementById("champions");
        var champsTeam = document.getElementById("championsTeam");
        var champsPlayers = document.getElementById("championsPlayers");
        // var champsP1 = document.getElementById("championsPlayer1");
        // var champsP2 = document.getElementById("championsPlayer2");
        champs.className = "";
        if (winner.value == 1) {
          champsTeam.innerHTML = game.team1.name;
          champsPlayers.innerHTML = game.team1.player1 + " & " + game.team1.player2;
          // champsP1.innerHTML = game.team1.player1;
          // champsP2.innerHTML = game.team1.player2;
          data.champions = {
            team: game.team1.name,
            player1: game.team1.player1,
            player2: game.team1.player2
          };
        } else {
          champsTeam.innerHTML = game.team2.name;
          champsPlayers.innerHTML = game.team2.player1 + " & " + game.team2.player2;
          // champsP1.innerHTML = game.team2.player1;
          // champsP2.innerHTML = game.team2.player2;
          data.champions= {
            team: game.team2.name,
            player1: game.team2.player1,
            player2: game.team2.player2
          };
        }
        data.finishedGame = {
          tableId: game.table.id,
          team1: game.team1.name,
          team2: game.team2.name,
          winner: winner.value
        };
        ipcRenderer.send('champions', data);
      } else {
        if(winner.value == 1) {
          game.team1.round++;
          this.assignTeamToGame(game.team1);
        } else {
          game.team2.round++;
          this.assignTeamToGame(game.team2);
        }
        var tableId = "table" + game.table.id;
        var table = document.getElementById(tableId);
        if(table.getAttribute("delete") == "true" || this.waitingList.length == 0) {
          this.tables[game.table.id-1].inUse = false;
          var parent = table.parentNode;
          // this.tables.splice(game.table.id-1, 1);
          // for(var i = 0; i < this.tables.length; i++) {
          //   this.tables[i].id = i+1;
          // }
          parent.removeChild(table);
          var data = {
            tableId: game.table.id,
            team1: game.team1.name,
            team2: game.team2.name,
            winner: winner.value
          }
          ipcRenderer.send('finishDelete', data);
        } else {
          var g = this.startGame(game.table);
          this.removeFromWaitinglist();
          var data = {
            finishedGame: {
              round: game.round,
              tableId: game.table.id,
              team1: game.team1.name,
              team2: game.team2.name,
              winner: winner.value
            },
            newGame: {
              round: g.round,
              tableId: g.table.id,
              team1: g.team1.name,
              team2: g.team2.name
            }
          };
          ipcRenderer.send('finishGame', data);
        }
      }
    }
  }

  this.shuffle = function() {
    // this.teamsList = Team.list;
    var l = this.teamsList.length;
    for(var i = 0; i < l; i++) {
      var index = random(0, l);
      var t = this.teamsList[i];
      this.teamsList[i] = this.teamsList[index];
      this.teamsList[index] = t;
    }
  }

  this.makeTree = function() {
    var level = 1;
    var max = 1;
    var count = 0;
    this.gameTree[0] = [];
    for(var i = 0; i < this.games; i++) {
      this.gameTree[level-1][count] = new Game();
      count++;
      if(count == max && i != this.games-1) {
        level++;
        this.gameTree[level-1] = [];
        max *= 2;
        count = 0;
      }
    }
    this.totalRounds = level;
    this.roundLength = this.gameTree[this.totalRounds-1].length;
  }

  this.createRounds = function() {
    for(var i = 0; i < this.totalRounds; i++) {
      var round = document.createElement("div");
      round.className = "row";
      round.id = "round" + i;
      var roundDiv = document.createElement("div");
      roundDiv.className = "col-sm-12";
      var roundName = document.createElement("h1");
      roundName.className = "roundName";
      if(i == 0) {
        roundName.innerHTML = "Finale";
      } else {
        var x = Math.pow(2, i);
        roundName.innerHTML = "1/" + x + " finale";
      }
      roundDiv.appendChild(roundName);
      round.appendChild(roundDiv);
      roundContainer.appendChild(round);
    }
  }

  this.createTables = function() {
    for(var i = 0; i < this.nbTables; i++) {
      this.tables[i] = new Table(i+1);
      this.createTable(i+1);
    }
  }

  this.createTable = function(nb) {
    var cupTable = document.createElement("div");
    cupTable.className = "col-sm-6 cupTable";
    var tableId = "table" + nb;
    cupTable.id = tableId;
    cupTable.setAttribute("round", -1);
    cupTable.setAttribute("tableId", nb);

    var closeDiv = document.createElement("div");
    closeDiv.className = "close";
    var close = document.createElement("i");
    close.className = "fa fa-times";
    close.setAttribute("aria-hidden", "true");
    close.onclick = function() {gameMaker.setDeleteTable(this)};
    closeDiv.appendChild(close);
    cupTable.appendChild(closeDiv);

    var tableTitleDiv = document.createElement("div");
    tableTitleDiv.className = "tableTitle";
    var tableTitle = document.createElement("h3");
    tableTitle.innerHTML = "Table " + nb;
    tableTitleDiv.appendChild(tableTitle);
    cupTable.appendChild(tableTitleDiv);

    var tableTeams = document.createElement("div");
    tableTeams.className = "tableTeams";

    var teamNames = document.createElement("div");
    teamNames.className = "teamNames";

    var team1 = document.createElement("div");
    team1.className = "team1";
    var team1name = document.createElement("h4");
    team1name.className = "team1name";
    team1name.innerHTML = "Team 1";
    team1.appendChild(team1name);
    teamNames.appendChild(team1);

    var vs = document.createElement("div");
    vs.className = "vs";
    var vsText = document.createElement("h1");
    vsText.innerHTML = "VS";
    vs.appendChild(vsText);
    teamNames.appendChild(vs);

    var team2 = document.createElement("div");
    team2.className = "team2";
    var team2name = document.createElement("h4");
    team2name.className = "team2name";
    team2name.innerHTML = "Team 2";
    team2.appendChild(team2name);
    teamNames.appendChild(team2);

    tableTeams.appendChild(teamNames);

    var tableChoose = document.createElement("div");
    tableChoose.className = "tableChoose";

    var team1Choose = document.createElement("div");
    team1Choose.className = "team1";
    var team1label = document.createElement("label");
    var team1radio = document.createElement("input");
    team1radio.type = "radio";
    team1radio.name = tableId;
    team1radio.value = 1;
    team1label.appendChild(team1radio);
    var team1trophyDiv = document.createElement("div");
    team1trophyDiv.className = "teamTrophy";
    var team1trophy = document.createElement("i");
    team1trophy.className = "fa fa-3x fa-trophy";
    team1trophyDiv.appendChild(team1trophy);
    team1label.appendChild(team1trophyDiv);
    team1Choose.appendChild(team1label);
    tableChoose.appendChild(team1Choose)

    var vsButton = document.createElement("div");
    vsButton.className = "vs";
    var winButton = document.createElement("button");
    winButton.className = "btn teamWinBtn";
    winButton.innerHTML = "Validate";
    winButton.onclick = function() {gameMaker.finishGame(this)};
    vsButton.appendChild(winButton);
    tableChoose.appendChild(vsButton);

    var team2Choose = document.createElement("div");
    team2Choose.className = "team2";
    var team2label = document.createElement("label");
    var team2radio = document.createElement("input");
    team2radio.type = "radio";
    team2radio.name = tableId;
    team2radio.value = 2;
    team2label.appendChild(team2radio);
    var team2trophyDiv = document.createElement("div");
    team2trophyDiv.className = "teamTrophy";
    var team2trophy = document.createElement("i");
    team2trophy.className = "fa fa-3x fa-trophy";
    team2trophyDiv.appendChild(team2trophy);
    team2label.appendChild(team2trophyDiv);
    team2Choose.appendChild(team2label);
    tableChoose.appendChild(team2Choose);

    tableTeams.appendChild(tableChoose);

    cupTable.appendChild(tableTeams);
    tablesList.appendChild(cupTable);
  }

  this.updateTable = function(game) {
    var tableId = "table" + game.table.id;
    var table = document.getElementById(tableId);
    var t1 = table.querySelector(".team1name");
    t1.innerHTML = game.team1.name;
    var t2 = table.querySelector(".team2name");
    t2.innerHTML = game.team2.name;
    var button = table.querySelector(".teamWinBtn");
    button.setAttribute("round", game.round);
    button.setAttribute("game", game.game);
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
    for(var i = 0; i < this.totalRounds; i++) {
      var id = "round" + i;
      var round = document.getElementById(id);
      if(round.childNodes.length < 2) {
        round.className = "row hidden";
      } else {
        round.className = "row";
      }
    }
  }

  this.setDeleteTable = function(e) {
    var table = e.parentNode.parentNode;
    var id = table.getAttribute("tableId");
    var box = document.createElement("div");
    box.className = "message hidden";
    box.setAttribute("tableId", id);

    var span = document.createElement("span");
    span.innerHTML = "Voulez vous enlever la table après la partie?";
    box.appendChild(span);

    var b1 = document.createElement("button");
    b1.className = "btn";
    b1.innerHTML = "OUI"
    b1.onclick = function() {gameMaker.confirmDeleteTable(this)};
    box.appendChild(b1);

    var b2 = document.createElement("button");
    b2.className = "btn";
    b2.innerHTML = "NON"
    b2.onclick = function() {gameMaker.dontDeleteTable(this)};
    box.appendChild(b2);

    messageBox.appendChild(box);
    box.className = "message animated fadeIn";
    // table.setAttribute("delete", "true");
  }

  this.confirmDeleteTable = function(e) {
    var box = e.parentNode;
    var id = "table" + box.getAttribute("tableId");
    var table = document.getElementById(id);
    table.setAttribute("delete", "true");
    box.className = "message animated fadeOut";
    setTimeout(function() {
      box.parentNode.removeChild(box);
    }, 1000);
  }

  this.dontDeleteTable = function(e) {
    var box = e.parentNode;
    box.className = "message animated fadeOut";
    setTimeout(function() {
      box.parentNode.removeChild(box);
    }, 1000);
  }

  this.showWaitingList = function() {
    var waitingList = [];
    for(var i = 0; i < this.waitingList.length; i++) {
      var t1 = this.waitingList[i].team1;
      var t2 = this.waitingList[i].team2;
      this.addToWaitingList(t1, t2);
      waitingList.push({ team1: t1.name, team2: t2.name });
    }
    ipcRenderer.send('waitingList', waitingList);
  }

  this.addToWaitingList = function(team1, team2) {
    var nextMatch = document.createElement("li");
    nextMatch.className = "nextMatch";

    var team1div = document.createElement("div");
    team1div.className = "team1";
    var team1name = document.createElement("h5");
    team1name.innerHTML = team1.name;
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
    team2name.innerHTML = team2.name;
    team2div.appendChild(team2name);
    nextMatch.appendChild(team2div);

    nextMatches.appendChild(nextMatch);
  }

  this.removeFromWaitinglist = function() {
    var obj = nextMatches.querySelector(".nextMatch:first-child");
    obj.parentNode.removeChild(obj);
  }

  // this.showRound = function() {
  //   roundNb.innerHTML = this.round;
  // }
}
let gameMaker = new GameMaking();

addTeam = function() {
  var teamName = teamNameInput.value.trim();
  var player1Name = player1NameInput.value.trim();
  var player2Name = player2NameInput.value.trim();
  var player1Licence = player1LicenceInput.value.trim();
  var player2Licence = player2LicenceInput.value.trim();
  // teams.push({
  //   name: teamName,
  //   player1: player1Name,
  //   player2: player2Name
  // });
  if(teamName.length > 0 && player1Name.length > 0 && player2Name.length > 0) {
    var teamId = Team.list.length;
    new Team(teamId, teamName, player1Name, player2Name, player1Licence, player2Licence, false);
    addTeamToList(teamId, teamName, player1Name, player2Name, player1Licence, player2Licence, false);
  }
}

addTeamToList = function(teamid, teamName, player1Name, player2Name, player1Licence, player2Licence, present) {
  var tr = document.createElement("tr");

  var id = document.createElement("td");
  id.innerHTML = Team.list.length;
  id.className = "idField";
  tr.appendChild(id);

  var team = document.createElement("td");
  team.className = "tableText"
  var teamSpan = document.createElement("span");
  teamSpan.innerHTML = teamName;
  teamSpan.className = "teamSpan";
  team.appendChild(teamSpan);
  var teamEdit = document.createElement("input");
  teamEdit.value = teamName;
  teamEdit.className = "teamEdit form-control hidden";
  team.appendChild(teamEdit);
  tr.appendChild(team);

  var p1 = document.createElement("td");
  p1.className = "tableText"
  var p1Span = document.createElement("span");
  p1Span.innerHTML = player1Name;
  p1Span.className = "p1Span";
  p1.appendChild(p1Span);
  var p1LicenceSpan = document.createElement("h6");
  p1LicenceSpan.innerHTML = player1Licence;
  p1LicenceSpan.className = "p1LicenceSpan";
  p1.appendChild(p1LicenceSpan);
  var p1Edit = document.createElement("input");
  p1Edit.value = player1Name;
  p1Edit.className = "p1Edit form-control hidden";
  p1.appendChild(p1Edit);
  var p1LicenceEdit = document.createElement("input");
  p1LicenceEdit.value = player1Licence;
  p1LicenceEdit.className = "p1LicenceEdit form-control hidden";
  p1.appendChild(p1LicenceEdit);
  tr.appendChild(p1);

  var p2 = document.createElement("td");
  p2.className = "tableText"
  var p2Span = document.createElement("span");
  p2Span.innerHTML = player2Name;
  p2Span.className = "p2Span";
  p2.appendChild(p2Span);
  var p2LicenceSpan = document.createElement("h6");
  p2LicenceSpan.innerHTML = player2Licence;
  p2LicenceSpan.className = "p2LicenceSpan";
  p2.appendChild(p2LicenceSpan);
  var p2Edit = document.createElement("input");
  p2Edit.value = player2Name;
  p2Edit.className = "p2Edit form-control hidden";
  p2.appendChild(p2Edit);
  var p2LicenceEdit = document.createElement("input");
  p2LicenceEdit.value = player2Licence;
  p2LicenceEdit.className = "p2LicenceEdit form-control hidden";
  p2.appendChild(p2LicenceEdit);
  tr.appendChild(p2);

  var editBtnTd = document.createElement("td");
  editBtnTd.className = "btnColumn";
  var editBtn = document.createElement("button");
  editBtn.innerHTML = "Edit";
  editBtn.className = "btn editBtn";
  editBtn.id = "edit" + Team.list.length;
  editBtn.onclick = function() {editTeam(this)};
  editBtnTd.appendChild(editBtn);
  tr.appendChild(editBtnTd);
  var saveBtn = document.createElement("button");
  saveBtn.innerHTML = "Save";
  saveBtn.className = "btn saveBtn hidden";
  saveBtn.id = "save" + Team.list.length;
  saveBtn.onclick = function() {saveTeam(this)};
  editBtnTd.appendChild(saveBtn);
  tr.appendChild(editBtnTd);

  var removeBtnTd = document.createElement("td");
  removeBtnTd.className = "btnColumn";
  var removeBtn = document.createElement("button");
  removeBtn.innerHTML = "Remove";
  removeBtn.className = "btn";
  removeBtn.onclick = function() {removeTeam(this)};
  removeBtnTd.appendChild(removeBtn);
  tr.appendChild(removeBtnTd);

  var presentTd = document.createElement("td");
  presentTd.className = "presentBox";
  var presentLabel = document.createElement("span");
  if(present) {
    presentLabel.className = "checkbox checkboxChecked";
  } else {
    presentLabel.className = "checkbox";
  }
  presentLabel.onclick = function() {teamPresent(this)};
  var presentSpan = document.createElement("span");
  presentSpan.className = "checkboxInner";
  // var presentCheck = document.createElement("input");
  // presentCheck.type = "checkbox";
  // presentCheck.className = "checkboxInput";
  // presentSpan.appendChild(presentCheck);
  presentLabel.appendChild(presentSpan);
  presentTd.appendChild(presentLabel);
  tr.appendChild(presentTd);

  teamList.appendChild(tr);
  tr.scrollIntoView();
}

editTeam = function(btn) {
  var tr = btn.parentNode.parentNode;
  var teamSpan = tr.querySelector(".teamSpan");
  var teamEdit = tr.querySelector(".teamEdit");
  var p1Span = tr.querySelector(".p1Span");
  var p1LicenceSpan = tr.querySelector(".p1LicenceSpan");
  var p1Edit = tr.querySelector(".p1Edit");
  var p1LicenceEdit = tr.querySelector(".p1LicenceEdit");
  var p2Span = tr.querySelector(".p2Span");
  var p2LicenceSpan = tr.querySelector(".p2LicenceSpan");
  var p2Edit = tr.querySelector(".p2Edit");
  var p2LicenceEdit = tr.querySelector(".p2LicenceEdit");
  var saveBtn = tr.querySelector(".saveBtn");

  teamSpan.className = "teamSpan hidden";
  teamEdit.className = "teamEdit form-control";
  p1Span.className = "p1Span hidden";
  p1LicenceSpan.className = "p1LicenceSpan hidden";
  p1Edit.className = "p1Edit form-control";
  p1LicenceEdit.className = "p1LicenceEdit form-control";
  p2Span.className = "p2Span hidden";
  p2LicenceSpan.className = "p2LicenceSpan hidden";
  p2Edit.className = "p2Edit form-control";
  p2LicenceEdit.className = "p2LicenceEdit form-control";
  btn.className = "btn editBtn hidden";
  saveBtn.className = "btn saveBtn";
}

saveTeam = function(btn) {
  var tr = btn.parentNode.parentNode;
  var id = tr.querySelector(".idField").innerHTML;
  var teamSpan = tr.querySelector(".teamSpan");
  var teamEdit = tr.querySelector(".teamEdit");
  var p1Span = tr.querySelector(".p1Span");
  var p1LicenceSpan = tr.querySelector(".p1LicenceSpan");
  var p1Edit = tr.querySelector(".p1Edit");
  var p1LicenceEdit = tr.querySelector(".p1LicenceEdit");
  var p2Span = tr.querySelector(".p2Span");
  var p2LicenceSpan = tr.querySelector(".p2LicenceSpan");
  var p2Edit = tr.querySelector(".p2Edit");
  var p2LicenceEdit = tr.querySelector(".p2LicenceEdit");
  var editBtn = tr.querySelector(".editBtn");

  Team.list[id-1].name = teamEdit.value;
  Team.list[id-1].player1 = p1Edit.value;
  Team.list[id-1].player1Licence = p1LicenceEdit.value;
  Team.list[id-1].player2 = p2Edit.value;
  Team.list[id-1].player2Licence = p2LicenceEdit.value;

  teamSpan.innerHTML = teamEdit.value;
  p1Span.innerHTML = p1Edit.value;
  p1LicenceSpan.innerHTML = p1LicenceEdit.value;
  p2Span.innerHTML = p2Edit.value;
  p2LicenceSpan.innerHTML = p2LicenceEdit.value;
  teamSpan.className = "teamSpan";
  teamEdit.className = "teamEdit form-control hidden";
  p1Span.className = "p1Span";
  p1LicenceSpan.className = "p1LicenceSpan";
  p1Edit.className = "p1Edit form-control hidden";
  p1LicenceEdit.className = "p1LicenceEdit form-control hidden";
  p2Span.className = "p2Span";
  p2LicenceSpan.className = "p2LicenceSpan";
  p2Edit.className = "p2Edit form-control hidden";
  p2LicenceEdit.className = "p2LicenceEdit form-control hidden";
  btn.className = "btn saveBtn hidden";
  editBtn.className = "btn editBtn";
}

removeTeam = function(btn) {
  var tr = btn.parentNode.parentNode;
  var id = tr.querySelector(".idField").innerHTML;
  tr.parentNode.removeChild(tr);
  Team.list.splice(id-1, 1);
  resetId();
}

teamPresent = function(obj) {
  var tr = obj.parentNode.parentNode;
  var id = tr.querySelector(".idField").innerHTML;
  if(obj.className == "checkbox") {
    obj.className = "checkbox checkboxChecked";
    Team.list[id-1].present = true;
  } else {
    obj.className = "checkbox";
    Team.list[id-1].present = false;
  }
}

addPrice = function() {
  var priceName = priceNameInput.value.trim();
  var priceProb = priceProbInput.value.trim();
  var priceId = Price.list.length-1;
  new Price(priceId, priceName, priceProb);
  if(priceName.length > 0 && priceProb.length > 0) {
    addPriceToList(priceId, priceName, priceProb);
  }
}

addPriceToList = function(id, priceName, priceProb) {
  var li = document.createElement("li");
  li.className = "price";
  li.id = "price" + id;

  var idField = document.createElement("span");
  idField.innerHTML = id;
  idField.className = "idField hidden";
  li.appendChild(idField);

  var nameDiv = document.createElement("div");
  nameDiv.className = "priceName";

  var priceNameSpan = document.createElement("span");
  priceNameSpan.innerHTML = priceName;
  nameDiv.appendChild(priceNameSpan);
  var nameEdit = document.createElement("input");
  nameEdit.value = priceName;
  nameEdit.className = "nameEdit form-control hidden";
  nameDiv.appendChild(nameEdit);
  li.appendChild(nameDiv);

  var probDiv = document.createElement("div");
  probDiv.className = "priceProb";

  var priceProbSpan = document.createElement("span");
  priceProbSpan.innerHTML = priceProb + "%";
  probDiv.appendChild(priceProbSpan);
  var inputGroup = document.createElement("div");
  inputGroup.className = "input-group hidden";
  var probEdit = document.createElement("input");
  probEdit.type = "number";
  probEdit.value = priceProb;
  probEdit.className = "probEdit form-control";
  inputGroup.appendChild(probEdit);
  var inputGroupAddon = document.createElement("div");
  inputGroupAddon.className = "input-group-addon";
  inputGroupAddon.innerHTML = "%";
  inputGroup.appendChild(inputGroupAddon);
  probDiv.appendChild(inputGroup);
  li.appendChild(probDiv);

  var editBtnDiv = document.createElement("div");
  editBtnDiv.className = "btnDiv";
  var editBtn = document.createElement("button");
  editBtn.innerHTML = "Edit";
  editBtn.className = "btn editBtn";
  editBtn.id = "edit" + Team.list.length;
  editBtn.onclick = function() {editPrice(this)};
  editBtnDiv.appendChild(editBtn);
  var saveBtn = document.createElement("button");
  saveBtn.innerHTML = "Save";
  saveBtn.className = "btn saveBtn hidden";
  saveBtn.id = "save" + Team.list.length;
  saveBtn.onclick = function() {savePrice(this)};
  editBtnDiv.appendChild(saveBtn);
  li.appendChild(editBtnDiv);

  var removeBtnDiv = document.createElement("div");
  removeBtnDiv.className = "btnDiv";
  var removeBtn = document.createElement("button");
  removeBtn.innerHTML = "Remove";
  removeBtn.className = "btn";
  removeBtn.onclick = function() {removePrice(this)};
  removeBtnDiv.appendChild(removeBtn);
  li.appendChild(removeBtnDiv);

  priceList.appendChild(li);
  li.scrollIntoView();
}

editPrice = function(btn) {
  var li = btn.parentNode.parentNode;
  var nameSpan = li.querySelector(".priceName span");
  var nameEdit = li.querySelector(".nameEdit");
  var probSpan = li.querySelector(".priceProb span");
  var probGroup = li.querySelector(".input-group");
  //var probEdit = li.querySelector(".probEdit");
  var saveBtn = li.querySelector(".saveBtn");

  nameSpan.className = "hidden";
  nameEdit.className = "nameEdit form-control";
  probSpan.className = "hidden";
  probGroup.className = "input-group";
  btn.className = "btn editBtn hidden";
  saveBtn.className = "btn saveBtn";
}

savePrice = function(btn) {
  var li = btn.parentNode.parentNode;
  var id = li.querySelector(".idField").innerHTML;
  var nameSpan = li.querySelector(".priceName span");
  var nameEdit = li.querySelector(".nameEdit");
  var probSpan = li.querySelector(".priceProb span");
  var probGroup = li.querySelector(".input-group");
  var probEdit = li.querySelector(".probEdit");
  var editBtn = li.querySelector(".editBtn");

  Price.list[id].name = nameEdit.value;
  Price.list[id].prob = probEdit.value;

  nameSpan.innerHTML = nameEdit.value;
  probSpan.innerHTML = probEdit.value + "%";
  nameSpan.className = "";
  nameEdit.className = "nameEdit form-control hidden";
  probSpan.className = "";
  probGroup.className = "input-group hidden";
  btn.className = "btn saveBtn hidden";
  editBtn.className = "btn editBtn";
}

removePrice = function(btn) {
  var li = btn.parentNode.parentNode;
  var id = li.querySelector(".idField").innerHTML;
  li.parentNode.removeChild(li);
  Team.list.splice(id-1, 1);
}

playLottery = function() {
  lottery.play();
}

lotteryNewTeam = function() {
  lottery.newTeam();
}

finishLottery = function() {
  lottery.finish();
}

saveTeamsToFile = function() {
  dialog.showSaveDialog({ defaultPath: '/teams.cupPong',
    filters: [{ name: 'Cup Pong Teams', extensions: ['cupPong'] }]}, (fileName) => {
      if (fileName === undefined){
          // console.log("You didn't save the file");
          return;
      }
      var obj = { teams: Team.list };
      let content = JSON.stringify(obj);
      fs.writeFile(fileName, content, (err) => {
          if(err){
              alert("An error ocurred creating the file "+ err.message)
          }
          // alert("The file has been succesfully saved");
      });
  });
}
savePricesToFile = function() {
  dialog.showSaveDialog({ defaultPath: '/prices.cupPongPrice',
    filters: [{ name: 'Cup Pong Prices', extensions: ['cupPongPrice'] }]}, (fileName) => {
      if (fileName === undefined){
          // console.log("You didn't save the file");
          return;
      }
      var obj = { teams: Price.list };
      let content = JSON.stringify(obj);
      fs.writeFile(fileName, content, (err) => {
          if(err){
              alert("An error ocurred creating the file "+ err.message)
          }
          // alert("The file has been succesfully saved");
      });
  });
}

loadTeamsFromFile = function() {
  dialog.showOpenDialog({ filters: [
     { name: 'Cup Pong Teams', extensions: ['cupPong'] }
   ]}, (fileNames) => {
    // fileNames is an array that contains all the selected
    if(fileNames === undefined){
        // console.log("No file selected");
        return;
    }
    var fileName = fileNames[0];
    fs.readFile(fileName, 'utf-8', (err, data) => {
        if(err){
            alert("An error ocurred reading the file :" + err.message);
            return;
        }
        // console.log("The file content is : " + data);
        var obj = JSON.parse(data);
        // console.log(obj);
        Team.list = [];
        teamList.innerHTML = "";
        for(var i = 0; i < obj.teams.length; i++) {
          var t = obj.teams[i];
          new Team(t.id, t.name, t.player1, t.player2, t.player1Licence, t.player2Licence, t.present);
          addTeamToList(t.id, t.name, t.player1, t.player2, t.player1Licence, t.player2Licence, t.present);
        }
    });
  });
}
loadTeamsFromExcel = function() {
  dialog.showOpenDialog({ filters: [
     { name: 'Excel (.xlsx)', extensions: ['xlsx'] }
   ]}, (fileNames) => {
    // fileNames is an array that contains all the selected
    if(fileNames === undefined){
        // console.log("No file selected");
        return;
    }
    var fileName = fileNames[0];
    // fs.readFile(fileName, 'utf-8', (err, data) => {
    //     if(err){
    //         alert("An error ocurred reading the file :" + err.message);
    //         return;
    //     }
    //     // console.log("The file content is : " + data);
    //     var obj = JSON.parse(data);
    //     // console.log(obj);
    //     Team.list = [];
    //     teamList.innerHTML = "";
    //     for(var i = 0; i < obj.teams.length; i++) {
    //       var t = obj.teams[i];
    //       new Team(t.id, t.name, t.player1, t.player2, t.present);
    //       addTeamToList(t.id, t.name, t.player1, t.player2, t.present);
    //     }
    // });

    //console.log(XLSX.utils.sheet_to_html(fileName));
  });
}
loadPricesFromFile = function() {
  dialog.showOpenDialog({ filters: [
     { name: 'Cup Pong Prices', extensions: ['cupPongPrice'] }
   ]}, (fileNames) => {
    // fileNames is an array that contains all the selected
    if(fileNames === undefined){
        // console.log("No file selected");
        return;
    }
    var fileName = fileNames[0];
    fs.readFile(fileName, 'utf-8', (err, data) => {
        if(err){
            alert("An error ocurred reading the file :" + err.message);
            return;
        }
        // console.log("The file content is : " + data);
        var obj = JSON.parse(data);
        // console.log(obj);
        Price.list = [];
        priceList.innerHTML = "";
        for(var i = 0; i < obj.teams.length; i++) {
          var p = obj.teams[i];
          new Price(p.id, p.name, p.prob);
          addPriceToList(p.id, p.name, p.prob);
        }
    });
  });
}

resetId = function() {
  var list = teamList.children;
  for(var i = 0; i < list.length; i++) {
    list[i].querySelector(".idField").innerHTML = i+1;
  }
}

sendMessage = function(message) {
  var box = document.createElement("div");
  box.className = "message hidden";
  box.innerHTML = message;
  messageBox.appendChild(box);
  box.className = "message animated fadeIn";
  setTimeout(function() {
    box.className = "message animated fadeOut";
    setTimeout(function() {
      box.parentNode.removeChild(box);
    }, 1000);
  }, 4000);
}

toggleLottery = function() {
  if(lotteryDiv.className == "") {
    lotteryDiv.className = "lotteryOpen";
  } else {
    lotteryDiv.className = "";
  }
}

startGame = function() {
  if(Team.list.length < 2) {
    sendMessage("Vous devez ajouter au moins 2 équipes");
    return;
  }
  gameMaker.nbTables = document.getElementById("nbTables").value;
  gameMaker.teamsList = [];
  for(var i = 0; i < Team.list.length; i++) {
    if(Team.list[i].present) {
      gameMaker.teamsList.push(Team.list[i]);
      lottery.teams.push(Team.list[i]);
    }
  }
  if(gameMaker.teamsList.length > 1) {
    if(gameMaker.nbTables > (gameMaker.teamsList / 2)) {
      var nb = Team.list.length;
      if(nb % 2 == 1) {
        nb -= 1;
      }
      gameMaker.nbTables = nb/2;
    }
    lottery.prices = Price.list;
    lottery.makeTable();
    loadSaveLottery.className = "hidden";
    lotteryEdit.className = "hidden";
    lotteryPlay.className = "";
    gameMaker.start();
  } else {
    sendMessage("Il n'y a pas assez d'équipes présents");
  }
}

random = function(min, max) {
  return Math.floor(min + (Math.random() * (max - min)));
}
