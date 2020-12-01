// Target the isoParams form in the HTML
const isoParams = document.getElementById('isoParams');

// Create variables to use in getIso()
const urlBase = 'https://api.mapbox.com/isochrone/v1/mapbox/';
let profile = 'driving';
let minutes = 30;

// Set up a marker that you can use to show the query's coordinates
const isoMarker = new mapboxgl.Marker({
  'color': '#314ccd',
  'draggable': true
});

// fire when geocoder result is executed
isoGeocoder.on('result', function(ev) {
        console.log('isoGeocoder fired');
        isoMarker.remove();
        // bufferMarker.remove();

        var urlBase = 'https://api.mapbox.com/isochrone/v1/mapbox/';

        if(typeof isoLayer !== 'undefined') {
          // clear the map on result if layer exists
          map.removeLayer('isoLayer');
        }

        if(typeof countyLayer !== 'undefined') {
          // clear the map on result if layer exists
          map.setLayoutProperty('counties', 'visibility', 'none');
        }
        
        // establish coordinates and split each element in the array
        var coords = ev.result.geometry.coordinates;
        lngLat = [coords[0], coords[1]];

        isoMarker.setLngLat(lngLat).addTo(map);

        getIso();

        $('.custom-geo-modify').show();
});

// if user grabs marker and starts to move it
const onDragStart = () => {

  // hide form and clear svg
  $(".side-panel-container").hide();
  $( "svg" ).remove();

  // clear out buffer/isochrone layers if they're on the page
  map.setLayoutProperty('isoLayer', 'visibility','none');
  map.setLayoutProperty('buffer', 'visibility','none');

  var lngLat =[];

  // clear out all visuals and everything
  // if Datatable currently exists, then clear and kill it
  if ( $.fn.dataTable.isDataTable('#dataTable') ) {
    $('#dataTable').DataTable().destroy();
  }

  // empty html of jobsTable
  $('#dataTable thead').empty();
  $('#dataTable tbody').empty();
}

// when user lets go of isochrone marker after drag
const isoDragEnd = () => {
	getIso();
}

// when user lets go of buffer marker after drag
const bufferDragEnd = () => {
	getBuffer();
}

isoMarker.on('dragstart', onDragStart);
isoMarker.on('dragend', isoDragEnd);


const getIso = () => {

	// show loader
	$('.loading').show();

	// hide params if showing
	$('.iso-params').hide();

	// hide form and clear svg
	$(".side-panel-container").hide();
	$( "svg" ).remove();

	// clear out buffer/isochrone layers if they're on the page
	// map.setLayoutProperty('isoLayer', 'visibility','none');
	// map.setLayoutProperty('buffer', 'visibility','none');
	map.setLayoutProperty('countyFill', 'visibility','none');

	let lngLat = isoMarker.getLngLat();
    isoMarker.setLngLat(lngLat);

    lngLat = [lngLat.lng,lngLat.lat];

    const url = urlBase + profile + '/' + lngLat + '?contours_minutes=' + minutes + '&polygons=true&access_token=' + mapboxgl.accessToken;
    console.log(url);
	$.ajax({
		method:'GET',
		url:url
	}).done( function(isochrone) {
		console.log(isochrone);
		// Set the 'iso' source'sdata to what's returned by the API query
    	map.getSource('iso').setData(isochrone);

    	let bbox = turf.bbox(isochrone);

    	if(typeof isoLayer === 'undefined') {
            // add isochrone layer
            map.addLayer({
              'id': 'isoLayer',
              'type': 'line',
              'source': 'iso',
              'layout': {
                'visibility':'visible'
              },
              'paint': {
                "line-width" : 1
              }
            }, "countyFill");
        }

        map.setFilter('centroids',['within',isochrone]);

        setTimeout(getCentroids, 500);


	});

}


// When a user changes the value of profile or duration by clicking a button, change the parameter's value and make the API query again
isoParams.addEventListener('change', function(e) {
  if (e.target.name === 'profile') {
    profile = e.target.value;
    getIso();
  } else if (e.target.name === 'duration') {
    minutes = e.target.value;
    getIso();
  }
});





