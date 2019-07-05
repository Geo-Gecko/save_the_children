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
      .html(function(d) {
        return "<div style='padding-left: 10%;'><span>" + d["Short Name"] + "</span></div>";
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
  
  d3.select("#sliderContainer").selectAll("p").append("hr");

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

      var active = d3.selectAll(".no")


      for (var i = 0; i < sliderData[0].length; i++) {
        if (sliderData[1][i][0] !== "0" || sliderData[1][i][1] !== "100") {
          activeFilters.push(sliderData[0][i][0]);
          filterValues.push(sliderData[1][i]);
        }
      }

      var activeSliders = [activeFilters].concat([filterValues]);


      var dataset = geoJsonFeatureCollection.features;

      for (var i = 0; i < activeFilters.length; i++) {
        if (i === 0) {
          toBeFiltered = dataset.filter(dataset => dataset.properties.original_data[activeFilters[i]] > activeSliders[1][i][0] && dataset.properties.original_data[activeFilters[i]] < activeSliders[1][i][1])
        } else {
          toBeFiltered = toBeFiltered.filter(toBeFiltered => toBeFiltered.properties.original_data[activeFilters[i]] > activeSliders[1][i][0] && toBeFiltered.properties.original_data[activeFilters[i]] < activeSliders[1][i][1])
        }
      }

      if(activeFilters.length === 0 ) {
        resetMap();
      }

      for (key in map['_layers']) {
        if (typeof map['_layers'][key]['feature'] !== 'undefined') {
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
        if (typeof map['_layers'][key]['feature'] !== 'undefined') {
          var l = map['_layers'][key];
          $.each(toBeFiltered, function(index, value) {
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
  $.each(filterList.data, function(index, value) {
    var option = $('<option></option>');
    option.attr('value', value.Name);
    option.text(value.Name);
    select.append(option);

  });
  $('#kpiDropDownContainer').empty().append(select);

  $('#resetSliders').click(function(d) {
    $.each(sliders, function(index, value) {
      // console.log(value)
      value.noUiSlider.reset();
    })
    resetMap();
  })

  $('#filterButton').click(function(d) {
    $.each(sliders, function(index, value) {
      // console.log(value)
      value.noUiSlider.reset();
    })
    resetMap();
  })

  function resetMap() {
    for (key in map['_layers']) {
      if (typeof map['_layers'][key]['feature'] !== 'undefined') {
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