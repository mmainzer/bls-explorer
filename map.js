// test

 mapboxgl.accessToken = 'pk.eyJ1IjoibW1haW56ZXIiLCJhIjoiY2s2Y2pjNHRyMWN5cDNtcWVudmFhNDJ0diJ9.8b7KyCNL_Xv_fAEiLMQXdg';

    const map = new mapboxgl.Map({
      container: 'map', // container id
      style: 'mapbox://styles/mmainzer/ck5r0lcgr0eti1iqiiglddux6', // stylesheetmapbox://styles/mmainzer/ck5r0lcgr0eti1iqiiglddux6
      center: [-83.007,32.731], // starting position [lng, lat]
      zoom: 6.8 // starting zoom
    });

    var currentZoom = map.getZoom();

    // document.getElementById('radialGeocoder').appendChild(radialGeocoder.onAdd(map));

    // create geocoder for isochrone search
    const isoGeocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        marker: false,
        zoom: currentZoom,
        flyTo: false,
        placeholder: 'Drive time from...'
    });

    // create geocoder for radial search
    const radialGeocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        marker: false,
        zoom: currentZoom,
        flyTo: false,
        placeholder: 'Distance from...'
    });
 
    document.getElementById('isoGeocoder').appendChild(isoGeocoder.onAdd(map));
    document.getElementById('radialGeocoder').appendChild(radialGeocoder.onAdd(map));

    // function for number formatting
    Number.prototype.format = function(n, x) {
        var re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\.' : '$') + ')';
        return this.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, 'g'), '$&,');
    };

    const isoLayer = map.getLayer('isoLayer');
    const buffLayer = map.getLayer('buffer');
    const countyLayer = map.getLayer('counties');

    const centroidId = 'ckaipg8t60jk622k72wvk46un';
    const centroidUrl = "https://api.mapbox.com/datasets/v1/mmainzer/" + centroidId + "/features?access_token=" + mapboxgl.accessToken;

    const polygonId = 'ck5cyrs0p20qc2imh0ti1irml';
    const countyUrl = "https://api.mapbox.com/datasets/v1/mmainzer/" + polygonId + "/features?access_token=" + mapboxgl.accessToken;

    map.on('load', function() {

      // When the map loads, add the isochrone source
      map.addSource('iso', {
        type: 'geojson',
        data: {
          'type': 'FeatureCollection',
          'features': []
        }
      });

      // repeat that process for the buffer layer
      // add source
      map.addSource('buff', {
        type: 'geojson',
        data: {
          'type': 'FeatureCollection',
          'features': []
        }
      });

      // add the county tileset as a layer
      map.addSource('southeast-counties', {
        type: 'vector',
        url: 'mapbox://mmainzer.77kp2r4f'
      });

      map.addLayer({
        'id': 'counties',
        'type': 'fill',
        'source':'southeast-counties',
        'layout': {
          'visibility':'none',
        },
        'paint': {
          "fill-color": "#39f3bb",
          "fill-opacity": 0.3,
          "fill-outline-color": "#000000"
        },
        'source-layer': 'southeast-counties-4k21g3'
      }, 'waterway-label')


  });



