#include "bitboard.h"

Bitboard Bitboard::fromString(std::string boardStr, int& turn) {
	//Reverse serialized board 
	//[Board][Turn]- 64 characters, and 1 character respectively
	Bitboard newBB;

	for (int p = 0; p < BOARD_SPACES; p++) {
		char pin = boardStr[p];
		int r = BOARD_SIZE_MINUS_1 - (p / BOARD_SIZE);
		int c = p % BOARD_SIZE;

		int pos = (r * BOARD_SIZE) + c;
		uint64 posMask = toMask(pos);
		if (pin == '1') newBB.bb[PLAYER1] |= posMask;
		else if (pin == '2') newBB.bb[PLAYER2] |= posMask;
	}

	if (boardStr[BOARD_SPACES] == '1') turn = PLAYER1;
	else turn = PLAYER2;

	return newBB;
}

extern const uint64 MOVES_DIAGONAL[PLAYER_COUNT][BOARD_SPACES] = {
	{	//P1
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0x2,
		0x5,
		0xa,
		0x14,
		0x28,
		0x50,
		0xa0,
		0x40,
		0x200,
		0x500,
		0xa00,
		0x1400,
		0x2800,
		0x5000,
		0xa000,
		0x4000,
		0x20000,
		0x50000,
		0xa0000,
		0x140000,
		0x280000,
		0x500000,
		0xa00000,
		0x400000,
		0x2000000,
		0x5000000,
		0xa000000,
		0x14000000,
		0x28000000,
		0x50000000,
		0xa0000000,
		0x40000000,
		0x200000000,
		0x500000000,
		0xa00000000,
		0x1400000000,
		0x2800000000,
		0x5000000000,
		0xa000000000,
		0x4000000000,
		0x20000000000,
		0x50000000000,
		0xa0000000000,
		0x140000000000,
		0x280000000000,
		0x500000000000,
		0xa00000000000,
		0x400000000000,
		0x2000000000000,
		0x5000000000000,
		0xa000000000000,
		0x14000000000000,
		0x28000000000000,
		0x50000000000000,
		0xa0000000000000,
		0x40000000000000,
	},
	{ //P2
		0x200,
		0x500,
		0xa00,
		0x1400,
		0x2800,
		0x5000,
		0xa000,
		0x4000,
		0x20000,
		0x50000,
		0xa0000,
		0x140000,
		0x280000,
		0x500000,
		0xa00000,
		0x400000,
		0x2000000,
		0x5000000,
		0xa000000,
		0x14000000,
		0x28000000,
		0x50000000,
		0xa0000000,
		0x40000000,
		0x200000000,
		0x500000000,
		0xa00000000,
		0x1400000000,
		0x2800000000,
		0x5000000000,
		0xa000000000,
		0x4000000000,
		0x20000000000,
		0x50000000000,
		0xa0000000000,
		0x140000000000,
		0x280000000000,
		0x500000000000,
		0xa00000000000,
		0x400000000000,
		0x2000000000000,
		0x5000000000000,
		0xa000000000000,
		0x14000000000000,
		0x28000000000000,
		0x50000000000000,
		0xa0000000000000,
		0x40000000000000,
		0x200000000000000,
		0x500000000000000,
		0xa00000000000000,
		0x1400000000000000,
		0x2800000000000000,
		0x5000000000000000,
		0xa000000000000000,
		0x4000000000000000,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0
	}
};

