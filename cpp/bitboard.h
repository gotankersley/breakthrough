#pragma once

#include <vector>
#include <string>

typedef uint64_t uint64;

const int INF = 1000000;
const int HALF_INF = INF/2;
const int BOARD_SIZE = 8;
const int BOARD_SIZE_MINUS_1 = BOARD_SIZE-1;
const int BOARD_SPACES = 64;
const int MAX_POSSIBLE_MOVES = 48; //16*3
const int INVALID = -1;
const int PLAYER_COUNT = 2;
const int LENGTH_INDEX = 0;

typedef int Move;

enum { PLAYER1, PLAYER2 };
enum { STATUS_LOSE=-1,STATUS_IN_PLAY=0, STATUS_WIN=1};

const uint64 MASK_WINS[] = {0xff, 0xff00000000000000};
const uint64 MASK_NEAR_WINS[] = {0xff00, 0xff000000000000};
const uint64 MASK_BLOCK_WINS[PLAYER_COUNT][BOARD_SIZE] = {
	{0x2, 0x5, 0xa, 0x14, 0x28, 0x50, 0xa0, 0x40}, //P1 (Range 8-15, so + 8)
	{0x200000000000000, 0x502000000000000, 0xa00000000000000, 0x1400000000000000, 0x2800000000000000, 0x5000000000000000, 0xa000000000000000, 0x4000000000000000} //P2 (Range 48-55, so + 48)
};

//Precomputed arrays
extern const uint64 MOVES_DIAGONAL[PLAYER_COUNT][BOARD_SPACES];
extern const uint64 MOVES_ALL[PLAYER_COUNT][BOARD_SPACES];
extern const int WEIGHT_POS_OFFENSE[2][BOARD_SPACES];
extern const int WEIGHT_POS_DEFENSE[2][BOARD_SPACES];

//Macros
#define bitCount(bitboard) __builtin_popcount(bitboard)
#define toMask(pos) (1uLL << pos)
#define bitScan(bitboard) __builtin_ffsll(bitboard)
#define bitLoop(bitboard) __builtin_ffsll(bitboard)
#define bitLoopIteration(bitboard, pos) bitboard ^= (1uLL << pos);


struct Bitboard {
	uint64 bb[2]; //Bitboards


	Bitboard() {		 
		bb[PLAYER1] = 0; 
		bb[PLAYER2] = 0; 
	}

	void init() {
		bb[PLAYER1] = 0xffff000000000000; //P1 Initial board state
		bb[PLAYER2] = 0x000000000000ffff; //P2 Initial board state
	}
	

	static Bitboard fromString(std::string boardStr, int& turn);

	std::string toString(int turn) {
		std::string boardStr = "";

		for (int r = BOARD_SIZE_MINUS_1; r >= 0; r--) {
			for (int c = 0; c < BOARD_SIZE; c++) {
				int pos = (r*BOARD_SIZE)+c;					
				uint64 posMask = toMask(pos);

				
				if ((bb[PLAYER1] & posMask)) boardStr += '1';
				else if ((bb[PLAYER2] & posMask)) boardStr += '2';
				else boardStr += '0';
			}
		}
		
		//Turn
		if (turn == PLAYER1) boardStr += '1';
		else boardStr += '2';
		
		return boardStr;
	}

	

	bool isGameOver(int turn) {
		int oppTurn = !turn;		
		
		//Win if reached opposite side of board		
		if ((bb[turn] & MASK_WINS[turn])) return true;

		//Else if no opponent pieces - just jumped
		else if (bb[oppTurn] == 0) return true;

		else return false;
	}

	int score(int turn) {
		int oppTurn = !turn;		
		int score = 0;
			
		uint64 pins = bb[turn];
		uint64 oppPins = bb[oppTurn];

		//Offense 
		int foundPos = bitLoop(pins);		
		while (foundPos) {						
			int pos = foundPos-1;
			bitLoopIteration(pins, pos);

			score += WEIGHT_POS_OFFENSE[turn][pos] + (rand() % 3);		
			foundPos = bitLoop(pins);
		}
		
		
		//Defense
		foundPos = bitLoop(oppPins);	
		while (foundPos) {
			int pos = foundPos-1;
			bitLoopIteration(oppPins, pos);
			score -= WEIGHT_POS_DEFENSE[oppTurn][pos];		
			foundPos = bitLoop(oppPins);
		}
			
	
		return score;
	}

	void makeMove(int turn, Move move) {
		if (move == INVALID) return;
		
		//This does NOT verify / guarantee that the move is legal	
		int srcPos = move >> BOARD_SIZE;
		int dstPos = move & 0xff;

		int oppTurn = !turn;
		uint64 destPosMask = toMask(dstPos);
		
		bb[turn] ^= toMask(srcPos); //Remove source
		bb[turn] |= destPosMask; //Add to dest
		bb[oppTurn] &= ~destPosMask; //Remove any jump pins					
	}


