#include <iostream>
#include <fstream>
#include <math.h>
//#include <netinet/in.h>
#include <iomanip>

#include "bitboard.h"
#include "ai/alphabeta.h"

const int QUAD_WORD = 32;
const int OUTPUT_SIZE = (1 << 24)/QUAD_WORD;

//Generate all 2^24 possible Third-Rank-Wins (TRWs) for both players
int main() {
	AI::AlphaBeta<Bitboard, Move> alphabeta(17);	
	uint attackerOutput[OUTPUT_SIZE];    
	uint defenderOutput[OUTPUT_SIZE];    
    
			
	//From the Point-of-view of the player1 as the attacker		
	uint outIndex = 0;
	int packIndex = 0;
	uint packAttackValue = 0;
	uint packDefendValue = 0;
	int statDefenderTurnWins = 0;
	int statDefenderTurnLoses = 0;
	
	int statAttackerTurnWins = 0;
	int statAttackerTurnLoses = 0;
	
	std::cout << "Generating..." << std::endl;
	for(uint64 attackPos = 0; attackPos < (1 << 8); attackPos++) {    
		for(uint64 defensePos = 0; defensePos < (1 << 16); defensePos++) {	
			//Set the state
			Bitboard board;
			board.bb[PLAYER1] = attackPos << 16;
			board.bb[PLAYER2] = defensePos;
			
			Bitboard attackBoard = board;
			Bitboard defendBoard = board;
			
			//Alphabeta playout to see if it's a forced win		
			int isAttackerTurnWin;			
			int isDefenderTurnWin;
			
			alphabeta.play(attackBoard, PLAYER1, isAttackerTurnWin);
			alphabeta.play(defendBoard, PLAYER2, isDefenderTurnWin);
						
			//Verify that the AB playout finished 
			if (isAttackerTurnWin < 0) {
				std::cout << "Not played out attacker turn: attacker(" << attackPos << "), defender(" << defensePos << ")" << std::endl;
				std::cout << "0x" << std::hex << std::noshowbase << std::setw(2) << std::setfill('0') << attackBoard.bb[PLAYER1] << std::endl;
				std::cout << "0x" << std::hex << std::noshowbase << std::setw(2) << std::setfill('0') << attackBoard.bb[PLAYER2] << std::endl;
				return 0;
			}
			else if (isDefenderTurnWin < 0) {
				std::cout << "Not played out defender turn: attacker(" << attackPos << "), defender(" << defensePos << ")" << std::endl;
				std::cout << "0x" << std::hex << std::noshowbase << std::setw(2) << std::setfill('0') << defendBoard.bb[PLAYER1] << std::endl;
				std::cout << "0x" << std::hex << std::noshowbase << std::setw(2) << std::setfill('0') << defendBoard.bb[PLAYER2] << std::endl;
				return 0;
			}
			
			//Defenders's turn, so all wins are actually losses			
			isDefenderTurnWin = !isDefenderTurnWin;
			
			//Stats - Attacker turn - wins for ATTACKER
			if (isAttackerTurnWin) statAttackerTurnWins++;
			else statAttackerTurnLoses++;
									
			
			//Stats - Defender turn - wins for ATTACKER
			if (isDefenderTurnWin) statDefenderTurnWins++;
			else statDefenderTurnLoses++;
												
			
			//Pack output into int32					
            packAttackValue |= (isAttackerTurnWin << packIndex);	
            packDefendValue |= (isDefenderTurnWin << packIndex);	
			
			
			//If packed int32 is full, store in output
			if (packIndex+1 == QUAD_WORD) {
				attackerOutput[outIndex] = packAttackValue;  
				defenderOutput[outIndex] = packDefendValue;  
				

				outIndex++;
				packAttackValue = 0;
				packDefendValue = 0;
				packIndex = 0;
			}
			else packIndex++;            
		}			
		std::cout << attackPos << "/255" << std::endl;	        		
	}	
	
	//Finish adding any bits
	if (packIndex != 0) {	
		std::cout << "Didn't divide evenly!" << std::endl;
		attackerOutput[outIndex] = packAttackValue;		
		defenderOutput[outIndex] = packDefendValue;		
	}
	
	//Output stats
	std::cout << "Stats: " << std::endl;
	std::cout << "Attacker turn: " << std::endl;
	std::cout << "- attacker wins: " << statAttackerTurnWins << std::endl;
	std::cout << "- attacker loses: " << statAttackerTurnLoses << std::endl << std::endl;
	
	std::cout << "Defender turn: " << std::endl;
	std::cout << "- attacker wins: " << statDefenderTurnWins << std::endl;
	std::cout << "- attacker loses: " << statDefenderTurnLoses << std::endl;
	
	//Output to file
	std::cout << "Writing wins" << std::endl;		
	std::fstream fout;
    
	fout = std::fstream("trws-attacker-turn.dat", std::ios::out | std::ios::binary);	
 	fout.write((char*)&attackerOutput,sizeof(uint)*OUTPUT_SIZE);        
	
	fout.close();
	
	std::fstream fout2;
    
	fout2 = std::fstream("trws-defender-turn.dat", std::ios::out | std::ios::binary);	
 	fout2.write((char*)&defenderOutput,sizeof(uint)*OUTPUT_SIZE);        
	
	fout2.close();
		
	return 0;

}
