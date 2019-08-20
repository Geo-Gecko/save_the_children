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
  function determineLayers(product1) {


    function SelectElement(id, valueToSelect) {
      var element = document.getElementById(id);
      element.value = valueToSelect;
    }


    var map = L.map('map', {
      zoomSnap: 0.25,
      attributionControl: false
    });
    var geoJsonFeatureCollection;
    if (L.Browser.mobile) {
      map.setView([1.291471, 32.482235], 7);
    } else {
      map.setView([1.291471, 34.482235], 7);
    }

    L.control.attribution({
      position: 'bottomleft'
    }).addTo(map)

    var southWest = new L.LatLng(-1.606559295542773, 28.026294838895254),
      northEast = new L.LatLng(4.301960929158914, 39.744435655056094),
      bounds = new L.LatLngBounds(southWest, northEast);

    map.fitBounds(bounds);

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

    //  L.esri.basemapLayer('DarkGray').addTo(map);
    // console.log(results)
    var filterList = d3.nest().key(function (d) {
      return d.Organisation_Name;
    }).sortKeys(d3.ascending).entries(product1);

    var ownerList = d3.nest().key(function (d) {
      return d['Type of Facility'];
    }).sortKeys(d3.ascending).entries(product1);

    var modalityList = d3.nest().key(function (d) {
      return d['Funding Modality'];
    }).sortKeys(d3.ascending).entries(product1);

    geoJsonFeatureCollection = {
      type: 'FeatureCollection',
      features: product1.map(function (datum) {
        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [parseFloat(datum.s_lon), parseFloat(datum.s_lat)]
          },
          properties: {

            "origin_city": datum,
            "Organisation_Name": datum.Organisation_Name,
            "s_city_id": parseFloat(datum.s_city_id),
            "School": datum.School,
            "e_city_id": parseFloat(datum.e_city_id),
            "Referral_Pathway": datum.Referral_Pathway,
            "Transition_Pathway": datum.Transition_Pathway,
            "s_lat": parseFloat(datum.s_lat),
            "s_lon": parseFloat(datum.s_lon),
            "e_lat": parseFloat(datum.e_lat),
            "e_lon": parseFloat(datum.e_lon)
          }
        }
      })
    };

    var oneToManyFlowmapLayer = L.canvasFlowmapLayer(geoJsonFeatureCollection, {
      originAndDestinationFieldIds: {
        originUniqueIdField: 's_city_id',
        originGeometry: {
          x: 's_lon',
          y: 's_lat'
        },
        destinationUniqueIdField: 'e_city_id',
        destinationGeometry: {
          x: 'e_lon',
          y: 'e_lat'
        }
      },
      pathDisplayMode: 'selection',
      animationStarted: true,
      animationEasingFamily: 'Cubic',
      animationEasingType: 'In',
      animationDuration: 2000
    }).addTo(map)
      .on('click', function (point) {
        //  $('#sidebar-content').text("The data is: " + point.propagatedFrom.feature.properties.School)
      });

    function resetMap() {

      var array = ['#e41a1c', '#377eb8', "#4daf4a", "#984ea3"];
      var arrayLabel = ["Primary School Only", "Accelerated Education Programme Centre", "Referral Pathways", "Transition Pathways"];

      addLegend(array, arrayLabel, "Legend", "circle");
      for (key in map['_layers']) {
        if (typeof map['_layers'][key]['feature'] !== 'undefined' && map['_layers'][key]['feature']['geometry']['type'] !== 'MultiPolygon') {
          var l = map['_layers'][key];
          if (l['feature']['properties']['isOrigin'] && l['feature']['properties']['origin_city']['Is_the_Support_for_Primary_School_or_AEP_centre_hosted_by_the_school?'] === 'Primary School') {
            l.setStyle({
              radius: 6,
              fillColor: "#e41a1c",
              color: "#000",
              weight: 1,
              opacity: 1,
              fillOpacity: 0.8
            })
          } else if (l['feature']['properties']['isOrigin'] && l['feature']['properties']['origin_city']['Is_the_Support_for_Primary_School_or_AEP_centre_hosted_by_the_school?'] === 'AEP centre') {
            l.setStyle({
              radius: 6,
              fillColor: "#377eb8",
              color: "#000",
              weight: 1,
              opacity: 1,
              fillOpacity: 0.8
            })
          } else if (!l['feature']['properties']['isOrigin'] && l['feature']['properties']['origin_city']['Pathway'] === 'Referral') {
            l.setStyle({
              radius: 6,
              fillColor: "#4daf4a",
              color: "#000",
              weight: 1,
              opacity: 1,
              fillOpacity: 0.8
            })
          } else if (!l['feature']['properties']['isOrigin'] && l['feature']['properties']['origin_city']['Pathway'] === 'Transition') {
            l.setStyle({
              radius: 6,
              fillColor: "#984ea3",
              color: "#000",
              weight: 1,
              opacity: 1,
              fillOpacity: 0.8
            })
          }
        }
      }

    }

    resetMap();

    var square = L.shapeMarker([51.505, -0.09], {
      shape: "square",
      radius: 20
    }).addTo(map);

    function iconsMap() {

      for (key in map['_layers']) {
        if (typeof map['_layers'][key]['feature'] !== 'undefined' && map['_layers'][key]['feature']['geometry']['type'] !== 'MultiPolygon') {
          var l = map['_layers'][key];
          if (l['feature']['properties']['isOrigin'] === false && l['feature']['properties']['origin_city']['Level of Pathway'] === 'Secondary' && l['feature']['properties']['origin_city']['Pathway'] === 'Transition') {
           
            l.options.shape = "square";
            l.options.radius = 20;
            // l.setStyle({
            //   radius: 20,
            //   fillColor: "#000",
            //   shape: 'square',
            //   color: "#000",
            //   weight: 1,
            //   opacity: 1,
            //   fillOpacity: 0.8
            // })
            console.log(l);
          }
        }
      }

    }

    iconsMap();

    console.log(square)

    // Updates the displayed map markers to reflect the crossfilter dimension passed in
    var updateMap = function (locs) {
      // clear the existing markers from the map
      //markersLayer.clearLayers();
      //clusterLayer.clearLayers();

      var minlat = 200,
        minlon = 200,
        maxlat = -200,
        maxlon = -200;

      locs.forEach(function (d, i) {

        if (d.latitude != null && d.latitude != undefined) {
          // add a Leaflet marker for the lat lng and insert the application's stated purpose in popup\
          //var mark = L.marker([d.latitude, d.longitude]);
          //markersLayer.addLayer(mark);
          //clusterLayer.addLayer(mark);

          // find corners
          if (minlat > d.latitude) minlat = d.latitude;
          if (minlon > d.longitude) minlon = d.longitude;
          if (maxlat < d.latitude) maxlat = d.latitude;
          if (maxlon < d.longitude) maxlon = d.longitude;
        }
      });

      c1 = L.latLng(minlat, minlon);
      c2 = L.latLng(maxlat, maxlon + 2);
      c3 = L.latLng(maxlat, maxlon);

      // fit bounds
      if (L.Browser.mobile) {
        map.fitBounds(L.latLngBounds(c1, c3));
      } else {
        map.fitBounds(L.latLngBounds(c1, c2));
      }

      // correct zoom to fit markers
      setTimeout(function () {
        map.setZoom(map.getZoom() - 0.25);
      }, 500);

    };

    // since this demo is using the optional "pathDisplayMode" as "selection",
    // it is up to the developer to wire up a click or mouseover listener
    // and then call the "selectFeaturesForPathDisplay()" method to inform the layer
    // which Bezier paths need to be drawn
    oneToManyFlowmapLayer.on('click', function (e) {
      resetMap();

      SelectElement("options", "None");
      $('#infoText').html('Information about selected point below.');
      //  console.log(e)
      if (e.sharedOriginFeatures.length) {
        $('#sidebar-content').html(
          "<table>" +
          "<tr><td>Nature of facility</td><td>" + e.layer.feature.properties.origin_city["Is_the_Support_for_Primary_School_or_AEP_centre_hosted_by_the_school?"] + "</td><tr>" +
          "<tr><td>Type of Facility</td><td>" + e.layer.feature.properties.origin_city["Type of Facility"] + "</td><tr>" +
          "<tr><td>Name of facility</td><td>" + e.layer.feature.properties.origin_city.School + "</td><tr>" +
          "<tr><td>ILETS Score</td><td>" + e.layer.feature.properties.origin_city.IELTS + "</td><tr>" +
          "<tr><td>Funding Modality</td><td>" + e.layer.feature.properties.origin_city["Funding Modality"] + "</td><tr>" +
          "<tr><td>Name of Referral Facility</td><td>" + e.sharedOriginFeatures[1].properties.origin_city["Name_of_pathway"] + "</td><tr>" +
          "<tr><td>Name of Transition Facility</td><td>" + e.sharedOriginFeatures[0].properties.origin_city["Name_of_pathway"] + "</td><tr>" +
          "<tr><td>Total Students</td><td>" + e.layer.feature.properties.origin_city["Total Students"] + "</td><tr>" +
          "<tr><td>Refugee Students</td><td>" + e.layer.feature.properties.origin_city["Refugee Students"] + "</td><tr>" +
          "<tr><td>Total Teachers</td><td>" + e.layer.feature.properties.origin_city["Total Teachers"] + "</td><tr>" +
          "<tr><td>Refugee Teachers</td><td>" + e.layer.feature.properties.origin_city["Refugee Teachers"] + "</td><tr>" +
          "<tr><td>Organisation</td><td>" + e.layer.feature.properties.origin_city["Organisation_Name"] + "</td><tr>" +
          "<tr><td>Number of Latrines</td><td>" + e.layer.feature.properties.origin_city["Number of Latrines"] + "</td><tr>" +
          "<tr><td>Data collection date</td><td>" + e.layer.feature.properties.origin_city["Date of Data Collection"] + "</table>")

        oneToManyFlowmapLayer.selectFeaturesForPathDisplay(e.sharedOriginFeatures, 'SELECTION_NEW');
        var locations = [];
        e.sharedOriginFeatures.forEach(function (d, i) {
          locations.push({
            latitude: d.properties.e_lat,
            longitude: d.properties.e_lon
          });
          locations.push({
            latitude: d.properties.s_lat,
            longitude: d.properties.s_lon
          });
        })
        updateMap(locations);
      }
      if (e.sharedDestinationFeatures.length) {
        var totalStudents = 0,
          totalRefugeeStudents = 0,
          totalTeachers = 0,
          totalRefugeeTeachers = 0;
        e.sharedDestinationFeatures.forEach(function (d, i) {
          totalStudents = totalStudents + parseInt(d.properties.origin_city["Total Students"]);
          totalRefugeeStudents = totalRefugeeStudents + parseInt(d.properties.origin_city["Refugee Students"]);
          totalTeachers = totalTeachers + parseInt(d.properties.origin_city["Total Teachers"]);
          totalRefugeeTeachers = totalRefugeeTeachers + parseInt(d.properties.origin_city["Refugee Teachers"]);
        })

        $('#sidebar-content').html(
          "<table>" +
          //  "Type of facility: " + e.layer.feature.properties.origin_city["Is_the_Support_for_Primary_School_or_AEP_centre_hosted_by_the_school?"] + "<br>" +
          "<tr><td>Name of facility</td><td>" + e.layer.feature.properties.origin_city.Name_of_pathway + "</td><tr>" +
          "<tr><td>Total Students</td><td>" + totalStudents + "</td><tr>" +
          "<tr><td>Refugee Students</td><td>" + totalRefugeeStudents + "</td><tr>" +
          "<tr><td>Total Teachers</td><td>" + totalTeachers + "</td><tr>" +
          "<tr><td>Refugee Teachers</td><td>" + totalRefugeeTeachers + "</td><tr>" +
          "<tr><td>Data collection date</td><td>" + e.layer.feature.properties.origin_city["Date of Data Collection"] + "</table>")

        oneToManyFlowmapLayer.selectFeaturesForPathDisplay(e.sharedDestinationFeatures, 'SELECTION_NEW');
        var locations = [];
        e.sharedDestinationFeatures.forEach(function (d, i) {
          locations.push({
            latitude: d.properties.e_lat,
            longitude: d.properties.e_lon
          });
          locations.push({
            latitude: d.properties.s_lat,
            longitude: d.properties.s_lon
          });
        })
        updateMap(locations);
      }
    });

    var layerPopup;
    oneToManyFlowmapLayer.on('mouseover', function (e) {
      var coordinates = e.layer.feature.geometry.coordinates;
      var swapped_coordinates = [coordinates[1], coordinates[0]];
      if (e.sharedOriginFeatures.length) {
        //schools
        if (map) {
          layerPopup = L.popup()
            .setLatLng(swapped_coordinates)
            .setContent("<table>" +
              "<tr><td>Nature of facility</td><td>" + e.layer.feature.properties.origin_city["Is_the_Support_for_Primary_School_or_AEP_centre_hosted_by_the_school?"] + "</td><tr>" +
              "<tr><td>Type of Facility</td><td>" + e.layer.feature.properties.origin_city["Type of Facility"] + "</td><tr>" +
              "<tr><td>Name of facility</td><td>" + e.layer.feature.properties.origin_city.School + "</td><tr>" +
              "<tr><td>ILETS Score</td><td>" + e.layer.feature.properties.origin_city.IELTS + "</td><tr>" +
              "<tr><td>Funding Modality</td><td>" + e.layer.feature.properties.origin_city["Funding Modality"] + "</td><tr>" + "</table>")
            .openOn(map);
        }
      }
      if (e.sharedDestinationFeatures.length) {
        //destinations
        if (map) {
          layerPopup = L.popup()
            .setLatLng(swapped_coordinates)
            .setContent("<table>" +
              "<tr><td>Name of facility</td><td>" + e.layer.feature.properties.origin_city.Name_of_pathway + "</td><tr>" +
              "<tr><td>Data collection date</td><td>" + e.layer.feature.properties.origin_city["Date of Data Collection"] + "</table>")
            .openOn(map);
        }
      }
    });

    oneToManyFlowmapLayer.on('mouseout', function (e) {
      if (layerPopup && map) {
        map.closePopup(layerPopup);
        layerPopup = null;
      }
    });


    $('#highlightOptions').change(function () {
      reset();

      function changeOptions(data) {
        var select = $('<select multiple name="options" id="options" style="width: 100%; height: 100px; overflow-y: auto; overflow-x: auto;"><option value="None">- None -</option></select>');
        $.each(data, function (index, value) {
          var option = $('<option></option>');
          option.attr('value', value.key);
          option.text(value.key);
          select.append(option);
        });
        $('#dropDownContainer').empty().append(select);

      }

      if ($(this).val() === "Donors") {
        changeOptions(filterList)
      } else if ($(this).val() === "Funding Modality") {
        changeOptions(modalityList)
      } else if ($(this).val() === "Ownership") {
        changeOptions(ownerList)
      }



      $('#options').change(function () {
        var highlightCount = 0;
        reset();
        $('#infoText').html('Click on a point to show additional information below.');
        var array = ["#f7f7f6", '#c3ff3e', '#7d7d7d'];
        var arrayLabel = ["", "Selected agency facilities", "Other agency facilities"];

        addLegend(array, arrayLabel, "Legend", "circle");
        if ($(this).val() === "None") {
          resetMap();
        } else {
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
              $.each($(this).val(), function (index, value) {
                if (l['feature']['properties']['origin_city']['Organisation_Name'] === value || l['feature']['properties']['origin_city']['Funding Modality'] === value || l['feature']['properties']['origin_city']['Type of Facility'] === value) {
                  highlightCount = highlightCount + 1;
                  l.setStyle({
                    radius: 6,
                    fillColor: "#c3ff3e",
                    color: "#000",
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8
                  })
                }
              });
            }
          }
        }
        $('#highlightedCount').html('<span class="count">' + comma(highlightCount) + '</span><span> highlighted </span>')
      });
    })





    //  var inputdata = 123 || 456 || 789;
    //  var split = input.split('||');
    var select = $('<select multiple name="options" id="options" style="width: 100%; height: 100px; overflow-y: auto; overflow-x: auto;"><option value="None">- None -</option></select>');
    $.each(filterList, function (index, value) {
      var option = $('<option></option>');
      option.attr('value', value.key);
      option.text(value.key);
      select.append(option);
    });
    $('#dropDownContainer').empty().append(select);

    $('#options').change(function () {
      var highlightCount = 0;
      reset();
      $('#infoText').html('Click on a point to show additional information below.');
      var array = ["#f7f7f6", '#c3ff3e', '#7d7d7d'];
      var arrayLabel = ["", "Selected agency facilities", "Other agency facilities"];

      addLegend(array, arrayLabel, "Legend", "circle");
      if ($(this).val() === "None") {
        resetMap();
      } else {
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
            $.each($(this).val(), function (index, value) {
              if (l['feature']['properties']['origin_city']['Organisation_Name'] === value || l['feature']['properties']['origin_city']['Funding Modality'] === value || l['feature']['properties']['origin_city']['Type of Facility'] === value) {
                highlightCount = highlightCount + 1;
                l.setStyle({
                  radius: 6,
                  fillColor: "#c3ff3e",
                  color: "#000",
                  weight: 1,
                  opacity: 1,
                  fillOpacity: 0.8
                })
              }
            });

          }
        }
      }

      $('#highlightedCount').html('<span class="count">' + comma(highlightCount) + '</span><span> highlighted </span>')

    });

    function reset() {
      resetMap();
      oneToManyFlowmapLayer.clearAllPathSelections();

      $('#sidebar-content').html("");

      map.fitBounds(bounds);
    }

    $('#reset').on('click', function () {
      reset();

      $('#infoText').html('Click on a point to show additional information below.');

      SelectElement("options", "None");
    })

    $('#mapLegendButton').on('click', function () {
      reset();
    })
    $('#priorityApproachesButton').on('click', function () {
      // reset();

      oneToManyFlowmapLayer.clearAllPathSelections();
      priorityApproaches();

      map.fitBounds(bounds);
    })

    function arrayRemove(arr, value) {

      return arr.filter(function (ele) {
        return ele != value;
      });

    }

    function priorityApproaches() {
      var arr = ["Can't wait to Learn", "Early Grade Reading", "TeamUp", "Double Shifting", "Improving Learning Environments in Emergencies", "Cash Transfers"]

      var toggledOn = $('input[type=checkbox]:checked');
      $.each(toggledOn, function (index, value) {
        if (value.parentNode.id === "button-1") {
          arr = arrayRemove(arr, "Can't wait to Learn")
        } else if (value.parentNode.id === "button-2") {
          arr = arrayRemove(arr, "Early Grade Reading")
        } else if (value.parentNode.id === "button-3") {
          arr = arrayRemove(arr, "TeamUp")
        } else if (value.parentNode.id === "button-4") {
          arr = arrayRemove(arr, "Double Shifting")
        } else if (value.parentNode.id === "button-5") {
          arr = arrayRemove(arr, "Improving Learning Environments in Emergencies")
        } else if (value.parentNode.id === "button-6") {
          arr = arrayRemove(arr, "Cash Transfers")
        }
      });

      var priorityCount = 0;

      for (key in map['_layers']) {
        if (typeof map['_layers'][key]['feature'] !== 'undefined' && map['_layers'][key]['feature']['geometry']['type'] !== 'MultiPolygon') {
          var l = map['_layers'][key];
          const found = l['feature']['properties']['origin_city']["Priority Approaches"].split(",").some(r => arr.includes(r))
          if (found) {
            priorityCount = priorityCount + 1;
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
      $('#priorityCount').html('<span class="count">' + comma(priorityCount) + '</span><span> highlighted </span>')
    }

    var toggles = d3.selectAll('.buttons.r').on('change', function (d) {
      priorityApproaches();
    });

    // var switches = d3.select('#button-switch').on('change', function (d) {
    //   console.log($(this));
    // });

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

    // Add point markers to the map
    var points = mapData.sheets(constants.pointsSheetName);
    var layers;
    var group = '';
    if (points && points.elements.length > 0) {
      layers = determineLayers(points.elements);
    } else {
      completePoints = true;
    }

    // centerAndZoomMap(group);


    // Change Map attribution to include author's info + urls
    changeAttribution();


  }

  /**
   * Changes map attribution (author, GitHub repo, email etc.) in bottom-right
   */
  function changeAttribution() {
    var attributionHTML = $('.leaflet-control-attribution')[0].innerHTML;
    var credit = '';
    var name = getSetting('_authorName');
    var url = getSetting('_authorURL');

    if (name && url) {
      if (url.indexOf('@') > 0) {
        url = 'mailto:' + url;
      }
      credit += ' by <a href="' + url + '">' + name + '</a> | ';
    } else if (name) {
      credit += ' by ' + name + ' | ';
    } else {
      credit += ' | ';
    }

    //		credit += 'View <a href="' + getSetting('_githubRepo') + '">code</a>';
    //		if (getSetting('_codeCredit')) credit += ' by ' + getSetting('_codeCredit');
    //		credit += ' with ';
    $('.leaflet-control-attribution')[0].innerHTML = credit + attributionHTML;
  }

  /**
   * Returns the value of a setting s
   * getSetting(s) is equivalent to documentSettings[constants.s]
   */
  function getSetting(s) {
    return documentSettings[constants[s]];
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