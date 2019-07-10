var cbounds;
(function (d3, $, queue, window) {
	'use strict';
	/*if ($(window).width() < 600)
     {
      $("#overlay-content").css("width","auto");
     }
  else 
     {
      $("#overlay-content").css("width","auto");
     }*/

	//$("#filters").css("height",$(window).height()-$("#filters").offset().top-150+"px")
	// https://www.humanitarianresponse.info/en/operations/afghanistan/cvwg-3w
	// https://public.tableau.com/profile/geo.gecko#!/vizhome/Districtpolygon/v1?publish=yes
	'use strict';
	String.prototype.replaceAll = function (search, replacement) {
		var target = this;
		return target.replace(new RegExp(search, 'g'), replacement);
	};
	String.prototype.capitalize = function () {
		return this.charAt(0).toUpperCase() + this.slice(1);
	}
	var _selectedDataset;
	var dataset;
	var dataset1;
	var filteredsubCountys = [];
	var filteredsubCountysClass = [];
	var subCounty;
	var zoom;
	queue()
		.defer(d3.json, "./data/uganda1442SubCounties.geojson") //dist
		.defer(d3.csv, "./data/data.csv")
		.defer(d3.csv, "./data/kpiList.csv")
		.await(ready);


	var global = {};
	global.selectedsubCounty = []; // name
	global.selectedTheme = []; // ID
	global.selectedFilter = []; //undefined; //[]; // ID
	global.subCountyCount;
	global.currentEvent;


	function refreshCounts() {
		_selectedDataset = dataset1;
	}


	var righthelpButton = new L.Control.Button(L.DomUtil.get('righthelpbutton'), {
		toggleButton: 'active'
	});
	righthelpButton.addTo(map);
	righthelpButton.on('click', function () {
		if (righthelpButton.isToggled()) {
			rightSidebar.show();
		} else {
			rightSidebar.hide();
		}
	});

	var lefthelpButton = new L.Control.Button(L.DomUtil.get('lefthelpbutton'), {
		position: 'topleft',
		toggleButton: 'active'
	});
	lefthelpButton.addTo(map);
	lefthelpButton.on('click', function () {
		if (lefthelpButton.isToggled()) {
			leftSidebar.show();
		} else {
			leftSidebar.hide();
		}
	});


	function ready(error, ugandaGeoJson, dataKPI, kpiList) {
		if (error) {
		  throw error;
		};
		// console.log(ugandaGeoJson, ActorID, SettlementID, SectorID, AllID)
		ugandaGeoJson.features.map(function (d) {
		  d.properties.DNAME_06 = d.properties.Concat.toLowerCase().capitalize();
		});
		//need join all data
		// var nameAbbKays = d3.keys(nameAbb[0]);
		var dataKPIKays = d3.keys(dataKPI[0]);
		// var sectorKays = d3.keys(sector[0]);
		// var dataset = relationship.map(function (d) {
		//   var i;
		//   for (i = 0; i < nameAbb.length; i++) {
		// 	if (nameAbb[i].Actor_ID === d.Actor_ID) {
		// 	  nameAbbKays.map(function (k) {
		// 		d[k] = nameAbb[i][k];
		// 	  });
		// 	  break;
		// 	}
		//   }
		//   for (i = 0; i < dataKPI.length; i++) {
		// 	if (dataKPI[i].Settlement_ID === d.Settlement_ID) {
		// 	  dataKPIKays.map(function (k) {
		// 		d[k] = dataKPI[i][k];
		// 	  });
		// 	  break;
		// 	}
		//   }
		//   for (i = 0; i < sector.length; i++) {
		// 	if (sector[i].Sector_ID === d.Sector_ID) {
		// 	  sectorKays.map(function (k) {
		// 		d[k] = sector[i][k];
		// 	  });
		// 	  break;
		// 	}
		//   }
		//   return d;
		// });
		// console.log(dataset);
	
		// http://bl.ocks.org/phoebebright/raw/3176159/
		var districtList = d3.nest().key(function (d) {
		  return d.District;
		}).sortKeys(d3.ascending).entries(dataKPI);
		// var sectorList = d3.nest().key(function (d) {
		//   return d.Sector;
		// }).sortKeys(d3.ascending).entries(sector);
		var settlementList = d3.nest().key(function (d) {
		  return d.Settlement;
		}).sortKeys(d3.ascending).entries(dataKPI);
		// var agencyList = d3.nest().key(function (d) {
		//   return d.Name;
		// }).sortKeys(d3.ascending).entries(nameAbb);
		// global.districtCount = districtList.length;
		// global.sectorCount = sectorList.length;
		// global.settlementCount = settlementList.length;
		// global.agencyCount = agencyList.length;
		refreshCounts();
		updateLeftPanel(districtList, settlementList, dataset);
		// updateLeftPanel(districtList, null, null, null, dataset);
	
	
		// d3.selectAll('.custom-list-header').on("click", function(){
		//   var customList = d3.select(this.parentNode).select("div");
		//   // if (customList.node().getBoundingClientRect().width===0){}
		//   console.log(customList.node().getBoundingClientRect());
		// });
		$(".custom-list-header").click(function () {
		  // d3.select(this.parentNode).selectAll("p").style("background", "transparent");
		  $(this).siblings(".custom-list").toggleClass('collapsed');
		  // $(this).find("span").toggleClass('glyphicon-menu-down').toggleClass('glyphicon-menu-right');
		});
	
		// Collapses all the boxes apart from district
		$(".custom-list-header").siblings(".custom-list").addClass('collapsed');
		$("#district-list.custom-list").removeClass('collapsed');
	
	
		var h = (window.innerHeight ||
		  document.documentElement.clientHeight ||
		  document.body.clientHeight);
		if (h > 540) {
		  d3.select(".list-container").style("height", h + "px");
		  d3.select("#d3-map-wrapper").style("height", h + "px");
		}
		var w = (window.innerWidth ||
		  document.documentElement.clientWidth ||
		  document.body.clientWidth);
		d3.select(".list-container").style("height", h - 0 + "px")
	
		// var map = new L.Map("d3-map-container", {
		// 	center: [1.367, 32.305],
		// 	zoom: 7,
		// 	zoomControl: false
		//   })
		//   .addLayer(new L.TileLayer("https://api.mapbox.com/styles/v1/gecko/cj27rw7wy001w2rmzx0qdl0ek/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZ2Vja28iLCJhIjoidktzSXNiVSJ9.NyDfX4V8ETtONgPKIeQmvw"));
		//temporarily disable the zoom
		map.scrollWheelZoom.disable();
		map.doubleClickZoom.disable();
		map.boxZoom.disable();
		map.keyboard.disable();
		map.touchZoom.disable();
		map.dragging.disable();
	
		var rightSidebar = L.control.sidebar('sidebar-right', {
		  position: 'right'
		});
		map.addControl(rightSidebar);
		rightSidebar.toggle();
	
		var wrapper = d3.select("#map");
		var width = wrapper.node().offsetWidth || 960;
		var height = wrapper.node().offsetHeight || 480; // < 480 ? h : wrapper.node().offsetHeight)  || 480;
		var domain = [+Infinity, -Infinity];
		var opacity = 0.3;
		var color = d3.scale.linear().domain(domain) //http://bl.ocks.org/jfreyre/b1882159636cc9e1283a
		  .interpolate(d3.interpolateHcl)
		  .range([d3.rgb("#ffe1b8"), d3.rgb('#e08114')]); //#f597aa #a02842
	
		var tooltip = d3.select(map.getPanes().overlayPane)
		  .append("div")
		  .attr("class", "d3-tooltip d3-hide");
	
		//d3.select("#d3-map-wrapper").selectAll("*").remove();
	
		//var svg = d3.select("#d3-map-wrapper")
		var svg = d3.select(map.getPanes().overlayPane)
		  .append("svg")
		  .attr("xmlns", "http://www.w3.org/2000/svg")
		  .attr("preserveAspectRatio", "xMidYMid")
		  .attr("viewBox", "0 0 " + width + " " + height)
		  .attr("width", width)
		  .attr("z-index", 600)
		  .attr("height", height);
	
		svg.append("rect")
		  .attr("class", "background")
		  .attr("width", width)
		  .attr("height", height)
		  .on("click", refreshMap)
	
	
		var g = svg.append("g")
		  .attr("class", "map");
		// g.attr("transform", "translate(" + 0 + "," + 24 + ")");
	
		// var mapTitle = svg.append("g")
		//   .attr("class", "mat-title")
		//   .selectAll("text")
		//   .data(["3W Map - Uganda"])
		//   .enter()
		//   .append("text")
		//   .attr("class", "neighbour")
		//   .style("font-weight", "bold")
		//   .attr("x", width / 2)
		//   .attr("y", 40)
		//   .style("text-align", "centre")
		//   .text(function (d) {
		//     return d;
		//   });
	
		var projection = d3.geo.mercator()
		  .scale(1)
		  .translate([0, 0]); //395 width/2 930 - 2400  -2400
		//console.log(center);
		var path = d3.geo.path()
		  .projection(projection);
	
		var datasetNest = d3.nest().key(function (d) {
		  return d.District;
		}).entries(dataKPI);
	
		var b = path.bounds(ugandaGeoJson),
		  s = 5176.885757686581,
		  t = [(width - 154 - s * (b[1][0] + b[0][0])) / 2, (height + 20 - s * (b[1][1] + b[0][1])) / 2];
	
		projection
		  .scale(s)
		  .translate(t);
	
		var ugandaPath;
	
		var ugandaDistricts = g.append("g").attr("class", "uganda-districts");
	
		window.updateGeoPath = function updateGeoPath(ugandaGeoJson) {
		  //console.log(ugandaGeoJson.features[0].properties.DNAME_06);
		  ugandaPath = ugandaDistricts
			.selectAll('.district')
			.data(ugandaGeoJson.features);
		  ugandaPath
			.enter()
			.append("path")
			.attr("style", "z-index:600")
			.attr("style", "pointer-events:all!important")
			.style("cursor", "pointer")
			.style("stroke", "#fff")
			.each(function (d) {
			  d.properties.centroid = projection(d3.geo.centroid(d)); // ugandaCentroid = d.properties.centroid;
			  datasetNest.map(function (c) {
				if (c.key === d.properties.DNAME_06) {
				  d.properties._sectorList = d3.nest().key(function (a) {
					return a.Sector;
				  }).entries(c.values);
				  d.properties._settlementList = d3.nest().key(function (a) {
					return a.Settlement;
				  }).entries(c.values);
				  d.properties._agencyList = d3.nest().key(function (a) {
					return a.Name;
				  }).entries(c.values);
				  domain[0] = d.properties._agencyList.length < domain[0] ? d.properties._agencyList.length :
					domain[
					  0];
				  domain[1] = d.properties._agencyList.length > domain[1] ? d.properties._agencyList.length :
					domain[
					  1];
				  color.domain(domain);
				}
			  });
			})
			.on("mousemove", function (d) {
	
			  var mouse = d3.mouse(svg.node()).map(function (d) {
				return parseInt(d);
			  });
			  var str = "<p><span>District:</span> <b>" + d.properties.DNAME_06 + "</b></p>"
			  if (d.properties._settlementList && d.properties._sectorList && d.properties._agencyList) {
				str = str + "<p><span>Settlements:</span> <b>" + d.properties._settlementList.length + "</b></p>" +
				  "<p><span>Sectors:</span> <b>" + d.properties._sectorList.length + "</b></p>" +
				  "<p><span>Agencies:</span> <b>" + d.properties._agencyList.length + "</b></p>";
			  }
			  //console.log("mousemove", str);
			  tooltip.html(str);
			  var box = tooltip.node().getBoundingClientRect() || {
				height: 0
			  };
	
	
			  tooltip
				.classed("d3-hide", false)
				.attr("style", "left:" + (mouse[0] + 15) + "px;top:" + (mouse[1] < height / 2 ? mouse[1] : mouse[
					1] -
				  box.height) + "px");
			})
			.on("mouseover", function (d) {
			  //console.log("mouseover");
			  d3.select(this).style("fill", "#aaa");
			})
			.on("mouseout", function (d) {
			  //console.log("mouseout");
			  d3.select(this).style("fill", d.properties._agencyList ? color(d.properties._agencyList.length) :
				"#ccc");
			  tooltip.classed("d3-hide", true);
			})
			.attr("d", path)
			.on("click", function (d) {
			  //console.log("click");
			  var needRemove = $(d3.select(this).node()).hasClass("d3-active"); //d3.select(this).attr("class");//d3-active
			  // d3.select(this).classed("d3-active", !needRemove).style("opacity", needRemove ? opacity : 1);
			  // d.properties._selected = !needRemove;
			  ugandaPath.style("opacity", function (a) {
				// var needRemove = $(d3.select(this).node()).hasClass("d3-active");
				if (a.properties.DNAME_06 === d.properties.DNAME_06) {
				  a.properties._selected = !needRemove;
				  return (a.properties._selected ? 1 : opacity);
				} else {
				  return (a.properties._selected ? 1 : opacity);
				}
			  });
			  // settlements.style("opacity", opacity);
			  // d3.select(this).style("opacity", 1); //d3.selectAll(".district-" + d.properties.DNAME_06.replaceAll('[ ]', "_"))
			  // d3.select("#district-list").selectAll("p").style("background", "transparent");
			  d3.select(".district-list-" + d.properties.DNAME_06.replaceAll('[ ]', "_")).style("background",
				"#8cc4d3");
			  refreshCounts();
			  global.currentEvent = "district";
			  myFilter({
				"key": d.properties.DNAME_06
			  }, global.currentEvent);
	
			  settlements.style("opacity", opacity);
			  if (global.selectedDistrict && global.selectedDistrict.length > 0) {
				global.selectedDistrict.map(function (dd) {
				  d3.selectAll(".settlement-district-" + dd.key.toLowerCase().replaceAll("[ ]", "-")).style(
					"opacity", 1);
				});
			  }
			  d3.selectAll(".settlement-district-" + d.properties.DNAME_06.toLowerCase().replaceAll("[ ]", "-")).style(
				"opacity", 1);
			})
			.style("fill", function (d) {
			  return d.properties._agencyList ? color(d.properties._agencyList.length) : "#ccc"; //#3CB371
			})
			.attr("class", function (d) {
			  return "district district-" + d.properties.DNAME_06.replaceAll('[ ]', "_");
			});
		  ugandaPath //.transition().duration(duration)
			.each(function (d) {
			  d.properties.centroid = projection(d3.geo.centroid(d)); // ugandaCentroid = d.properties.centroid;
			  datasetNest.map(function (c) {
				if (c.key === d.properties.DNAME_06) {
				  d.properties._sectorList = d3.nest().key(function (a) {
					return a.Sector;
				  }).entries(c.values);
				  d.properties._settlementList = d3.nest().key(function (a) {
					return a.Settlement;
				  }).entries(c.values);
				  d.properties._agencyList = d3.nest().key(function (a) {
					return a.Name;
				  }).entries(c.values);
				  domain[0] = d.properties._agencyList.length < domain[0] ? d.properties._agencyList.length :
					domain[
					  0];
				  domain[1] = d.properties._agencyList.length > domain[1] ? d.properties._agencyList.length :
					domain[
					  1];
				  color.domain(domain);
				}
			  });
			})
			.style("fill", function (d) {
			  return d.properties._agencyList ? color(d.properties._agencyList.length) : "#ccc"; //#3CB371
			})
			.attr("class", function (d) {
			  return "district district-" + d.properties.DNAME_06.replaceAll('[ ]', "_");
			});
		  ugandaPath.exit().remove();
		  // var ugandaCentroid;
	
		}
	
		var ugandaNeighboursPath;
		updateGeoPath(ugandaGeoJson);
		var tanzaniaText;
		var indianOcean;
		var ugandaNeighboursText;
		var domain = color.domain();
	
		// var N = 4;
		// var array = (Array.apply(null, {
		//   length: N+1
		// }).map(Number.call, Number)).map(function(d,i){
		//   return Math.round(i*(domain[1]-domain[0])/N);
		// });
		var array = [domain[0], Math.round(2 * (domain[1] - domain[0]) / 4), Math.round(3 * (domain[1] - domain[0]) /
		  4), domain[1]];
	
		// var legendX = 250;
		// var legendY = 22;
		// svg.selectAll('.legend-rect')
		//   .data(array)
		//   .enter()
		//   .append('rect')
		//   .attr('class', 'legend-rect')
		//   .attr("x", legendX + 20)
		//   .attr("y", function (d, i) {
		//     return (i + 1) * legendY + height - 735;
		//   })
		//   .attr("width", 20)
		//   .attr("height", 20)
		//   .style("stroke", "black")
		//   .style("stroke-width", 0)
		//   .style("fill", function (d) {
		//     return color(d);
		//   });
		// //the data objects are the fill colors
	
		// svg.selectAll('.legend-text')
		//   .data(array)
		//   .enter()
		//   .append('text')
		//   .attr('class', 'legend-text')
		//   .attr("x", legendX + 45)
		//   .attr("y", function (d, i) {
		//     return (i) * legendY + height - 710;
		//   })
		//   .attr("dy", "0.8em") //place text one line *below* the x,y point
		//   .text(function (d, i) {
		//     return d;
		//   });
	
		// svg.selectAll('.legend-title')
		//   .data(["Number of Agencies"])
		//   .enter()
		//   .append('text')
		//   .attr('class', 'legend-title')
		//   .attr("x", legendX + 20)
		//   .attr("y", height - 740)
		//   .attr("dy", "0.8em") //place text one line *below* the x,y point
		//   .text(function (d, i) {
		//     return d;
		//   });
	
		g.append("g").attr("class", 'circle-group');
		// var localdataKPI = $.extend(true, [], dataKPI);
		var settlements = svg.select('.circle-group')
		  .selectAll('.settlement')
		  .data(dataKPI);
		settlements.enter().append('g')
		  .attr("class", function (d) {
			return "settlement settlement-" + d.s_city_id + " settlement-district-" + d.School.toLowerCase().replaceAll(
			  "[ ]", "-");
		  })
		  .append('path')
		  .style("fill", "#fff")
		  .style("stroke", "red")
		  .style("stroke-width", "0.5px")
		  .style("cursor", "pointer")
		  .on("mousemove", function (d) {
			var mouse = d3.mouse(svg.node()).map(function (d) {
			  return parseInt(d);
			});
			var str = "<p><span>Settlement:</span> <b>" + d.Settlement + "</b></p>"
			tooltip
			  .classed("d3-hide", false)
			  .attr("style", "left:" + (mouse[0] + 15) + "px;top:" + (mouse[1]) + "px")
			  .html(str);
		  })
		  .on("mouseover", function (d) {
			d3.select(this).style("fill", "#aaa");
		  })
		  .on("mouseout", function (d) {
			d3.select(this).style("fill", "#fff");
			tooltip.classed("d3-hide", true);
		  })
		  .on("click", function (d) {
			// ugandaPath.style("opacity", opacity); //d3.selectAll(".district")
			// ugandaPath.style("opacity", function (a) {
			//   a.properties._selected = false;
			//   return opacity;
			// });
			// d3.select(".district-" + d.District.replaceAll('[ ]', "_")).style("opacity", 1);
			// d3.select("#district-list").selectAll("p").style("background", "transparent");
			// d3.select(".district-list-" + d.District.replaceAll('[ ]', "_")).style("background", "#8cc4d3");
			// refreshCounts();
			// global.selectedDistrict = [];
			// myFilter({
			//   "key": d.District
			// }, "district", false);
			// d3.select("#settlement-list").selectAll("p").style("background", "transparent");
			d3.select(".settlement-list-" + d.Settlement_ID).style("background", "#8cc4d3");
			// var needRemove = $(d3.select(this).node()).hasClass("d3-active");
			global.currentEvent = "settlement";
			myFilter({
			  "key": d.Settlement,
			  values: [{
				"Settlement_ID": d.Settlement_ID
			  }]
			}, global.currentEvent, undefined);
			settlements.style("opacity", opacity);
			// d3.select(this.parentNode).style("opacity", 1);
			global.selectedSettlement.map(function (a) {
			  d3.select(".settlement-" + a.values[0].Settlement_ID).style("opacity", 1);
			});
			// global.needRefreshDistrict = true;
		  });
		settlements //.transition().duration(duration)
		  .each(function (d) {
			d._coordinates = projection([d.s_lon, d.s_lat]);
		  })
		  .attr("transform", function (d) {
			return "translate(" + d._coordinates[0] + "," + d._coordinates[1] + ")rotate(-90)";
		  })
		  .select("path")
		  .attr("d", 'M 0,0 m -5,-5 L 5,0 L -5,5 Z'); //http://bl.ocks.org/dustinlarimer/5888271
		settlements.exit().remove();
	
		// settlements.append("title").text(function (d) {
		//   return d.Settlement;
		// });
	
		// zoom and pan
		// var zoom = d3.behavior.zoom().scaleExtent([1, 1])
		//   .on("zoom", function () {
		//     g.attr("transform", "translate(" +
		//       d3.event.translate.join(",") + ")scale(" + d3.event.scale + ")");
		//   });
		// svg.call(zoom)
	
	
		function refreshMap() {
		  // ugandaPath.style("opacity", 1);
		  $(".custom-list-header").siblings(".custom-list").addClass('collapsed');
		  $("#district-list.custom-list").removeClass('collapsed');
		  global.selectedDistrict = [];
		  ugandaPath.style("opacity", function (a) {
			a.properties._selected = false;
			return 1;
		  });
		  settlements.style("opacity", 1);
		  d3.select("#district-list").selectAll("p").style("background", "transparent");
		  d3.select("#sector-list").selectAll("p").style("background", "transparent");
		  d3.select("#settlement-list").selectAll("p").style("background", "transparent");
		  d3.select("#agency-list").selectAll("p").style("background", "transparent");
		  updateLeftPanel(districtList, sectorList, settlementList, agencyList, dataset);
		  // updateLeftPanel(districtList, [], [], [], dataset);
		  refreshCounts();
		}
		d3.select("#d3-map-refresh").on("click", refreshMap);
	
	
		// function onlyUnique(value, index, self) {
		//   console.log(value, index, self)
		//   return self.indexOf(value) === index;
		// }
		function onlyUniqueObject(data) {
		  data = data.filter(function (d, index, self) {
			return self.findIndex(function (t) {
			  return t.key === d.key;
			}) === index;
		  });
		  return data;
		}
	
		function filterSelectedItem(item, c, needRemove) {
		  if (needRemove) {
			global[item] = global[item].filter(function (a) {
			  return a !== c;
			});
		  } else {
			global[item].push(c);
		  }
		  global[item] = onlyUniqueObject(global[item]); //global[item].filter(onlyUnique);;
		}
	
	
	
	
		function myFilter(c, flag, needRemove) {
		  if (flag === "district") {
			filterSelectedItem("selectedDistrict", c, needRemove);
		  }
		  if (flag === "settlement") {
			// global.selectedSettlement = c;
			filterSelectedItem("selectedSettlement", c, needRemove);
		  }
		  if (flag === "sector") {
			filterSelectedItem("selectedSector", c, needRemove);
		  }
		  if (flag === "agency") {
			filterSelectedItem("selectedAgency", c, needRemove);
		  }
	
		  var selectedDataset = dataset.filter(function (d) { //global.selectedDataset
			var isDistrict = false; //global.selectedDistrict ? global.selectedDistrict.key === d.District : true;
			if (global.selectedDistrict.length > 0) {
			  global.selectedDistrict.map(function (c) {
				if (c.key === d.District) {
				  isDistrict = true;
				}
			  });
			} else {
			  isDistrict = true;
			}
			// var isSettlement = global.selectedSettlement ? global.selectedSettlement.values[0].Settlement_ID === d.Settlement_ID : true;
			var isSettlement = false;
			if (global.selectedSettlement.length > 0) {
			  global.selectedSettlement.map(function (c) {
				if (c.values[0].Settlement_ID === d.Settlement_ID) {
				  isSettlement = true;
				}
			  });
			} else {
			  isSettlement = true;
			}
			// var isSector = global.selectedSector ? global.selectedSector.values[0].Sector_ID === d.Sector_ID : true;
			var isSector = false;
			if (global.selectedSector.length > 0) {
			  global.selectedSector.map(function (c) {
				if (c.values[0].Sector_ID === d.Sector_ID) {
				  isSector = true;
				}
			  });
			} else {
			  isSector = true;
			}
			// var isAgency = global.selectedAgency ? global.selectedAgency.values[0].Actor_ID === d.Actor_ID : true;
	
			var isAgency = false;
			if (global.selectedAgency.length > 0) {
			  global.selectedAgency.map(function (c) {
				if (c.values[0].Actor_ID === d.Actor_ID) {
				  isAgency = true;
				}
			  });
			} else {
			  isAgency = true;
			}
	
			return isDistrict && isSettlement && isSector && isAgency;
		  });
	
		  // console.log(selectedDataset.length, global.selectedDistrict, global.selectedSettlement, global.selectedSector, global.selectedAgency);
		  //     global.selectedDistrict = []; // name
		  // global.selectedSector = []; // ID
		  // global.selectedSettlement = []; //undefined; //[]; // ID
		  // global.selectedAgency = []; // ID
	
		  var districtList = null;
		  if (flag !== "district") {
			districtList = d3.nest().key(function (d) {
			  return d.District;
			}).sortKeys(d3.ascending).entries(selectedDataset);
		  }
	
		  var settlementList = null;
		  if (flag !== "settlement") {
			settlementList = d3.nest().key(function (d) {
			  return d.Settlement;
			}).sortKeys(d3.ascending).entries(selectedDataset);
		  }
	
		  var sectorList = null;
		  if (flag !== "sector") {
			sectorList = d3.nest().key(function (d) {
			  return d.Sector;
			}).sortKeys(d3.ascending).entries(selectedDataset);
		  }
	
		  var agencyList = null;
		  if (flag !== "agency") {
			agencyList = d3.nest().key(function (d) {
			  return d.Name;
			}).sortKeys(d3.ascending).entries(selectedDataset);
		  }
		  // global.selectedDistrict = districtList;
		  updateLeftPanel(districtList, sectorList, settlementList, agencyList, dataset);
	
		  if (flag === "district") {
			d3.select("#district-count").text(global.selectedDistrict.length);
		  } else {
			// global.selectedDistrict = districtList;
			d3.select("#district-count").text(districtList.length);
		  }
		  if (flag === "settlement") {
			d3.select("#settlement-count").text(global.selectedSettlement.length); //.text("1");
		  } else {
			// global.selectedSettlement = settlementList;
			d3.select("#settlement-count").text(settlementList.length);
		  }
		  if (flag === "sector") {
			d3.select("#sector-count").text(global.selectedSector.length);
		  } else {
			d3.select("#sector-count").text(sectorList.length);
		  }
		  if (flag === "agency") {
			d3.select("#agency-count").text(global.selectedAgency.length);
		  } else {
			d3.select("#agency-count").text(agencyList.length);
		  }
	
		}
	
	
	
		function updateLeftPanel(districtList, sectorList, settlementList, agencyList, dataset) {
		  // console.log(settlementList, districtList);
		  // console.log(global.currentEvent);
		  if (global.currentEvent !== "district") {
			d3.selectAll(".district").style("opacity", opacity);
			d3.selectAll(".settlement").style("opacity", opacity);
			districtList.map(function (a) {
			  d3.select(".district-" + a.key.replaceAll('[ ]', "_")).style("opacity", 1);
			  a.values.map(function (b) {
				d3.select(".settlement-" + b.Settlement_ID).style("opacity", 1);
			  });
			});
		  }
	
		  // d3.select("#district-count").text(districtList.length);
		  if (districtList) {
			var _districtList = d3.select("#district-list").selectAll("p")
			  .data(districtList);
			_districtList.enter().append("p")
			  .text(function (d) {
				return d.key;
			  })
			  // .style("background", "transparent")
			  .on("click", function (c) {
				// if (global.needRefreshDistrict) {
				//   d3.select("#district-list").selectAll("p").style("background", "transparent");
				//   global.needRefreshDistrict = false;
				// }
				settlements.style("opacity", opacity);
				if (global.selectedDistrict.length > 0) {
				  global.selectedDistrict.map(function (dd) {
					d3.selectAll(".settlement-district-" + dd.key.toLowerCase().replaceAll("[ ]", "-")).style(
					  "opacity", 1);
				  });
				}
				c.values.map(function (ddd) {
				  d3.select(".settlement-" + ddd.Settlement_ID).style('opacity', 1);
				});
				// d3.select("#sector-list").selectAll("p").style("background", "transparent");
				// d3.select("#settlement-list").selectAll("p").style("background", "transparent");
				// d3.select("#agency-list").selectAll("p").style("background", "transparent");
				var needRemove = $(d3.select(this).node()).hasClass("d3-active");
				d3.select(this).classed("d3-active", !needRemove).style("background", needRemove ? "transparent" :
				  "#E3784A");
				// refreshCounts();
				global.currentEvent = "district";
				myFilter(c, global.currentEvent, needRemove);
				// myFilterByDistrict(c, needRemove);
				ugandaPath.style("opacity", function (a) {
				  if (a.properties.DNAME_06 === c.key) {
					a.properties._selected = !needRemove;
					return a.properties._selected ? 1 : opacity;
				  }
				  return a.properties._selected ? 1 : opacity;
				});
				// d3.select(".district-" + c.key.replaceAll('[ ]', "_")).style("opacity", 1);
			  });
			_districtList //.transition().duration(duration)
			  .attr("class", function (d) {
				return "district-list-" + d.key.replaceAll('[ ]', "_");
			  })
			  .text(function (d) {
				return d.key;
			  });
			_districtList.exit().remove();
		  }
	
		  if (sectorList) {
			d3.select("#sector-count").text(sectorList.length);
			var _sectorList = d3.select("#sector-list").selectAll("p")
			  .data(sectorList);
			_sectorList.enter().append("p")
			  .attr("class", function (d) {
				return d.key.replace(/\s/g, '');
			  })
			  .text(function (d) {
				return d.key;
			  })
			  // .style("background", "transparent")
			  .on("click", function (c) {
				// d3.select(this.parentNode).selectAll("p").style("background", "transparent");
				// d3.select(this).style("background", "#8cc4d3");
				var needRemove = $(d3.select(this).node()).hasClass("d3-active"); //d3.select(this).attr("class");//d3-active
				d3.select(this).classed("d3-active", !needRemove).style("background", needRemove ? "transparent" :
				  "#E3784A");
				global.currentEvent = "sector";
				myFilter(c, global.currentEvent, needRemove);
				// myFilterBySector(c, needRemove);
			  });
			_sectorList //.transition().duration(duration)
			  .text(function (d) {
				return d.key;
			  });
			_sectorList.exit().remove();
		  }
		  //Hack to indent child protection and SGBV
		  $("p.CP").insertAfter("p.Protection");
	
		  if (settlementList) {
			d3.select("#settlement-count").text(settlementList.length);
			var _settlementList = d3.select("#settlement-list").selectAll("p")
			  .data(settlementList);
			_settlementList.enter().append("p")
			  .text(function (d) {
				return d.key;
			  })
			  // .style("background", "transparent")
			  .on("click", function (c) {
				// d3.select(this.parentNode).selectAll("p").style("background", "transparent");
				// d3.select(this).style("background", "#8cc4d3");
				var needRemove = $(d3.select(this).node()).hasClass("d3-active"); //d3.select(this).attr("class");//d3-active
				d3.select(this).classed("d3-active", !needRemove).style("background", needRemove ? "transparent" :
				  "#E3784A");
				global.currentEvent = "settlement";
				myFilter(c, global.currentEvent, needRemove);
				// myFilterBySettlement(c, undefined);
				settlements.style("opacity", opacity);
				// settlements.style("opacity", function (a) {
				//   if (a.Settlement_ID === c.values[0].Settlement_ID) {
				//     a._selected = !needRemove;
				//     return a._selected ? 1 : opacity;
				//   }
				//   return a._selected ? 1 : opacity;
				// });
				// d3.select(".settlement").style("opacity", 0);
				// d3.select(".settlement-" + c.values[0].Settlement_ID).style("opacity", 1);
				global.selectedSettlement.map(function (a) {
				  d3.select(".settlement-" + a.values[0].Settlement_ID).style("opacity", 1);
				});
			  });
			_settlementList
			  .attr("class", function (d) {
				return "settlement-list-" + d.values[0].Settlement_ID;
			  })
			  .text(function (d) {
				return d.key;
			  });
			_settlementList.exit().remove();
		  }
		  if (agencyList) {
			d3.select("#agency-count").text(agencyList.length);
			var _agencyList = d3.select("#agency-list").selectAll("p")
			  .data(agencyList);
			_agencyList.enter().append("p")
			  .text(function (d) {
				return d.key;
			  })
			  // .style("background", "transparent")
			  .on("click", function (c) {
				var needRemove = $(d3.select(this).node()).hasClass("d3-active"); //d3.select(this).attr("class");//d3-active
				d3.select(this).classed("d3-active", !needRemove).style("background", needRemove ? "transparent" :
				  "#E3784A");
				// myFilterByAgency(c, needRemove);
				global.currentEvent = "agency"
				myFilter(c, global.currentEvent, needRemove);
				// settlementList.map(function (a) {
				//   d3.select(".settlement-" + a.values[0].Settlement_ID).style("opacity", 1);
				// });
				// global.selectedDistrict.map(function (dd) {
				//   d3.selectAll(".settlement-district-" + dd.key.toLowerCase().replaceAll("[ ]", "-")).style(
				//     "opacity", 1);
				// });
			  });
			_agencyList
			  .text(function (d) {
				return d.key;
			  });
			_agencyList.exit().remove();
		  }
		}
	
		window.addEventListener("resize", function () {
		  var wrapper = d3.select("#d3-map-wrapper");
		  var width = wrapper.node().offsetWidth || 960;
		  var height = wrapper.node().offsetHeight || 480;
		  if (width) {
			d3.select("#d3-map-wrapper").select("svg")
			  .attr("viewBox", "0 0 " + width + " " + height)
			  .attr("width", width)
			  .attr("height", height);
		  }
		});
	
		/*
		setTimeout(function () {
		  queue()
			.defer(d3.json, "./data/UgandaDistricts.unhighlighted.geojson") //dist
			.await(readyUnhighlighted);
		}, 100);
	
		function readyUnhighlighted(error, ugandaGeoJsonUnhighlighted) {
		  if (error) {
			throw error;
		  };
		  ugandaGeoJsonUnhighlighted.features.map(function (d) {
			d.properties.DNAME_06 = d.properties.dist.toLowerCase().capitalize();
		  });
		  ugandaGeoJson.features = ugandaGeoJson.features.concat(ugandaGeoJsonUnhighlighted.features);
		  updateGeoPath(ugandaGeoJson);
		}*/

        d3.select("#education-list").selectAll("p").append("div").attr("class", "sliders");
		d3.select("#socio-economic-list").selectAll("p").append("div").attr("class", "sliders");
		d3.select("#wash-and-health-list").selectAll("p").append("div").attr("class", "sliders");
		d3.select("#energy-list").selectAll("p").append("div").attr("class", "sliders");
		d3.select("#agriculture-list").selectAll("p").append("div").attr("class", "sliders");
		d3.select("#economic-list").selectAll("p").append("div").attr("class", "sliders");    
		var sliders = document.getElementsByClassName('sliders');
		var fieldName = [];

		for ( var i = 0; i < sliders.length; i++ ) {
			var domain =[+Infinity, -Infinity];
			fieldName.push([sliders[i].__data__.values[0].FieldNames]);
			for (var j = 0; j < dataset1.length; j++) {
				var Household = +(dataset1[j]["HOUSEHOLDS"]);
				var filterValue;

				
					filterValue = +(dataset1[j][sliders[i].__data__.values[0].FieldNames])  / Household * 100 ;
				
			}

				console.log(sliders);
			noUiSlider.create(sliders[i], {
				start: [0,100],
				behaviour: "drag",
				margin: 5,
				connect: true,
				orientation: "horizontal",
				range: {
					'min': 0,
					'max': 100
				},
				tooltips: true,
				format: {
					to: function (value) {
						// console.log(value);
						return value.toFixed(0) + '%';
					},
					from: function (value) {
						return value.replace('%', '');
					}
				}
			});

			var activeFilters = [];
			//sliders[i].noUiSlider.on('slide', addValues);

		}

		function addValues() {
			var allValues = [];
			var range, rangeMin, rangeMax;
			var realRange = [];


			for (var i = 0; i < sliders.length; i++) {
				allValues.push([sliders[i].noUiSlider.get()]);
				range = sliders[i].noUiSlider.get();
				rangeMin = range.slice(0, 1);
				rangeMax = range.slice(1);

				realRange.push(rangeMin.concat(rangeMax));
				rangeMin = [+(rangeMin) * Household / 100];
				rangeMax = [+(rangeMax) * Household / 100];


			}

			var sliderData = [fieldName].concat([realRange]);

			var filtered = [];
			var classfiltered = [];

			var filteredPop = 0;
			var filteredHH = 0;
			var subCountyValue;

			var activeFilters = [];
			var filterValues = [];

			for (var i = 0; i < sliderData[0].length; i++) {
				if (sliderData[1][i][0] !== "0%" || sliderData[1][i][1] !== "100%") {
					activeFilters.push(sliderData[0][i][0]);
					filterValues.push(sliderData[1][i]);
				}
			}


			for (var j = 0; j < activeFilters.length; j++) {
				for (var i = 0; i < dataset1.length; i++) {


					if (dataset1[i][activeFilters[j]]) {
						for (var k = 0; k < activeFilters.length; k++) {
							{
								subCountyValue = +(dataset1[i][activeFilters[j]]) / +(dataset1[i]["HOUSEHOLDS"]) * 100;
							}
						}
						if (subCountyValue < +((filterValues[j][0]).replace('%', ''))  || subCountyValue > +((filterValues[j][1]).replace('%', ''))) {
							filtered.push(dataset1[i].Concat);
						}
					}
				}
			}

			filteredsubCountys = filtered.filter(function (item, pos) {
				return filtered.indexOf(item) === pos;
			});
			filteredsubCountysClass = classfiltered.filter(function (item, pos) {
				return filtered.indexOf(item) === pos;
			});


			for (var i = 0; i < dataset1.length; i++) {
				for (var j = 0; j < filteredsubCountys.length; j++) {
					if (filteredsubCountys[j] === dataset1[i].Concat) {
						var filtHousehold = +(dataset1[i]["HOUSEHOLDS"]);
						filteredHH = filteredHH + filtHousehold;
					}
				}

			}
			d3.select("#subCounty-count").text(global.subCountyCount - filteredsubCountys.length);
			d3.select("#household-count").text((global.householdCount - filteredHH).toLocaleString());


			var dataUBOStemp = dataUBOS.filter(function (d) {
				for (var k = 0; k < filteredsubCountys.length; k++) {
						if (d.Concat === filteredsubCountys[k]) {
							return;	 
						}
							
					}
				return d;
			})
			
			var districtList1 = d3.nest().key(function (d) {
				for (var k = 0; k < filteredsubCountys.length; k++) {
					if (d.Concat === filteredsubCountys[k]) {
						//console.log(filteredsubCountys[k]);
						return; 
					}
					return d.DISTRICT + " District";
				}
			}).sortKeys(d3.ascending).entries(dataUBOStemp);
			
			
			if (filteredsubCountys.length === 0) {
				
			buildList($('#district-subcounty-list').empty(), districtList);
				
			} else {
			buildList($('#district-subcounty-list').empty(), districtList1);
				}

			
			var subCountyListPanel = d3.select("#district-subcounty-list");

		var subCountyListPanel = d3.select("#district-subcounty-list").selectAll("p span p span");

		subCountyListPanel.on('mouseover', function(){
			$(this).addClass('is-hover');
		}).on('mouseout', function(){
			$(this).removeClass('is-hover');
		})
		
		var districtListPanel = d3.select("#district-subcounty-list").select("p").selectAll(".District");
		
		
		districtListPanel.attr("class", "districtHeading");

			ugandaPath.style("fill", function (d) {
				for (var k = 0; k < filteredsubCountys.length; k++) {
					if (d.properties.Concat === filteredsubCountys[k]) {
						return "none";
					}
				}
				return "#e3784a";
			});

			var header = d3.select("#subCountyHeader");
			var str = "National Average";
			header.html(str);


			var activeFilters = [];
			var filterValues = [];

			for (var i = 0; i < sliderData[0].length; i++) {
				if (sliderData[1][i][0] !== "0.00%" || sliderData[1][i][1] !== "100.00%") {
					activeFilters.push(sliderData[0][i][0]);
					filterValues.push(sliderData[1][i]);
				}
			}


		}
	
	  } // ready
	
	



})(d3, $, queue, window);