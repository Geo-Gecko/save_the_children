function addLegend(array, arrayLabel, legendLabel, circle) {
				d3.select('#legend').select('svg').remove();
				var legendSvg = d3.select('#legend')
				.append('svg')
				.attr('class', 'head')
				.attr('width', "100%")
				.attr('height', 100);


				var legendX = 0;
				var legendDY = 20;

				if (circle) {
					legendSvg.selectAll("circle")
						.data(array)
						.enter()
						.append("circle")
						.attr("cy",function(d, i) {
						return (i + 1) * legendDY + 10;
					})
						.attr("cx",10)
						.attr("r","0.4em")
						.style("fill",function(d, i) {
						return array[i];
					});

				}

				if (!circle) {
					legendSvg.selectAll('.legend-rect')
						.data(array)
						.enter()
						.append('rect')
						.attr('class', 'legend-rect')
						.attr("x", legendX)
						.attr("y", function (d, i) {
						return (i + 1) * legendDY;
					})
						.attr("width", 20)
						.attr("height", 20)
						.style("stroke", "black")
						.style("stroke-width", 0)
						.style("fill", function (d, i) {
						return array[i];
					});	
				}

				//the data objects are the fill colors

				legendSvg.selectAll('.legend-text')
					.data(array)
					.enter()
					.append('text')
					.attr('class', 'legend-text')
					.style('color', 'white')
					.attr("x", legendX + 25)
					.attr("y", function (d, i) {
					return (i) * legendDY + 25;
				})
					.attr("dy", "0.8em") //place text one line *below* the x,y point
					.text(function (d, i) {
					return arrayLabel[i];
				});

				legendSvg.selectAll('.legend-title')
					.data([legendLabel])
					.enter()
					.append('text')
					.attr('class', 'legend-title')
					.attr("x", legendX)
					.attr("y", 0)
					.attr("font-weight", "bold")
					.attr("dy", "0.8em") //place text one line *below* the x,y point
					.text(function (d, i) {
					return d;
				});
			}

