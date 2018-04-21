var abMaxDepth = null;
var AlphaBetaPlayer = (function() { //Poor man's namespace (module pattern)
	var DEBUG = true;
	var MAX_DEPTH;
	
	var bestStateAtDepth = []; //The board state
	var bestScoreAtDepth = [];	
	var totalNodes = 0;	
	
	function play(board, onPlayed) {					
		MAX_DEPTH = menu.getDefault('maxDepth', 4);
		if (!abMaxDepth) {
			abMaxDepth = prompt('Max Depth', MAX_DEPTH);
			if (!abMaxDepth) return;
			var propertyName = MENU_PREFIX + 'maxDepth';	
			localStorage.setItem(propertyName, abMaxDepth);
		}		
				
		var turn = board.turn;
		var oppTurn = +(!turn);
		var bb = board.bb.slice();		
		
		//Reset runtime variables		
		//bestStateAtDepth = new Array(MAX_DEPTH);
		bestMoveAtDepth = new Array(MAX_DEPTH);
		bestScoreAtDepth = new Array(MAX_DEPTH);
		
		totalNodes = 0;		
		
		//START SEARCH
		var timeStart = performance.now();
		var bestScore = negamax(bb, turn, oppTurn, -INFINITY, INFINITY, 0);
		var duration = performance.now() - timeStart;
		
		
		//CHOOSE MOVE
		//Find shortest win - maybe a better way to do this?
		var bestMove = bestMoveAtDepth[0];
		if (bestScore >= INFINITY) { 
			var MAX_D = MAX_DEPTH-1;
			for (var d = 1; d < MAX_D; d++) {
				MAX_DEPTH = d;
				bestMoveAtDepth = new Array(MAX_DEPTH);
				bestScoreAtDepth = new Array(MAX_DEPTH);
				
				totalNodes = 0;		
        
				var bestScore2 = negamax(bb, turn, oppTurn, -INFINITY, INFINITY, 0);
				if (bestScore2 >= INFINITY) {
					bestMove = bestMoveAtDepth[0];
					break;
				}
			}
		}
		
		
		//Debugging info
		if (DEBUG) {
			if (bestScore >= INFINITY) Stage.sendMessage('AB: Win found');
			else if (bestScore <= -INFINITY) {
				Stage.sendMessage('AB: Inevitable loss'); 
			}			
			
			//console.log ('AlphaBeta Stats:');
			//console.log ('- time: ' + duration + ' ms');
			//console.log ('- total nodes: ' + totalNodes);			
			//console.log ('- best score: ' + bestScore);
			//console.log ('- depth: ' + MAX_DEPTH);	
			console.log ('J/S AB score: ' + bestScore);			
		}	
		
		
		if (!bestMove) { //Probably gonna lose - Get first avail move
			var moves = board.getMoves();		
			if (!moves.length) return onPlayed();	
			else return onPlayed(moves[0]);
		}		
		else {
			var move = BB_splitSrcDst(bestMove);
			var move4 = {sr:POS_TO_R[move.src], sc:POS_TO_C[move.src], dr:POS_TO_R[move.dst], dc:POS_TO_C[move.dst]}; 
			return onPlayed(move4);
		}
	}
	
	//Recursive Alpha-Beta tree search	
	function negamax (bb, turn, oppTurn, alpha, beta, depth) { 						
		
		//Anchor
		if (depth >= MAX_DEPTH) { //Max depth - Score
			//There shouldn't be any terminal nodes, (since they'd be found in the expansion)
			return BB_score(bb, turn);
		}
		
		//EXPANSION
		bestMoveAtDepth[depth] = null;
		
		//Loop through child states
		var bestScore = -INFINITY - depth;

		//var childMoves = BB_getMoves(bb, turn);
		var moveIndexes = BB_getMoveIndexes(bb, turn);
		var movesLength = moveIndexes[0];
		totalNodes += movesLength;
		for (var c = 1; c <= movesLength; c++) { 		
			var childBoard = bb.slice();
			var srcDst = moveIndexes[c];			
			var src = srcDst >>> 8;
			var dst = srcDst & 0xff;
			BB_makeMove(childBoard, turn, src, dst);
						
			//Win
			if (BB_isGameOver(childBoard, turn)) {
				
				bestMoveAtDepth[depth] = srcDst;
				var levelOfInfinity = INFINITY+(MAX_DEPTH-depth);
				bestScoreAtDepth[depth] = levelOfInfinity;
				return levelOfInfinity;
			}
			
						
			var recursedScore = negamax(childBoard, oppTurn, turn, -beta, -Math.max(alpha, bestScore), depth+1); //Swap cur player as we descend
			var currentScore = -recursedScore;
			
			if (currentScore > bestScore) { 
				bestScore = currentScore;
				
				bestMoveAtDepth[depth] = srcDst;
				bestScoreAtDepth[depth] = currentScore;				
				if (bestScore >= beta) return bestScore;//AB cut-off
			}	
		}
		
		return bestScore;
	}
	
	//Exports
	return {
		getPlay:play
	}

})(); //End namespace AlphaBetaPlayer