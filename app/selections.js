// INITIATE CHOSEN DROPBOXES

$('#geography').chosen({
	width: "95%",
	no_results_text: "Oops, nothing found!",
	hide_results_on_select: false
});

// open smaller reset container top left when standard geo selected
$("#geo-data-update").click(function() {
	$("#form").hide();
});

// open drive time selection tool and close main form temporarily
$("#advanced-drive-time").click(function() {
	$("#form").hide();
	$("#driveTimeForm").show();
});

// open radius selection tool and close main form temporarily
$("#advanced-radius").click(function() {
	$("#form").hide();
	$("#radiusForm").show();
});

// close custom geo form and open regular form on cancel
$(".clear-out").click(function() {
	$(".customGeoForm").hide();

	$("#geoAlert").hide();

	$(".side-panel-container").hide();
	$("#form").show();

	$('#level').val('').trigger('chosen:updated');
	$('#geography').val('').trigger('chosen:updated');

	map.removeLayer('isoLayer');
    map.removeLayer('buffer');
    map.setLayoutProperty('countyFill', 'visibility', 'none');

    // isoMarker.remove();
    // bufferMarker.remove();

    map.flyTo({
    	center: [-83.007,32.731], // starting position [lng, lat]
      	zoom: 6.8 // starting zoom
    });

	$( "svg" ).remove();

});

// hide and show radius and drive-time parameters to modify the search
$("#radiusModify").click(function() {
	$('.radius-params').css('display','flex');
});

$("#isoModify").click(function() {
	$('.iso-params').css('display','flex');
});


// when clicking get data, fire events
$("#geo-data-update").click( () => {

	console.log(areas);
	// bring up the loader
  	$('.loading').show();

  	let selectedGeographies = $("#geography_chosen span").get().map(el => el.textContent);

  	// get the prefixes and geoids of the selected geographies
  	let series = selectedGeographies.map(id => areas.find(({ area }) => area === id).prefix);
  	let geoFilter = selectedGeographies.map(id => areas.find(({ area }) => area === id).geoid);
  	// flatten the array in case a cd region was selected with a nested array
  	series = series.flat();
  	geoFilter = geoFilter.flat();
  	console.log(geoFilter);

  	let seriesOne = [];
  	let seriesTwo = [];
  	series.forEach( (element, index) => {
  		seriesOne.push( series[index] = "LAU"+element+"04" );
  		seriesTwo.push( series[index] = "LAU"+element+"06" );
  	});

  	series = seriesOne.concat( seriesTwo );

  	//bls api only allows a max of 50 series per call, so check first
  	if (series.length > 25) {
  		showError();
  	} else {

  		series = series.map( serie => serie ).join(',');
  		console.log(series);
  		// make request for data
		makeCall(series, geoFilter);

  	}
});




