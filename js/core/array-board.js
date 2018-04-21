var VALID = 0;
var INVALID = -1;
var INVALID_JUMP = 1;
var INVALID_SOURCE = 2;
var INVALID_MOVE = 3;
var INVALID_TURN = 4;
var INVALID_BOUNDS = 5;
var INVALID_DESTINATION = 6;

var GAME_IN_PLAY = 0;
var GAME_WIN = 1;

var BOARD_SIZE = 8;
var BOARD_SIZE_MINUS_1 = BOARD_SIZE-1;
var BOARD_SPACES = 64;

var PLAYER1 = 0;
var PLAYER2 = 1;
var EMPTY = -1; 

function invalidMsg(invalid) {
	switch(invalid) {
		case VALID: return 'Valid';
		case INVALID_MOVE: return 'Nope: can only move forward one row...'; 
		case INVALID_JUMP: return 'Nope: jumps must be diagonal...'; 
		case INVALID_SOURCE: return 'Nope: not your pin...'; 
		case INVALID_TURN: return 'Nope: wrong player...';
		case INVALID_BOUNDS: return 'Nope: must move on the board...';
		case INVALID_DESTINATION: return 'Nope: destination not empty...';
		default: return 'Nope: invalid...';
	}
}

//Class Board 
function Board() {	
	
	this.turn = PLAYER1;
	this.board = new Array(BOARD_SIZE);
	for (var i = 0; i < BOARD_SIZE; i++) {
		this.board[i] = new Array(BOARD_SIZE);
	}
	
	
}

Board.prototype.init = function(boardStr) {	
	
	if (boardStr && boardStr.length == BOARD_SPACES + 1) this.fromString(boardStr);			
	else { //Init
		
		for (var i = 0; i < BOARD_SIZE; i++) {
			this.board[0][i] = PLAYER2;
			this.board[1][i] = PLAYER2;
			
			this.board[2][i] = EMPTY;
			this.board[3][i] = EMPTY;
			this.board[4][i] = EMPTY;
			this.board[5][i] = EMPTY;				
			
			this.board[BOARD_SIZE-2][i] = PLAYER1;
			this.board[BOARD_SIZE_MINUS_1][i] = PLAYER1;
		}
	}
	
}

Board.prototype.copy = function() {
	var newBoard = new Board();
	for (var r = 0; r < BOARD_SIZE; r++) {
		for (var c = 0; c < BOARD_SIZE; c++) {
			newBoard.board[r][c] = this.board[r][c];
		}
	}
	newBoard.turn = this.turn;
	return newBoard;	
}


Board.prototype.onBoard = function(r, c) {
	if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return false;
	else return true;
}

Board.prototype.canSelect = function(r, c) {	
	
	if (this.board[r][c] == this.turn) return true;
	else return false;
	
}


Board.prototype.canMove = function(sr, sc, dr, dc) {	

	if (!this.onBoard(sr, sc) || !this.onBoard(dr, dc)) return INVALID_BOUNDS;	//Out of bounds
	else if (!this.canSelect(sr, sc)) return INVALID_SOURCE; //Invalid selection
	else {
		var dir = (this.turn * 2) - 1;
		var oppTurn = +(!this.turn);
		if (sr + dir != dr) return INVALID_MOVE;
		else if (Math.abs(sc - dc) >= 2) return INVALID_MOVE;
		else if (sc != dc) { //Diagonal
			if (this.board[dr][dc] != EMPTY && this.board[dr][dc] != oppTurn) return INVALID_DESTINATION;			
		}
		else if (this.board[dr][dc] != EMPTY) return INVALID_JUMP;
		
	}
	
	return VALID;
}

Board.prototype.getMoves = function() {	
	var turn = this.turn;
	var oppTurn = +(!turn);
	var moves = [];
	var dir = (this.turn * 2) - 1;
	for (var r = 0; r < BOARD_SIZE; r++) {		
		for (var c = 0; c < BOARD_SIZE; c++) {
			var pin = this.board[r][c];
			if (pin == turn) {
				var dr = r+dir;
				if (dr < 0 || dr >= BOARD_SIZE) continue;
				if (this.board[dr][c] == EMPTY) moves.push({sr:r, sc:c, dr:dr, dc:c});
				if (this.board[dr][c+1] == EMPTY || this.board[dr][c+1] == oppTurn) moves.push({sr:r, sc:c, dr:dr, dc:c+1});
				if (this.board[dr][c-1] == EMPTY || this.board[dr][c-1] == oppTurn) moves.push({sr:r, sc:c, dr:dr, dc:c-1});
			}
		}
	}
	return moves;
}

