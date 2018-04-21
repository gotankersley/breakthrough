/* Note: This uses Javascript typed arrays to emulate 64 bit integers, and to do bitwise operations with them */

//Note instead of this, for some uses you can use Math.log2 instead, (except for when it might be zero)
var MASK_TO_POS_LO = {0:0,1:0,2:1,4:2,8:3,16:4,32:5,64:6,128:7,256:8,512:9,1024:10,2048:11,4096:12,8192:13,16384:14,32768:15,65536:16,131072:17,262144:18,524288:19,1048576:20,2097152:21,4194304:22,8388608:23,16777216:24,33554432:25,67108864:26,134217728:27,268435456:28,536870912:29,1073741824:30,2147483648:31};
var MASK_TO_POS_HI = {0:0,1:32,2:33,4:34,8:35,16:36,32:37,64:38,128:39,256:40,512:41,1024:42,2048:43,4096:44,8192:45,16384:46,32768:47,65536:48,131072:49,262144:50,524288:51,1048576:52,2097152:53,4194304:54,8388608:55,16777216:56,33554432:57,67108864:58,134217728:59,268435456:60,536870912:61,1073741824:62,2147483648:63};

function newMask(lo, hi) {
	return new Uint32Array([lo, hi]);	
}

function copyOff(bb, off) {
	return bb.slice(off, off+2);
}


function eq(x, y) {
	if (x[0] == y[0] && x[1] == y[1]) return true;
	else return false;
}

function and(x, y) { 
	return new Uint32Array([
		x[0] & y[0], //HI
		x[1] & y[1]  //LO
	]);	
}

function andOff1(bb, off, y) { 
	return new Uint32Array([
		bb[off] & y[0], //HI
		bb[off+1] & y[1]  //LO
	]);	
}

function andOff2(bb1, off1, bb2, off2) { 
	return new Uint32Array([
		bb1[off1] & bb2[off2], //HI
		bb1[off1+1] & bb2[off2+1]  //LO
	]);	
}

function or(x, y) { 
	return new Uint32Array([
		x[0] | y[0], //HI
		x[1] | y[1]  //LO
	]);	
}

function orOff2(bb1, off1, bb2, off2) { 
	return new Uint32Array([
		bb1[off1] | bb2[off2], //HI
		bb1[off1+1] | bb2[off2+1]  //LO
	]);	
}

function xor(x, y) { 
	return new Uint32Array([
		x[0] ^ y[0], //HI
		x[1] ^ y[1]  //LO
	]);	
}

function xorOff1(bb1, off, y) { 
	return new Uint32Array([
		bb1[off] ^ y[0], //HI
		bb1[off+1] ^ y[1]  //LO
	]);	
}

function notEq(x) {
	x[0] = ~x[0]; //HI
	x[1] = ~x[1]; //LO
	return x;
}

//Eq
function andEqOff2(bb1, off1, bb2, off2) { // &=
	bb1[off1] &= bb2[off2]; //HI
	bb1[off1+1] &= bb2[off2+1];  //LO	
}

function orEq(x, y) { // |=
	x[0] |= y[0]; //HI
	x[1] |= y[1];  //LO	
}

function orEqOff1(bb, off, y) { // |=
	bb[off] |= y[0]; //HI
	bb[off+1] |= y[1];  //LO	
}

function orEqOff2(bb1, off1, bb2, off2) { // |=
	bb1[off1] |= bb2[off2]; //HI
	bb1[off1+1] |= bb2[off2+1];  //LO	
}

function xorEqOff1(bb, off, y) { // ^=
	bb[off] ^= y[0]; //HI
	bb[off+1] ^= y[1];  //LO	
}

function xorEqOff2(bb1, off1, bb2, off2) { // ^=
	bb1[off1] ^= bb2[off2]; //HI
	bb1[off1+1] ^= bb2[off2+1];  //LO	
}


//Eval
function evalOff1(bb, off) {
	if (bb[off] || bb[off+1]) return true;
	else return false;
}

function evalAnd(x, y) { // if (x & y)	
	if ((x[0] & y[0]) || (x[1] & y[1])) return true;
	else return false;
}

function evalAndOff1 (bb, off, y) { // if (bb[off] & y)	
	if ((bb[off] & y[0]) || (bb[off+1] & y[1])) return true;
	else return false;
}

function evalAndOff2 (bb1, off1, bb2, off2) { // if (bb[off1] & bb[off2])	
	if ((bb1[off1] & bb2[off2]) || (bb1[off1+1] & bb2[off2+1])) return true;
	else return false;
}



function bitCount(x) {
	var lo = x[1]; //LO
	lo = lo - ((lo >>> 1) & 0x55555555);
	lo = (lo & 0x33333333) + ((lo >>> 2) & 0x33333333);
	var loCount = ((((lo + (lo >>> 4)) & 0x0F0F0F0F) * 0x01010101) >>> 24);
	
	var hi = x[0]; //HI
	hi = hi - ((hi >>> 1) & 0x55555555);
	hi = (hi & 0x33333333) + ((hi >>> 2) & 0x33333333);
	return loCount + ((((hi + (hi >>> 4)) & 0x0F0F0F0F) * 0x01010101) >>> 24);	
}


function bitLoop(bb, off, iterationFn){ //bitScan
	var x = bb.slice(off, off+2);	
	
	var hi = x[0];
	while (hi) {
		var minBit = hi & -hi;		
		iterationFn(Math.log2(minBit >>> 0) + 32);		
		hi &= hi-1;
	}
	
	var lo = x[1];
	
	while (lo) {
		var minBit = lo & -lo;		
		iterationFn(Math.log2(minBit >>> 0));		
		lo &= lo-1;
	}
		
}

/*
function bitLoopNested(outerBB, outerOff, innerBB){ 
	var bits = [];
	
	var outerHi = outerBB[outerOff];
	while (outerHi) {
		var outerMinBit = outerHi & -outerHi;		
		var outerPos = outerMinBit + 32;
		var outerPosMaskIndex = outerPos<<1;
		outerHi &= outerHi-1;
		
		var innerHi = innerBB[outerPosMaskIndex];
		while (innerHi) {
			var innerMinBit = innerHi & -innerHi;		
			var innerPos = innerMinBit + 32;
			innerHi &= innerHi-1;
			bits.push((outerPos<<6)+innerPos);
			//iterationFn(outerPos, innerPos);
		}
		
		var innerLo = innerBB[outerPosMaskIndex+1];	
		while (innerLo) {
			var innerPos = innerLo & -innerLo;				
			innerLo &= innerLo-1;
			bits.push((outerPos<<6)+innerPos);
			//iterationFn(outerPos, innerPos);		
		}
	}
	
	var outerLo = outerBB[outerOff+1];	
	while (outerLo) {
		var outerPos = outerLo & -outerLo;
		var outerPosMaskIndex = outerPos<<1;		
		outerLo &= outerLo-1;
		
		var innerHi = innerBB[outerPosMaskIndex];
		while (innerHi) {
			var innerMinBit = innerHi & -innerHi;		
			var innerPos = innerMinBit + 32;
			innerHi &= innerHi-1;
			bits.push((outerPos<<6)+innerPos);
			//iterationFn(outerPos, innerPos);
		}
		
		var innerLo = innerBB[outerPosMaskIndex+1];	
		while (innerLo) {
			var innerPos = innerLo & -innerLo;				
			innerLo &= innerLo-1;
			bits.push((outerPos<<6)+innerPos);
			//iterationFn(outerPos, innerPos);		
		}
		
	}	
	return bits;
}*/