function drawChart(dataset) {

				var svg = d3.select("#sidebarRight")
				.append("svg")
				.append("g")
				.attr("height", "4vh");

				var legendX = 0;
				var legendDY = 20;
				svg.append("g")
					.attr("class", "slices");
				svg.append("g")
					.attr("class", "labels");
				svg.append("g")
					.attr("class", "lines");

				svg.selectAll('.legend-title')
					.data(dataset)
					.enter()
					.append('text')
					.attr('class', 'legend-title')
					.attr("x", '-10vh'	)
					.attr("y", '-7vh')
					.attr("dy", "0.8em") //place text one line *below* the x,y point
					.text(function (d, i) {
					return d.title;
				});

				var width = +(d3.select("#sidebarRight.leaflet-control").select('h1').style('width').slice(0, -2)),
					height = +(d3.select("#sidebarRight.leaflet-control").select('h1').style('width').slice(0, -2)),
					radius = Math.min(width, height) / 8;

				var pie = d3.layout.pie()
				.sort(null)
				.value(function(d) {
					return d.value;
				});

				var arc = d3.svg.arc()
				.outerRadius(radius * 0.8)
				.innerRadius(radius * 0.4);

				var outerArc = d3.svg.arc()
				.innerRadius(radius * 0.9)
				.outerRadius(radius * 0.9);

				svg.attr("transform", "translate(" + width  / 2 + "," + height / 4 + ")");

				var key = function(d){ return d.data.label; };

				var color = d3.scale.category20()
				//				.domain(["Age Group (0-17)", "Age Group (18-30)", "Age Group (31-59)", "Age Group (60+)"])
				.range(["#006837", "#c2e699", "#78c679", "#66c2a5",  "#8da0cb", "#e78ac3", "#ff8c00"]);


				function Data (dataset){
					var labels = color.domain();
					return dataset.map(function(label){
						return { label: label.label, value: label.value }
					}).filter(function(d) {
						return d.value > 5;
					}).sort(function(a,b) {
						return d3.ascending(a.label, b.label);
					});
				}

				change(Data(dataset));

				function mergeWithFirstEqualZero(first, second){
					var secondSet = d3.set(); second.forEach(function(d) { secondSet.add(d.label); });

					var onlyFirst = first
					.filter(function(d){ return !secondSet.has(d.label) })
					.map(function(d) { return {label: d.label, value: 0}; });
					return d3.merge([ second, onlyFirst ])
						.sort(function(a,b) {
						return d3.ascending(a.label, b.label);
					});
				}

				function change(data) {
					var duration = 500;
					var data0 = svg.select(".slices").selectAll("path.slice")
					.data().map(function(d) { return d.data });
					if (data0.length == 0) data0 = data;
					var was = mergeWithFirstEqualZero(data, data0);
					var is = mergeWithFirstEqualZero(data0, data);

					/* ------- SLICE ARCS -------*/

					var slice = svg.select(".slices").selectAll("path.slice")
					.data(pie(was), key);

					slice.enter()
						.insert("path")
						.attr("class", "slice")
						.style("fill", function(d) { return color(d.data.label); })
						.each(function(d) {
						this._current = d;
					});

					slice = svg.select(".slices").selectAll("path.slice")
						.data(pie(is), key);

					slice		
						.transition().duration(duration)
						.attrTween("d", function(d) {
						var interpolate = d3.interpolate(this._current, d);
						var _this = this;
						return function(t) {
							_this._current = interpolate(t);
							return arc(_this._current);
						};
					});

					slice = svg.select(".slices").selectAll("path.slice")
						.data(pie(data), key);

					slice
						.exit().transition().delay(duration).duration(0)
						.remove();
					/* ------- TEXT LABELS -------*/

					var text = svg.select(".labels").selectAll("text")
					.data(pie(was), key);

					text.enter()
						.append("text")
						.attr("dy", ".35em")
						.style("opacity", 0)
						.style("font-size", "0.8em")
						.text(function(d) {
						return d.data.label + " (" + d.data.value.toFixed(1) + "%)" ;
					})
						.each(function(d) {
						this._current = d;
					});

					function midAngle(d){
						return d.startAngle + (d.endAngle - d.startAngle)/2;
					}

					text = svg.select(".labels").selectAll("text")
						.data(pie(is), key);

					text.transition().duration(duration)
						.style("opacity", function(d) {
						return d.data.value == 0 ? 0 : 1;
					})
						.attrTween("transform", function(d) {
						var interpolate = d3.interpolate(this._current, d);
						var _this = this;
						return function(t) {
							var d2 = interpolate(t);
							_this._current = d2;
							var pos = outerArc.centroid(d2);
							pos[0] = radius * (midAngle(d2) < Math.PI ? 1 : -1);
							return "translate("+ pos +")";
						};
					})
						.styleTween("text-anchor", function(d){
						var interpolate = d3.interpolate(this._current, d);
						return function(t) {
							var d2 = interpolate(t);
							return midAngle(d2) < Math.PI ? "start":"end";
						};
					});

					text = svg.select(".labels").selectAll("text")
						.data(pie(data), key);

					text
						.exit().transition().delay(duration)
						.remove();

					/* ------- SLICE TO TEXT POLYLINES -------*/

					var polyline = svg.select(".lines").selectAll("polyline")
					.data(pie(was), key);

					polyline.enter()
						.append("polyline")
						.style("opacity", 0)
						.each(function(d) {
						this._current = d;
					});

					polyline = svg.select(".lines").selectAll("polyline")
						.data(pie(is), key);

					polyline.transition().duration(duration)
						.style("opacity", function(d) {
						return d.data.value == 0 ? 0 : .5;
					})
						.attrTween("points", function(d){
						this._current = this._current;
						var interpolate = d3.interpolate(this._current, d);
						var _this = this;
						return function(t) {
							var d2 = interpolate(t);
							_this._current = d2;
							var pos = outerArc.centroid(d2);
							pos[0] = radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
							return [arc.centroid(d2), outerArc.centroid(d2), pos];
						};			
					});

					polyline = svg.select(".lines").selectAll("polyline")
						.data(pie(data), key);

					polyline
						.exit().transition().delay(duration)
						.remove();
				};

			}