Board.prototype.makeMove = function(sr, sc, dr, dc) {	
	//Assume that it has already been validated	
	this.board[dr][dc] = this.board[sr][sc]; //Will overwrite for jumps
	this.board[sr][sc] = EMPTY;
}

	
var WEIGHT_PIN = 1;
var WEIGHT_COLUMNS = [4,3,2,1,1,2,3,4];
var WEIGHT_BACKROW = 2;
var WEIGHT_NEAR_GOAL = 2;
Board.prototype.score = function() {

	//minus zigzags?
	var turn = this.turn;
	var oppTurn = +(!turn);
	
	var scores = [0,0];
	for (var r = 0; r < BOARD_SIZE; r++) {	
			
		//Win / Final line of defense
		if (this.board[0][r] == PLAYER2) scores[PLAYER2] += WEIGHT_BACKROW; 
		else if (this.board[0][r] == PLAYER1) scores[PLAYER1] += INFINITY;
		
		if (this.board[BOARD_SIZE_MINUS_1][r] == PLAYER1) scores[PLAYER1] += WEIGHT_BACKROW; 
		else if (this.board[BOARD_SIZE_MINUS_1][r] == PLAYER2) scores[PLAYER2] += INFINITY; 
		
		
		for (var c = 0; c < BOARD_SIZE; c++) {
			var pin = this.board[r][c];
			if (pin != EMPTY) {
				scores[pin] += WEIGHT_PIN; //Material advantage
				scores[pin] += WEIGHT_COLUMNS[c]; //How close to edge
				
				//Distance to goal
				if (pin == PLAYER1) scores[PLAYER1] += c * WEIGHT_NEAR_GOAL;
				else scores[PLAYER2] += (BOARD_SIZE_MINUS_1 - c) * WEIGHT_NEAR_GOAL;
			}
		}
	}
	
	return scores[turn]-scores[oppTurn];
	
}


Board.prototype.getTurn = function() {
	return this.turn;
}

Board.prototype.getPin = function(r, c) {	
	
	return this.board[r][c];
}


Board.prototype.changeTurn = function() {
	this.turn = +(!this.turn);
}


Board.prototype.toString = function() {	
	
	//Serialize into Breakthrough Board Notation (BBN)
	var boardStr = '';
	for (var r = BOARD_SIZE_MINUS_1; r >= 0; r--) {
		for (var c = 0; c < BOARD_SIZE; c++) {
			var pin = this.board[r][c];
			if (pin == PLAYER1) boardStr += '1';
			else if (pin == PLAYER2) boardStr += '2';
			else boardStr += '0';
		}
	}
	boardStr += (this.turn == PLAYER1)? '1' : '2';
	return boardStr;
}

Board.prototype.fromString = function(boardStr) {
	for (var i = 0; i < BOARD_SPACES; i++) {
		var pin = boardStr.charAt(i);
		var r = BOARD_SIZE_MINUS_1 - Math.floor(i / BOARD_SIZE);
		var c = i % BOARD_SIZE;
		if (pin == '1') this.board[r][c] = PLAYER1;
		else if (pin == '2') this.board[r][c] = PLAYER2;
		else this.board[r][c] = EMPTY;
	}
	this.turn = boardStr[BOARD_SPACES] == '1'? PLAYER1 : PLAYER2;
}

Board.prototype.btmnToMove = function(btmn) {
	//Breakthrough Board Notation to move
	//Example: A7A6
	btmn = btmn.toLowerCase().replace(/[^1-7a-g]/g, '');
	if (btmn.length != 4) {
		alert('Invalid BTMN:' + btmn);
		return null;
	}
	
	return {
		sr : BOARD_SIZE-parseInt(btmn.charAt(1)),
		sc : btmn.charCodeAt(0)-97,
		
		dr : BOARD_SIZE-parseInt(btmn.charAt(3)),
		dc : btmn.charCodeAt(2)-97,
	}
}


Board.prototype.isGameOver = function() {
	//Reached the opposite end row
	for (var i = 0; i < BOARD_SIZE; i++) {
		if (this.board[0][i] == PLAYER1) return true;
		else if (this.board[BOARD_SIZE_MINUS_1][i] == PLAYER2) return true;
	}
	
	//Check for no pieces
	var hasPin1 = false;
	var hasPin2 = false;
	for (var r = 0; r < BOARD_SIZE; r++) {
		for (var c = 0; c < BOARD_SIZE; c++) {
			var pin = this.board[r][c];
			if (pin != EMPTY) {
				if (pin == PLAYER1) hasPin1 = true;
				else if (pin == PLAYER2) hasPin2 = true;
				if (hasPin1 && hasPin2) return false; //Game not over yet
			}
		}
	
	}
	return true;
}

Board.prototype.deriveMove  = function(boardStr) {
	var changedBoard = new Board();
	changedBoard.init(boardStr);	
	
	var move = {};
	var diffSrcCount = 0;
	var diffDestCount = 0;
	for (var r = 0; r < BOARD_SIZE; r++) {
		for (var c = 0; c < BOARD_SIZE; c++) {			
			if (this.board[r][c] != changedBoard.board[r][c]) {
				if (changedBoard.board[r][c] == EMPTY) { //Src
					move.sr = r;
					move.sc = c;
					diffSrcCount++;
				}
				else if (changedBoard.board[r][c] == this.turn) { //Dest
					move.dr = r;
					move.dc = c;
					diffDestCount++;
				}
			}
		}
	}
	if (diffSrcCount === 1 && diffDestCount === 1) return move;
	else return null;
}

//End class Board
