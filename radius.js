

// Target the bufferParams form in the HTML
const bufferParams = document.getElementById('bufferUnit');

// create variables to use in getBuffer()
let unit = 'miles';
let distance = 10;

const bufferMarker = new mapboxgl.Marker({
  'color': '#314ccd',
  'draggable': true
});

// fire functions when marker is dragged
bufferMarker.on('dragstart', onDragStart);
bufferMarker.on('dragend', bufferDragEnd);


// fire necessary events when location chosen in geocoder
radialGeocoder.on('result', function(ev) {

	isoMarker.remove();
	bufferMarker.remove();

	if(typeof buffLayer !== 'undefined') {
		map.removeLayer('buffer');
	}

	if(typeof countyLayer !== 'undefined') {
	// clear the map on result if layer exists
		map.removeLayer('ga-counties');
	}

	// establish coordinates and split each element in the array
	const coords = ev.result.geometry.coordinates;
	lngLat = [coords[0], coords[1]];

	bufferMarker.setLngLat(lngLat).addTo(map);

	getBuffer();

	$('.custom-geo-modify').show();

})

// call centroids geojson and generate proper array with buffer
function getBuffer() {

	// show loader
	$('.loading').show();

	// hide param options if they're showing
	$('.radius-params').hide();

	// hide form and clear svg
	$(".side-panel-container").hide();
	$( "svg" ).remove();

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

	const left = $(window).width() / 2;

	if ($(window).width() < 800) {
		bbox = {top: 380, bottom:2, left: 2, right: 2};
	} else {
		bbox = {top: 220, bottom:50, left: left, right: 0};
	}

	// gather array of geographies from span
	const selectedGeographies = $("#geography_chosen span").get().map(el => el.textContent);
	const selectedLevel = $("#level_chosen span").text();

	var lngLat = bufferMarker.getLngLat();
    bufferMarker.setLngLat(lngLat);

    lngLat = [lngLat.lng,lngLat.lat];

    // create a source for the point from which a buffer will be created
    var bufferPoint = {
      'type': 'Feature',
      'geometry': {
        'type': 'Point',
        'coordinates': lngLat
      },
      'properties': {
        'name': 'Buffer Point'
      }
    };

    // create buffer feature collection with turf
    const buffer = turf.buffer(bufferPoint, distance, {units:unit});

    const bufferFC = turf.featureCollection([buffer]);

    // set the 'buffer' source's data to the return here
    map.getSource('buff').setData(buffer);

    const boundingBox = turf.bbox(buffer);

    if(typeof buffLayer === 'undefined') {
		// add buffer layer
		map.addLayer({
			"id": "buffer",
			"type": "line",
			"source": 'buff',
			"layout": {
			  'visibility':'none'
			},
			'paint': {
                "line-width" : 1
             }
		}, "waterway-label");
	}

	// GET CENTROIDS OF COUNTY FILES
	$.ajax({
		method:'GET',
		url:centroidUrl
	}).done(function(data) {
		// get the array of points inside the buffer
    	var collected = turf.collect(bufferFC, data, 'GEOID', 'GEOID');

    	// get the necessary property of the centroid to populate APIs for data requests
    	const values = collected.features[0].properties.GEOID;
		const areas = values.map(value => "LAUCN"+value+"0000000006").join(',');

		map.setFilter('counties', ["all",["match",["get","geoid"],values,true,false]]);

		let features = data.features.filter(function(item) {
			return values.indexOf(item.properties.geoid) !== -1;
		});

		let laborTotal = 0;
		let unemploymentTotal = 0;

		for (index = 0; index < features.length; ++index) {
			let unemployment = features[index].properties.unemployment;
			let labor = features[index].properties['labor force'];

			laborTotal += labor;
			unemploymentTotal += unemployment;
		}

		let rate = ( unemploymentTotal / laborTotal ) * 100;
		rate = round(rate, 1);

		// create text for unemployment rate label
		$("#unemploymentRateLabel").text(rate+"%");

		if (values.length > 50 || values.length < 1) {
			showError();
		} else {
			// BUILD API CALL
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
			    "endyear":"2020",
			  }
			}

			// FETCH DATA
	    	$.ajax(settings).done(function (response) {
	    		const data = response.Results.series;


		  		// DO SOMETHING WITH DATA
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
				// set now that data is collected and formatted, hide loader and show all elements
			    $(".loading").hide();
			    map.fitBounds(boundingBox, {
			      padding : bbox
			    });
			    bufferMarker.setLngLat(lngLat);
			    map.setLayoutProperty('counties', 'visibility','visible');
			    map.setLayoutProperty('buffer', 'visibility','visible');
			    $('.side-panel-container').show();
	    	})

		}

	})
	
}

// Update buffer when parameters of form are changed
bufferParams.addEventListener('change', function(e) {

	if (e.target.name === 'distance') {
		distance = e.target.value;
		getBuffer(); 
	} else if (e.target.name === 'unit') {
		unit = e.target.value;
		getBuffer();
	}
});



