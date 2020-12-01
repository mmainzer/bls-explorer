// events to fire on the map itself
const setLayers = (filterArray) => {
	console.log(filterArray);
	let cbsa = [];
	let fips = [];
	filterArray.forEach( (element) => {
		if (element.startsWith('13') === true) {
			fips.push(element);
		} else {
			cbsa.push(element)
		}
	});
	console.log(cbsa);
	console.log(fips);
	let areaFilter;

	if (cbsa.length < 1) {
		areaFilter = ["any",["match",["get","GEOID"],fips,true,false]];
	} else if (fips.length < 1) {
		areaFilter = ["any",["match",["get","cbsa"],cbsa,true,false]];
	} else {
		areaFilter = ["any",
						["match",["get","cbsa"],cbsa,true,false],
						["match",["get","GEOID"],fips,true,false]
					  ];
	}

	console.log(areaFilter);
	map.setFilter('countyFill',areaFilter);
	map.setLayoutProperty('countyFill','visibility','visible');

	setTimeout(getBounds, 500);
	
}

const getBounds = () => {

	const left = $(window).width() / 1.9;

	if ($(window).width() < 800) {
		padding = {top: 380, bottom:2, left: 2, right: 2};
	} else {
		padding = {top: 10, bottom:10, left: left, right: 5};
	}

	let features = map.queryRenderedFeatures({layers:['countyFill']});
	console.log(features);
	features = turf.featureCollection(features);
	console.log(features);
	let bbox = turf.bbox(features);

	map.fitBounds(bbox, {
		padding : padding
	});

}

const getCentroids = () => {
	let centroidFeatures = map.queryRenderedFeatures({layers:['centroids']});
    console.log(centroidFeatures);

    let seriesOne = [];
  	let seriesTwo = [];
  	let geoFilter = [];
  	centroidFeatures.forEach( (element) => {
  		seriesOne.push( "LAUCN"+element.properties.GEOID+"0000000004" );
  		seriesTwo.push( "LAUCN"+element.properties.GEOID+"0000000006" );
  		geoFilter.push(element.properties.GEOID);
  	});

  	series = seriesOne.concat( seriesTwo );
  	
  	//bls api only allows a max of 50 series per call, so check first
  	if (series.length > 25) {
  		showError();
  	} else {
  		series = series.map( serie => serie ).join(',');
  		console.log(series);
  		makeCall(series, geoFilter);
  	}
}