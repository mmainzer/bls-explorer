// function to build the line chart for labor force
const buildLine = (dataset) => {

	console.log("Building Line chart!");

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


	y.domain([d3.min(lineData, function(d) { return d.laborForce; })-1000, d3.max(lineData, function(d) { return d.laborForce; }) + 5]);

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