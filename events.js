

// function to detect Internet Explorer

function isInternetExplorer() {
	return window.navigator.userAgent.match(/(MSIE|Trident)/);
}

function showBrowserAlert() {
	if(isInternetExplorer()){
       // Do not show initial form
       $("#form").hide();
       $("#browserAlert").show();
    } else {
    	console.log('All good');
    }
}

// check browser width and set bounding box for zoom later based on said width
let bbox;

// style dropdowns with chosen

$('#level').chosen({
	width: "95%"
});

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

	// if Datatable currently exists, then clear and kill it
	if ( $.fn.dataTable.isDataTable('#emsiTable') ) {
		$('#emsiTable').DataTable().destroy();
	}

	// empty html of jobsTable
	$('#emsiTable thead').empty();
  	$('#emsiTable tbody').empty();

	$(".side-panel-container").hide();
	$("#form").show();

	$('#level').val('').trigger('chosen:updated');
	$('#geography').val('').trigger('chosen:updated');

	map.removeLayer('isoLayer');
    map.removeLayer('buffer');
    map.setLayoutProperty('counties', 'visibility', 'none');

    isoMarker.remove();
    bufferMarker.remove();

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


// dropdown filters for level to geography dropdowns
(function() {

	// check for IE
	showBrowserAlert();

	// object of arrays contained in counties.js
	// assign dropdown elements to variables
	var level = document.getElementById('level');
	var geographyList = document.getElementById('geography_chosen').getElementsByClassName('chosen-results')[0];
	var geographyOption = document.getElementById('geography');

	// assign occupation dropdowns to variables
	// var carnegieLevel = document.getElementById('carnegieParent');
	// var schoolsList = document.getElementById('occupation_chosen').getElementsByClassName('chosen-results')[0];
	// var schoolsOption = document.getElementById('occupation');

	// create on change event that will populate empty counties dropdown with values from arrays
	level.onchange = function() {
		// clear out geographies
		geographyList.length = 0;
		geographyOption.length = 0;

		// get the selected value from level
		var _val = this.options[this.selectedIndex].value;

		// loop through the counties array at the selected value
		for (var i in geographies[_val]) {
		
			// create option target
			var op = document.createElement('option');
			// set option value value
			op.value = geographies[_val][i];
			// set the display label
			op.text = geographies[_val][i];
			// append it to geography dropdown
			geographyOption.appendChild(op);

		}

		$('#geography').trigger('chosen:updated');
	};

		// fire this to update geography dropdown on load
		level.onchange();

})();

// event listener for when geography is selected
document.getElementById('geo-data-update').onclick = function updateGeography() {
  	
  	// close the main form in center
  	// better, animate it into another, collapsed container in top left
  	// collapsed container will be method to reset the parameters later on


  	// bring up the loader
  	$('.loading').show();

  	isoMarker.remove();
  	bufferMarker.remove();

  	// clear out buffer/isochrone layers if they're on the page
	map.setLayoutProperty('isoLayer', 'visibility','none');
    map.setLayoutProperty('buffer', 'visibility','none');
    map.setLayoutProperty('counties', 'visibility','none');

	// if Datatable currently exists, then clear and kill it
	if ( $.fn.dataTable.isDataTable('#dataTable') ) {
		$('#dataTable').DataTable().destroy();
	}

	// empty html of jobsTable
	$('#dataTable thead').empty();
  	$('#dataTable tbody').empty();

  	// gather array of geographies from span
	let selectedGeographies = $("#geography_chosen span").get().map(el => el.textContent);
	let selectedLevel = $("#level_chosen span").text();


	// get the matching geoids from the geography dict in data.js and push to an array
	// generate array for area parameter
	if (selectedLevel === 'MSA') {
		var selectedGeoidsArrays = selectedGeographies.map(id => countyObj.msas.find(({ area }) => area === id).geoid);
		var selectedGeoids = [].concat.apply([], selectedGeoidsArrays);
		map.setFilter('counties', ["all",["match",["get","geoid"],selectedGeoids,true,false]]);
		map.setLayoutProperty('counties', 'visibility','visible');
		var areas = selectedGeoids.map(selectedGeoid => "LAUCN"+selectedGeoid+"0000000006").join(',');
	} else if (selectedLevel === 'County') {
		var selectedGeoids = selectedGeographies.map(id => countyObj.counties.find(({ area }) => area === id).geoid);
		map.setFilter('counties', ["all",["match",["get","geoid"],selectedGeoids,true,false]]);
		map.setLayoutProperty('counties', 'visibility','visible');
		var areas = selectedGeoids.map(selectedGeoid => "LAUCN"+selectedGeoid+"0000000006").join(',');
	}

	console.log(selectedGeoids);
	console.log(selectedGeoids.length);

	if (selectedGeoids.length > 50) {
		showError();
	} else {
		//////////////////////////////////////////////////////////////////////////////////////////////////////
									// MAKE REQUEST FOR TOKEN THEN DATA
		//////////////////////////////////////////////////////////////////////////////////////////////////////

		const settings = {
		  "async": true,
		  "crossDomain": true,
		  "url": "https://api.bls.gov/publicAPI/v2/timeseries/data/?registrationkey=2075e7710bca44038c4abc07eecee9d5",
		  "method": "POST",
		  "headers": {
		    "Content-Type": "application/x-www-form-urlencoded"
		  },
		  "data": {
		    "seriesid": areas,
		    "startyear":"2017",
		    "endyear":"2019",
		  }
		}

		$.ajax(settings).done(function (response) {
		  const data = response.Results.series;
		  // zoom to selected area
		  getBounds(selectedGeoids);
		  
		  // do stuff with returned data here
		  buildBans(data);
		  buildLine(data);
		  buildTable(data);

		  $('#dataTable').DataTable({
				"lengthChange" : false,
				"pageLength" : 5,
				"autoWidth" : true,
				"dom" : "Bfrtip",
				"pagingType" : "full",
				"buttons" : [
					{extend: 'csv', exportOptions:{columns:':visible'}}
				],
				"colReorder" : true
			});

		});
	}

}

function getBounds(filterArray) {
	// get centroids
	$.ajax({
		method:'GET',
		url: countyUrl
	}).done(function(data) {
		
		const left = $(window).width() / 2;
		
		if ($(window).width() < 800) {
			bbox = {top: 380, bottom:2, left: 2, right: 2};
		} else {
			bbox = {top: 10, bottom:10, left: left, right: 0};
		}

		let features = data.features.filter(function(item) {
			return filterArray.indexOf(item.properties.geoid) !== -1;
		});

		let area = {
			type: 'FeatureCollection',
			features: features
		};

		let counties = area.features;

		let laborTotal = 0;
		let unemploymentTotal = 0;

		for (index = 0; index < counties.length; ++index) {
			let unemployment = counties[index].properties.unemployment;
			let labor = counties[index].properties['labor force'];

			laborTotal += labor;
			unemploymentTotal += unemployment;
		}

		let rate = ( unemploymentTotal / laborTotal ) * 100;
		rate = round(rate, 1);

		// create text for unemployment rate label
		$("#unemploymentRateLabel").text(rate+"%");

		let boundingBox = turf.bbox(area);

		map.fitBounds(boundingBox, {
			padding : bbox
		});

		// reveal all visuals and hide all unnecessary elements
		$(".loading").hide();
		$('.side-panel-container').show();
	})
}

function showError() {
	// show a hidden div with error message
	$(".loading").hide();
	$(".customGeoForm").hide();
	// include a reset button on this error message
	$("#geoAlert").show();
}




















