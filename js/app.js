const { ipcRenderer } = require('electron');
const {dialog} = require('electron').remote;
var fs = require('fs');

var body = document.getElementById("body");
body.style.height = window.innerHeight + "px";
var teamList = document.getElementById("teamList");
teamList.style.height = (window.innerHeight * 0.85) + "px";

var main = document.getElementById("main");

var overview = document.getElementById("overview");
var tablesList = document.getElementById("tablesList");
tablesList.style.height = (window.innerHeight * 0.9) + "px";
var roundNb = document.getElementById("roundNb");
var nextMatches = document.getElementById("nextMatches");
nextMatches.style.height = (window.innerHeight * 0.9) + "px";

var teamNameInput = document.getElementById("teamName");
var player1NameInput = document.getElementById("player1Name");
var player2NameInput = document.getElementById("player2Name");

var Team = function(id, name, p1, p2) {
  this.id = id;
  this.name = name;
  this.player1 = p1;
  this.player2 = p2;
  this.present = false;

  Team.list.push(this);
}
Team.list = [];
// new Team(0, "βΔΞ", "Lee Geertsen", "Valerio Ripperino");
// for (var i = 1; i < 3; i++) {
//   var name = "TEAMTEAMTEAMTEAM" + (i+1);
//   new Team(i, name, "lol", "lol");
// }
// for (var i = 3; i < 6; i++) {
//   var name = "TEAMTEAM TEAMTEAM" + (i+1);
//   new Team(i, name, "lol", "lol");
// }


var Table = function(id) {
  this.id = id;
  this.free = true;
  this.inUse = true;

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
    var data = { nbTables: this.nbTables };
    ipcRenderer.send('createTables', data);
    this.shuffle();
    this.teams = this.teamsList.length;
    this.games = this.teams-1;
    this.makeTree();
    this.createTables();
    this.round++;
    this.showRound();
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
      games.push({ tableId: game.table.id, team1: game.team1.name, team2: game.team2.name });
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
              tableId: game.table.id,
              team1: game.team1.name,
              team2: game.team2.name,
              winner: winner.value
            },
            newGame: {
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
    this.teamsList = Team.list;
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

    // var closeDiv = document.createElement("div");
    // closeDiv.className = "close";
    // var close = document.createElement("i");
    // close.className = "fa fa-times";
    // close.setAttribute("aria-hidden", "true");
    // close.onclick = function() {gameMaker.setDeleteTable(this)};
    // closeDiv.appendChild(close);
    // cupTable.appendChild(closeDiv);

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
  }

  this.setDeleteTable = function(e) {
    var table = e.parentNode.parentNode;
    table.setAttribute("delete", "true");
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

  this.showRound = function() {
    roundNb.innerHTML = this.round;
  }
}
let gameMaker = new GameMaking();

addTeam = function() {
  var teamName = teamNameInput.value.trim();
  var player1Name = player1NameInput.value.trim();
  var player2Name = player2NameInput.value.trim();
  // teams.push({
  //   name: teamName,
  //   player1: player1Name,
  //   player2: player2Name
  // });
  var teamId = Team.list.length;
  new Team(teamId, teamName, player1Name, player2Name);
  if(teamName.length > 0 && player1Name.length > 0 && player2Name.length > 0) {
    addTeamToList(teamId, teamName, player1Name, player2Name);
  }
}

