// FUNCTIONS TO CHECK BROWSERS

const isInternetExplorer = () => {

	return window.navigator.userAgent.match(/(MSIE|Trident)/);

}

const showBrowserAlert = () => {

	if(isInternetExplorer()){
       // Do not show initial form
       $("#form").hide();
       $("#browserAlert").show();
    } else {
    	console.log('All good');
    }

}

const showError = () => {

	// show a hidden div with error message
	$(".loading").hide();
	$(".customGeoForm").hide();
	// include a reset button on this error message
	$("#geoAlert").show();
	
}

// function for number formatting
Number.prototype.format = function(n, x) {
    var re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\.' : '$') + ')';
    return this.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, 'g'), '$&,');
};