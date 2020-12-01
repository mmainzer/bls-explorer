// Target the bufferParams form in the HTML
const bufferParams = document.getElementById('bufferUnit');

// create variables to use in getBuffer()
let unit = 'miles';
let distance = 20;
let coords;

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
	coords = ev.result.geometry.coordinates;
	lngLat = [coords[0], coords[1]];

	bufferMarker.setLngLat(lngLat).addTo(map);

	getBuffer(coords);

	$('.custom-geo-modify').show();

});

const getBuffer = (coords) => {

		// show loader
	$('.loading').show();

	// hide params if showing
	$('.radius-params').hide();

	// hide form and clear svg
	$(".side-panel-container").hide();
	$( "svg" ).remove();

	// clear out buffer/isochrone layers if they're on the page
	// map.setLayoutProperty('isoLayer', 'visibility','none');
	// map.setLayoutProperty('buffer', 'visibility','none');
	map.setLayoutProperty('countyFill', 'visibility','none');

	let lngLat = bufferMarker.getLngLat();
    bufferMarker.setLngLat(lngLat);

    lngLat = [lngLat.lng,lngLat.lat];

    // create a source for the point from which a buffer will be created
    const bufferPoint = {
      'type': 'Feature',
      'geometry': {
        'type': 'Point',
        'coordinates': lngLat
      },
      'properties': {
        'name': 'Buffer Point'
      }
    };

    const buffer = turf.featureCollection( [turf.buffer(bufferPoint, distance, {units:unit})] );

    // set the 'buffer' source's data to the return here
    map.getSource('buff').setData(buffer);

    if(typeof buffLayer === 'undefined') {
		// add buffer layer
		map.addLayer({
			"id": "buffer",
			"type": "line",
			"source": 'buff',
			"layout": {
			  'visibility':'visible'
			},
			'paint': {
                "line-width" : 1
             }
		}, "countyFill");
	}

	map.setFilter('centroids',['within',buffer]);

    setTimeout(getCentroids, 500);

}

// when someone changes the radius for an update, fire th function again
// When a user changes the value of profile or duration by clicking a button, change the parameter's value and make the API query again
$('#radial-update').click( () => {

	let updateValue = document.getElementById('radial-distance').value;
	distance = Number(updateValue);

	getBuffer(coords);

	$('.layerPanelPopup').hide();

});