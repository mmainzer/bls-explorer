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
            
        isoMarker.remove();
        bufferMarker.remove();

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
        console.log(isoMarker);

        getIso();

        $('.custom-geo-modify').show();
});

// if user grabs marker and starts to move it
function onDragStart() {

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
function isoDragEnd() {
	getIso();
}

// when user lets go of buffer marker after drag
function bufferDragEnd() {
	getBuffer();
}

isoMarker.on('dragstart', onDragStart);
isoMarker.on('dragend', isoDragEnd);

// get drivetime for given coordinates and create drivetime layer with given parameters
function getIso() {

	// show loader
	$('.loading').show();

  // hide params if showing
  $('.iso-params').hide();

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

	// gather array of geographies from span
	const selectedGeographies = $("#geography_chosen span").get().map(el => el.textContent);
	const selectedLevel = $("#level_chosen span").text();

	var lngLat = isoMarker.getLngLat();
    isoMarker.setLngLat(lngLat);

    lngLat = [lngLat.lng,lngLat.lat];

    var url = urlBase + profile + '/' + lngLat + '?contours_minutes=' + minutes + '&polygons=true&access_token=' + mapboxgl.accessToken;
    console.log(url);

    // make initial call to get your isochrone geojson
    $.ajax({
    	method: 'GET',
    	url: url
    }).done(function(isochrone) {
    	// Set the 'iso' source'sdata to what's returned by the API query
    	map.getSource('iso').setData(isochrone);

    	var boundingBox = turf.bbox(isochrone);

    	if(typeof isoLayer === 'undefined') {
            // add isochrone layer
            map.addLayer({
              'id': 'isoLayer',
              'type': 'fill',
              'source': 'iso',
              'layout': {
                'visibility':'none'
              },
              'paint': {
                'fill-color': '#39f3bb',
                'fill-opacity': 0.3
              }
            }, "waterway-label");
        }

    // GET CENTROIDS OF COUNTY FILES
    $.ajax({
      method :'GET',
      url : centroidUrl
    }).done(function(data) {
      // get the array of points inside the buffer
      var collected = turf.collect(isochrone, data, 'geoid', 'geoid');

      // get the necessary property of the centroid to populate APIs for data requests
      const values = collected.features[0].properties.geoid;
      const areas = values.map(value => "LAUCN"+value+"0000000006").join(',');

      console.log(areas);

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
          "endyear":"2019",
        }
      }

      // FETCH DATA VIA API
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
        // REVEAL VISUALS
        // set now that data is collected and formatted, hide loader and show all elements
        $(".loading").hide();
        map.fitBounds(boundingBox, {
          padding : {top: 50, bottom:50, left: 800, right: 20}
        });
        isoMarker.setLngLat(lngLat);
        console.log(isoMarker);
        map.setLayoutProperty('isoLayer', 'visibility','visible');
        $('.side-panel-container').show();
      });

    })
 
  })

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