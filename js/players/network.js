var NetworkPlayer = (function() { //Network namespace (Module pattern)			
	var networkUrls = [INVALID,INVALID];		
	var playerId = +(new Date()); //Timestamp
	
	function getPlay(board, onPlayed) {			
		var turn = board.turn;
		
		var url = getDefaultUrl(turn);
		if (!url || url == '') {
			if (!configPlayer(turn)) return;
		}
		
		var qsStart = (url.lastIndexOf('?') > 0)? '&' : '?'; //Horrible format
		var queryString = qsStart + 'id=' + playerId + '&board=' + board.toString();
		url += queryString;
		
		ajax(url, function(data, status) {
			//Optional argument to log info 
			if (data.hasOwnProperty('alert')) alert(data.alert); 
			if (data.hasOwnProperty('log')) console.log(data.log); 
			if (data.hasOwnProperty('move') || data.hasOwnProperty('board')) {
				
				if (data.hasOwnProperty('move')) {
					//Expect a BTMN String - Example: A5B4 
					var btmn = data.move;
					var move = board.btmnToMove(btmn);
					move.player = PLAYER_NETWORK;
					if (move) {
						//Sanity check
						if (data.hasOwnProperty('board')) { 
							var receivedBoardStr = data.board;
							var boardCopy = board.copy();
							boardCopy.makeMove(move.sr, move.sc, move.dr, move.dc);
							boardCopy.changeTurn();
							var expectedBoardStr = boardCopy.toString();						
								
							if (receivedBoardStr != expectedBoardStr) return alert('Network error: Expected move "' + btmn + "' to result in " + expectedBoardStr + '"\nReceived: "' + receivedBoardStr + '"');							
							else return onPlayed(move);	
						}
						//No Sanity check
						else return onPlayed(move);							
					}
					else return alert ('Player attempted invalid move: ' + btmn);
				}
				else {
					var changedBoardStr = data.board;
					var move = board.deriveMove(changedBoardStr);
					move.player = PLAYER_NETWORK;
					if (move) return onPlayed(move);
					else return alert('Network error: invalid board string. \nUnable to derive move from: "' + changedBoardStr + '"');
				}
			}
			else return alert('Network service must return a JSON object containing either a "move", or "board" attribute.\nSee https://gotankersley.bitbucket.io/doc/network for more info.');
		});
		
	}
	
	function getDefaultUrl(player) {
		var url = networkUrls[player];
		if (url == INVALID) {		
			var defaultUrl = menu.getDefault('networkUrl' + player, null); 
			if (!defaultUrl) return '';
			else return defaultUrl;
		}
		else return url;
	}
	
	function configPlayer(player) {
		var oldUrl = getDefaultUrl(player);		
		var newUrl = prompt('Enter a service URL:\n(See https://gotankersley.bitbucket.io/doc/network for more info)', oldUrl );
		if (!newUrl) return;
		var propertyName = MENU_PREFIX + 'networkUrl' + player;	
		localStorage.setItem(propertyName, newUrl);
		networkUrls[player] = newUrl;
		
	}
	
	//Vanilla J/S equivalent of jQuery's $.ajax
	function ajax(url, callback) { 
		var xhr = new XMLHttpRequest();
		xhr.open('GET', encodeURI(url));
		xhr.onload = function() {
			var data = JSON.parse(xhr.responseText);
			callback(data, xhr.status);			
		};
		xhr.send();
	}
	
	
	//Exports
	return {getPlay:getPlay, configPlayer:configPlayer};

})(); //End NetworkPlayer namespace