///////////////////////////////////////////////////////////////////////////////////////
						      // BUILD BANs FOR LABEL HEADERS
///////////////////////////////////////////////////////////////////////////////////////

// function to round numbers
function round(value, precision) {
    var multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
}

const parser = d3.timeParse("%Y-%m-%d");

// thousands separators for numbers
function commas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function buildBans(dataset) {
	const array = [];

	let latestTotal = 0;
	let prevTotal = 0;

	// for each series id, build necessary properties
	dataset.forEach(function(element) {
		console.log(element.data);
		let seriesID = element.seriesID;
		let latest = Number(element.data[0].value);
		let previous = Number(element.data[12].value);

		latestTotal += latest;
		prevTotal += previous;

		let obj = {
			series : seriesID,
			latestForce : latest,
			previousTwelveForce : previous
		};

		array.push(obj);

	});

	const difference = latestTotal - prevTotal;
	const pct = ( difference / prevTotal ) * 100;
	const pctDiff = round(pct, 2);

	console.log(latestTotal);
	console.log(prevTotal);
	console.log(difference);

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
}

function buildLine(dataset) {
	const chartContainer = document.getElementById("lineContainer");
	const array = [];

	dataset.forEach(function(element) {
		let data = element.data;
		let index;
		for (index = 0; index < data.length; ++index) {
		    let tempObj = {};
		    let month = data[index].period.replace('M','');
		    let year = data[index].year;
		    data[index].date = year+'-'+month+'-'+'01';
		    data[index].laborForce = Number(data[index].value);

		    tempObj.date = data[index].date;
		    tempObj.laborForce = data[index].laborForce;

		    array.push(tempObj);
		}

	});

	const lineData = d3.nest()
		.key(function(d) { return d.date; })
		.rollup(function(v) { return d3.sum(v, function(d) { return d.laborForce; }); })
		.entries(array);

	lineData.forEach(function(element) {
		element.date = element.key;
		element.laborForce = element.value;
		delete element.value;
		delete element.key;
		element.date = parser(element.date);
	});

	let height = $(window).height() * .32;
	let width = $(window).width() / 2;

	let margin = {top: 20, right: 15, bottom: 25, left: 50};

	width = width - margin.left - margin.right;
	height = height - margin.top - margin.bottom;

	let svg = d3.select(chartContainer).append("svg")
	  .attr("width",  width + margin.left + margin.right)
	  .attr("height", height + margin.top + margin.bottom)
	  .append("g")
	  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


	// set the ranges
	let x = d3.scaleTime().range([0, width]);
	  
	x.domain(d3.extent(lineData, function(d) { return d.date; }));


	let y = d3.scaleLinear().range([height, 0]);


	y.domain([d3.min(lineData, function(d) { return d.laborForce; }) - 500, d3.max(lineData, function(d) { return d.laborForce; }) + 5]);

	let valueline = d3.line()
	        .x(function(d) { return x(d.date); })
	        .y(function(d) { return y(d.laborForce);  })
	        .curve(d3.curveMonotoneX);

	svg.append("path")
	    .data([lineData]) 
	    .attr("class", "line")  
	    .attr("d", valueline); 

	//  var xAxis_woy = d3.axisBottom(x).tickFormat(d3.timeFormat("Week %V"));
	const xAxis_woy = d3.axisBottom(x).tickFormat(d3.timeFormat("%b %Y")).ticks(7);

	svg.append("g")
	        .attr("class", "x axis")
	        .attr("transform", "translate(0," + height + ")")
	        .call(xAxis_woy);

	//  Add the Y Axis
	svg.append("g").call(d3.axisLeft(y).ticks(5).tickFormat(d3.format("~s")));

}

function buildTable(dataset) {
	console.log(dataset);
	let str = '<tr>';
	let headers = [' ','Area','Month','Year','Labor Force'];

	headers.forEach(function(header) {
		str += '<th>' + header + '</th>';
	});

	str += '</tr>';

	$('#dataTable thead').html(str);

	let arrAll = [];
	dataset.forEach(function(element) {
		// create temp variables
		let tempArray = [];
		let geoidArray = [];
		let data = element.data;
		let index;
		// isolate the series ID
		let geoid = element.seriesID;
		// strip first 5 and last 10 characters to isolate the geoid
		geoid = geoid.substr(5,5);
		geoidArray.push(geoid);
		// map to the county geoids to get county name
		let county = geoidArray.map(id => countyObj.counties.find(({ geoid }) => geoid === id).area);
		// for each index of the data array
		for (index = 0; index < data.length; ++index) {
			let tempArrayTwo = [];
			let month = data[index].periodName;
			let year = data[index].year;
			let laborForce = Number(data[index].value);
			tempArrayTwo.push(geoid);
			tempArrayTwo.push(county[0]);
			tempArrayTwo.push(month);
			tempArrayTwo.push(year);
			tempArrayTwo.push(laborForce);
			tempArray.push(tempArrayTwo);
		}
		arrAll.push(tempArray);
	});

	console.log(arrAll);

	let tableData = [];
	arrAll.forEach(function(element) {
		for (index = 0; index < element.length; ++index) {
			tableData.push(element[index]);
		}
	});

	console.log(arrAll);
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
}
