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
        .defer(d3.json, "./data/UgandaDistricts.geojson") //dist
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
        d3.select("#subCounty-count").text(global.subCountyCount);
        d3.select("#household-count").text(global.householdCount.toLocaleString());

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


    function ready(error, ugandaSubCountiesGeoJson, dataUBOS, filterList_Subcounty) {
        //standard for if data is missing, the map shouldnt start.
        if (error) {
            throw error;
        }
        var filterList_SubcountyKays = d3.keys(filterList_Subcounty[0]);
        var dataUBOSKays = d3.keys(dataUBOS[0]);
        ugandaSubCountiesGeoJson.features.map(function (d) {
            d.properties.subc = d.properties.dist.toLowerCase().capitalize();
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

        function buildList(parentElement, items) {
            var i, l, list, li;
            if (!items || !items.length) {
                // return;
            } // return here if there are no items
            list = $("<p></p>").appendTo(parentElement);
            li = $("<span></span>").text("Name: " + items.School).addClass(items.School).addClass("subcountyHeading");
            list.append("<br>");
            list.append(li);
            li = $("<span></span>").text("Funding Organisation: " + items.Organisation_Name).addClass(items.Organisation_Name).addClass("subcountyHeading");
            list.append("<br>");
            list.append(li);
            li = $("<span></span>").text("Current Attendance: Not Available").addClass("subcountyHeading");
            list.append("<br>");
            list.append("<br>");
            list.append("<br>");
            list.append(li);
            li = $("<span></span>").text("Charts").addClass("subcountyHeading");
            list.append("<br>");
            list.append("<br>");
            list.append(li);
            // for (i = 0, l = items.length; i < l; i++) {
            //     buildList(li, items[i].values);
            // }
        }
        // http://bl.ocks.org/phoebebright/raw/3176159/
        var districtList = d3.nest().key(function (d) {
            return d.DISTRICT + " District";
        }).sortKeys(d3.ascending).entries(dataUBOS);

        // buildList($('#district-subcounty-list').empty(), districtList);


        var subCountyListPanel = d3.select("#district-subcounty-list").selectAll("p span p span");

        subCountyListPanel.on('mouseover', function () {
            $(this).addClass('is-hover');
        }).on('mouseout', function () {
            $(this).removeClass('is-hover');
        })

        var districtListPanel = d3.select("#district-subcounty-list").select("p").selectAll(".District");


        districtListPanel.attr("class", "districtHeading");


        var themeList = d3.nest().key(function (d) {
            return d.Theme;
        }).sortKeys(d3.ascending).entries(filterList_Subcounty);

        var filterList_Subcounty = d3.nest().key(function (d) {
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


        var totalHouseholds = d3.sum(dataUBOS, function (d) {
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
                [9, 23.0],
                [-9.5, 45]
            ]);
        map.options.maxZoom = 12;
        map.options.minZoom = 6;

        var ugandaPath;
        var domain = [+Infinity, -Infinity];
        var opacity = 0.7;
        var width = $(window).width();
        var height = $(window).height();


        d3.select("#info").on("click", function () {
            $("#overlay1").show();
        });

        d3.select(".glyphicon-remove").on("click", function () {
            $("#overlay1").hide();
        });

        $(document).keyup(function (e) {
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
        }).entries(dataUBOS);

        var b = path.bounds(ugandaSubCountiesGeoJson),
            s = 5176.885757686581,
            t = [(width - 154 - s * (b[1][0] + b[0][0])) / 2, (height + 20 - s * (b[1][1] + b[0][1])) / 2];

        projection
            .scale(s)
            .translate(t);

        var ugandaPath;

        var ugandaDistricts = g.append("g").attr("class", "uganda-districts");

        window.updateGeoPath = function updateGeoPath(ugandaSubCountiesGeoJson) {
            //console.log(ugandaSubCountiesGeoJson.features[0].properties.DNAME_06);
            ugandaPath = ugandaDistricts
                .selectAll('.district')
                .data(ugandaSubCountiesGeoJson.features);
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
                    var str = "<p><span>District:</span> <b>" + d.properties.dist + "</b></p>"
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
                    return "district district-" + d.properties.dist.replaceAll('[ ]', "_");
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
                    return "district district-" + d.properties.dist.replaceAll('[ ]', "_");
                });
            ugandaPath.exit().remove();
            // var ugandaCentroid;

        }

        var ugandaNeighboursPath;
        updateGeoPath(ugandaSubCountiesGeoJson);
        var domain = color.domain();

        // var N = 4;
        // var array = (Array.apply(null, {
        //   length: N+1
        // }).map(Number.call, Number)).map(function(d,i){
        //   return Math.round(i*(domain[1]-domain[0])/N);
        // });
        var array = [domain[0], Math.round(2 * (domain[1] - domain[0]) / 4), Math.round(3 * (domain[1] - domain[0]) /
            4), domain[1]];



        g.append("g").attr("class", 'circle-group');
        // var localdataUBOS = $.extend(true, [], dataUBOS);
        var settlements = svg.select('.circle-group')
            .selectAll('.settlement')
            .data(dataUBOS);
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
                var str = "<p><span>School Name:</span> <b>" + d.School + "</b></p>"
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

                buildList($('#district-subcounty-list').empty(), d);

                
                $('#chart').empty();

                var myData = "date	KPI 1	KPI 2	KPI 3\n\
20111001	63.4	62.7	72.2\n\
20111002	58.0	59.9	67.7\n\
20111022	54.4	60.7	72.4\n";

                var margin = {
                        top: 20,
                        right: 80,
                        bottom: 30,
                        left: 50
                    },
                    width = $('#chart').width() - margin.left - margin.right,
                    height = width/1.5;

                var parseDate = d3.time.format("%Y%m%d").parse;

                var x = d3.time.scale()
                    .range([0, width]);

                var y = d3.scale.linear()
                    .range([height, 0]);

                var color = d3.scale.category10();

                var xAxis = d3.svg.axis()
                    .scale(x)
                    .orient("bottom");

                var yAxis = d3.svg.axis()
                    .scale(y)
                    .orient("left");

                var line = d3.svg.line()
                    .interpolate("basis")
                    .x(function (d) {
                        return x(d.date);
                    })
                    .y(function (d) {
                        return y(d.temperature);
                    });

                var svg = d3.select("#chart").append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                var data = d3.tsv.parse(myData);

                color.domain(d3.keys(data[0]).filter(function (key) {
                    return key !== "date";
                }));

                data.forEach(function (d) {
                    d.date = parseDate(d.date);
                });

                var cities = color.domain().map(function (name) {
                    return {
                        name: name,
                        values: data.map(function (d) {
                            return {
                                date: d.date,
                                temperature: Math.random() //+d[name]
                            };
                        })
                    };
                });

                x.domain(d3.extent(data, function (d) {
                    return d.date;
                }));

                y.domain([
                    d3.min(cities, function (c) {
                        return d3.min(c.values, function (v) {
                            return v.temperature;
                        });
                    }),
                    d3.max(cities, function (c) {
                        return d3.max(c.values, function (v) {
                            return v.temperature;
                        });
                    })
                ]);

                // var legend = svg.selectAll('g')
                //     .data(cities)
                //     .enter()
                //     .append('g')
                //     .attr('class', 'legend');

                // legend.append('rect')
                //     .attr('x', width - 20)
                //     .attr('y', function (d, i) {
                //         return i * 20;
                //     })
                //     .attr('width', 10)
                //     .attr('height', 10)
                //     .style('fill', function (d) {
                //         return color(d.name);
                //     });

                // legend.append('text')
                //     .attr('x', width - 8)
                //     .attr('y', function (d, i) {
                //         return (i * 20) + 9;
                //     })
                //     .text(function (d) {
                //         return d.name;
                //     });

                svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + height + ")")
                    .call(xAxis);

                svg.append("g")
                    .attr("class", "y axis")
                    .call(yAxis)
                    .append("text")
                    .attr("transform", "rotate(-90)")
                    .attr("y", 6)
                    .attr("dy", ".71em")
                    .style("text-anchor", "end")
                    .text("Number of students");

                var city = svg.selectAll(".city")
                    .data(cities)
                    .enter().append("g")
                    .attr("class", "city");

                city.append("path")
                    .attr("class", "line")
                    .attr("d", function (d) {
                        return line(d.values);
                    })
                    .style("stroke", function (d) {
                        return color(d.name);
                    });

                city.append("text")
                    .datum(function (d) {
                        return {
                            name: d.name,
                            value: d.values[d.values.length - 1]
                        };
                    })
                    .attr("transform", function (d) {
                        return "translate(" + x(d.value.date) + "," + y(d.value.temperature) + ")";
                    })
                    .attr("x", 3)
                    .attr("dy", ".35em")
                    .text(function (d) {
                        return d.name;
                    });

                var mouseG = svg.append("g")
                    .attr("class", "mouse-over-effects");

                mouseG.append("path") // this is the black vertical line to follow mouse
                    .attr("class", "mouse-line")
                    .style("stroke", "black")
                    .style("stroke-width", "1px")
                    .style("opacity", "0");

                var lines = document.getElementsByClassName('line');

                var mousePerLine = mouseG.selectAll('.mouse-per-line')
                    .data(cities)
                    .enter()
                    .append("g")
                    .attr("class", "mouse-per-line");

                mousePerLine.append("circle")
                    .attr("r", 7)
                    .style("stroke", function (d) {
                        return color(d.name);
                    })
                    .style("fill", "none")
                    .style("stroke-width", "1px")
                    .style("opacity", "0");

                mousePerLine.append("text")
                    .attr("transform", "translate(10,3)");

                mouseG.append('svg:rect') // append a rect to catch mouse movements on canvas
                    .attr('width', width) // can't catch mouse events on a g element
                    .attr('height', height)
                    .attr('fill', 'none')
                    .attr('pointer-events', 'all')
                    .on('mouseout', function () { // on mouse out hide line, circles and text
                        d3.select(".mouse-line")
                            .style("opacity", "0");
                        d3.selectAll(".mouse-per-line circle")
                            .style("opacity", "0");
                        d3.selectAll(".mouse-per-line text")
                            .style("opacity", "0");
                    })
                    .on('mouseover', function () { // on mouse in show line, circles and text
                        d3.select(".mouse-line")
                            .style("opacity", "1");
                        d3.selectAll(".mouse-per-line circle")
                            .style("opacity", "1");
                        d3.selectAll(".mouse-per-line text")
                            .style("opacity", "1");
                    })
                    .on('mousemove', function () { // mouse moving over canvas
                        var mouse = d3.mouse(this);
                        d3.select(".mouse-line")
                            .attr("d", function () {
                                var d = "M" + mouse[0] + "," + height;
                                d += " " + mouse[0] + "," + 0;
                                return d;
                            });

                        d3.selectAll(".mouse-per-line")
                            .attr("transform", function (d, i) {
                                console.log(width / mouse[0])
                                var xDate = x.invert(mouse[0]),
                                    bisect = d3.bisector(function (d) {
                                        return d.date;
                                    }).right;
                                idx = bisect(d.values, xDate);

                                var beginning = 0,
                                    end = lines[i].getTotalLength(),
                                    target = null;

                                while (true) {
                                    target = Math.floor((beginning + end) / 2);
                                    pos = lines[i].getPointAtLength(target);
                                    if ((target === end || target === beginning) && pos.x !== mouse[0]) {
                                        break;
                                    }
                                    if (pos.x > mouse[0]) end = target;
                                    else if (pos.x < mouse[0]) beginning = target;
                                    else break; //position found
                                }

                                d3.select(this).select('text')
                                    .text(y.invert(pos.y).toFixed(2));

                                return "translate(" + mouse[0] + "," + pos.y + ")";
                            });
                    });

                // d3.select(".settlement-list-" + d.Settlement_ID).style("background", "#8cc4d3");
                // global.currentEvent = "settlement";
                // myFilter({
                //     "key": d.Settlement,
                //     values: [{
                //         "Settlement_ID": d.Settlement_ID
                //     }]
                // }, global.currentEvent, undefined);
                // settlements.style("opacity", opacity);
                // d3.select(this.parentNode).style("opacity", 1);
                // global.selectedSettlement.map(function (a) {
                //     d3.select(".settlement-" + a.values[0].Settlement_ID).style("opacity", 1);
                // });
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

        subCounty = L.geoJson(ugandaSubCountiesGeoJson)
        cbounds = subCounty.getBounds();

        setTimeout(function () {
            zoom = map.getBoundsZoom(cbounds);
            map.setView({
                lat: 1.367,
                lng: 32.105
            });
            map.setZoom(zoom);
            setTimeout(function () {
                map.setView({
                    lat: 1.367,
                    lng: 32.105
                }, zoom + 0.8, {
                    pan: {
                        animate: true,
                        duration: 1.5
                    },
                    zoom: {
                        animate: true
                    }
                });
                map.fitBounds(cbounds);
                map.invalidateSize();
            }, 500);
        }, 100);

        function refreshMap() {
            $(".custom-list-header").siblings(".custom-list").addClass('collapsed');
            $("#socio-economic-list.custom-list").removeClass('collapsed');
            var header = d3.select("#subCountyHeader");
            filteredsubCountys = [];
            var str = "National Average";
            header.html(str);

            // buildList($('#district-subcounty-list').empty(), districtList);

            var subCountyListPanel = d3.select("#district-subcounty-list").selectAll("p span p span");

            subCountyListPanel.on('mouseover', function () {
                $(this).addClass('is-hover');
            }).on('mouseout', function () {
                $(this).removeClass('is-hover');
            })

            var districtListPanel = d3.select("#district-subcounty-list").select("p").selectAll(".District");


            districtListPanel.attr("class", "districtHeading");
            for (var i = 0; i < sliders.length; i++) {
                sliders[i].noUiSlider.reset();
            }
            // ugandaPath.style("fill", "e3784a");


            refreshCounts();
        }
        d3.select("#d3-map-refresh").on("click", refreshMap);


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


        for (var i = 0; i < sliders.length; i++) {
            var domain = [+Infinity, -Infinity];
            fieldName.push([sliders[i].__data__.key]);
            // for (var j = 0; j < dataset1.length; j++) {
            // 	var Household = +(dataset1[j]["HOUSEHOLDS"]);
            //     var filterValue;
            //     filterValue = +(dataset1[j][sliders[i].__data__.values[0].FieldNames])  / Household * 100 ;
            // }
            noUiSlider.create(sliders[i], {
                start: [0, 100],
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
            sliders[i].noUiSlider.on('slide', addValues);

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
                rangeMin = [+(rangeMin)];
                rangeMax = [+(rangeMax)];


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
                    // activeFilters.forEach(function (d) {
                    //     console.log(d);
                    // })

                    if (dataset1[i][activeFilters[j]]) {
                        for (var k = 0; k < activeFilters.length; k++) {
                            {
                                subCountyValue = +(dataset1[i][activeFilters[j]]);
                            }
                        }
                        if (subCountyValue < +((filterValues[j][0]).replace('%', '')) || subCountyValue > +((filterValues[j][1]).replace('%', ''))) {
                            filtered.push(dataset1[i].s_city_id);
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

            subCountyListPanel.on('mouseover', function () {
                $(this).addClass('is-hover');
            }).on('mouseout', function () {
                $(this).removeClass('is-hover');
            })

            var districtListPanel = d3.select("#district-subcounty-list").select("p").selectAll(".District");


            districtListPanel.attr("class", "districtHeading");

            // ugandaPath.style("fill", function (d) {
            //     for (var k = 0; k < filteredsubCountys.length; k++) {
            //         if (d.properties.Concat === filteredsubCountys[k]) {
            //             return "none";
            //         }
            //     }
            //     return "#e3784a";
            // });


            d3.select("#subCounty-count").text(dataset1.length - filteredsubCountys.length);

            settlements.style("opacity", function (d) {
                for (var k = 0; k < filteredsubCountys.length; k++) {
                    if (d.s_city_id === filteredsubCountys[k]) {
                        return 0;
                    }
                }
                return 1;
            })

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