	std::vector<Move> getMoves(int turn) {
		std::vector<Move> moves;

		int oppTurn = !turn;	

		uint64 open = ~(bb[turn] | bb[oppTurn]);
		uint64 pins = bb[turn];
		 

		int foundPos = bitLoop(pins);
		while (foundPos) {
			int pinPos = foundPos-1;
			bitLoopIteration(pins, pinPos);
			
			uint64 jumps = bb[oppTurn] & MOVES_DIAGONAL[turn][pinPos];	//Jumps		
			uint64 avail = (open & MOVES_ALL[turn][pinPos]) | jumps; //All				
		
			int foundAvail = bitLoop(avail);
			while(foundAvail) {
				int availPos = foundAvail-1;
				bitLoopIteration(avail, availPos);
				moves.push_back((pinPos << BOARD_SIZE) + availPos);
				foundAvail = bitLoop(avail);
			}			
			foundPos = bitLoop(pins);
		}
		return moves;
	}
	/*
	std::vector<Move> getNonLossMoves(int turn, int& status) { //And wins too	
		std::vector<Move> moves;

		int oppTurn = !turn;		

		uint64 open = ~(bb[turn] | bb[oppTurn]);
		uint64 pins = bb[turn];
		uint64 oppPins = bb[oppTurn];

		//Win		
		//uint64 pinsNearWin = pins & MASK_NEAR_WINS[turn];
		//if (pinsNearWin) {			
		//	ulong srcWin;
		//	ulong dstWin;

			//bitScan(pinsNearWin, srcWin);
			//int maskIndexOffset = (turn * 40) + BOARD_SIZE; //Offset for how MASK_BLOCK_WINS is stored
			//bitScan(MASK_BLOCK_WINS[turn][srcWin-maskIndexOffset], dstWin); //Only pins on back row can stop			
			//moveSrcDsts[LENGTH_INDEX] = 1;
			//moveSrcDsts[1] = (srcWin << BOARD_SIZE) + dstWin;
			//return STATUS_WIN;	
		//}
		
		//Try to block opponent if they are about to win
		//uint64 oppNearWins = oppPins & MASK_NEAR_WINS[oppTurn];
		//if (oppNearWins) {
	//		ulong posToBlock;
	//		bitScan(oppNearWins, posToBlock);
	//		int maskIndexOffset = (oppTurn * 40) + BOARD_SIZE; //Offset for how MASK_BLOCK_WINS is stored
	//		pins &= MASK_BLOCK_WINS[oppTurn][posToBlock-maskIndexOffset]; //Only pins on back row can stop
	//		if (!pins) { //Otherwise, only consider moves that can block
	//			status = STATUS_LOSE;
	//			return moves; 
	//		}
//
//		}
		

		//Check for jumps
		uint64 jumpPins = 0;
		uint64 movePins = 0;

		int pinPos = bitLoop(pins);		
		while (pinPos) {
			uint64 pinMask = (1uLL << pinPos);
			pins ^= pinMask;
			
			uint64 jumps = bb[oppTurn] & MOVES_DIAGONAL[turn][pinPos];	//Jumps	

			if (jumps) jumpPins |= pinMask;
			//if (rand() % 10 > 7) movePins |= pinMask;
		}

		if (jumpPins) movePins |= jumpPins; //Mostly only include pins with jumps
		else movePins = bb[turn]; //No jumps so just include all pins

		//Find all valid moves
		while (bitLoop(movePins, pinPos)) {
			bitLoopIteration(movePins, pinPos);
			
			uint64 jumps = bb[oppTurn] & MOVES_DIAGONAL[turn][pinPos];	//Jumps		
			uint64 avail = (open & MOVES_ALL[turn][pinPos]) | jumps; //All	

			ulong availPos;
			while (bitLoop(avail, availPos)) {
				bitLoopIteration(avail, availPos);
				moves.push_back((pinPos << BOARD_SIZE) + availPos);
			}
		}
		status = STATUS_IN_PLAY;
		return moves;
	}
	*/
	int deriveMove(Bitboard changedBB, int turn) {
		//Find difference
		uint64 combined = bb[turn] | changedBB.bb[turn];
		uint64 srcBB = combined ^ changedBB.bb[turn];
		uint64 dstBB = combined ^ bb[turn];
		
		int srcPos = bitScan(srcBB)-1;
		int dstPos = bitScan(dstBB)-1;
		return (srcPos << BOARD_SIZE) + dstPos;

	}
};