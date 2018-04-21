var Url = (function() {
	var nonVolatileHashChange = false;
	var hashChangedFn;
	
	function init(onHashChanged) {
		hashChangedFn = onHashChanged;
		window.onhashchange = onHashChangedManager;
	}
	
	function onHashChangedManager(e) {		
		//Non-volatile
		if (nonVolatileHashChange) {
			nonVolatileHashChange = false;
			e.preventDefault();
			e.stopPropagation();
			
		}
		else hashChangedFn(e); //Regularly scheduled hash event		
	}
	
	function setHashNonVolatile(val) {
		if (window.location.hash.replace('#') != val) {
			nonVolatileHashChange = true;
			window.location.hash = val; //This will trigger a hash event
		}
	}
	

	function getQueryString(name, url) {
		if (!url) url = window.location.href;
		name = name.replace(/[\[\]]/g, "\\$&");
		var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
			results = regex.exec(url);
		if (!results) return null;
		if (!results[2]) return true;
		return decodeURIComponent(results[2].replace(/\+/g, " "));
	}
	
	//Export
	return {init:init, setHash:setHashNonVolatile, getQueryString:getQueryString};
	
})();
//End Url namespace