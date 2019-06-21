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
		.defer(d3.csv, "./data/UBOS_1442Subcounty_data.csv")
		.defer(d3.csv, "./data/filterList_Subcounty.csv")
		.await(ready);


	var global = {};
	global.selectedsubCounty = []; // name
	global.selectedTheme = []; // ID
	global.selectedFilter = []; //undefined; //[]; // ID
	global.subCountyCount;
	global.currentEvent;


	function refreshCounts() {
		d3.select("#subCounty-count").text(global.subCountyCount);
		d3.select("#household-count").text(global.householdCount.toLocaleString());

		_selectedDataset = dataset1;
	}


	var righthelpButton = new L.Control.Button(L.DomUtil.get('righthelpbutton'), { toggleButton: 'active' });
	righthelpButton.addTo(map);
	righthelpButton.on('click', function () {
		if (righthelpButton.isToggled()) {
			rightSidebar.show();
		} else {
			rightSidebar.hide();
		}
	});

	var lefthelpButton = new L.Control.Button(L.DomUtil.get('lefthelpbutton'), {position: 'topleft', toggleButton: 'active' });
	lefthelpButton.addTo(map);
	lefthelpButton.on('click', function () {
		if (lefthelpButton.isToggled()) {
			leftSidebar.show();
		} else {
			leftSidebar.hide();
		}
	});


	function ready(error, ugandaSubCountiesGeoJson, dataUBOS, filterList_Subcounty) {
		//standard for if data is missing, the map shouldnt start.
		if (error) {
			throw error;
		}
		var filterList_SubcountyKays = d3.keys(filterList_Subcounty[0]);
		var dataUBOSKays = d3.keys(dataUBOS[0]);
		ugandaSubCountiesGeoJson.features.map(function (d) {
			d.properties.subc = d.properties.Concat.toLowerCase().capitalize();
		});
		//need join all data
		dataset1 = dataUBOS.map(function (d) {
			var i;
			for (i = 0; i < ugandaSubCountiesGeoJson.length; i++) {
				if (ugandaSubCountiesGeoJson[i].subc === d.Concat) {
					dataUBOSKays.map(function (k) {
						d[k] = ugandaSubCountiesGeoJson[i][k];
					});
					break;
				}
			}
			return d;
		});
		console.log(dataset1);
		
		function buildList(parentElement, items) {
				var i, l, list, li;
				if( !items || !items.length ) { return; } // return here if there are no items
				list = $("<p></p>").appendTo(parentElement);
				for(i = 0, l = items.length ; i < l ; i++) {
					li = $("<span></span>").text(items[i].key).addClass(items[i].key).addClass("subcountyHeading");
					buildList(li, items[i].values);
					list.append(li);
					list.append("<br>");
				}
			}
		// http://bl.ocks.org/phoebebright/raw/3176159/
		var districtList = d3.nest().key(function (d) {
			return d.DISTRICT + " District";
		}).sortKeys(d3.ascending).entries(dataUBOS);
		
			buildList($('#district-subcounty-list').empty(), districtList);
		

		var subCountyListPanel = d3.select("#district-subcounty-list").selectAll("p span p span");

		subCountyListPanel.on('mouseover', function(){
			$(this).addClass('is-hover');
		}).on('mouseout', function(){
			$(this).removeClass('is-hover');
		})
		
		var districtListPanel = d3.select("#district-subcounty-list").select("p").selectAll(".District");
		
		
		districtListPanel.attr("class", "districtHeading");		
	

		var themeList = d3.nest().key(function(d) {
			return d.Theme;
		}).sortKeys(d3.ascending).entries(filterList_Subcounty);

		var filterList_Subcounty = d3.nest().key(function(d) {
			return d.Name;
		}).sortKeys(d3.ascending).entries(filterList_Subcounty);
		// console.log(filterList_Subcounty);

		var educationList = filterList_Subcounty.filter(function (d) {
			if (d.values[0].Theme === "Education (% of population)") {
				return d.key; //return d.Actor_Type["UN"];
			}
		});
		var socioEconomicList = filterList_Subcounty.filter(function (d) {
			if (d.values[0].Theme === "Socio-Economic") {
				return d.key; //return d.Actor_Type["UN"];
			}
		});

		var washAndHealthList = filterList_Subcounty.filter(function (d) {
			if (d.values[0].Theme === "WASH & Health") {
				return d.key; //return d.Actor_Type["UN"];
			}
		});
		var energyList = filterList_Subcounty.filter(function (d) {
			if (d.values[0].Theme === "Energy") {
				return d.key; //return d.Actor_Type["UN"];
			}
		});
		var agricultureList = filterList_Subcounty.filter(function (d) {
			if (d.values[0].Theme === "Agriculture") {
				return d.key; //return d.Actor_Type["UN"];
			}
		});
		var economicList = filterList_Subcounty.filter(function (d) {
			if (d.values[0].Theme === "Economic") {
				return d.key; //return d.Actor_Type["UN"];
			}
		});


		var totalHouseholds = d3.sum(dataUBOS, function(d) {
			return parseFloat(d.HOUSEHOLDS);
		});

		var subCountyList = d3.nest().key(function (d) {
			return d.Concat;
		}).sortKeys(d3.ascending).entries(dataUBOS);

		global.subCountyCount = subCountyList.length;
		global.householdCount = totalHouseholds;


		refreshCounts();
		updateLeftPanel(subCountyList, dataset1);

		$(".custom-list-header").click(function () {
			$(".custom-list-header").siblings(".custom-list").addClass('collapsed');
			$(this).siblings(".custom-list").toggleClass('collapsed');
			$(this).find("span").toggleClass('glyphicon-menu-down').toggleClass('glyphicon-menu-right');
		});

		// Collapses all the boxes apart from subCounty
		$(".custom-list-header").siblings(".custom-list").addClass('collapsed');
		$("#socio-economic-list.custom-list").removeClass('collapsed');


		var h = (window.innerHeight ||
				 document.documentElement.clientHeight ||
				 document.body.clientHeight);
		//    if (h > 540) {
		d3.select(".list-container").style("height", h + "px");
		d3.select("#d3-map-container").style("height", h + "px");
		//    }
		var w = (window.innerWidth ||
				 document.documentElement.clientWidth ||
				 document.body.clientWidth);
		d3.select(".list-container").style("height", h - 0 + "px")

		var _3w_attrib = 'Created by <a href="http://www.geogecko.com">Geo Gecko</a> and © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, Powered by <a href="https://d3js.org/">d3</a>';
		var basemap = L.tileLayer("https://api.mapbox.com/styles/v1/gecko/cj27rw7wy001w2rmzx0qdl0ek/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZ2Vja28iLCJhIjoidktzSXNiVSJ9.NyDfX4V8ETtONgPKIeQmvw");

		//basemap.addTo(map);
		map.doubleClickZoom.disable();

		map.bounds = [],
			map.setMaxBounds([
			[9,23.0],
			[-9.5,45]
		]);
		map.options.maxZoom=12;
		map.options.minZoom=6;

		var ugandaPath;
		var domain = [+Infinity, -Infinity];
		var opacity = 0.7;
		var width = $(window).width();
		var height = $(window).height();


		d3.select("#info").on("click", function() {
			$("#overlay1").show(); 
		});

		d3.select(".glyphicon-remove").on("click", function() {
			$("#overlay1").hide(); 
		});

		$(document).keyup(function(e) {
			if (e.keyCode == 27) { // escape key maps to keycode `27`
				// <DO YOUR WORK HERE>
				$("#overlay1").hide();
			}
		});    

		var color = d3.scale.linear().domain(domain) //http://bl.ocks.org/jfreyre/b1882159636cc9e1283a
		.interpolate(d3.interpolateHcl)
		.range([d3.rgb("#f7fcfd"), d3.rgb('#00441b')]);
		var tooltip = d3.select(map.getPanes().overlayPane)
		.append("div")
		.attr("class", "d3-tooltip d3-hide");
		var datasetNest = d3.nest().key(function (d) {
			return d.Concat;
		}).entries(dataset1);


		var countries = [];
		var countriesOverlay = L.d3SvgOverlay(function (sel, proj) {
			var projection = proj.pathFromGeojson.projection;
			var path = d3.geo.path().projection(projection);

			ugandaPath = sel.selectAll('.subCounty').data(countries);
			ugandaPath.enter()
				.append('path')
				.attr('d', proj.pathFromGeojson)
				.attr('fill-opacity', '0.5')
				.attr("z-index", "600")
				.attr("style", "pointer-events:all!important")
				.style("cursor", "pointer")
				.style("stroke", "#000")
				.each(function (d) {
				//console.log(d);
				d.properties.centroid = projection(d3.geo.centroid(d)); // ugandaCentroid = d.properties.centroid;
				// console.log(d, d.properties.centroid);
				datasetNest.map(function (c) {
					if (c.key === d.properties.subc) {
						//console.log(c);
						d.properties._Population_2014 = d3.nest().key(function (a) {
							//console.log(a);
							return a.Population_2014;
						}).entries(c.values);
						d.properties._Household_2014 = d3.nest().key(function (a) {
							// console.log(a);
							return a.HOUSEHOLDS;
						}).entries(c.values);
						//console.log(d);
						var filterValue = +(d.properties._Population_2014[0].key);
						domain[0] = filterValue < domain[0] ? filterValue :
						domain[
							0];
						domain[1] = filterValue > domain[1] ? filterValue :
						domain[
							1];
						color.domain(domain);
					}
				});
			})
				.on("mousemove", function (d) {
				var svg = d3.select(this.parentNode.parentNode.parentNode);
				var mouse = d3.mouse(svg.node()).map(function (d) {
					return parseInt(d);
				});
				var shift = d3.transform(svg.attr("transform"))
				mouse[0] = mouse[0] + shift.translate[0] + shift.translate[0] * (shift.scale[0] - 1);
				mouse[1] = mouse[1] + shift.translate[1] + shift.translate[1] * (shift.scale[1] - 1);
				// console.log(sel, mouse);
				var str = "<p><b>" + d.properties.subc + "</b><span> SubCounty</span></p>"
				tooltip.html(str);
				var box = tooltip.node().getBoundingClientRect() || {
					height: 0
				};
				tooltip
					.classed("d3-hide", false)
					.attr("style", "left:" + (mouse[0] + 15) + "px;top:" + (mouse[1] < height / 2 ? mouse[1] : mouse[1] - box.height) + "px");
			})
				.on("mouseover", function (d) {
				tooltip.classed("d3-hide", false);
			})
				.on("mouseout", function (d) {
				tooltip.classed("d3-hide", true);
			})
				.on("click", function (d) {
				if ($("#left").attr("data-status") =="closed")
				{
					$("#left").find(".toggler").trigger("click");
				}


				var header = d3.select("#subCountyHeader");
				var str = "National Average versus " + d.properties.subc + " SubCounty";

				header.html(str);
				ugandaPath.style("fill", function (d) {
					for (var k = 0; k < filteredsubCountys.length; k++) {
						if (d.properties.subc === filteredsubCountys[k]) {
							return "none";
						}
					}
					return "#e3784a";
				});
				d3.select(this).style("fill", "#41b6c4");
				d3.select(this).attr("opacity", 1);


				console.log(d);
				d3.select("#dist-population-count").text((+(d.properties.Population)).toLocaleString());
				d3.select("#dist-household-count").text((+(d.properties.Households)).toLocaleString());
			})
				.style("fill", "#e3784a")
				.attr("class", function (d) {
				return "subCounty subCounty-" + d.properties.subc.replaceAll('[ ]', "_");
			});

			ugandaPath.attr('stroke-width', 1 / proj.scale)
				.each(function (d) {
				d.properties.centroid = projection(d3.geo.centroid(d)); // ugandaCentroid = d.properties.centroid;
				datasetNest.map(function (c) {
					if (c.key === d.properties.dist) {
						//console.log(c);
						d.properties._Population_2014 = d3.nest().key(function (a) {
							//console.log(a);
							return a.Population_2014;
						}).entries(c.values);
						d.properties._Household_2014 = d3.nest().key(function (a) {
							// console.log(a);
							return a.HOUSEHOLDS;
						}).entries(c.values);
						//console.log(d);
						var filterValue = +(d.properties._Population_2014[0].key);
						domain[0] = filterValue < domain[0] ? filterValue :
						domain[
							0];
						domain[1] = filterValue > domain[1] ? filterValue :
						domain[
							1];
						color.domain(domain);
						//console.log(domain);
					}
				});
			})
				.attr("class", function (d) {
				return "subCounty subCounty-" + d.properties.subc.replaceAll('[ ]', "_");
			});
			ugandaPath.exit().remove();
		});
		countries = ugandaSubCountiesGeoJson.features;
		countriesOverlay.addTo(map);
		/**/ 

		subCounty = L.geoJson(ugandaSubCountiesGeoJson)
		cbounds = subCounty.getBounds();

		setTimeout(function(){
			zoom = map.getBoundsZoom(cbounds);
			map.setView({lat: 1.367, lng: 32.105 });
			map.setZoom(zoom);
			setTimeout(function(){  
				map.setView({lat: 1.367, lng: 32.105 },zoom+0.8,{pan: {animate: true,duration: 1.5},zoom: {animate: true} });
				map.fitBounds(cbounds);
				map.invalidateSize();
			},500);
		},100);

		function refreshMap() {
			$(".custom-list-header").siblings(".custom-list").addClass('collapsed');
			$("#socio-economic-list.custom-list").removeClass('collapsed');
			var header = d3.select("#subCountyHeader");
			filteredsubCountys = [];
			var str = "National Average";
			header.html(str);
			
			buildList($('#district-subcounty-list').empty(), districtList);
			
		var subCountyListPanel = d3.select("#district-subcounty-list").selectAll("p span p span");

		subCountyListPanel.on('mouseover', function(){
			$(this).addClass('is-hover');
		}).on('mouseout', function(){
			$(this).removeClass('is-hover');
		})
		
		var districtListPanel = d3.select("#district-subcounty-list").select("p").selectAll(".District");
		
		
		districtListPanel.attr("class", "districtHeading");		
			for (var i = 0; i < sliders.length; i++) {
				sliders[i].noUiSlider.reset();
			}
			ugandaPath.style("fill", "e3784a");


			refreshCounts();
		}
		d3.select("#d3-map-refresh").on("click", refreshMap);


		function makePdf() {
			if ($("#d3-map-make-pdf").hasClass('disabled')) {
				return;
			}
			var lat_tmp = 1.367;
			var lng_tmp = 32.305;
			map.setMaxBounds(null);
			map.setView([lat_tmp, lng_tmp], 7);
			$("#d3-map-make-pdf").addClass('disabled');
			var spinner = new Spinner({length: 15, radius: 20, width: 10}).spin(document.body);
			document.getElementById('d3-map-make-pdf').appendChild(spinner.el);

			var filters = [];
			if (sliders.length > 0) {
				filters.push({"name": "subCounty", "values": global.selectedsubCounty})
			}

			var $xhr = $.ajax({
				type: "HEAD",
				url: "./data/UBOS_subCounty_data.csv",
			}).done(function () {
				var lastModified = new Date($xhr.getResponseHeader("Last-Modified"));
				basemap.on("load", setTimeout(function(){console.log("all visible tiles have been loaded...");
														 generatePdf(map, _selectedDataset, filters, lastModified, function () {
															 $("#d3-map-make-pdf").removeClass('disabled');
															 spinner.stop();
														 });

														}, 5000));
			})
			}

		d3.select("#d3-map-make-pdf").on("click", makePdf);


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
			global[item] = onlyUniqueObject(global[item]);
		}




		function myFilter(c, flag, needRemove) {
			if (flag === "subCounty") {
				filterSelectedItem("selectedsubCounty", c, needRemove);
			}
			if (flag === "theme") {
				filterSelectedItem("selectedTheme", c, needRemove);
			}

			var selectedDataset = dataset1.filter(function (d) {
				var issubCounty = false;
				if (global.selectedsubCounty.length > 0) {
					global.selectedsubCounty.map(function (c) {
						if (c.key === d.Concat) {
							issubCounty = true;
						}
					});
				} else {
					issubCounty = true;
				}
				var isTheme = false;
				if (global.selectedTheme.length > 0) {
					global.selectedTheme.map(function (c) {

						if (c.values[0].Settlement_ID === d.Settlement_ID) {
							isTheme = true;
						}
					});
				} else {
					isTheme = true;
				}
				var isFilter = false;
				if (filterList_Subcounty.length > 0) {
					filterList_Subcounty.map(function (c) {
						if (c.key === d.Sector_ID) {
							isTheme = true;
						}
					});
				} else {
					isFilter = true;
				}

				return issubCounty && isTheme && isFilter;
			});

			_selectedDataset = selectedDataset;

			var subCountyList = null;
			if (flag !== "subCounty") {
				subCountyList = d3.nest().key(function (d) {
					return d.Concat;
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
			updateLeftPanel(subCountyList, dataset1);

			if (flag === "subCounty") {
				d3.select("#subCounty-count").text(global.selectedsubCounty.length);
			} else {
				// global.selectedsubCounty = subCountyList;
				d3.select("#subCounty-count").text(subCountyList.length);
			}
			if (flag === "theme") {
				d3.select("#theme-count").text(global.selectedTheme.length);
			} else {
				d3.select("#theme-count").text(themeList.length);
			}
			if (flag === "filter") {
				d3.select("#filter-count").text(global.selectedFilter.length);
			} else {
				d3.select("#filter-count").text(filterList_Subcounty.length);
			}


		}

		function updateLeftPanel(subCountyList, dataset1) {
			if (educationList) {
				var _educationList = d3.select("#education-list").selectAll("p")
				.data(educationList);
				_educationList.enter().append("p")
					.text(function (d) {
					return d.key;
				})
				_educationList
					.attr("class", function (d) {
					return "education-list-" + d.key.replaceAll('[ ]', "_");
				})
					.text(function (d) {
					return d.key;
				});
				_educationList.exit().remove();
			}

			if (socioEconomicList) {
				var _socioEconomicList = d3.select("#socio-economic-list").selectAll("p")
				.data(socioEconomicList);
				_socioEconomicList.enter().append("p")
					.text(function (d) {
					return d.key;
				})
				_socioEconomicList
					.attr("class", function (d) {
					return "socio-economic-list-" + d.key.replaceAll('[ ]', "_");
				})
					.text(function (d) {
					return d.key;
				});
				_socioEconomicList.exit().remove();
			}
			if (washAndHealthList) {
				var _washAndHealthList = d3.select("#wash-and-health-list").selectAll("p")
				.data(washAndHealthList);
				_washAndHealthList.enter().append("p")
					.text(function (d) {
					return d.key;
				})
				_washAndHealthList
					.attr("class", function (d) {
					return "wash-and-health-list-" + d.key.replaceAll('[ ]', "_");
				})
					.text(function (d) {
					return d.key;
				});
				_washAndHealthList.exit().remove();
			}
			if (energyList) {
				var _energyList = d3.select("#energy-list").selectAll("p")
				.data(energyList);
				_energyList.enter().append("p")
					.text(function (d) {
					return d.key;
				})
				_energyList
					.attr("class", function (d) {
					return "energy-list-" + d.key.replaceAll('[ ]', "_");
				})
					.text(function (d) {
					return d.key;
				});
				_energyList.exit().remove();
			}
			if (agricultureList) {
				var _agricultureList = d3.select("#agriculture-list").selectAll("p")
				.data(agricultureList);
				_agricultureList.enter().append("p")
					.text(function (d) {
					return d.key;
				})
				_agricultureList
					.attr("class", function (d) {
					return "agriculture-list-" + d.key.replaceAll('[ ]', "_");
				})
					.text(function (d) {
					return d.key;
				});
				_agricultureList.exit().remove();
			}
			if (economicList) {
				var _economicList = d3.select("#economic-list").selectAll("p")
				.data(economicList);
				_economicList.enter().append("p")
					.text(function (d) {
					return d.key;
				})
				_economicList
					.attr("class", function (d) {
					return "economic-list-" + d.key.replaceAll('[ ]', "_");
				})
					.text(function (d) {
					return d.key;
				});
				_economicList.exit().remove();
			}
		}
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