extern const uint64 MOVES_ALL[PLAYER_COUNT][BOARD_SPACES] = {
	{ //P1
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0x0000000000000003,
		0x0000000000000007,
		0x000000000000000e,
		0x000000000000001c,
		0x0000000000000038,
		0x0000000000000070,
		0x00000000000000e0,
		0x00000000000000c0,
		0x0000000000000300,
		0x0000000000000700,
		0x0000000000000e00,
		0x0000000000001c00,
		0x0000000000003800,
		0x0000000000007000,
		0x000000000000e000,
		0x000000000000c000,
		0x0000000000030000,
		0x0000000000070000,
		0x00000000000e0000,
		0x00000000001c0000,
		0x0000000000380000,
		0x0000000000700000,
		0x0000000000e00000,
		0x0000000000c00000,
		0x0000000003000000,
		0x0000000007000000,
		0x000000000e000000,
		0x000000001c000000,
		0x0000000038000000,
		0x0000000070000000,
		0x00000000e0000000,
		0x00000000c0000000,
		0x0000000300000000,
		0x0000000700000000,
		0x0000000e00000000,
		0x0000001c00000000,
		0x0000003800000000,
		0x0000007000000000,
		0x000000e000000000,
		0x000000c000000000,
		0x0000030000000000,
		0x0000070000000000,
		0x00000e0000000000,
		0x00001c0000000000,
		0x0000380000000000,
		0x0000700000000000,
		0x0000e00000000000,
		0x0000c00000000000,
		0x0003000000000000,
		0x0007000000000000,
		0x000e000000000000,
		0x001c000000000000,
		0x0038000000000000,
		0x0070000000000000,
		0x00e0000000000000,
		0x00c0000000000000
	},
	{  //P2		
		0x0000000000000300,
		0x0000000000000700,
		0x0000000000000e00,
		0x0000000000001c00,
		0x0000000000003800,
		0x0000000000007000,
		0x000000000000e000,
		0x000000000000c000,
		0x0000000000030000,
		0x0000000000070000,
		0x00000000000e0000,
		0x00000000001c0000,
		0x0000000000380000,
		0x0000000000700000,
		0x0000000000e00000,
		0x0000000000c00000,
		0x0000000003000000,
		0x0000000007000000,
		0x000000000e000000,
		0x000000001c000000,
		0x0000000038000000,
		0x0000000070000000,
		0x00000000e0000000,
		0x00000000c0000000,
		0x0000000300000000,
		0x0000000700000000,
		0x0000000e00000000,
		0x0000001c00000000,
		0x0000003800000000,
		0x0000007000000000,
		0x000000e000000000,
		0x000000c000000000,
		0x0000030000000000,
		0x0000070000000000,
		0x00000e0000000000,
		0x00001c0000000000,
		0x0000380000000000,
		0x0000700000000000,
		0x0000e00000000000,
		0x0000c00000000000,
		0x0003000000000000,
		0x0007000000000000,
		0x000e000000000000,
		0x001c000000000000,
		0x0038000000000000,
		0x0070000000000000,
		0x00e0000000000000,
		0x00c0000000000000,
		0x0300000000000000,
		0x0700000000000000,
		0x0e00000000000000,
		0x1c00000000000000,
		0x3800000000000000,
		0x7000000000000000,
		0xe000000000000000,
		0xc000000000000000,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0
	}
};

extern const int WEIGHT_POS_OFFENSE[PLAYER_COUNT][BOARD_SPACES] = {
	{ //P1
		INF,INF,INF,INF,INF,INF,INF,INF,  
		10,10,10,10,10,10,10,10,   
		5,5,5,5,5,5,5,5,   
		4,4,4,4,4,4,4,4,   
		3,3,3,3,3,3,3,3,    
		2,2,2,2,2,2,2,2,    
		1,1,1,1,1,1,1,1,    
		2,2,2,2,2,2,2,2 
	},
	{ //P2
		2,2,2,2,2,2,2,2,
		1,1,1,1,1,1,1,1,    
		2,2,2,2,2,2,2,2,    
		3,3,3,3,3,3,3,3,    
		4,4,4,4,4,4,4,4,   
		5,5,5,5,5,5,5,5,   
		10,10,10,10,10,10,10,10, 
		INF,INF,INF,INF,INF,INF,INF,INF 				
	}
};


extern const int WEIGHT_POS_DEFENSE[PLAYER_COUNT][BOARD_SPACES] = {
	{ //P1
		INF,INF,INF,INF,INF,INF,INF,INF,
		HALF_INF,HALF_INF,HALF_INF,HALF_INF,HALF_INF,HALF_INF,HALF_INF,HALF_INF,
		5,5,5,5,5,5,5,5,   
		4,4,4,4,4,4,4,4,   
		3,3,3,3,3,3,3,3,    
		2,2,2,2,2,2,2,2,    
		1,1,1,1,1,1,1,1,    
		5,5,5,5,5,5,5,5
	},
	{ //P2
		5,5,5,5,5,5,5,5,
		1,1,1,1,1,1,1,1,    
		2,2,2,2,2,2,2,2,    
		3,3,3,3,3,3,3,3,    
		4,4,4,4,4,4,4,4,   
		5,5,5,5,5,5,5,5,   
		HALF_INF,HALF_INF,HALF_INF,HALF_INF,HALF_INF,HALF_INF,HALF_INF,HALF_INF,
		INF,INF,INF,INF,INF,INF,INF,INF
	}
};
