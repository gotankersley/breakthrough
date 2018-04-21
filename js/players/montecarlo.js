var mcMaxIterations = null;
var MonteCarloPlayer = (function() { //Poor man's namespace (module pattern)

	
	var MOVE_LIMIT = 50;
	var MC_WIN = 1;	
	var MC_TIE = 0; //Technically Breakthrough doesn't have draws - but the simulations might not finish, so score as tie
	var MC_LOSE = -1;
	
	function play(board, onPlayed) {			
		var MAX_ITERATIONS = menu.getDefault('maxIterations', 10);
		if (!mcMaxIterations) {
			mcMaxIterations = prompt('Max Iterations per child position', MAX_ITERATIONS);
			if (!mcMaxIterations) return;
			var propertyName = MENU_PREFIX + 'maxIterations';	
			localStorage.setItem(propertyName, mcMaxIterations);
		}
		
		var currentTurn = board.turn;
		var bb = board.bb;
		var moveIndexes = BB_getMoveIndexes(bb, currentTurn);
		var movesLength = moveIndexes[0];		
				
		var bestScore = -INFINITY;
		var bestPlay = -1;
		for (s = 1; s <= movesLength; s++) {
			
			var srcDst = moveIndexes[s];
			var src = srcDst >>> 8;
			var dst = srcDst & 0xff;
			
			var kidBoard = bb.slice();
			BB_makeMove(kidBoard, currentTurn, src, dst);	
			
						
			if (BB_isGameOver(bb, currentTurn)) { //Win
				var move = {sr:POS_TO_R[src], sc:POS_TO_C[src], dr:POS_TO_R[dst], dc:POS_TO_C[dst]};
				return onPlayed(move); 
			}
			
			var score = 0;
			for (var i = 0; i < mcMaxIterations; i++) {
				var boardCopy = kidBoard.slice();
				var simResult = simulate(boardCopy, currentTurn);
				score += simResult;
			}
			
			if (score > bestScore) {
				bestScore = score;
				bestPlay = s;
			}
			console.log(s + ' - ' + score);
		}
		//console.log('BestScore', bestScore);
		
		//Eeny, meeny, miny, moe...
		if (bestPlay < 0) bestPlay = moveIndexes[Math.floor(Math.random() * movesLength)+1];		
		var srcDst = moveIndexes[bestPlay];
		var src = srcDst >>> 8;
		var dst = srcDst & 0xff;
		var move = {sr:POS_TO_R[src], sc:POS_TO_C[src], dr:POS_TO_R[dst], dc:POS_TO_C[dst]};			
		return onPlayed(move);
	}
	
	function simulate(bb, currentTurn) {
		
		var turn = currentTurn;
		for (var p = 0; p < MOVE_LIMIT; p++) {			
						
			var moveIndexes = BB_getMoveIndexes(bb, turn);
			var movesLength = moveIndexes[0];
			if (movesLength) {
				//TODO: block win?!?!
				var randMove = moveIndexes[Math.floor(Math.random() * movesLength)+1];
				var randSrc = randMove >>> 8;
				var randDst = randMove & 0xff;
				BB_makeMove(bb, turn, randSrc, randDst);				
				
				if (BB_isGameOver(bb, turn)) {
					if (turn == currentTurn) return MC_WIN;
					else return MC_LOSE;
				}
				else turn = +(!turn);
			}
			else {
				if (turn == currentTurn) return MC_LOSE;
				else return MC_WIN;
			}
			
							
		}
		return MC_TIE; //Not technical tie, but just that game move limit reached
	}
	
	//Exports
	return {
		getPlay:play
	}

})(); //End namespace MonteCarloPlayer