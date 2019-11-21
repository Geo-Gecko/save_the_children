$(window).on('load', function () {
  var documentSettings = {};
  var markerColors = [];

  var polygonSettings = [];
  var polygonSheets = 1;
  var polygonsLegend;

  var completePoints = false;
  var completePolygons = false;
  var completePolylines = false;

  /**
   * Returns an Awesome marker with specified parameters
   */
  function createMarkerIcon(icon, prefix, markerColor, iconColor) {
    return L.AwesomeMarkers.icon({
      icon: icon,
      prefix: prefix,
      markerColor: markerColor,
      iconColor: iconColor
    });
  }


  /**
   * Sets the map view so that all markers are visible, or
   * to specified (lat, lon) and zoom if all three are specified
   */
  function centerAndZoomMap(points) {
    var lat = map.getCenter().lat,
      latSet = false;
    var lon = map.getCenter().lng,
      lonSet = false;
    var zoom = 12,
      zoomSet = false;
    var center;

    if (getSetting('_initLat') !== '') {
      lat = getSetting('_initLat');
      latSet = true;
    }

    if (getSetting('_initLon') !== '') {
      lon = getSetting('_initLon');
      lonSet = true;
    }

    if (getSetting('_initZoom') !== '') {
      zoom = parseInt(getSetting('_initZoom'));
      zoomSet = true;
    }

    if ((latSet && lonSet) || !points) {
      center = L.latLng(lat, lon);
    } else {
      center = points.getBounds().getCenter();
    }

    if (!zoomSet && points) {
      zoom = map.getBoundsZoom(points.getBounds());
    }

    map.setView(center, zoom);
  }


  /**
   * Given a collection of points, determines the layers based on 'Group'
   * column in the spreadsheet.
   */
  function determineLayers(product2) {

    function eventFire(el, etype) {
      if (el.fireEvent) {
        el.fireEvent('on' + etype);
      } else {
        var evObj = document.createEvent('Events');
        evObj.initEvent(etype, true, false);
        el.dispatchEvent(evObj);
      }
    }

    function openPanel(PanelName) {
      var i;
      var x = document.getElementsByClassName("filterclass");
      for (i = 0; i < x.length; i++) {
        x[i].style.display = "none";
      }
      document.getElementById(PanelName).style.display = "block";
    }

    function numberWithCommas(x) {
      return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    function SelectElement(id, valueToSelect) {
      var element = document.getElementById(id);
      element.value = valueToSelect;
    }
    var map = L.map('map', {
      zoomSnap: 0.01
    });
    var geoJsonFeatureCollection;
    var forMax;
    if (L.Browser.mobile) {
      map.setView([1.291471, 32.482235], 7);
    } else {
      map.setView([1.291471, 34.482235], 7);
    }

    var southWest = new L.LatLng(-1.606559295542773, 28.026294838895254),
      northEast = new L.LatLng(4.301960929158914, 39.744435655056094),
      bounds = new L.LatLngBounds(southWest, northEast);

    map.fitBounds(bounds);

    //  map.on('moveend', function(d) {
    //    console.log(map.getBounds());
    //  })

    // loading GeoJSON file - UgandaNeighbouringCountries
    $.getJSON("../../assets/geojsons/UgandaNeighbours.geojson", function (data) {
      // L.geoJson function is used to parse geojson file and load on to map
      L.geoJson(data, {
        style: {
          fillColor: "#7d7d7d",
          color: "#000",
          weight: 1,
          opacity: 0.4,
          fillOpacity: 0.6
        }
      }).addTo(map);
    });

    var OpenStreetMap_Mapnik = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);


    Papa.parse('./csv-data/kpiList1.csv', {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: function (results) {
        forMax = results.data;
        filters(results);
      }
    });


    var summary = d3.nest().key(function (d) {
      return d.School;
    }).sortKeys(d3.ascending).entries(product2);

    var summary1 = product2.filter(function (k) {
      if (k.Year === "2019" && k.Term === "3") {
        return k; //return d.Actor_Type["UN"];
      }
    });

    d3.select("#school-count").text(numberWithCommas(summary1.length));

    var studentCount = d3.sum(summary1, function (d) {
      //  console.log(d);
      return parseInt(d["Number of Learners"])

    })
    d3.select("#student-count").text(numberWithCommas(studentCount));
    // d3.select("#household-count").text(global.householdCount.toLocaleString());

    //  should switch to this

    geoJsonFeatureCollection = {
      type: 'FeatureCollection',
      features: summary1.map(function (datum) {
        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [datum.s_lon, datum.s_lat]
          },
          properties: {
            "original_data": datum
          }
        }
      })
    };

    var geojsonMarkerOptions = {
      radius: 6,
      fillColor: "#c3ff3e",
      color: "#000",
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8
    };
    L.geoJson(geoJsonFeatureCollection, {
        onEachFeature: function (feature, layer) {
          var layerPopup;
          layer.on('mouseover', function (e) {
            var coordinates = e.target.feature.geometry.coordinates;
            var swapped_coordinates = [coordinates[1], coordinates[0]];
              if (map) {
                layerPopup = L.popup()
                  .setLatLng(swapped_coordinates)
                  .setContent("<table>" +
                    "<tr><td>Type of facility</td><td>" + e.target.feature.properties.original_data["Is_the_Support_for_Primary_School_or_AEP_centre_hosted_by_the_school?"] + "</td><tr>" +
                    "<tr><td>Name of facility</td><td>" + e.target.feature.properties.original_data.School + "</td><tr>" +"</table>")
                  .openOn(map);
              }
          });

          layer.on('mouseout', function (e) {
            if (layerPopup && map) {
              map.closePopup(layerPopup);
              layerPopup = null;
            }
          });
        },
        pointToLayer: function (feature, latlng) {
          return L.circleMarker(latlng, geojsonMarkerOptions);
        }
      }).addTo(map)
      .on('click', function (d) {
        
        console.log(d);

        for (key in map['_layers']) {
          if (typeof map['_layers'][key]['feature'] !== 'undefined' && map['_layers'][key]['feature']['geometry']['type'] !== 'MultiPolygon') {
            var l = map['_layers'][key];
            if (l['feature']['properties']['original_data']["School"] === d.layer.feature.properties.original_data.School) {
              l.setStyle({
                radius: 6,
                fillColor: "#c3ff3e",
                color: "#000",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
              })
            } else {
              l.setStyle({
                radius: 6,
                fillColor: "#7d7d7d",
                color: "#000",
                weight: 1,
                opacity: 0.4,
                fillOpacity: 0.4
              })
            }
          }
        }

        SelectElement("options", "Number of Teachers");

        eventFire(document.getElementById('statsButton'), 'click');


        $('#sidebar-content').html(
          "<table>" +
          "<tr><td>Type of facility</td><td style='padding-left: 10%;'>" + d.layer.feature.properties.original_data["Is_the_Support_for_Primary_School_or_AEP_centre_hosted_by_the_school?"] + "</td><tr>" +
          "<tr><td>Name of facility</td><td style='padding-left: 10%;'>" + d.layer.feature.properties.original_data.School + "</td><tr>" +
          //  "<tr><td>Name of Referral Facility</td><td>" + e.sharedOriginFeatures[1].properties.original_data["Name_of_pathway"] + "</td><tr>" +
          //  "<tr><td>Name of Transition Facility</td><td>" + e.sharedOriginFeatures[0].properties.original_data["Name_of_pathway"] + "</td><tr>" +
          "<tr><td>Current No. of Male Learners</td><td style='padding-left: 10%;'>" + d.layer.feature.properties.original_data["Number of Male Learners"] + "</td><tr>" +
          "<tr><td>Current No. of Female Learners</td><td style='padding-left: 10%;'>" + d.layer.feature.properties.original_data["Number of Female Learners"] + "</td><tr>" +
          "<tr><td>Current No. of Male Teachers</td><td style='padding-left: 10%;'>" + d.layer.feature.properties.original_data["Number of Male Learners"] + "</td><tr>" +
          "<tr><td>Current No. of Female Teachers</td><td style='padding-left: 10%;'>" + d.layer.feature.properties.original_data["Number of Female Teachers"] + "</td><tr>" +
          "<tr><td>Average Male Attendence</td><td style='padding-left: 10%;'>" + parseFloat(d.layer.feature.properties.original_data["Average Male Attendence"]).toFixed(2) + "%</td><tr>" +
          "<tr><td>Average Female Attendence</td><td style='padding-left: 10%;'>" + parseFloat(d.layer.feature.properties.original_data["Average Female Attendence"]).toFixed(2) + "%</td><tr>" +
          "<tr><td>Partner Organisation</td><td style='padding-left: 10%;'>" + d.layer.feature.properties.original_data["Partner Organisation"] + "</td><tr>" + "</table>")

        // d3.select("#my_dataviz").remove();
        $('#my_dataviz').empty()

        var chartData = product2.filter(function (k) {
          if (k.School === d.layer.feature.properties.original_data.School) {
            return k; //return d.Actor_Type["UN"];
          }
        }).sort(function (x, y) {
          return d3.ascending(x.Term, y.Term);
        });

        // set the dimensions and margins of the graph
        var margin = {
            top: 10,
            right: 100,
            bottom: 30,
            left: 50
          },
          width = 460 - margin.left - margin.right,
          height = 350 - margin.top - margin.bottom;

        // append the svg object to the body of the page
        var svg = d3.select("#my_dataviz")
          .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
          .append("g")
          .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

        // A color scale: one color for each group
        var myColor = d3.scaleOrdinal()
          .domain(chartData)
          .range(d3.schemeSet2);

        // Add X axis --> it is a date format
        var x = d3.scaleLinear()
          .domain([0, 4])
          .range([0, width]);
        svg.append("g")
          .attr("id", "xAxis")
          .attr("transform", "translate(0," + height + ")")
          .call(d3.axisBottom(x).ticks(3));

        // Add Y axis
        var y = d3.scaleLinear()
          .domain([0, 1500])
          .range([height, 0]);
        svg.append("g")
          .attr("id", "yAxis")
          .call(d3.axisLeft(y));

        var yAxis = d3.select("#yAxis").selectAll("g:nth-child(odd)").remove();

        var xAxis = d3.select("#xAxis").selectAll("g");

        xAxis._groups[0][0].remove();

        xAxis._groups[0][4].remove();

        //  yAxis.remove();

        // Initialize line with group a
        var line = svg
          .append('g')
          .append("path")
          .datum(chartData)
          .attr("d", d3.line()
            .x(function (d) {
              //  console.log(d);
              return x(+d.Term)
            })
            .y(function (d) {
              // console.log(d);
              return y(+d["Number of Teachers"])
            })
          )
          .attr("stroke", function (d) {
            return myColor("valueA")
          })
          .style("stroke-width", 4)
          .style("fill", "none")

        // A function that update the chart
        function update(selectedGroup) {
          var max = forMax.filter(function (k) {
            if (k.Name === selectedGroup) {
              return k.Max;
            }
          });

          // Create new data with the selection?
          var dataFilter = chartData.map(function (d) {
            return {
              Term: d.Term,
              value: d[selectedGroup]
            }
          })

          //New Y axis
          var yAxis = d3.select("#yAxis").remove();

          var y = d3.scaleLinear()
            .domain([0, max[0].Max])
            .range([height, 0]);
          svg.append("g")
            .attr("id", "yAxis")
            .call(d3.axisLeft(y));

          var yAxis = d3.select("#yAxis").selectAll("g:nth-child(odd)").remove();

          // Give these new data to update line
          line
            .datum(dataFilter)
            .transition()
            .duration(1000)
            .attr("d", d3.line()
              .x(function (d) {
                return x(+d.Term)
              })
              .y(function (d) {
                return y(+d.value)
              })
            )
            .attr("stroke", function (d) {
              return myColor(selectedGroup)
            })
        }

        $('#options').change(function (d) {
          // recover the option that has been chosen
          var selectedOption = d3.select(this).property("value")
          // run the updateChart function with this selected option
          update(selectedOption)
        })

      })


    function filters(filterList) {

      var schoolLevel = filterList.data.filter(function (d) {
        if (d.Type === "School-Level") {
          return d;
        }
      });

      var educationCannotWait = filterList.data.filter(function (d) {
        if (d.Type === "Education Cannot Wait") {
          return d;
        }
      });

      var echoInclude = filterList.data.filter(function (d) {
        if (d.Type === "ECHO INCLUDE") {
          return d;
        }
      });

      if (schoolLevel) {
        var _dataList = d3.select("#school-level-list").selectAll("p")
          .data(schoolLevel);
        _dataList.enter().append("p")
          .html(function (d) {
            return "<div style='padding-left: 10%;'><span>" + d["Name"] + "</span></div>";
          })
        _dataList.exit().remove();
      }

      if (educationCannotWait) {
        var _dataList = d3.select("#education-cannot-wait-list").selectAll("p")
          .data(educationCannotWait);
        _dataList.enter().append("p")
          .html(function (d) {
            return "<div style='padding-left: 10%;'><span>" + d["Name"] + "</span></div>";
          })
        _dataList.exit().remove();
      }

      if (echoInclude) {
        var _dataList = d3.select("#echo-include-list").selectAll("p")
          .data(echoInclude);
        _dataList.enter().append("p")
          .html(function (d) {
            return "<div style='padding-left: 10%;'><span>" + d["Name"] + "</span></div>";
          })
        _dataList.exit().remove();
      }

      d3.select("#school-level-list").selectAll("p").append("div").attr("class", "sliders");
      d3.select("#education-cannot-wait-list").selectAll("p").append("div").attr("class", "sliders");
      d3.select("#echo-include-list").selectAll("p").append("div").attr("class", "sliders");

      d3.select("#sliderContainer").selectAll("p").append("hr");

      var sliders = document.getElementsByClassName('sliders');
      var fieldName = [];

      for (var i = 0; i < sliders.length; i++) {
        var domain = [+Infinity, -Infinity];
        fieldName.push([filterList.data[i].Name]);
        noUiSlider.create(sliders[i], {
          start: [parseFloat(filterList.data[i].Min), parseFloat(filterList.data[i].Max)],
          behaviour: "drag",
          step: 5,
          margin: 5,
          connect: true,
          orientation: "horizontal",
          range: {
            'min': parseFloat(filterList.data[i].Min),
            'max': parseFloat(filterList.data[i].Max)
          },
          tooltips: true,
          format: {
            to: function (value) {
              return value.toFixed(0);
            },
            from: function (value) {
              return value.replace('%', '');
            }
          }
        });

        var toBeFiltered = [];
        sliders[i].noUiSlider.on('slide', addValues);

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

          var activeFilters = [];

          var filterValues = [];

          for (var i = 0; i < sliderData[0].length; i++) {
            activeFilters.push(sliderData[0][i][0]);
            filterValues.push(sliderData[1][i]);
          }

          var activeSliders = [activeFilters].concat([filterValues]);

          var dataset = geoJsonFeatureCollection.features;

          for (var i = 0; i < activeFilters.length; i++) {
            // console.log(dataset.properties.original_data[activeFilters[i]]);
            // console.log(activeSliders[1][i][0]);
            if (i === 0) {
              toBeFiltered = dataset.filter(dataset => parseFloat(dataset.properties.original_data[activeFilters[i]]) > activeSliders[1][i][0] && parseFloat(dataset.properties.original_data[activeFilters[i]]) < activeSliders[1][i][1])
            } else {
              toBeFiltered = toBeFiltered.filter(toBeFiltered => parseFloat(toBeFiltered.properties.original_data[activeFilters[i]]) > activeSliders[1][i][0] && parseFloat(toBeFiltered.properties.original_data[activeFilters[i]]) < activeSliders[1][i][1])
            }
          }

          d3.select("#school-count").text(numberWithCommas(toBeFiltered.length));

          var studentCount = d3.sum(toBeFiltered, function (d) {
            return parseInt(d.properties.original_data["Number of Learners"])

          })
          d3.select("#student-count").text(numberWithCommas(studentCount));

          if (activeFilters.length === 0) {
            resetMap();
          }

          for (key in map['_layers']) {
            if (typeof map['_layers'][key]['feature'] !== 'undefined' && map['_layers'][key]['feature']['geometry']['type'] !== 'MultiPolygon') {
              var l = map['_layers'][key];
              l.setStyle({
                radius: 6,
                fillColor: "#7d7d7d",
                color: "#000",
                weight: 1,
                opacity: 0.4,
                fillOpacity: 0.4
              })
            }
          }

          for (key in map['_layers']) {
            if (typeof map['_layers'][key]['feature'] !== 'undefined' && map['_layers'][key]['feature']['geometry']['type'] !== 'MultiPolygon') {
              var l = map['_layers'][key];
              $.each(toBeFiltered, function (index, value) {
                // console.log(value)
                if (l['feature']['properties']['original_data']["School"] === value.properties.original_data.School) {
                  l.setStyle({
                    radius: 6,
                    fillColor: "#c3ff3e",
                    color: "#000",
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8
                  })
                }
              })
            }
          }
        }
      }

      var select = $('<select name="options" id="options" style="max-width: 400px;"></select>');

      var title = $('<option class="groupTitle" disabled selected value=""><span  style="font-size: larger; text-decoration: underline;">School-Level</span></option>');
      select.append(title);
      $.each(schoolLevel, function (index, value) {
        var option = $('<option></option>');
        option.attr('value', value.Name);
        option.text(value.Name);
        select.append(option);

      });
      var title = $('<option class="groupTitle" disabled selected value=""><span  style="font-size: larger; text-decoration: underline;">Education Cannot Wait</span></option>');
      select.append(title);
      $.each(educationCannotWait, function (index, value) {
        var option = $('<option></option>');
        option.attr('value', value.Name);
        option.text(value.Name);
        select.append(option);

      });
      var title = $('<option class="groupTitle" disabled selected value=""><span  style="font-size: larger; text-decoration: underline;">ECHO INCLUDE</span></option>');
      select.append(title);
      $.each(echoInclude, function (index, value) {
        var option = $('<option></option>');
        option.attr('value', value.Name);
        option.text(value.Name);
        select.append(option);

      });
      $('#kpiDropDownContainer').empty().append(select);


      SelectElement("options", "Number of Teachers");

      $('#resetSliders').click(function (d) {
        $.each(sliders, function (index, value) {
          value.noUiSlider.reset();
        })
        resetMap();
      })

      $('#filterButton').click(function (d) {
        $.each(sliders, function (index, value) {
          // console.log(value)
          value.noUiSlider.reset();
        })
        resetMap();
      })

      function resetMap() {

        d3.select("#school-count").text(numberWithCommas(geoJsonFeatureCollection.features.length));

        var studentCount = d3.sum(geoJsonFeatureCollection.features, function (d) {
          return parseFloat(d.properties.original_data["Number of Learners"])

        })
        d3.select("#student-count").text(numberWithCommas(studentCount));

        for (key in map['_layers']) {
          if (typeof map['_layers'][key]['feature'] !== 'undefined' && map['_layers'][key]['feature']['geometry']['type'] !== 'MultiPolygon') {
            var l = map['_layers'][key];
            l.setStyle({
              radius: 6,
              fillColor: "#c3ff3e",
              color: "#000",
              weight: 1,
              opacity: 1,
              fillOpacity: 0.8
            })
          }
        }

      }

    };

    $('#map').css('visibility', 'visible');
    $('.loader').hide();
    $("#controlPanel").show();

  }



  /**
   * Here all data processing from the spreadsheet happens
   */
  function onMapDataLoad() {
    var options = mapData.sheets(constants.optionsSheetName).elements;
    createDocumentSettings(options);

    document.title = getSetting('_mapTitle');
    addBaseMap();

    // Add point markers to the map
    var points = mapData.sheets(constants.pointsSheetName);
    var layers;
    var group = '';
    if (points && points.elements.length > 0) {
      layers = determineLayers(points.elements);
    } else {
      completePoints = true;
    }

  }

  /**
   * Loads the basemap and adds it to the map
   */
  function addBaseMap() {
    var basemap = trySetting('_tileProvider', 'CartoDB.Positron');
    // L.tileLayer.provider(basemap, {
    //   maxZoom: 18
    // }).addTo(map);
    // L.control.attribution({
    //   position: trySetting('_mapAttribution', 'bottomright')
    // }).addTo(map);
  }

  /**
   * Returns the value of a setting s
   * getSetting(s) is equivalent to documentSettings[constants.s]
   */
  function getSetting(s) {
    return documentSettings[constants[s]];
  }

  /**
   * Returns the value of setting named s from constants.js
   * or def if setting is either not set or does not exist
   * Both arguments are strings
   * e.g. trySetting('_authorName', 'No Author')
   */
  function trySetting(s, def) {
    s = getSetting(s);
    if (!s || s.trim() === '') {
      return def;
    }
    return s;
  }

  function tryPolygonSetting(p, s, def) {
    s = getPolygonSetting(p, s);
    if (!s || s.trim() === '') {
      return def;
    }
    return s;
  }

  /**
   * Triggers the load of the spreadsheet and map creation
   */
  var mapData;

  $.ajax({
    url: 'csv/Options.csv',
    type: 'HEAD',
    error: function () {
      // Options.csv does not exist, so use Tabletop to fetch data from
      // the Google sheet
      mapData = Tabletop.init({
        key: googleDocURL,
        callback: function (data, mapData) {
          onMapDataLoad();
        }
      });
    },
    success: function () {
      // Get all data from .csv files
      mapData = Procsv;
      mapData.load({
        self: mapData,
        tabs: ['Options', 'Points', 'Polygons', 'Polylines'],
        callback: onMapDataLoad
      });
    }
  });

  /**
   * Reformulates documentSettings as a dictionary, e.g.
   * {"webpageTitle": "Leaflet Boilerplate", "infoPopupText": "Stuff"}
   */
  function createDocumentSettings(settings) {
    for (var i in settings) {
      var setting = settings[i];
      documentSettings[setting.Setting] = setting.Customize;
    }
  }

  // Returns a string that contains digits of val split by comma evey 3 positions
  // Example: 12345678 -> "12,345,678"
  function comma(val) {
    while (/(\d+)(\d{3})/.test(val.toString())) {
      val = val.toString().replace(/(\d+)(\d{3})/, '$1' + ',' + '$2');
    }
    return val;
  }

});