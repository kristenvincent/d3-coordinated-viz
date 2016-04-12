/* Kristen Vincent's D3 coordinated viz main.js */

//PROBLEMS!!!!!!!!!!
//UPDATE CHART BASED ON SELECTED ATTRIBUTE
//TITLES FOR CLASS BREAKS
//HIGHLIGHTING
//text to svg containing chart

//ON DYNAMIC LABELS


//DELETE UN-USED CODE FOR FINAL!
//ADD NAME TO MAP!
//ADD DATA SOURCES
//COMMENT

//wrap everything in a self-exectuing anonymous function to move to local scope
(function() {

//pseudo-global variables
var attrArray = ["Percent Of Farms With Milk Cows", "Yearly Production Per Cow (Thousands $)", "Cows Per Capita", "Active Selling Dairy Farms Per Capita", "Total Farms Per Capita"]; //list of attributes
var expressed = attrArray[0]; //initial attribute
	//chart frame dimensions
var width = window.innerWidth * 0.50,
	height = 455;
	leftPadding = 25,
    rightPadding = 2,
    topBottomPadding = 5,
    chartInnerWidth = width - leftPadding - rightPadding,
    chartInnerHeight = height - topBottomPadding * 2,
    translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

//create a scale to size bars proportionally to frame
var yScale = d3.scale.linear()
	.range([0, height])
	.domain([0, 45]);

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

	//create projection
	var projection = d3.geo.albers()
		.center([0, 44.60])
		.rotate([90, 0, 0])
		.parallels([30.64, 44.84])
		.scale(6000)
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

		//add dropdown to map
		createDropdown(csvData);

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
			var geojsonprops = wisconsinCounties[a].properties; //the current county geojson properties
			var geojsonKey = geojsonprops.COUNTY_FIP; //the geojson primary key

			//where primary keys match, transfer csv data to geojson properties object
			if (geojsonKey == csvKey) {

				//assign all attributes and values
				attrArray.forEach(function(attr) {
					var val = parseFloat(csvCounty[attr]); //get csv attribute value
					geojsonprops[attr] = val; //assign attribute and value to geojson properties
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
		.attr("class", function(d){
			return "counties " + d.properties.COUNTY_FIP;
		})
		.attr("d", path)
		.style("fill", function(d){
			return choropleth(d.properties, colorScale);
		});
		.on("mouseover", function(d){
			highlight(d.properties);
		});
		.on("mouseout", function(d){
			dehighlight(d.properties);
		});

	var desc = counties.append("desc")
		.text('{"fill": "yellow"}');
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
	//if attribute value exists, assign a color; otherwise assign pink
	if (val) {
		return colorScale(val);
	} else if (val == "No data") {
		return "pink";
	} else {
		return "pink";
	}
	
};

//function to create coordinated bar graph
function setChart(csvData, colorScale) {
	var chart = d3.select("body")
		.append("svg")
		.attr("width", width)
		.attr("height", height)
		.attr("class", "chart");

	//create a rectangle for chart background fill
    var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

	//set bars for each county
	var bars = chart.selectAll(".bar")
		.data(csvData)
		.enter()
		.append("rect")
		.sort(function(a, b){
			return b[expressed]-a[expressed]
		})
		.attr("class", function(d) {
			return "bars " + d.COUNTY_FIP;
		})
		.attr("width", chartInnerWidth / csvData.length - 1);

	//annotate bars with attribute value text
	var numbers = chart.selectAll(".numbers")
		.data(csvData)
		.enter()
		.append("text")
		.sort(function(a, b) {
			return b[expressed]-a[expressed]
		})
		.attr("class", function(d) {
			return "numbers " + d.COUNTY_FIP;
		})
		.attr("text-anchor", "middle")
		.attr("x", function(d, i) {
			var fraction = width / csvData.length;
			return i * fraction + (fraction - 1) / 2;
		})
		.attr("y", function(d) {
			return height - yScale(parseFloat(d[expressed])) + 15;
		})
		.text(function(d){
			return Math.round(d[expressed]*100)/100
		})

	 //create vertical axis generator	
	 var yAxis = d3.svg.axis()
	 	.scale(yScale)
	 	.orient("left");

	//place axis
	var axis = chart.append("g")
		.attr("class", "axis")
		.attr("transform", translate)
		.call(yAxis);

	//create frame for chart border
	var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

	var desc = chart.append("desc")
	 	.text('{"fill": "none"}');

	 updateChart(bars, csvData.length, colorScale);
};

//function to update chart 
function updateChart(bars, n, colorScale) {
	//position bars
    bars.attr("x", function(d, i){
            return i * (chartInnerWidth / n) + leftPadding;
        })
        //size/resize bars
        .attr("height", function(d, i){
            return 463 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        //color/recolor bars
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });

	var chartTitle = d3.select(".chartTitle")
	 	.text(expressed);
};

//function to create a dropdown menu for attribute selection
function createDropdown(csvData) {
	//add select element
	var dropdown = d3.select("body")
		.append("select")
		.attr("class", "dropdown")
		.on("change", function () {
			changeAttribute(this.value, csvData)
		});

	//add addtibute name options
	var attrOptions = dropdown.selectAll("attrOptions")
		.data(attrArray)
		.enter()
		.append("option")
		.attr("value", function(d) {return d})
		.text(function(d) {return d});
};

//function for dropdown change listener handler
function changeAttribute(attribute, csvData) {
	//change the expressed attribute
	expressed = attribute;

	//recreate the color scale
	var colorScale = makeColorScale(csvData);

	//recolor enumeration units
	var counties = d3.selectAll(".counties")
		.transition()//add animation
		.duration(250)
		.style("fill", function(d) {
			return choropleth(d.properties, colorScale)
		});

	//re-sort, resize, and recolor bars
    var bars = d3.selectAll(".bar")
        //re-sort bars
        .sort(function(a, b){
            return b[expressed] - a[expressed];
        })
		.transition()//add animation
		.delay(function(d, i){
			return i*20
		})
		.duration(500);

	//PROBLEM!!
	updateChart(bars, csvData.length, colorScale);
	
};

//function to highlight enumeration units and squares
function highlight(props){
	//change fill
	var selected = d3.selectAll("." + props.COUNTY_FIP)
		.style("fill", "yellow");
};

// function dehighlight(props){
// 	var selected = d3.selectAll("." + props.COUNTY_FIP)
// 		.style({
// 			"fill": function(){
// 				return getStyle(this, "fill")
// 			}
// 		});

// 	function getStyle(element, styleName){
// 		var styleText = d3.select(element)
// 			.select("desc")
// 			.text();

// 		var styleObject = JSON.parse(styleText);

// 		return styleObject[styleName];
// 	};
//};


})(); //end of main.js

