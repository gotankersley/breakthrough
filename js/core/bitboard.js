/*
NOTE: 
	This is a bitboard class for Breakthrough which requires 64 bits.  
	However, as javascript only allows for bitwise operations on 32 bit integers, we are "emulating" 64 bit boards using typed arrays.	
*/

const INFINITY = 1000000;
const HALF_INFINITY = INFINITY/2;
const TRW_INFINITY = INFINITY+100;
const WINFINITY = INFINITY;
const BOARD_SIZE = 8;
const BOARD_SIZE_MINUS_1 = BOARD_SIZE-1;
const BOARD_SPACES = 64;
const MAX_POSSIBLE_MOVES = 48; //16*3

const PLAYER1 = 0;
const PLAYER2 = 1;

//BB struct indexes
const BB_STRUCT_SIZE = 4;
const P1 = 0; 
const P2 = 2; 

const P1_ABROAD = 1;
const P1_HOME = 0;
const P2_HOME = 3;
const P2_ABROAD = 2;

//Index maps
var POS_TO_R = [0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,3,3,3,3,3,3,3,3,4,4,4,4,4,4,4,4,5,5,5,5,5,5,5,5,6,6,6,6,6,6,6,6,7,7,7,7,7,7,7,7];
var POS_TO_C = [0,1,2,3,4,5,6,7,0,1,2,3,4,5,6,7,0,1,2,3,4,5,6,7,0,1,2,3,4,5,6,7,0,1,2,3,4,5,6,7,0,1,2,3,4,5,6,7,0,1,2,3,4,5,6,7,0,1,2,3,4,5,6,7];

var RC_TO_POS = [ //RowColumn to Pos
	[0,1,2,3,4,5,6,7],			    //Row 0	
	[8,9,10,11,12,13,14,15],	    //Row 1
	[16,17,18,19,20,21,22,23],	    //Row 2
	[24,25,26,27,28,29,30,31],		//Row 3
	[32,33,34,35,36,37,38,39], 		//Row 4
	[40,41,42,43,44,45,46,47],      //Row 5
	[48,49,50,51,52,53,54,55],  	//Row 6
	[56,57,58,59,60,61,62,63],      //Row 7
];


//Precalculated weights for different positions
var INF = INFINITY+200;
var HALF_INF = INF/2;
var WEIGHT_POS_OFFENSE = [
	[ //P1
		INF,INF,INF,INF,INF,INF,INF,INF,  
		10,10,10,10,10,10,10,10,   
		5+rnd(3),5+rnd(3),5+rnd(3),5+rnd(3),5+rnd(3),5+rnd(3),5+rnd(3),5+rnd(3),   
		4+rnd(3),4+rnd(3),4+rnd(3),4+rnd(3),4+rnd(3),4+rnd(3),4+rnd(3),4+rnd(3),   
		3+rnd(3),3+rnd(3),3+rnd(3),3+rnd(3),3+rnd(3),3+rnd(3),3+rnd(3),3+rnd(3),    
		2+rnd(3),2+rnd(3),2+rnd(3),2+rnd(3),2+rnd(3),2+rnd(3),2+rnd(3),2+rnd(3),    
		1+rnd(3),1+rnd(3),1+rnd(3),1+rnd(3),1+rnd(3),1+rnd(3),1+rnd(3),1+rnd(3),    
		2+rnd(3),2+rnd(3),2+rnd(3),2+rnd(3),2+rnd(3),2+rnd(3),2+rnd(3),2+rnd(3) 
	],
	[ //P2
		2+rnd(3),2+rnd(3),2+rnd(3),2+rnd(3),2+rnd(3),2+rnd(3),2+rnd(3),2+rnd(3),
		1+rnd(3),1+rnd(3),1+rnd(3),1+rnd(3),1+rnd(3),1+rnd(3),1+rnd(3),1+rnd(3),    
		2+rnd(3),2+rnd(3),2+rnd(3),2+rnd(3),2+rnd(3),2+rnd(3),2+rnd(3),2+rnd(3),    
		3+rnd(3),3+rnd(3),3+rnd(3),3+rnd(3),3+rnd(3),3+rnd(3),3+rnd(3),3+rnd(3),    
		4+rnd(3),4+rnd(3),4+rnd(3),4+rnd(3),4+rnd(3),4+rnd(3),4+rnd(3),4+rnd(3),   
		5+rnd(3),5+rnd(3),5+rnd(3),5+rnd(3),5+rnd(3),5+rnd(3),5+rnd(3),5+rnd(3),   
		10,10,10,10,10,10,10,10, 
		INF,INF,INF,INF,INF,INF,INF,INF,
	],

];

