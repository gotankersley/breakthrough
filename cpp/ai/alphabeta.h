#pragma once
#include <iostream>
#include <string>
#include <algorithm>


namespace AI {
	
	template<typename B, typename M>
	class AlphaBeta {
		public:
			int MAX_DEPTH;
			int MOVE_LIMIT;

			AlphaBeta(int maxDepth = 4);
			~AlphaBeta();
			M play(B board, int turn, int& isWin);

		private:	
			M* bestMoveAtDepth; //A, perhaps, in-elegant solution to targeting the root (0th) level of a recursive function call
			int negamax (Bitboard board, int turn, int oppTurn, int alpha, int beta, int depth);
		
	};

	template<typename B, typename M>
	AlphaBeta<B, M>::AlphaBeta(int maxDepth) { //Initialize 
		
		MAX_DEPTH = maxDepth;
		bestMoveAtDepth = new M[MAX_DEPTH];
	}

	template<typename B, typename M>
	AlphaBeta<B, M>::~AlphaBeta() { //Destructor 
		delete[] bestMoveAtDepth;
	}

	template<typename B, typename M>
	M AlphaBeta<B, M>::play(B board, int turn, int& isWin) {		
		isWin = -1;
		std::vector<M> moves = board.getMoves(turn);	

		int oppTurn = !turn;
		

		//Start Search	
		int bestScore = negamax(board, turn, oppTurn, -INF, INF, 0);
		#ifdef LOG_LEVEL_1
			std::cout << "Native AB Score: " << bestScore << std::endl;
		#endif
		

		//Evaluate move found
		M bestMove = bestMoveAtDepth[0];

		//Win
		if (bestScore >= INF) {
			#ifdef LOG_LEVEL_1 
				std::cout << "Win found (+" << (MAX_DEPTH-1) << ")" << std::endl;
			#endif
			isWin = 1;
			return bestMove;
		}

		//Lose
		else if (bestScore  <= -INF) {
			#ifdef LOG_LEVEL_1
				std::cout << "Inevitable loss" << std::endl;
			#endif

			isWin = 0;
			//Probably gonna lose - Get first avail move			
			std::vector<M> moves = board.getMoves(turn);
			
			if (moves.size() == 0) return INVALID; //No moves available
			else return moves[0]; //Non-random for easier testing
		}

		//In-Play
		else return bestMove;
	}

	//Recursive Alpha-Beta tree search	
	template<typename B, typename M>
	int AlphaBeta<B, M>::negamax (Bitboard board, int turn, int oppTurn, int alpha, int beta, int depth) {	
		
		//Anchor
		if (depth >= MAX_DEPTH) { //Max depth 

			//There shouldn't be any terminal nodes, (since they'd be found in the expansion)
			return board.score(turn);
		}

		//Expansion
		bestMoveAtDepth[depth] = INVALID;
		
		
		int bestScore = -INF;				
		std::vector<M> moves = board.getMoves(turn);
		int movesLength = moves.size();		
		if (movesLength == 0) return -INF; //No moves available - loss
		else if (depth == 0 && turn == PLAYER2) { //Zugzwang			
			movesLength++;
			moves.push_back(-1);			
		}
		
		//Loop through child states	
		for (int m = 0; m < movesLength; m++) {
			M move = moves[m];
			
			Bitboard childBoard = board;
			childBoard.makeMove(turn, move);

			//Win
			if (childBoard.isGameOver(turn)) {
				bestMoveAtDepth[depth] = move;				
				return INF;
			}

			//RECURSIVE call
			int recursedScore = negamax(childBoard, oppTurn, turn, -beta, std::max(alpha, bestScore), depth+1); //Swap current player as we descend
			int score = -recursedScore;
			if (score > bestScore) { 
				bestScore = score;				
				bestMoveAtDepth[depth] = move;						
				if (bestScore >= beta) return bestScore; //AB cut-off
			}
		}

		//The end
		return bestScore;
	}

}
