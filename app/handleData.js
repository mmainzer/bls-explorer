const round = (value, precision) => {
	const multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
}

const commas = (x) => {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const parser = d3.timeParse("%Y-%m-%d");

const buildBans = (dataset, datasetTwo) => {

	let array = [];

	let latestTotal = 0;
	let prevTotal = 0;
	let month = [];

	// for each series id, build necessary properties
	dataset.forEach(function(element) {
		let seriesID = element.seriesID;
		let latest = Number(element.data[0].value);
		let previous = Number(element.data[12].value);
		let m = element.data[0].periodName;
		month.push(m);

		latestTotal += latest;
		prevTotal += previous;

		let obj = {
			series : seriesID,
			latestForce : latest,
			previousTwelveForce : previous
		};

		array.push(obj);

	});

	let difference = latestTotal - prevTotal;
	let pct = ( difference / prevTotal ) * 100;
	let pctDiff = round(pct, 2);

	$("#latestMonth").text("in Labor Force ("+month[0]+" 2020)");
	$(".prev-month").text("since "+month[0]+" 2019");

	if (difference >=0) {
		$("#changeLabel").text("+"+commas(difference));
	} else {
		$("#changeLabel").text(commas(difference));
	}

	if (pctDiff >= 0) {
		$("#pctChangeLabel").text("+"+commas(pctDiff)+"%");
	} else	{
		$("#pctChangeLabel").text(commas(pctDiff)+"%");
	}

	$("#totalLabel").text(commas(latestTotal));

	buildUnemployedBans(datasetTwo, array, latestTotal, prevTotal);


}

const buildUnemployedBans = (dataset, array, latestTotal, prevTotal) => {

	console.log("Building unemployment rate BANs");

	let uArray = [];

	let uTotal = 0;
	let uPrev = 0;
	let month = [];

	// for each series id, build necessary properties
	dataset.forEach(function(element) {
		let seriesID = element.seriesID;
		let latest = Number(element.data[0].value);
		let previous = Number(element.data[12].value);
		let m = element.data[0].periodName;
		month.push(m);

		uTotal += latest;
		uPrev += previous;

		let obj = {
			series : seriesID,
			latestUnemployed : latest,
			previousTwelveUnemployed : previous
		};

		uArray.push(obj);

	});

	const uRate = ( uTotal / latestTotal ) * 100;
	const lastRate = ( uPrev / prevTotal ) * 100;

	$("#latestMonthUnemployed").text("unemployed in ("+month[0]+" 2020)");
	$(".last-month").text(month[0]+" 2019 unemployment rate");
	$(".current-month").text(month[0]+" 2020 unemployment rate");
	$("#unemployedLabel").text( commas(uTotal) );
	$("#currentUnemployedRate").text( round(uRate, 1)+"%" );
	$("#prevUnemployedRate").text( round(lastRate, 1)+"%" );

	console.log(uRate);
	console.log(uTotal);
	console.log(uPrev);
	console.log(lastRate);
	console.log(latestTotal);
	console.log(prevTotal);


}

const buildTable = (datasetOne, datasetTwo) => {

	console.log("building table now");

	// first, empty the existing table of content
	// if Datatable currently exists, then clear and kill it
	if ( $.fn.dataTable.isDataTable('#dataTable') ) {
		$('#dataTable').DataTable().destroy();
	}

	// empty html of jobsTable
	$('#dataTable thead').empty();
  	$('#dataTable tbody').empty();

	let str = '<tr>';
	let headers = ['Area','Month','Year','Labor Force','Unemployed', 'Unemployment Rate'];

	headers.forEach(function(header) {
		str += '<th>' + header + '</th>';
	});

	str += '</tr>';

	$('#dataTable thead').html(str);

	console.log(datasetOne);
	console.log(datasetTwo);

	let dataOne = [];
	let dataTwo = [];
	let laborForce = "laborForce";
	let unemployed = "unemployed";

	prepData( datasetOne, laborForce, dataOne );
	prepData( datasetTwo, unemployed, dataTwo );


	console.log(dataOne);
	console.log(dataTwo);

	// let data = dataOne.concat(dataTwo);
	let data = [];

	for(let i=0; i<dataOne.length; i++) {
		data.push({
			...dataOne[i],
			...(dataTwo.find((itemInner) => itemInner.id === dataOne[i].id))
		});
	}
	console.log(data);

	let tableData = [];
	data.forEach( (element) => {
		let tempArray = [];
		let ur = (element.unemployed / element.laborForce) * 100;
		tempArray.push(element.area);
		tempArray.push(element.month);
		tempArray.push(element.year);
		tempArray.push(commas(element.laborForce));
		tempArray.push(commas(element.unemployed));
		tempArray.push(round(ur,1)+"%");
		tableData.push(tempArray);
	});

	console.log(tableData);

	// build row and send to html table
	tableData.forEach(function(rowData) {
		var row = document.createElement('tr');
		rowData.forEach(function(cellData) {
			var cell = document.createElement('td');
			cell.appendChild(document.createTextNode(cellData));
			row.appendChild(cell);
		});			
		$("#dataTable tbody").append(row);
	});

	$('#dataTable').DataTable({
		"lengthChange" : true,
		"pageLength" : 5,
		"autoWidth" : true,
		"dom" : "Bfrtip",
		"pagingType" : "full",
		"buttons" : [
			{extend: 'csv', exportOptions:{columns:':visible'}}
		],
		"colReorder" : true
	});

	// reveal all visuals and hide all unnecessary elements
	$(".loading").hide();
	$('.side-panel-container').show();


}

const prepData = (data, variable, newData) => {
	console.log(variable);
	data.forEach( (element) => {
		// create temp variables
		let geoidArray = [];
		let data = element.data;
		let index;
		let geoid = element.seriesID;		
		// strip first 5 and last 10 characters to isolate the geoid
		console.log(geoid);
		if (geoid.startsWith('LAUM') === true) {
			geoid = geoid.substr(7,5)
		} else {
			geoid = geoid.substr(5,5);
		}
		geoidArray.push(geoid);
		let area = geoidArray.map(id => areas.find(({ geoid }) => geoid === id).area)[0];

		for (index=0; index<data.length; ++index) {
			let month = data[index].periodName;
			let year = data[index].year;
			let tempObj = {
				area:area,
				month:month,
				year:year,
				[variable]:Number(data[index].value),
				id:area+"_"+month+"_"+year
				// create an id on multiple properties to make merging
				// the labor force and unemployment objects easier
			}
			newData.push( tempObj );
		}

	});
}

const makeCall = (series, geoFilter) => {

	  	console.log(series);

	  	const settings = {
		  "async": true,
		  "crossDomain": true,
		  // "url": "https://api.bls.gov/publicAPI/v2/timeseries/data/?registrationkey=2075e7710bca44038c4abc07eecee9d5",
		  "url": "https://api.bls.gov/publicAPI/v2/timeseries/data/?registrationkey=6aff0b6bece9458d9ecfb4cd10a3a375",
		  "method": "POST",
		  "headers": {
		    "Content-Type": "application/x-www-form-urlencoded"
		  },
		  "data": {
		    "seriesid": series,
		    "startyear":"2017",
		    "endyear":"2020",
		  }
		}

		$.ajax(settings).done( (data) => {
			data = data.Results.series;
			console.log(data);
			let unemployment = [];
			let laborForce = [];
			data.forEach( (element) => {
				let series = element.seriesID;
				if (series.endsWith('04') === true) {
					unemployment.push(element);
				} else {
					laborForce.push(element);
				}
			});
			console.log(unemployment);
			console.log(laborForce);

			//build the bans for display later
			buildBans(laborForce, unemployment);
			// build the line chart for the labor force data
			buildLine(laborForce);
			// break down and rebuild the datatable
			buildTable(laborForce, unemployment);
			// handle the map layers and zoom to bounding box accordingly
			setLayers(geoFilter);

		});

}