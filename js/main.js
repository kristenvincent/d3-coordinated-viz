/* Kristen Vincent's D3 coordinated viz main.js */

//where is topojson.js??

//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap() {
	//map frame dimensions
	var width = 960,
		height = 460;

	//create new svg container for the map
	var map = d3.select("body")
		.append("svg")
		.attr("class", map)
		.attr("width", width)
		.attr("height", height);

	//create projection
	var projection = d3.geo.albers()
		.center([0, 46.2])
		.rotate([-2, 0, 0])
		.parallels([43, 62])
		.scale(25000)
		.translate([width / 2, height / 2]);

	//create a path generator
	var path = d3.geo.path()
		.projection(projection);

	//use queue.js to load data all at once
	d3_queue.queue()
		.defer(d3.csv, "data/D3_Lab_Data.csv")//load attributes from csv
		.defer(d3.json, "data/wicountyboundaries.topojson")//load county boundaries
		.await(callback);

	function callback (error, csvData, countyBoundaries) {
		//translate countyBoundaries topoJSON
		var wisconsinCounties = topojson.feature(countyBoundaries, countyBoundaries.objects.wicountyboundaries).features;

		console.log(wisconsinCounties);

		//add county boundaries to the map
		var counties = map.selectAll(".counties")
			.data(wisconsinCounties)
			.enter()
			.append("path")
			.attr("class", function(d){
				return "counties " + d.properties.COUNTY_FIP;
			})
			.attr("d", path);

	};
};