addTeamToList = function(teamid, teamName, player1Name, player2Name) {
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
  var teamEdit = document.createElement("input");
  teamEdit.value = teamName;
  teamEdit.className = "teamEdit form-control hidden";
  team.appendChild(teamSpan);
  team.appendChild(teamEdit);
  tr.appendChild(team);

  var p1 = document.createElement("td");
  p1.className = "tableText"
  var p1Span = document.createElement("span");
  p1Span.innerHTML = player1Name;
  p1Span.className = "p1Span";
  var p1Edit = document.createElement("input");
  p1Edit.value = player1Name;
  p1Edit.className = "p1Edit form-control hidden";
  p1.appendChild(p1Span);
  p1.appendChild(p1Edit);
  tr.appendChild(p1);

  var p2 = document.createElement("td");
  p2.className = "tableText"
  var p2Span = document.createElement("span");
  p2Span.innerHTML = player2Name;
  p2Span.className = "p2Span";
  var p2Edit = document.createElement("input");
  p2Edit.value = player2Name;
  p2Edit.className = "p2Edit form-control hidden";
  p2.appendChild(p2Span);
  p2.appendChild(p2Edit);
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

  teamList.appendChild(tr);
  tr.scrollIntoView();
}

editTeam = function(btn) {
  var tr = btn.parentNode.parentNode;
  var teamSpan = tr.querySelector(".teamSpan");
  var teamEdit = tr.querySelector(".teamEdit");
  var p1Span = tr.querySelector(".p1Span");
  var p1Edit = tr.querySelector(".p1Edit");
  var p2Span = tr.querySelector(".p2Span");
  var p2Edit = tr.querySelector(".p2Edit");
  var saveBtn = tr.querySelector(".saveBtn");

  teamSpan.className = "teamSpan hidden";
  teamEdit.className = "teamEdit form-control";
  p1Span.className = "p1Span hidden";
  p1Edit.className = "p1Edit form-control";
  p2Span.className = "p2Span hidden";
  p2Edit.className = "p2Edit form-control";
  btn.className = "btn editBtn hidden";
  saveBtn.className = "btn saveBtn";
}

saveTeam = function(btn) {
  var tr = btn.parentNode.parentNode;
  var id = tr.querySelector(".idField").innerHTML;
  var teamSpan = tr.querySelector(".teamSpan");
  var teamEdit = tr.querySelector(".teamEdit");
  var p1Span = tr.querySelector(".p1Span");
  var p1Edit = tr.querySelector(".p1Edit");
  var p2Span = tr.querySelector(".p2Span");
  var p2Edit = tr.querySelector(".p2Edit");
  var editBtn = tr.querySelector(".editBtn");

  Team.list[id-1].name = teamEdit.value;
  Team.list[id-1].player1 = p1Edit.value;
  Team.list[id-1].player2 = p2Edit.value;

  teamSpan.innerHTML = teamEdit.value;
  p1Span.innerHTML = p1Edit.value;
  p2Span.innerHTML = p2Edit.value;
  teamSpan.className = "teamSpan";
  teamEdit.className = "teamEdit form-control hidden";
  p1Span.className = "p1Span";
  p1Edit.className = "p1Edit form-control hidden";
  p2Span.className = "p2Span";
  p2Edit.className = "p2Edit form-control hidden";
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
          new Team(t.id, t.name, t.player1, t.player2);
          addTeamToList(t.id, t.name, t.player1, t.player2);
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

var messageBox = document.createElement("div");
messageBox.className = "messageBox hidden";

sendMessage = function(message) {
  var box = messageBox;
  box.innerHTML = message;
  body.appendChild(box);
  box.className = "messageBox animated fadeIn";
  setTimeout(function() {
    box.className = "messageBox hidden animated fadeOut";
    setTimeout(function() {
      box.parentNode.removeChild(box);
    }, 1000);
  }, 4000);
}

startGame = function() {
  if(Team.list.length < 2) {
    sendMessage("Vous devez ajouter au moins 2 équipes");
    return;
  }
  gameMaker.nbTables = document.getElementById("nbTables").value
  if(gameMaker.nbTables > Team.list.length / 2) {
    var nb = Team.list.length;
    if(nb % 2 == 1) {
      nb -= 1;
    }
    gameMaker.nbTables = nb/2;
  }
  gameMaker.start();
}

random = function(min, max) {
  return Math.floor(min + (Math.random() * (max - min)));
}
