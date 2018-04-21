#include <iostream>
#include <map>
#include <algorithm>

#include "bitboard.h"

#define LOG_LEVEL_1
#define LOG_LEVEL_2
#include "ai/montecarlo.h"



typedef std::map<std::string, std::string> Hash;

bool parseArgs(int argc, char** argv, Hash& args) { //Convert args to associative array for easier handling	
	bool hasKey = false;
	std::string lastKey;
	for (int i = 1; i < argc; i++) { //Ignore program name
		std::string str = argv[i];
		std::transform(str.begin(), str.end(), str.begin(), ::toupper);
		if (argv[i][0] == '-') {
			std::string key = str.substr(1); //Remove initial '-'
			lastKey = key;
			args[key] = "";
			hasKey = true;
		}
		else if (hasKey) {
			std::string val = str;
			args[lastKey] = val;
			hasKey = false;
		}
		else {
			printf("Invalid argument: %s\n", argv[i]);
			return false;
		}
	}
	return true;
}


int main(int argc, char** argv) {
	
	Hash args;
	if (argc == 1) std::cout << "{\"alert\":\"Expected -board argument passed into executable\"}\n";
	if (!parseArgs(argc, argv, args)) return 1;
	
	int turn;	
	Bitboard bb = Bitboard::fromString(args["BOARD"], turn);	
	
	//std::cout << "Current Board: " << bb.toString(turn) << std::endl;
	srand(0);
				
	Move move = INVALID;
	AI::MonteCarlo<Bitboard, > a;
	
	//if (args["ENGINE"] == "AB") {
	//	AI::AlphaBeta<Bitboard, Move> ab(6);			
	//	move = ab.play(bb, turn);
	//}
	//else {		
		AI::MonteCarlo<Bitboard, Move> mc(1000);
		move = mc.play(bb, turn);
	//}
	
	if (move == INVALID) std::cout << "{\"alert\":\"No moves available\"}\n";
	else {		
		bb.makeMove(turn, move);
		turn = !turn;
		std::cout << "{\"board\":\"" + bb.toString(!turn) + "\"}";
		//std::cout << "{\"board\":\"" + bb.toString(!turn) + "\", \"log\":\"" << msg << "\"}";		
	}
	
	

    return(0);

}
