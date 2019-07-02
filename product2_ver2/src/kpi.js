// function addValues(slider) {

//   console.log(slider);
//   var allValues = [];
//   var range, rangeMin, rangeMax;
//   var realRange = [];

//   allValues.push([slider[i].noUiSlider.get()]);
//   range = slider[i].noUiSlider.get();
//   rangeMin = range.slice(0, 1);
//   rangeMax = range.slice(1);

//   realRange.push(rangeMin.concat(rangeMax));
//   rangeMin = [+(rangeMin)];
//   rangeMax = [+(rangeMax)];

//   var sliderData = [whichSlider].concat([realRange]);

// }

function filters(filterList) {

  if (filterList.data) {
    var _dataList = d3.select("#sliderContainer").selectAll("p")
      .data(filterList.data);
    _dataList.enter().append("p")
      .text(function(d) {
        return d.Name;
      })
    // _dataList
    //     .attr("class", function (d) {
    //         return "kpi-list-" + d.Name;
    //     })
    //     .text(function (d) {
    //         return d.key;
    //     });
    _dataList.exit().remove();
  }

  d3.select("#sliderContainer").selectAll("p").append("div").attr("class", "sliders");

  var sliders = document.getElementsByClassName('sliders');
  var fieldName = [];

  for (var i = 0; i < sliders.length; i++) {
    var domain = [+Infinity, -Infinity];
    fieldName.push([filterList.data[i].Name]);
    noUiSlider.create(sliders[i], {
      start: [parseFloat(filterList.data[i].Min), parseFloat(filterList.data[i].Max)],
      behaviour: "drag",
      margin: 5,
      connect: true,
      orientation: "horizontal",
      range: {
        'min': parseFloat(filterList.data[i].Min),
        'max': parseFloat(filterList.data[i].Max)
      },
      tooltips: true,
      format: {
        to: function(value) {
          return value.toFixed(0);
        },
        from: function(value) {
          return value.replace('%', '');
        }
      }
    });

    var activeFilters = [];
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

      var filtered = [];

      for (var i = 0; i < sliderData[0].length; i++) {
        if (sliderData[1][i][0] !== "0" || sliderData[1][i][1] !== "100") {
          activeFilters.push(sliderData[0][i][0]);
          filterValues.push(sliderData[1][i]);
        }
      }

      var activeSliders = [activeFilters].concat([filterValues]);

      // console.log(activeSliders);

      for (key in map['_layers']) {
        if (typeof map['_layers'][key]['feature'] !== 'undefined') {
          var l = map['_layers'][key];
          for (var i = 0; i < activeFilters.length; i++) {
            // console.log(l['feature']['properties']['original_data'][sliderData[0][i]] > sliderData[1][i][0]);
            if (l['feature']['properties']['original_data'][activeFilters[i]] > activeSliders[1][i][0] && l['feature']['properties']['original_data'][activeFilters[i]] < activeSliders[1][i][1]) {
              filtered.push(l['feature']['properties']['original_data'].School)
            }
          }
        }
      }

      var filteredOut = filtered.filter(function(item, pos) {
        return filtered.indexOf(item) === pos;
      });

      // console.log(geoJsonFeatureCollection)

      // geoJsonFeatureCollection.eachLayer(function(layer) {
      //   // console.log(layer)

      // })

				// for (var k = 0; k < filteredsubCountys.length; k++) {
				// 	if (d.properties.Concat === filteredsubCountys[k]) {
				// 		return "none";
				// 	}
				// }
				// return "#e3784a";


      // for (key in map['_layers']) {
      //   if (typeof map['_layers'][key]['feature'] !== 'undefined') {
      //     var l = map['_layers'][key];
      //     l.setStyle({
      //       radius: 6,
      //       fillColor: "#7d7d7d",
      //       color: "#000",
      //       weight: 1,
      //       opacity: 0.4,
      //       fillOpacity: 0.4
      //     })
      //   }
      // }

      // for (key in map['_layers']) {
      //   if (typeof map['_layers'][key]['feature'] !== 'undefined') {
      //     var l = map['_layers'][key];
      //     $.each(filteredOut, function(index, value) {
      //       if (l['feature']['properties']['original_data']["School"] === value) {
      //         l.setStyle({
      //           radius: 6,
      //           fillColor: "#c3ff3e",
      //           color: "#000",
      //           weight: 1,
      //           opacity: 1,
      //           fillOpacity: 0.8
      //         })
      //       }
      //     })
      //   }
      // }

    }

  }

  var select = $('<select name="options" id="options" style="max-width: 300px;"></select>');
  $.each(filterList.data, function(index, value) {
    var option = $('<option></option>');
    option.attr('value', value.Name);
    option.text(value.Name);
    select.append(option);

  });
  $('#kpiDropDownContainer').empty().append(select);

  // $('#options').change(function() {
  //   var whichSlider = $(this).val();

  //   var select = $('<div name="options" id="sliders"></div>');
  //   $.each(filterList.data, function(index, value) {
  //     var number = $('<p></p>');
  //     number.attr('class', "slider" + index);
  //     select.append(number);

  //     // if (whichSlider === value.Name) {

  //     //   noUiSlider.create(handlesSlider, {
  //     //     start: [parseFloat(value.Min), parseFloat(value.Max)],
  //     //     behaviour: "drag",
  //     //     margin: 5,
  //     //     connect: true,
  //     //     orientation: "horizontal",
  //     //     range: {
  //     //       'min': parseFloat(value.Min),
  //     //       'max': parseFloat(value.Max)
  //     //     },
  //     //     tooltips: true,
  //     //     // format: {
  //     //     //   to: function(value) {
  //     //     //     // console.log(value);
  //     //     //     return value.toFixed(0);
  //     //     //   },
  //     //     //   from: function(value) {
  //     //     //     return value.replace('%', '');
  //     //     //   }
  //     //     // }
  //     //   });

  //     // }
  //   });

  //   $('#sliders').empty().append(select);
  //   if ($(this).val() === "None") {
  //     resetMap();
  //   } else {
  //     var activeFilters = [];
  //     handlesSlider.noUiSlider.on('slide', addValues);
  //   }
  // })

  //  // When the button is changed, run the updateChart function
  //  d3.select("#options").on("change", function(d) {
  //   // recover the option that has been chosen
  //   var selectedOption = d3.select(this).property("value")
  //   console.log(selectedOption)
  //   // run the updateChart function with this selected option
  //   update(selectedOption)
  // })

};