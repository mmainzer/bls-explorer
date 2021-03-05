// test

mapboxgl.accessToken = 'pk.eyJ1IjoiZ3BjZWNvbmRldiIsImEiOiJja2kyNGY1dGkwbTg4MndxbnlsZXRuOXgyIn0.qWgZ_I1LvZIAID7t5XbEnQ';
const esriToken = 'AAPKcb414e3fd1b34bbd97cc0323e0698159ydaqx1AVTb_m9KC-YdyeHTFdTHgj_31yHlp9y8kfH6QhKvWYQ9qHDEH7CtglER4o';
const authentication = new arcgisRest.ApiKey({
  key: esriToken
});

const map = new mapboxgl.Map({
  container: 'map', // container id
  style: 'mapbox://styles/gpcecondev/cki24df3n0pjb19nq644ual14', // stylesheetmapbox://styles/mmainzer/ck5r0lcgr0eti1iqiiglddux6
  center: [-83.007,32.731], // starting position [lng, lat]
  zoom: 6.8 // starting zoom
});

var currentZoom = map.getZoom();


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

$('#isoGeocoder').append(isoGeocoder.onAdd(map));
$('#radialGeocoder').append(radialGeocoder.onAdd(map));


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
  map.addSource('counties', {
    type: 'vector',
    url: 'mapbox://gpcecondev.b4ol3rar'
  });

  // add the county centroid as a layer
  map.addSource('countyCentroids', {
    type: 'vector',
    url: 'mapbox://gpcecondev.bzk3b5se'
  });

  map.addLayer({
    'id': 'countyFill',
    'type': 'fill',
    'source':'counties',
    'filter':["all",["match",["get","STATEFP"],["13","01","12","28","47","45","37"],true,false]],
    'layout': {
      'visibility':'none',
    },
    'paint': {
      "fill-color": "#39f3bb",
      "fill-opacity": 0.3,
      "fill-outline-color": "#000000"
    },
    'source-layer': 'usCounties'
  }, 'admin-1-boundary-bg')

  map.addLayer({
    'id': 'centroids',
    'type': 'circle',
    'source':'countyCentroids',
    'filter':["all",["match",["get","STATEFP"],["13","01","12","28","47","45","37"],true,false]],
    'layout': {
      'visibility':'visible',
    },
    'paint': {
      "circle-color": "hsla(0, 0%, 0%, 0.01)",
      'circle-radius':0.1
    },
    'source-layer': 'usCountiesCentroids-bad1gv'
  }, 'admin-1-boundary-bg')


});