var WEIGHT_POS_DEFENSE = [
	[ //P1
		INF,INF,INF,INF,INF,INF,INF,INF,  
		HALF_INF,HALF_INF,HALF_INF,HALF_INF,HALF_INF,HALF_INF,HALF_INF,HALF_INF,
		5,5,5,5,5,5,5,5,   
		4,4,4,4,4,4,4,4,   
		3,3,3,3,3,3,3,3,    
		2,2,2,2,2,2,2,2,    
		1,1,1,1,1,1,1,1,    
		5,5,5,5,5,5,5,5 
	],
	[ //P2
		5,5,5,5,5,5,5,5,
		1,1,1,1,1,1,1,1,    
		2,2,2,2,2,2,2,2,    
		3,3,3,3,3,3,3,3,    
		4,4,4,4,4,4,4,4,   
		5,5,5,5,5,5,5,5,   
		HALF_INF,HALF_INF,HALF_INF,HALF_INF,HALF_INF,HALF_INF,HALF_INF,HALF_INF,
		INF,INF,INF,INF,INF,INF,INF,INF, 
	],

];

const MASK_TRW_ATTACK = new Uint32Array([0xff0000, 0xff00]);
const MASK_TRW_DEFENSE = new Uint32Array([0xffff, 0xff0000, 0xff000000]); //From POV of attacker, P2 has to parts for vertical flip
const MASK_TRW_ENDGAME = 0xffff00;

//Create a Uint32Array to act like a Pseudo-struct
function BB_new() {	
	
	var bb = new Uint32Array([
		0xffff0000, 0x00000000, //P1 Initial board state
		0x00000000,	0x0000ffff, //P2 Initial board state		
	]);
	return bb;
}


function BB_toString(bb, turn) { 
	//Serialize
	//[Board][Turn] - 65 characters
	var str = '';	
	for (var r = BOARD_SIZE_MINUS_1; r >= 0; r--) {
		for (var c = 0; c < BOARD_SIZE; c++) {
			var p = RC_TO_POS[r][c];
	
			var maskIndex = p<<1;
			if (evalAndOff2(bb, P1, POS_MASKS, maskIndex)) str += '1';
			else if (evalAndOff2(bb, P2, POS_MASKS, maskIndex)) str += '2';
			else str += '0';			
		}
	}
		
	//Turn
	str += (turn + 1);
	
	return str;
}

function BB_fromString(str) {
	//Reverse serialized board 
	//Just the [Board]- 64 characters, ignore turn
	var bb = new Uint32Array(BB_STRUCT_SIZE);
	
	for (var p = 0; p < BOARD_SPACES; p++) {
		var pin = str.charAt(p);
		var r = BOARD_SIZE_MINUS_1 - Math.floor(p / BOARD_SIZE);
		var c = p % BOARD_SIZE;
		var pos = RC_TO_POS[r][c];
		var maskIndex = pos<<1;
		if (pin == '1') orEqOff2(bb, P1, POS_MASKS, maskIndex); //p1 |= posMask		
		else if (pin == '2') orEqOff2(bb, P2, POS_MASKS, maskIndex); //p2 |= posMask			
	}
					
	return bb;
}


function BB_isGameOver(bb, turn) {
	var oppTurn = +(!turn);
	var cur = turn<<1;
	var opp = (!turn)<<1;
	
	//Win if reached opposite side of board
	//Note just use 32 bits instead of full emulated 64 bits
	if ((bb[cur+oppTurn] & MASK_WINS_32[turn])) return true; 
	
	//Else if no pieces - Just jumped opponent
	else if (evalOff1(bb, opp) === false) return true;
	
	else return false;	
}


