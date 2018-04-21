#pragma once
#include <iostream>
#include <vector>
//#include <omp.h>


namespace AI {
	
	
	const int WIN = 1;
	const int LOSE = -1;
	const int TIE = 0; 	

	
	template<typename B, typename M>
	class MonteCarlo {
		public:
			int MAX_ITERATIONS;
			int MOVE_LIMIT;

			MonteCarlo(int maxIterations = 1000, int moveLimit = 45);
			M play(B board, int turn);

		private:			
			int simulate(B board, int turn);
		
	};
	
	
	//Definitions included here to avoid linker errors: https://isocpp.org/wiki/faq/templates#separate-template-fn-defn-from-decl
	template<typename B, typename M>
	MonteCarlo<B, M>::MonteCarlo(int maxIterations, int moveLimit) { //Initialize 
		
		MAX_ITERATIONS = maxIterations;
		MOVE_LIMIT = moveLimit;
	}

	template<typename B, typename M>
	M MonteCarlo<B, M>::play(B board, int turn) {		
		std::vector<M> moves = board.getMoves(turn);		
		int movesLength = moves.size();
		if (moves.size() == 0) return INVALID;

		//Loop over each available kid position
		int bestScore = -INF;
		int bestMoveIndex = INVALID;
		for (int m = 0; m < movesLength; m++) {
			M move = moves[m];

			Bitboard childBoard = board; // .copy();?
			childBoard.makeMove(turn, move);

			//Win available
			if (childBoard.isGameOver(turn)) return move;
			
			//#pragma omp parallel	
			int childScore = 0;
			for (int i = 0; i < MAX_ITERATIONS; i++) {
				childScore += simulate(childBoard, turn); //copy when passed by value
			}

			#ifdef LOG_LEVEL_2
				std::cout << m << " - Child Score (" << childScore << ") - " << childBoard.toString(turn) << std::endl;
			#endif
			if (childScore > bestScore) {
				bestScore = childScore;
				bestMoveIndex = m;
			}
		}

		//Eeny, meeny, miny, moe...
		if (bestMoveIndex == INVALID) return moves[0]; //No good moves found - Pick first available
		else {
			#ifdef LOG_LEVEL_1
				std::cout << "BestScore: " << bestScore << std::endl;
			#endif
			return moves[bestMoveIndex];
		}
	}
	
	//Better sim?
	template<typename B, typename M>
	int MonteCarlo<B, M>::simulate(B board, int turn) {
		int oppTurn = !turn;
		int simTurn = oppTurn;


		for (int m = 0; m < MOVE_LIMIT; m++) {
			
			std::vector<M> moves = board.getMoves(simTurn);			
			int movesLength = moves.size();
			if (movesLength == 0) {				
				return (simTurn == turn) ? LOSE : WIN;
			}

			M chosenMove = INVALID;
			//if (simTurn == oppTurn) { //Heuristic score / with rand
				int bestScore = -INF;
				for (int i = 0; i < movesLength; i++) {					
					M move = moves[i];
					B boardCopy = board;
					boardCopy.makeMove(simTurn, move);
					int score = boardCopy.score(simTurn);
					if (score > bestScore) {
						bestScore = score;
						chosenMove = move;
					}

				}

			//}
			//else { //Random
			//	int randIndex = (rand() % movesLength);
			//	chosenMove = moves[randIndex];
			//}
						
			
			board.makeMove(simTurn, chosenMove);
			if (board.isGameOver(simTurn)) return (simTurn == turn) ? WIN : LOSE;
			else simTurn = !simTurn; //Change turn
		}
		return TIE; 
	}

	/*template<typename B, typename M>
	int MonteCarlo<B, M>::simulate(B board, int turn) {
		int simTurn = !turn;		

		for (int m = 0; m < MOVE_LIMIT; m++) {
			int status = INVALID;
			std::vector<Move> moves = board.getNonLossMoves(simTurn, status);
			if (status == STATUS_WIN) return (turn == simTurn) ? WIN : LOSE;
			else if (status == STATUS_LOSE) return (turn == simTurn) ? LOSE : WIN;

			int movesLength = moves.size();
			if (movesLength == 0) {
				std::cout << "here" << std::endl;
				return (turn == simTurn) ? LOSE : WIN;
			}

			
			int randIndex = (rand() % movesLength);
			Move randMove = moves[randIndex];
			
			board.makeMove(simTurn, randMove);
			if (board.isGameOver(simTurn)) return (turn == simTurn) ? WIN : LOSE;
			else simTurn = !simTurn; //Change turn
		}
		return TIE; 
	}*/
}
