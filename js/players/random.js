var RandomPlayer = (function() { //Poor man's namespace (module pattern)

	function play(board, onPlayed) {	
	
		
		var moves = board.getMoves();		
		if (!moves.length) return onPlayed();
		
		var randMove = [Math.floor(Math.random() * moves.length)];
		return onPlayed(moves[randMove]);
	}
	
	//Exports
	return {
		getPlay:play
	}

})(); //End namespace RandomPlayer