function BB_makeMove(bb, turn, srcPos, dstPos) {
	//This does NOT verify that the move is legal	
	var cur = turn<<1;
	var opp = (!turn)<<1;	
	
	xorEqOff2(bb, cur, POS_MASKS, srcPos<<1); //Remove source
	orEqOff2(bb, cur, POS_MASKS, dstPos<<1); //Add to dest
	andEqOff2(bb, opp, POS_MASKS_NEG, dstPos<<1); //Remove any jump pins					
}

function BB_isTrwState(bb, turn, role) {
	var oppTurn = +(!turn);
	var cur = turn<<1;
	var opp = (!turn)<<1;	
	
	//Third-Rank-Win (TRW) check				
	var attackBits = (bb[cur+oppTurn] & MASK_TRW_ATTACK[turn]); //cur+oppturn = p1->lo, p2->hi
	if (attackBits) {
		var trwIndex;
		if (turn == PLAYER1) trwIndex = attackBits | (bb[3] & MASK_TRW_DEFENSE[0]); //p1->hi				
		else trwIndex = ( //Shift the three different pieces to flip vertically
			(attackBits << 8) | 
			((bb[0] & MASK_TRW_DEFENSE[1]) >>> 8) |
			((bb[0] & MASK_TRW_DEFENSE[2]) >>> 24)
		); 
		//console.log(trwIndex);
		
		if (TRWS_BY_ROLE[role][trwIndex]) return true;
	}
	return false;
	
}

function BB_score(bb, turn) {
	var oppTurn = +(!turn);
	var cur = turn<<1;
	var opp = (!turn)<<1;	
	var score = 0;
	
	
	
	//OFFENSE 
	var offHi = bb[cur];
	while (offHi) {
		var minBit = offHi & -offHi;
		var pos = Math.log2(minBit >>> 0) + 32;
		offHi &= offHi-1;
		
		score += WEIGHT_POS_OFFENSE[turn][pos];
	}
	
	var offLo = bb[cur+1];	
	while (offLo) {
		var minBit = offLo & -offLo;
		var pos = Math.log2(minBit >>> 0);		
		offLo &= offLo-1;
		
		score += WEIGHT_POS_OFFENSE[turn][pos];
	}
	
	//DEFENSE
	var defHi = bb[opp];
	while (defHi) {
		var minBit = defHi & -defHi;
		var pos = Math.log2(minBit >>> 0) + 32;
		defHi &= defHi-1;
		
		score -= WEIGHT_POS_DEFENSE[oppTurn][pos];
	}
	
	var defLo = bb[opp+1];	
	while (defLo) {
		var minBit = defLo & -defLo;
		var pos = Math.log2(minBit >>> 0);		
		defLo &= defLo-1;
		
		score -= WEIGHT_POS_DEFENSE[oppTurn][pos];
	}
	
	return score;
}


function BB_deriveMove(originalBB, changedBB, turn) {
	
	//Derive move made by looking at changed board state
	var move = {};	
	var cur = turn<<1;	
	
	//Find difference
	var combined = orOff2(originalBB, cur, changedBB, cur);
	var srcBB = xorOff1(changedBB, cur, combined);
	var dstBB = xorOff1(originalBB, cur, combined);
	
	var src = MASK_TO_POS_HI[srcBB[0]] + MASK_TO_POS_LO[srcBB[1]]; //Don't know if bit is lo, or hi, but expect only 1 to be set
	var dst = MASK_TO_POS_HI[dstBB[0]] + MASK_TO_POS_LO[dstBB[1]];
			
	move.sr = POS_TO_R[src];
	move.sc = POS_TO_C[src];
	move.dr = POS_TO_R[dst];
	move.dc = POS_TO_C[dst];
	
	
	return move;
}

function BB_getMoves(bb, turn) {
	var moves = [];
	var moveMasks = BB_getMoveMasks(bb, turn);
	
	for (var m = 0; m < moveMasks.length; m++) {
		var mask = moveMasks[m].mask;
		var src = moveMasks[m].src;
		bitLoop(mask, 0, function(p) {
			
			moves.push({
				sr:POS_TO_R[src],
				sc:POS_TO_C[src],
				dr:POS_TO_R[p],
				dc:POS_TO_C[p],
			});
		});
	}
	
	return moves;
}

