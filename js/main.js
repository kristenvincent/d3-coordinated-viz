/* Kristen Vincent's D3 coordinated viz main.js */

//COLOR BOTTLES BASED ON CHOROPLETH COLOR?
//DO I HAVE TO ANNOTATE or axis MINE IF THEY ARE COUNTS?
//TITLE

//code in color scale??
//generators?

//domain-input
//range-output
//on Lesson 2.III example 2.10 chart title

//wrap everything in a self-exectuing anonymous function to move to local scope
(function() {

//pseudo-global variables
var attrArray = ["Percent Of Farms With Milk Cows", "How Much Each Cow Is Worth_thousandsofdollarseachcowproducesinayear", "Cows Per Capita", "Active Selling Dairy Farms Per Capita", "Total Farms Per Capita"]; //list of attributes
var expressed = attrArray[0]; //initial attribute
var colorScale;
//var colorClasses = [];
var colorClasses = [
		"#f7f7f7",
		"#cccccc",
		"#969696",
		"#636363",
		"#252525"
	];


//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap() {
	//map frame dimensions
	var width = window.innerWidth * 0.425,
		height = 600;

	//create new svg container for the map
	var map = d3.select("body")
		.append("svg")
		.attr("class", "map")
		.attr("width", width)
		.attr("height", height);
	
	// map.append("svg:image")
	// 	.attr("xlink:href", "assets/cow2-01.svg")
	// 	.attr("x", 228)
	//     .attr("y",53);

	//create projection
	var projection = d3.geo.albers()
		.center([0, 44.60])
		.rotate([90, 0, 0])
		.parallels([30.64, 44.84])
		.scale(6500)
		.translate([width / 2, height / 2]);

	//create a path generator
	var path = d3.geo.path()
		.projection(projection);

	//use queue.js to load data all at once
	q = d3_queue.queue();

	q
		.defer(d3.csv, "data/D3_Lab_Data.csv")//load attributes from csv
		.defer(d3.json, "data/wicountyboundaries.topojson")//load county boundaries
		.await(callback);

	function callback (error, csvData, countyBoundaries) {
		//translate countyBoundaries topoJSON
		var wisconsinCounties = topojson.feature(countyBoundaries, countyBoundaries.objects.wicountyboundaries).features;

		//join csv data to GeoJSON enumeration units
		wisconsinCounties = joinData(wisconsinCounties, csvData);

		//create the color scale
		var colorScale = makeColorScale(csvData);

		//add enumeration units to the map
		setEnumerationUnits(wisconsinCounties, map, path, colorScale);

		//add coordinated visualization to the map
		setChart(csvData, colorScale);
	};
}; //end of setMap()

//function to join the data
function joinData(wisconsinCounties, csvData) {
	//loop through csv to assign each set of csv attribute values to a geojson region
	for (var i=0; i<csvData.length; i++) {
		var csvCounty = csvData[i]; //the current county
		var csvKey = csvCounty.COUNTY_FIP; //the csv primary key

		//loop through geojson counties to find correct county
		for (var a=0; a<wisconsinCounties.length; a++) {
			var geojsonProps = wisconsinCounties[a].properties; //the current county geojson properties
			var geojsonKey = geojsonProps.COUNTY_FIP; //the geojson primary key

			//where primary keys match, transfer csv data to geojson properties object
			if (geojsonKey == csvKey) {

				//assign all attributes and values
				attrArray.forEach(function(attr) {
					var val = parseFloat(csvCounty[attr]); //get csv attribute value
					geojsonProps[attr] = val; //assign attribute and value to geojson properties
				});
			};
		};
	};

	return wisconsinCounties;
}; //end of joinData function

//function to select counties
function setEnumerationUnits(wisconsinCounties, map, path, colorScale) {
//add county boundaries to the map
	var counties = map.selectAll(".counties")
		.data(wisconsinCounties)
		.enter()
		.append("path")
		.attr("class", function(d) {
			return d.properties.COUNTY_FIP;
		})
		.attr("d", path)
		.style("fill", function(d) {
			return choropleth(d.properties, colorScale);
		});
}; //end of setEnumerationUnits function

//function to create color scale generator
function makeColorScale(data) {
	var colorClasses = [
		"#f7f7f7",
		"#cccccc",
		"#969696",
		"#636363",
		"#252525"
	];

	//create color scale generator
	colorScale = d3.scale.quantile()
		.range(colorClasses);

	//build array of all values of the expressed attribute
	var domainArray = [];
	for (var i=0; i<data.length; i++) {
		var val = parseFloat(data[i][expressed]);
		domainArray.push(val);
	};

	//assign array of expressed values as scale domain
	colorScale.domain(domainArray);

	return colorScale;
};

//function to make null values grey on the map
function choropleth(props, colorScale) {
	//make sure attribute value is a number
	var val = parseFloat(props[expressed]);
	//if attribute value exists, assign a color; otherwise assign gray
	if (val && val != NaN) {
		return colorScale(val);
	} else {
		return "pink";
	};
};

//function to create coordinated bar graph
function setChart(csvData, colorScale) {
	//chart frame dimensions
	var width = window.innerWidth * 0.5,
		height = 600;

	var chart = d3.select("body").append("svg")
		.attr("width", width)
		.attr("height", height)
		.attr("class", "chart");

	// var g = svg.append("g");

	//append image to the chart, one cow image per county
	var cowChart = chart.selectAll(".chart")
		.data(csvData)
		.enter()
		.append("svg:image")
		.attr("xlink:href", "assets/bottle-01.svg")
		// .attr("width", 200)
	 //    .attr("height", 200)
	    .attr("x", 228)
	    .attr("y",53)
	    .attr("class", function (d) {
	    	return "cow " + d.COUNTY_FIP;
	    })
	    .attr("width", 50)
	    .attr("height", 50);

	 var chartTitle = chart.append("text")
	 	.attr("x", 20)
	 	.attr("y", 40)
	 	.attr("class", "chartTitle")
	 	.text("Dairy in Wisconsin");

	 updateChart(cowChart, csvData.length, csvData);
};

//function to update chart 
function updateChart(cowChart, countySquares, csvData) {
	colorScale = makeColorScale(csvData);
	var xValue = 0;
	var yValue = 0;
	var colorArray = [];
	var height = 50;
	var width = 50;

	for (i = 0; i < colorClasses.length; i++) {
		var colorObject = {"color": colorClasses[i], "count":0};
		colorArray.push(colorObject);
	}

	

	var countyColor = cowChart.style("fill", function (d) {
			return choropleth(d, colorScale);
	})
	.attr("x", function (d, i) {
		color = choropleth (d, colorScale);
		//loop to arrange chart horizontally
		for (i = 0; i < colorArray.length; i++) {
			if(colorArray[i].color == color) {
				xValue = colorArray[i].count*(30 + 1);
				colorArray[i].count+=1;
			}
			if (color == "pink" || color == undefined) {
				xValue = -100000;
			}
		}
		return xValue;
	})
	.attr("y", function(d, i) {
		color = choropleth(d, colorScale);
		if (color == colorClasses[0]) {
				return 0
			} else if (color == colorClasses[1]) {
				return (height+1);
			} else if (color == colorClasses[2]) {
				return (height+1)*2;
			} else if (color == colorClasses[3]) {
				return (height+1)*3;
			} else if (color == colorClasses[4]) {
				return (height+1)*4;
			} else if (color == colorClasses[5]) {
				return (height+1)*5;
			}
		})
};


	// var img = g.append("svg:image")
	// 	.attr("xlink:href", "assets/cow-01.svg")
	// 	.attr("width", 200)
	//     .attr("height", 200)
	//     .attr("x", 228)
	//     .attr("y",53);

	
	  
	//create a second svg element to hold the bar chart
// 	var chart = d3.select("body")
// 		.append("svg")
// 		.attr("width", chartWidth)
// 		.attr("height", chartHeight)
// 		.attr("class", "chart");

// 	//create a scale to size bars proportionally to frame
// 	var yScale = d3.scale.linear()
// 		.range([0, chartHeight])
// 		.domain([0, 45]);

// 	//set bars for each county
// 	var bars = chart.selectAll(".bars")
// 		.data(csvData)
// 		.enter()
// 		.append("rect")
// 		.sort(function(a, b){
// 			return b[expressed]-a[expressed]
// 		})
// 		.attr("class", function(d) {
// 			return "bars " + d.COUNTY_FIP;
// 		})
// 		.attr("width", chartWidth / csvData.length - 1)
// 		.attr("x", function(d, i) {
// 			return i * (chartWidth / csvData.length);
// 		})
// 		.attr("height", function(d) {
// 			return yScale(parseFloat(d[expressed]));
// 		})
// 		.attr("y", function(d) {
// 			return chartHeight - yScale(parseFloat(d[expressed]));
// 		})
// 		.style ("fill", function(d) {
// 			return choropleth(d, colorScale);
// 		});

// 	//annotate bars with attribute value text
// 	var numbers = chart.selectAll(".numbers")
// 		.data(csvData)
// 		.enter()
// 		.append("text")
// 		.sort(function(a, b) {
// 			return b[expressed]-a[expressed]
// 		})
// 		.attr("class", function(d) {
// 			return "numbers " + d.COUNTY_FIP;
// 		})
// 		.attr("text-anchor", "middle")
// 		.attr("x", function(d, i) {
// 			var fraction = chartWidth / csvData.length;
// 			return i * fraction + (fraction - 1) / 2;
// 		})
// 		.attr("y", function(d) {
// 			return chartHeight - yScale(parseFloat(d[expressed])) + 15;
// 		})
// 		.text(function(d){
// 			return Math.round(d[expressed]*100)/100
// 		})
	


})(); //end of main.js

