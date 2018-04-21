'use strict'
var Stage = (function() { //Stage namespace (module pattern)		
		
	var CANVAS_SIZE = 700;
	var HALF_CANVAS = CANVAS_SIZE/2;
	var GRID_COUNT = BOARD_SIZE;	
	var GRID_SIZE = CANVAS_SIZE/GRID_COUNT;
	var HALF_GRID = GRID_SIZE/2;
	
	
	var COLOR_BOARD = '#669966';
	var COLOR_PATH = '#786f5e';
	var COLOR_PLAYER1 = '#ff4242';
	var COLOR_PLAYER2 = '#8d8d8d';		

	var COLOR_SELECTED = '#ff0';
	var COLOR_OUTLINE = '#333';			
	var COLOR_GRID = '#333';
	var COLOR_SUGGEST = 'aqua';
	
	var WIDTH_PATH = 8;
	var WIDTH_WIN = 3;	
	var WIDTH_PIN = HALF_GRID/2;
	var WIDTH_GRID = 0.5;	
	var WIDTH_HOVER = WIDTH_PIN + 5;
	var WIDTH_OUTLINE = 1;
	var WIDTH_SELECTED = 5;
	var WIDTH_SUGGEST = 6;
		
					
	var KEY_Z = 90;
	var KEY_Y = 89;
	var KEY_LEFT = 37;
	var KEY_RIGHT = 39;
	
	var DELAY_MOVE = 500;
	var DELAY_WIN_MESSAGE = 100;
		
	var MODE_PLAY = 0;
	var MODE_ANIM = 1;
		
	var canvas;	
	var canvasBounds;
	
	var ctx;	
	
	var board;
	var cursor = {x:0, y:0, r:0, c:0};
	var selected = {r:INVALID, c:INVALID};	
	var animInfo = {};
	var turn;
	var mode = MODE_PLAY;
	var suggested = {sr:INVALID, sc:INVALID, dr:INVALID, dc:INVALID};		
			
	function init(newGame) { 	

		//Menu				
		var menuManager = new MenuManager();
		menu = menuManager.properties;
		
		//Temp upgrade
		var oldNetworkUrl = menu.getDefault('networkUrl', false);
		if (oldNetworkUrl) {
			var propertyName = MENU_PREFIX + 'networkUrl';	
			localStorage.setItem(propertyName + '0', oldNetworkUrl);
			localStorage.setItem(propertyName + '1', oldNetworkUrl);
			localStorage.removeItem(propertyName);
		}
	
		board = newGame.board.copy();			
		canvas = document.getElementById('mainCanvas');
		canvasBounds = canvas.getBoundingClientRect(); 
		ctx = canvas.getContext('2d');    			
		ctx.font = 'bold 15px Verdana';
		
		
		//Event callbacks
		canvas.addEventListener('click', onMouseClick.bind(this), false);
		window.addEventListener('keydown', onKeyDown.bind(this), false);				
		canvas.addEventListener('mousemove', onMouseMove.bind(this), false);		
		
		//Game event callbacks
		game.addEventListener(EVENT_INVALID, onGameInvalid.bind(this));
		game.addEventListener(EVENT_GAME_OVER, onGameOver.bind(this));
		game.addEventListener(EVENT_PLAYED, onGamePlayed.bind(this));
		game.addEventListener(EVENT_BOARD_UPDATE, onGameBoardUpdate.bind(this));
		game.addEventListener(EVENT_SUGGEST, onGameSuggest.bind(this));
		
		draw(); 		
	}

	
	//Mouse and Keyboard Events	
	function onKeyDown(e) {	
		var changed = false;		
		
		if (e.ctrlKey || e.keyCode == KEY_LEFT || e.keyCode == KEY_RIGHT) {
			//Undo move with Ctrl + Z
			if (e.keyCode == KEY_Z || e.keyCode == KEY_LEFT) { 
				changed = game.undoMove();
			}
			//Redo move with Ctrl + Y
			else if (e.keyCode == KEY_Y || e.keyCode == KEY_RIGHT) { 
				changed = game.redoMove();
			}
			
			//Update state
			if (changed) {

				board = game.board;
			}
		}	
	}

	function onMouseMove(e) {	
		var x = e.clientX - canvasBounds.left; 
		var y = e.cursorY = e.clientY - canvasBounds.top;  
		
		cursor.x = x;
		cursor.y = y;
		
		cursor.r = Math.floor(y/GRID_SIZE);
		cursor.c = Math.floor(x/GRID_SIZE);		
	}

	function onMouseClick(e) {
		if (mode == MODE_ANIM) { //Snap to position
			mode = MODE_PLAY;
			return;
		}
		var x = e.clientX - canvasBounds.left; 
		var y = e.clientY - canvasBounds.top;  

		var r = Math.floor(y/GRID_SIZE);
		var c = Math.floor(x/GRID_SIZE);		
				
		//Check bounds
		if (!board.onBoard(r, c)) return;
		
		var turn = board.getTurn();
		if (game.players[turn] != PLAYER_HUMAN) return;
						
		var pin = board.getPin(r, c);

		if (board.canSelect(r, c)) selected = {r:r, c:c};	
		else {
			var moveCode = board.canMove(selected.r, selected.c, r, c);
			if (moveCode == VALID) game.onPlayed({sr:selected.r, sc:selected.c, dr:r, dc:c});
			else sendMessage(invalidMsg(moveCode));
		}
	}			
	
	function sendMessage(text) {	
		var msg = document.getElementById('message');
		msg.innerText = text;
		msg.style.display = 'block';
		setTimeout(function() {
			msg.style.display = 'none';
		}, 3000);

	}
	
	//Game events
	function onGameInvalid(invalid) {
		var message = invalidMsg(invalid);		
		sendMessage(message);
	}
	
	function onGameOver(winner, loser) {		
		var winText = (winner == PLAYER1)? 'Player 1' : 'Player 2';
		var message = 'Game over! ' + winText + ' wins';
		board = game.board.copy();
		setTimeout(function() {
			alert(message);
			sendMessage(message);
		}, DELAY_WIN_MESSAGE);
	}
	
	function onGamePlayed(playerType, move) {
		suggested = {sr:INVALID, sc:INVALID, dr:INVALID, dc:INVALID};	
		animMove(move, playerType, function() {			
			board = game.board.copy();
			var boardStr = board.toString();
			Url.setHash(boardStr);
						
			var nextPlayer = game.players[board.turn];
			var moveDelay = (nextPlayer == PLAYER_ITERATIVE_DEEPENING)? 0 : DELAY_MOVE;
			setTimeout(function() {
				if (!board.isGameOver()) game.play();
			}, DELAY_MOVE); //Next move
		});
	}
	
	function onGameBoardUpdate(newBoard) {		
		board = newBoard;	
	}
	
	function onGameSuggest(player, move) {
		suggested = move;
		console.log(suggested);
	}
	
	function animMove(move, initiatingPlayer, callback) {	
		if (initiatingPlayer == PLAYER_HUMAN) {
			//if (!menu.animateHuman) 
			return callback();//Skip animation for human
		}
		mode = MODE_ANIM;	
		animInfo = {
			r:move.sr,
			c:move.sc,
			x:(move.sc * GRID_SIZE), 
			y:(move.sr * GRID_SIZE)
		};	
		
		var tween = new TWEEN.Tween(animInfo)
		.to({x:(move.dc * GRID_SIZE), y:(move.dr * GRID_SIZE)}, menu.animSpeed)	
		.easing(TWEEN.Easing.Quadratic.In)		
		.onUpdate(function() {				
			if (mode != MODE_ANIM) { //Prematurely end animation				
				tween.stop();
				callback();
			}			
		})
		.onComplete(function() {
			mode = MODE_PLAY;
			callback();
		})
		.start();
	}
	
	//Drawing
	function draw(time) {			
					
				
		var turn = board.turn;
		//Draw Spaces
		for (var r = 0; r < BOARD_SIZE; r++) {
			for (var c = 0; c < BOARD_SIZE; c++) {
				var x = c * GRID_SIZE;
				var y = r * GRID_SIZE;
				
				//Draw Checkerboard pattern
				if (r % 2 == 0) {
					if (c % 2 == 0) ctx.fillStyle = '#fff';
					else ctx.fillStyle = COLOR_BOARD;
				}
				else {
					if (c % 2 == 0) ctx.fillStyle = COLOR_BOARD;
					else ctx.fillStyle = '#fff';
				}
				ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
				
				var animColor;
				//Draw Pins
				var pin = board.getPin(r, c);
				if (pin != EMPTY) {				
					var pinSize;
					var pinColor = (pin == PLAYER1)? COLOR_PLAYER1 : COLOR_PLAYER2;
					if (r == cursor.r && c == cursor.c && pin == turn) pinSize = WIDTH_HOVER;					
					else pinSize = WIDTH_PIN;
					
					//Move animation
					if (mode == MODE_ANIM && r == animInfo.r && c == animInfo.c) {
						animColor = pinColor;
						continue; 
					}
					
					//Selected 
					else if (r == selected.r && c == selected.c) {
						drawPin(x, y, COLOR_SELECTED, pinSize + WIDTH_SELECTED); 
						drawPin(x, y, pinColor, pinSize); 
					}
					
					
					//Regular pins
					else {
						drawPin(x, y, COLOR_OUTLINE, pinSize + WIDTH_OUTLINE); 
						drawPin(x, y, pinColor, pinSize); 
					}
					
					if (menu.showPlayerNum) {
						ctx.fillStyle = COLOR_PATH;	
						ctx.fillText(pin+1, x+HALF_GRID-5, y+HALF_GRID+2);
					}
					
					//Suggested - source
					if (r == suggested.sr && c == suggested.sc) {						
						ctx.strokeStyle = COLOR_SUGGEST;
						ctx.lineWidth = WIDTH_SUGGEST;
						ctx.strokeRect(x + 3, y + 3, GRID_SIZE - 3, GRID_SIZE - 3);																			
						ctx.lineWidth = 1;						
					}
				}
				//Suggested - dest
				if (r == suggested.dr && c == suggested.dc) {
					ctx.strokeStyle = COLOR_SUGGEST;
					ctx.lineWidth = WIDTH_SUGGEST;
					ctx.strokeRect(x+3, y+3, GRID_SIZE - 3, GRID_SIZE - 3);
					ctx.lineWidth = 1;
				}
				
				//Draw Position numbers
				if (menu.showPositions) {
					ctx.fillStyle = COLOR_PATH;	
					ctx.fillText(RC_TO_POS[r][c], x+5, GRID_SIZE+y-10);
				}
			}
		}		
				
		
		//Turn		
		drawTurn();
		
		//Draw Grid
		if (menu.showGrid) drawGrid();
		if (menu.showLabels) drawLabels();
		
		//Animation
		if (mode == MODE_ANIM) {
			var x = animInfo.x;
			var y = animInfo.y;
			drawPin(x, y, COLOR_SELECTED, WIDTH_HOVER + WIDTH_OUTLINE); 
			drawPin(x, y, animColor, WIDTH_PIN); 	
		}
		
		TWEEN.update(time);
		requestAnimationFrame(draw.bind(this)); //Repaint	
	}
	
	
	function drawGrid() {
		ctx.lineWidth = WIDTH_GRID;
		ctx.strokeStyle = COLOR_GRID;				
		var labelOffset = HALF_GRID;
		for (var i = 0; i < GRID_COUNT; i++) {
			var unit = i * GRID_SIZE;
			drawLine(ctx, unit, 0, unit, CANVAS_SIZE);
			drawLine(ctx, 0, unit, CANVAS_SIZE, unit);
						
		}		
		
	}
	
	function drawLabels() {	
		ctx.fillStyle = COLOR_PATH;			
		
		var labelOffset = HALF_GRID;
		for (var i = 0; i < GRID_COUNT; i++) {
			var unit = i * GRID_SIZE;			
			
			ctx.fillText(GRID_COUNT - i, 10, unit + labelOffset + 5);	//Vertical label
			ctx.fillText(String.fromCharCode(97 + i), unit + labelOffset - 5, CANVAS_SIZE - 10);	//Horizontal label
		}	
	}
		
	function drawPin(x, y, color, size) {
		
		var pinCenter = HALF_GRID-size;
		ctx.fillStyle = color;
		drawCircle(ctx, x + pinCenter, y + pinCenter, size, 0); 
		
	}
			
	
	function drawTurn() {
		var turn = board.getTurn();
		var text = (turn == PLAYER1)? 'Player 1' : 'Player 2';
				
		ctx.fillStyle = COLOR_PATH;
		ctx.fillText(text, 10, 15);		
	}
	
		
	//Export
	return {init:init, sendMessage:sendMessage};
})();
//End Stage namespace