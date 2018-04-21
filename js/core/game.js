'use strict'
/*
#About: Class to manage players and events
*/
//Constants
var GAME_REPEAT_WINDOW = 8; //Check for repeats this far back
var PLAYER_HUMAN = 0;
var PLAYER_RANDOM = 1;
var PLAYER_HEURISTIC = 2;
var PLAYER_NETWORK = 3;
var PLAYER_MONTECARLO = 4;
var PLAYER_ALPHABETA = 5;
var PLAYER_ITERATIVE_DEEPENING = 6;


var EVENT_INVALID = 0;
var EVENT_PLAYED = 1;
var EVENT_GAME_OVER = 2;
var EVENT_BOARD_UPDATE = 3;
var EVENT_SUGGEST = 4;


//Class Game
function Game(boardStr) {
	this.board = new Board(boardStr); //The main (current) board instance		
	boardStr = this.board.toString(); //Update
	
	//Add initial state
	this.history = [boardStr]; //History is for game log
	this.memory = {}; //Memory is for detecting repeats
	this.memory[boardStr] = true;
	this.undoHistory = [];
	
	this.players = [PLAYER_HUMAN, PLAYER_HUMAN];
	
	this.gameEvents = {}; //Callbacks to update UI	
	this.tmpMove;
	this.suggesting = false;
}


Game.prototype.updateBoard = function(newBoard) {
	this.board = newBoard;
	this.gameEvents[EVENT_BOARD_UPDATE](newBoard);
}

//Event methods
Game.prototype.addEventListener = function(name, callback) {	
	this.gameEvents[name] = callback;
}


Game.prototype.onGameOver = function(winner) {
		
	//this.logCurrentState(boardCopy);
	
	//Draw the win and other hoopla...
	this.gameEvents[EVENT_GAME_OVER](winner, +(!winner));
		
}

Game.prototype.undoMove = function() {
	
	if (this.history.length > 1) {	
		var oldTurn = this.board.turn;
		var oldStr = this.history.pop();
		this.undoHistory.push(oldStr);
		delete this.memory[oldStr];
		var boardStr = this.history[this.history.length-1];
		
		this.board = new Board(boardStr);		
		this.board.turn = +(!oldTurn);		
		Url.setHash(boardStr);
		return true;		
	}
	return false;
}

Game.prototype.redoMove = function() {	
	if (this.undoHistory.length > 0) {	
		var oldTurn = this.board.turn;
		var savedStr = this.undoHistory.pop();
		this.history.push(savedStr);
		this.memory[savedStr] = true;
		this.board = new Board(savedStr);							
		this.board.turn = +(!oldTurn);
		Url.setHash(savedStr);
		
		//Check for Game over		
		if (this.board.isGameOver()) this.onGameOver(this.board.turn);				
		return true;
	}
	return false;
}



//Helper function keep track of game history
Game.prototype.logCurrentState = function(board) {
	var boardStr = board.toString();
	this.history.push(boardStr);

	this.memory[boardStr] = true;
}


//Player functions
Game.prototype.play = function() {
	
	var board = this.board;
	var turn = board.getTurn();
	var player = this.players[turn];
	
	if (player == PLAYER_HUMAN) return; //Ignore
	
	//Handle no-move, and one move
	var moves = board.getMoves();	
	if (moves.length == 0) return this.onPlayed();
	else if (moves.length == 1) return this.onPlayed(moves[0]);
	
	
	//All Async - expect onPlayed callback	
	switch (player) {
		case PLAYER_NETWORK: NetworkPlayer.getPlay(board, this.onPlayed); break;	 	//Network
		case PLAYER_RANDOM: RandomPlayer.getPlay(board, this.onPlayed); break;			//Random
		case PLAYER_HEURISTIC: HeuristicPlayer.getPlay(board, this.onPlayed); break;	//Heuristic					
		case PLAYER_MONTECARLO: MonteCarloPlayer.getPlay(board, this.onPlayed); break;	//MonteCarlo					
		case PLAYER_ALPHABETA: AlphaBetaPlayer.getPlay(board, this.onPlayed); break;	//AlphaBeta					
		case PLAYER_ITERATIVE_DEEPENING: IterativeDeepeningPlayer.getPlay(board, this.onPlayed); break;	//IterativeDeepening							
		default: alert('Invalid player');
	}		
}


Game.prototype.onPlayed = function(move) {
	var self = game;	
			
	var board = self.board;	
	var turn = board.getTurn();
	var player = self.players[turn];
	
	var moveCode = board.canMove(move.sr, move.sc, move.dr, move.dc);
	if (moveCode != VALID) return alert('Player attempted invalid move:\n' + invalidMsg(moveCode));
		
	//Update board
	board.makeMove(move.sr, move.sc, move.dr, move.dc);			
	
	//History and Memory
	self.logCurrentState(board);	
	
	//Check for game over
	if (board.isGameOver()) self.onGameOver(board.turn);
	else {
		board.changeTurn();
		self.gameEvents[EVENT_PLAYED](player, move);
	}
}

Game.prototype.onPlayerConfig = function(player) {
	if (this.players[player] == PLAYER_NETWORK) NetworkPlayer.configPlayer(player);	
			
}

Game.prototype.onSuggestMove = function() {
	var self = game;
	if (!self.suggesting) {
		self.suggesting = true;
		var waiting = document.getElementById('suggestWaiting');
		var waitInterval = setInterval(function() {
			if (waiting.textContent.length >= 4) waiting.textContent = '';
			else waiting.textContent += '.';
			
			if (!self.suggesting) {
				waiting.textContent = '';
				clearInterval(waitInterval);
			}
		}, 500);
		var board = self.board;
		var turn = board.getTurn();
		var player = self.players[turn];
				
		IterativeDeepeningPlayer.getPlay(board, function(move) {				
			self.suggesting = false;
			self.gameEvents[EVENT_SUGGEST](player, move);
		});
	}
}

//end class Game
