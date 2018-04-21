var IterativeDeepeningPlayer = (function() { //Poor man's namespace (module pattern)

	
	var DEBUG = true;	
	var MAX_DEPTH = 8;
	var MAX_TIMEOUT = 3000; //MS
		
	var bestStateAtDepth;
	var inTrwStates = [false, false];
	var inTrwState = false;
	var timeStart;		
	
	function play(board, onPlayed) {					
			
		var turn = board.turn;
		var oppTurn = +(!turn);		
		var cur = turn<<1;
		var bb = board.bb.slice();
		
		
		//Check to see if it's in a TRW state
		inTrwState = inTrwStates[turn];
		if (inTrwState || BB_isTrwState(bb, turn, ROLE_ATTACKER)) {
			if ((bb[cur+oppTurn] & MASK_TRW_ENDGAME)) { //TRW sanity check, make sure they actually have attack pins in endgame locations
				console.log('In TRW state - limiting moves to attack-bits only, and increasing MAX_DEPTH');			
				
				MAX_DEPTH = 16; //Sorry if this melts your machine...
				inTrwStates[turn] = true; 
				
				//Limit moves to attack only						
				var attackBits = (bb[cur+oppTurn] & MASK_TRW_ENDGAME); //cur+oppturn = p1->lo, p2->hi
				if (turn == PLAYER1) {
					bb[P1_ABROAD] = attackBits;
					bb[P2_HOME] = (bb[P2_HOME] & MASK_TRW_DEFENSE[0]);
					bb[P1_HOME] = 0;
					bb[P2_ABROAD] = 0;
					
				}
				else {											
					bb[P2_ABROAD] = attackBits;
					bb[P1_HOME] = (bb[P1_HOME] & 0xffff0000);
					bb[P2_HOME] = 0;
					bb[P1_ABROAD] = 0;
				}
			}
			else { //Not really in a TRW 				
				inTrwState = false;
				inTrwStates[turn] = false;
			}
		}
		
		//Reset runtime variables	
		var root = {
			score: 0,
			bb : bb,
			children : []
		};
		var bestState = null;	
		var bestScore = -INFINITY;		
		bestStateAtDepth = new Array(MAX_DEPTH);
		timeStart = performance.now();
		
		//Win if possible
		var moveIndexes = BB_getMoveIndexes(bb, turn);
		var movesLength = moveIndexes[0];			
			
		for (var c = 1; c <= movesLength; c++) { 		
			var childBoard = bb.slice();
			var srcDst = moveIndexes[c];			
			var src = srcDst >>> BOARD_SIZE;
			var dst = srcDst & 0xff;
			BB_makeMove(childBoard, turn, src, dst);				
			
			//Win
			if (BB_isGameOver(childBoard, turn)) {				
				console.log('Taking win');
				var move = BB_deriveMove(bb, childBoard, turn);
				move.win = true;
				move.player = PLAYER_ITERATIVE_DEEPENING;
				return onPlayed(move);
			}							
			else if (BB_isTrwState(childBoard, turn, ROLE_DEFENDER) && !inTrwState) {	//From POV of defender here, because attacker just moved
				console.log('Moving into TRW state');
				var move = BB_deriveMove(bb, childBoard, turn);
				move.win = true;
				move.player = PLAYER_ITERATIVE_DEEPENING;
				return onPlayed(move);								
			}
			
			var childScore = BB_score(childBoard, turn);						
			root.children.push({score:childScore, bb:childBoard, children:[]});		
		}
		
		//START SEARCH		
		for (var d = 2; d < MAX_DEPTH; d++) {				
			var bestScore = negamax(root, turn, oppTurn, -INFINITY, INFINITY, 0, d);
			if (bestScore >= INFINITY) {
				bestState = root.children[bestStateAtDepth[0]].bb.slice();
				break;
			}
			else if (bestScore <= -HALF_INFINITY) break;				
			
			bestState = root.children[bestStateAtDepth[0]].bb.slice();
			
			//Prune any losing moves
			var newChildren = [];
			for (var i = 0; i < root.children.length; i++) {
				if (root.children[i].score > -HALF_INFINITY) newChildren.push(root.children[i]);
			}
			root.children = newChildren;
			
			if (d >= 5) { //Insure that it does at least SOME processing
				var duration = performance.now() - timeStart;
				if (duration > MAX_TIMEOUT) break; //Out of time
			}
			
		}
		MAX_DEPTH = 8;	//Reset
				
		
		
		//Debugging info
		if (DEBUG) {
			if (bestScore >= WINFINITY) Stage.sendMessage('Win found');
			else if (inTrwState) {
				alert ('In TRW state, but no winning path found!');
				console.log('In TRW state, but no winning path found:');
				console.log('Initial board:', board.bb);
				console.log('Limited board:', bb);
			}
			else if (bestScore >= TRW_INFINITY) Stage.sendMessage('TRW Win found');							
			else if (bestScore <= -TRW_INFINITY) Stage.sendMessage('TRW Inevitable loss');							
			else if (bestScore <= -HALF_INFINITY) Stage.sendMessage('Inevitable loss'); 
			
			//console.log ('Iterative Stats:');
		//	//console.log ('- time: ' + duration + ' ms');					
			//console.log ('Ok++: best score: ' + bestScore);
			//console.log ('- depth: ' + MAX_DEPTH);	
				
		}	
		
		
		if (!bestState) { //Probably gonna lose - Get first avail move
			var moves = board.getMoves();		
			if (!moves.length) return onPlayed();	
			else {
				var move = moves[0];
				move.player = PLAYER_ITERATIVE_DEEPENING;
				return onPlayed(move);
			}
		}		
		else {
			var changedBB = bestState;
			var move = BB_deriveMove(bb, changedBB, turn);
			move.player = PLAYER_ITERATIVE_DEEPENING;
			if (bestScore >= INFINITY) move.win = true;
			return onPlayed(move);
		}
	}
	
	//Recursive Alpha-Beta tree search with iterative deepening	
	function negamax (node, turn, oppTurn, alpha, beta, depth, maxDepth) { 						
		
		//Anchor - Last iteration
		if (depth >= maxDepth) { //Max depth
			//There shouldn't be any terminal nodes, (since they'd be found in the expansion)		
			return BB_score(node.bb, turn);
		}
		
		var bestScore = -INFINITY;
		bestStateAtDepth[depth] = INVALID;
			
		//Expand children & score	
		if (!node.children.length) { 
			var moveIndexes = BB_getMoveIndexes(node.bb, turn);
			var movesLength = moveIndexes[0];
			var cur = turn<<1;
			
			for (var c = 1; c <= movesLength; c++) { 		
				var childBoard = node.bb.slice();
				var srcDst = moveIndexes[c];			
				var src = srcDst >>> BOARD_SIZE;
				var dst = srcDst & 0xff;
				BB_makeMove(childBoard, turn, src, dst);				
				
				//Win
				if (BB_isGameOver(childBoard, turn)) {
					bestStateAtDepth[depth] = c-1; //These are c-1 because the will be used as root child id's to get the actual board state		
					node.children.push({score:WINFINITY, bb:childBoard, children:[]});					
					return WINFINITY;
				}							
				else if (BB_isTrwState(childBoard, turn, ROLE_DEFENDER) && !inTrwState) {	//From POV of defender here, because attacker just moved
					bestStateAtDepth[depth] = c-1;		
					node.children.push({score:TRW_INFINITY, bb:childBoard, children:[]});					
					return TRW_INFINITY;					
				}
				
				var childScore = BB_score(childBoard, turn);						
				node.children.push({score:childScore, bb:childBoard, children:[]});				
				if (childScore > bestScore) {
					bestScore = childScore;					
					bestStateAtDepth[depth] = c-1;	
				}
			}
			return bestScore;
		}
		
		//Looping through stored children
		else {
		
			//Order children for greater glory
			node.children = node.children.sort(FN_SCORE_COMPARE); //Custom compare function, sort by largest score first
			
			//Loop through child states			
			var children = node.children;
			for (var c = 0; c < children.length; c++) { 		
				var childNode = children[c];			
																			
				var recursedScore = negamax(childNode, oppTurn, turn, -beta, -Math.max(alpha, bestScore), depth+1, maxDepth); //Swap cur player as we descend
				var currentScore = -recursedScore;
				childNode.score = currentScore; //Score propagated up
				
				if (currentScore > bestScore) { 
					bestScore = currentScore;
					
					bestStateAtDepth[depth] = c;					
					if (bestScore >= beta) return bestScore;//AB cut-off
				}	
			}
			return bestScore;
		}
		
	}
	
	//Exports
	return {
		getPlay:play
	}
	
	function FN_SCORE_COMPARE(a, b) {
		return b.score - a.score;
	}

})(); //End namespace IterativeDeepeningPlayer
