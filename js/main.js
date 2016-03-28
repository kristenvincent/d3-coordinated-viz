/* Kristen Vincent's D3 coordinated viz main.js */

//where is topojson.js??

//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap() {
	//map frame dimensions
	var width = 960,
		height = 760;

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

		//add county boundaries to the map
		var counties = map.selectAll(".counties")
			.data(wisconsinCounties)
			.enter()
			.append("path")
			.attr("class", function(d){
				return d.properties.COUNTY_FIP;
			})
			.attr("d", path);


	};
};

