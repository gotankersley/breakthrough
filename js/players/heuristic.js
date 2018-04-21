var HeuristicPlayer = (function() { //Poor man's namespace (module pattern)
	
	function getPlay(board, onPlayed) {	
	
		var bb = board.bb;
		var turn = board.turn;
		var cur = turn<<1;		
		var oppTurn = +(!turn);
		
		var moveIndexes = BB_getMoveIndexes(bb, turn);
		var movesLength = moveIndexes[0];
		if (!movesLength) return onPlayed(); //No moves available
		
		var bestScore = -INFINITY;
		var bestMove = INVALID;		
				
		for (var m = 1; m <= movesLength; m++) { //Start at 1, 0 is move length
			var move = BB_splitSrcDst(moveIndexes[m]);			
			
			var boardCopy = bb.slice();					
			BB_makeMove(boardCopy, turn, move.src, move.dst);				
			var score = BB_score(boardCopy, turn);
			//console.log('score: ', score);
			if (score > bestScore) {
				bestScore = score;
				bestMove = m;				
			}
		}		
		
		if (bestMove < 0) {
			console.log('No best move found');
			bestMove = 0;
			return onPlayed();
		}
		else {			
			var move = BB_splitSrcDst(moveIndexes[bestMove]);
			
			var move = {sr:POS_TO_R[move.src], sc:POS_TO_C[move.src], dr:POS_TO_R[move.dst], dc:POS_TO_C[move.dst]};
			//console.log('BestScore: ' + bestScore);
			return onPlayed(move);
		}
		
	}
	
	//Exports
	return {
		getPlay:getPlay
	}

})(); //End namespace HeuristicPlayer
