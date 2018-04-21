var testNum = 0;
var success = true;

function assert(actual, expected, msg, target) {
	if (actual !== expected) {		
		success = false;
		throw {
			msg:
			`<div>
			<div>Error (${testNum}): ${msg}</div>
			<div>Actual: ${actual}</div>
			<div>Expected: ${expected}</div>`,
			target:target
		};
	}
	testNum++;	
	return true;
}


function onError(err) {
	document.write(err);
	//console.log(err);
}

function report() {
	if (success) document.write('<div style="color:green">All tests passed successfully.</div>');
	else document.write('<div style="color:red">Some tests failed.</div>');
}

