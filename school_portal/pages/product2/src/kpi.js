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

  var schoolLevel = filterList.data.filter(function(d) {
    if (d.Type === "School-Level") {
      return d;
    }
  });

  var educationCannotWait = filterList.data.filter(function(d) {
    if (d.Type === "Education Cannot Wait") {
      return d;
    }
  });

  var echoInclude = filterList.data.filter(function(d) {
    if (d.Type === "ECHO INCLUDE") {
      return d;
    }
  });

  if (schoolLevel) {
    var _dataList = d3.select("#school-level-list").selectAll("p")
      .data(schoolLevel);
    _dataList.enter().append("p")
      .html(function(d) {
        return "<div style='padding-left: 10%;'><span>" + d["Name"] + "</span></div>";
      })
    _dataList.exit().remove();
  }

  if (educationCannotWait) {
    var _dataList = d3.select("#education-cannot-wait-list").selectAll("p")
      .data(educationCannotWait);
    _dataList.enter().append("p")
      .html(function(d) {
        return "<div style='padding-left: 10%;'><span>" + d["Name"] + "</span></div>";
      })
    _dataList.exit().remove();
  }

  if (echoInclude) {
    var _dataList = d3.select("#echo-include-list").selectAll("p")
      .data(echoInclude);
    _dataList.enter().append("p")
      .html(function(d) {
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

      d3.select("#school-count").text(toBeFiltered.length);

      var studentCount = d3.sum(toBeFiltered, function(d) {
        return parseInt(d.properties.original_data["Number of Students"])

      })
      d3.select("#student-count").text(studentCount);

      if (activeFilters.length === 0) {
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
  
  var title = $('<option class="groupTitle" disabled selected value=""><span  style="font-size: larger; text-decoration: underline;">School-Level</span></option>');
  select.append(title);
  $.each(schoolLevel, function(index, value) {
    var option = $('<option></option>');
    option.attr('value', value.Name);
    option.text(value.Name);
    select.append(option);

  });
  var title = $('<option class="groupTitle" disabled selected value=""><span  style="font-size: larger; text-decoration: underline;">Education Cannot Wait</span></option>');
  select.append(title);
  $.each(educationCannotWait, function(index, value) {
    var option = $('<option></option>');
    option.attr('value', value.Name);
    option.text(value.Name);
    select.append(option);

  });
  var title = $('<option class="groupTitle" disabled selected value=""><span  style="font-size: larger; text-decoration: underline;">ECHO INCLUDE</span></option>');
  select.append(title);
  $.each(echoInclude, function(index, value) {
    var option = $('<option></option>');
    option.attr('value', value.Name);
    option.text(value.Name);
    select.append(option);

  });
  $('#kpiDropDownContainer').empty().append(select);

  
  SelectElement("options", "Number of Teachers");

  $('#resetSliders').click(function(d) {
    $.each(sliders, function(index, value) {
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

    d3.select("#school-count").text(geoJsonFeatureCollection.features.length);

    var studentCount = d3.sum(geoJsonFeatureCollection.features, function(d) {
      return parseInt(d.properties.original_data["Number of Students"])

    })
    d3.select("#student-count").text(studentCount);

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