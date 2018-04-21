function drawLine(ctx, x1, y1, x2, y2) {
	ctx.beginPath();	
	ctx.moveTo(x1, y1);
	
	ctx.lineTo(x2,y2);    
    ctx.closePath();		
	ctx.stroke();   
}

function drawCircle(ctx, x, y, r, margin) {
	ctx.beginPath();    
	ctx.arc(x + r,y + r, r - margin, 0, 2 * Math.PI, true);	
	ctx.closePath();    
	ctx.fill();		
}