function BB_getMoveMasks(bb, turn) {
	var cur = turn<<1;
	var opp = (!turn)<<1;	
	
	var moves = [];	
	var open = notEq(orOff2(bb, cur, bb, opp));
	
	//For all pins
	bitLoop(bb, cur, function(p) {		
		
		var pinMaskIndex = p<<1;
		var combo = andOff1(MOVES_ALL[turn], pinMaskIndex, open); //All		
		var jumps = andOff2(MOVES_DIAGONAL[turn], pinMaskIndex, bb, opp);	//Jumps		
		orEq(combo, jumps); 
		moves.push({src:p, mask:combo});
		
	});
	return moves;
}

function BB_getMoveIndexes(bb, turn){ 
	//WARNING: The array length is stored in index 0, and moves are a single SrcDst pos (e.g. srcPos<<8)+destPos)
	var moveIndexes = new Array(MAX_POSSIBLE_MOVES+1); //0 is length
	moveIndexes[0] = 0;
	var cur = turn<<1;
	var opp = (!turn)<<1;			
	var open = notEq(orOff2(bb, cur, bb, opp));	
	
	//OUTER - HI
	var pinsHi = bb[cur];
	while (pinsHi) {
		var pinsMinBit = pinsHi & -pinsHi;		
		var srcPos = Math.log2(pinsMinBit >>> 0) + 32;
		var pinMaskIndex = srcPos<<1;
		pinsHi &= pinsHi-1; //Avoid infinite loop
		var jumps = andOff2(MOVES_DIAGONAL[turn], pinMaskIndex, bb, opp);	//Jumps		
		var combo = andOff1(MOVES_ALL[turn], pinMaskIndex, open); //All				
		orEq(combo, jumps); 
		
		//INNER - HI
		var destsHi = combo[0];
		while (destsHi) {
			var destMinBit = destsHi & -destsHi;		
			var destPos = Math.log2(destMinBit >>> 0) + 32;
			destsHi &= destsHi-1; //Avoid infinite loop
			moveIndexes[++moveIndexes[0]] = (srcPos<<8)+destPos;
		}
		
		//INNER - LO
		var destsLo = combo[1];	
		while (destsLo) {
			var destMinBit = destsLo & -destsLo;	
			var destPos = Math.log2(destMinBit >>> 0); 			
			destsLo &= destsLo-1; //Avoid infinite loop
			moveIndexes[++moveIndexes[0]] = (srcPos<<8)+destPos;			
		}
	}
	
	//OUTER - LO
	var pinsLo = bb[cur+1];	
	while (pinsLo) {
		var pinsMinBit = pinsLo & -pinsLo;
		var srcPos = Math.log2(pinsMinBit >>> 0); 
		var pinMaskIndex = srcPos<<1;		
		pinsLo &= pinsLo-1; //Avoid infinite loop
		
		var jumps = andOff2(MOVES_DIAGONAL[turn], pinMaskIndex, bb, opp);	//Jumps		
		var combo = andOff1(MOVES_ALL[turn], pinMaskIndex, open); //All				
		orEq(combo, jumps); 
		
		//INNER - HI
		var destsHi = combo[0];
		while (destsHi) {
			var destMinBit = destsHi & -destsHi;		
			var destPos = Math.log2(destMinBit >>> 0) + 32;
			destsHi &= destsHi-1; //Avoid infinite loop
			moveIndexes[++moveIndexes[0]] = (srcPos<<8)+destPos;
		}
		
		//INNER - LO
		var destsLo = combo[1];	
		while (destsLo) {
			var destMinBit = destsLo & -destsLo;	
			var destPos = Math.log2(destMinBit >>> 0);			
			destsLo &= destsLo-1; //Avoid infinite loop
			moveIndexes[++moveIndexes[0]] = (srcPos<<8)+destPos;			
		}
		
	}	
	return moveIndexes;
}


//move1=srcDst 
//move2=src,dst 
//move4=sr,sc,dr,dc
function BB_splitSrcDst(srcDst) {

	var src = srcDst >>> 8;
	var dst = srcDst & 0xff;
	return {src:src, dst:dst};
}
