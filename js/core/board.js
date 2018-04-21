var VALID = 0;
var INVALID = -1;
var INVALID_JUMP = 1;
var INVALID_SOURCE = 2;
var INVALID_MOVE = 3;
var INVALID_TURN = 4;
var INVALID_BOUNDS = 5;
var INVALID_DESTINATION = 6;
var INVALID_BOARD_STRING = 7;


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
		case INVALID_BOARD_STRING: return 'Invalid board string...';
		default: return 'Nope: invalid...';
	}
}

//Class Board - Wrapper over the bitboard class
function Board(boardStr) {	
	if (boardStr) {
		if (boardStr.length == BOARD_SPACES + 1) {
			this.bb = BB_fromString(boardStr);
			this.turn = boardStr[BOARD_SPACES] == '1'? PLAYER1 : PLAYER2;		
		}
		else alert(invalidMsg(INVALID_BOARD_STRING));
	}
	else {
		this.turn = PLAYER1;	
		this.bb = BB_new();
	}
	
}

Board.prototype.copy = function() {
	
	var newBoard = new Board();	
	newBoard.turn = this.turn;
	newBoard.bb = this.bb.slice();
	return newBoard;	
}


Board.prototype.onBoard = function(r, c) {
	if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return false;
	else return true;
}

Board.prototype.canSelect = function(r, c) {	
	var pin = this.getPin(r, c);
	if (pin == this.turn) return true;
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
			if (this.getPin(dr,dc) != EMPTY && this.getPin(dr,dc) != oppTurn) return INVALID_DESTINATION;			
		}
		else if (this.getPin(dr,dc) != EMPTY) return INVALID_JUMP;
		
	}
	
	return VALID;
}

Board.prototype.getMoves = function() {	

	var moves = BB_getMoves(this.bb, this.turn);
	return moves;	
}

Board.prototype.makeMove = function(sr, sc, dr, dc) {	
	//Assume that it has already been validated	
	BB_makeMove(this.bb, this.turn, RC_TO_POS[sr][sc], RC_TO_POS[dr][dc]);	
}

	
Board.prototype.score = function() {
	return BB_score(this.bb, this.turn);
}


Board.prototype.getTurn = function() {
	return this.turn;
}

Board.prototype.changeTurn = function() {
	this.turn = +(!this.turn);
}

Board.prototype.getPin = function(r, c) {	
	var posMaskIndex = RC_TO_POS[r][c]<<1;
	
	if (evalAndOff2(this.bb, P1, POS_MASKS, posMaskIndex)) return PLAYER1;
	else if (evalAndOff2(this.bb, P2, POS_MASKS, posMaskIndex)) return PLAYER2;		
	else return EMPTY;
}

Board.prototype.toString = function() {	
	//Serialize into Breakthrough Board Notation (BBN)
	return BB_toString(this.bb, this.turn);	
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
	return BB_isGameOver(this.bb, this.turn);
}

Board.prototype.deriveMove = function(boardStr) {
	
	var changedBB = BB_fromString(boardStr);
	return BB_deriveMove(this.bb, changedBB, this.turn);	
}

//End class Board
