$(document).ready(function() {
    $('.chart-canvas').hide();

    $('.deleteSearch').on('click', deleteUser);

    $('#hourChart').hide();

    $('#daily-button').on('click', function() {
        if($('#dailyButtonLabel').hasClass('btn-success')) {
            return;
        }

        $('#dailyButtonLabel').attr('class', 'btn btn-success');
        $('#hourlyButtonLabel').attr('class', 'btn btn-default');
        $('#dayChart').show();
        $('#hourChart').hide();
    });

    $('#hourly-button').on('click', function() {
        if($('#hourlyButtonLabel').hasClass('btn-success')) {
            return;
        }

        $('#hourlyButtonLabel').attr('class', 'btn btn-success');
        $('#dailyButtonLabel').attr('class', 'btn btn-default');
        $('#hourChart').show();
        $('#dayChart').hide();
    });

    $("#addressForm").submit((e) => {
        e.preventDefault();

        //clearing all errors from the screen
        clearErrors();

        //show loading symbol for a pending request
        showLoading('address');

        var address = $("#addressInput").val();
        var city    = $("#cityInput").val();
        var country = $("#countryInput").val();

        $.post( "/address/search", { address, city, country }).done(function( data ) {
            //initialize google map with new coordinates
            initialize(data.form_parameters.lat, data.form_parameters.lon);

            //restore default values of charts and buttons
            restoreValues();

            //remove all loading animations
            hideLoadings();

            //Updating and showing data of the well (grey box) with weather report for right now
            var weatherObject = data.weather_obj;
            updateWellValues(
                weatherObject.temperature,
                weatherObject.clouds,
                weatherObject.humidity_percent,
                data.weather_obj.wind
            );

            //removing and re-adding the canvases to avoid styling bugs when re-rendering a new weather report
            resetCanvas();

            //getting the canvas element
            loadChart(data);
        }).fail((xhr) => {
            //remove all loading animations
            hideLoadings();

            var errors = xhr.responseJSON.errors;
            if(Array.isArray(errors)) {
                for(var e = 0; e < errors.length; e++) {
                    $("#addressErrors").append(`<li>${errors[e].msg}</li>`);
                }
            } else {
                $("#addressErrors").append(`<li>${errors}</li>`);
            }
        });
    });

    $("#coordinateForm").submit((e) => {
        e.preventDefault();

        //clearing all errors from the screen
        clearErrors();

        //show loading symbol for a pending request
        showLoading('coordinate');

        var latInput = $("#latitude-input").val();
        var lonInput = $("#longitude-input").val();

        $.post( "/address/coordinate-search", { lat: latInput, lon: lonInput }).done(function( data ) {
            //restore default values of charts and buttons
            restoreValues();

            //remove all loading animations
            hideLoadings();

            //Updating and showing data of the well (grey box) with weather report for right now
            var weatherObject = data.weather_obj;

            updateWellValues(
                weatherObject.temperature,
                weatherObject.clouds,
                weatherObject.humidity_percent,
                data.weather_obj.wind
            );

            //removing and re-adding the canvases to avoid styling bugs when re-rendering a new weather report
            resetCanvas();

            //getting the canvas element
            loadChart(data);
        }).fail((xhr) => {
            //remove all loading animations
            hideLoadings();

            var errors = xhr.responseJSON.errors;
            if(Array.isArray(errors)) {
                for(var e = 0; e < errors.length; e++) {
                    $("#coordinateErrors").append(`<li>${errors[e].msg}</li>`);
                }
            } else {
                $("#coordinateErrors").append(`<li>${errors}</li>`);
            }
        });
    });

    var restoreValues = () =>{
        $('#hourChart').hide();
        $('#dailyButtonLabel').attr('class', 'btn btn-success');
        $('#hourlyButtonLabel').attr('class', 'btn btn-default');
    };

    var updateWellValues = (temp, clouds, humidity, wind) => {
        $('.chart-canvas').show();
        $('.temp-well').html(Math.round(temp));
        $('.clouds-well').html(clouds);
        $('.humidity-well').html(humidity);
        $('.wind-well').html(Math.round(wind));
    };

    var resetCanvas = () => {
        var canvasBlock = $("#canvasBlock");
        canvasBlock.empty();
        canvasBlock.append('<canvas id="dayChart" width="400" height="400" class="chart-canvas"></canvas>');
        canvasBlock.append('<canvas id="hourChart" width="400" height="400" style="display: none;"></canvas>');
    };

    var clearErrors = () => {
        $("#addressErrors").empty();
        $("#coordinateErrors").empty();
    };

    var showLoading = (type) => {
        if(type === 'address') {
            $("#addressLoading").show();
        } else {
            $("#coordinateLoading").show();
        }
    };

    var hideLoadings = () => {
        $("#addressLoading").hide();
        $("#coordinateLoading").hide();
    };

    var loadChart = (data) => {
        var dayCanvas = document.getElementById("dayChart");
        var hourCanvas = document.getElementById("hourChart");
        var ctx = dayCanvas.getContext('2d');
        var ctx2 = hourCanvas.getContext('2d');

        updateChart(ctx, data);
        updateChart(ctx2, data);
    };

    var geocoder = new google.maps.Geocoder();

    //Google map section:
    function initialize(latitude, longitude) {
        var latLng = new google.maps.LatLng(latitude, longitude);
        var map = new google.maps.Map(document.getElementById('map'), {
            center: latLng,
            zoom: 8,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            disableDefaultUI: true
        });

        var marker = new google.maps.Marker({
            position: latLng,
            title: 'Point A',
            map: map,
            draggable: true
        });

        // Update current position info.
        updateMarkerPosition(latLng);
        geocodePosition(latLng);

        // Add dragging event listeners.
        google.maps.event.addListener(marker, 'dragstart', function() {
            updateMarkerAddress('Dragging...');
        });

        google.maps.event.addListener(marker, 'drag', function() {
            updateMarkerStatus('Dragging...');
            updateMarkerPosition(marker.getPosition());
            getPoint_Lat(marker.getPosition());
            getPoint_Lng(marker.getPosition());
        });

        google.maps.event.addListener(marker, 'dragend', function() {
            updateMarkerStatus('Drag ended');
            geocodePosition(marker.getPosition());
        });
    }

    // Onload handler to fire off the app.
    google.maps.event.addDomListener(window, 'load', initialize(40.6971494, -74.2598655));

    function geocodePosition(pos) {
        geocoder.geocode({
            latLng: pos
        }, function(responses) {
            if (responses && responses.length > 0) {
                updateMarkerAddress(responses[0].formatted_address);
            } else {
                updateMarkerAddress('Cannot determine address at this location.');
            }
        });
    }

    function updateMarkerStatus(str) {

    }

    function updateMarkerPosition(latLng) {
        $('#latitude-input').val(latLng.lat());
        $('#longitude-input').val(latLng.lng());
    }

    function getPoint_Lat(latLng) {
        // document.getElementById('pointLat').innerHTML = [
        //   latLng.lat()
        // ];
        // document.getElementById('latitude').value=[
        //   latLng.lat()
        // ];
    }

    function getPoint_Lng(latLng) {
        // document.getElementById('pointLng').innerHTML = [
        //   latLng.lng()
        // ];
        // longitude = [latLng.lng()];
        // document.getElementById('longitude').value=[
        //   latLng.lng()
        // ];
    }

    function updateMarkerAddress(str) {

    }
});

function deleteUser() {
  var confirmation = confirm('Are you sure?');

  if(confirmation) {
    $.ajax({
      type: 'DELETE',
      url: `/search/delete/${$(this).data('id')}`
    }).done((response) => {
      window.location.replace('/');
    });

    window.location.replace('/');
  } else {
    return false;
  }
}

function searchAgain() {
    var address = $(this).data('address');
    var city = $(this).data('city');
    var country = $(this).data('country');

    $('#addressInput').val(address);
    $('#cityInput').val(city);
    $('#countryInput').val(country);

    $('#addressForm').submit();
}

function updateChart(chartElement, data) {
    if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
        var tooltip_size = 7;
    } else {
        var tooltip_size = 2;
    }

    var gradientStroke = chartElement.createLinearGradient(0, 0, 900, 0);
    var gradientFill = chartElement.createLinearGradient(0, 0, 900, 0);

    if (chartElement.canvas.id === 'dayChart') {
        gradientStroke.addColorStop(0.1, `rgba(${data.proximate_weather_array[8][0]})`);
        gradientStroke.addColorStop(0.2, `rgba(${data.proximate_weather_array[8][1]})`);
        gradientStroke.addColorStop(0.35, `rgba(${data.proximate_weather_array[8][2]})`);
        gradientStroke.addColorStop(0.5, `rgba(${data.proximate_weather_array[8][3]})`);
        gradientStroke.addColorStop(0.6, `rgba(${data.proximate_weather_array[8][4]})`);
        gradientStroke.addColorStop(0.8, `rgba(${data.proximate_weather_array[8][5]})`);
        gradientStroke.addColorStop(1, `rgba(${data.proximate_weather_array[8][6]})`);

        gradientFill.addColorStop(0.1, `rgba(${data.proximate_weather_array[8][0]},0.6)`);
        gradientFill.addColorStop(0.2, `rgba(${data.proximate_weather_array[8][1]},0.6)`);
        gradientFill.addColorStop(0.35, `rgba(${data.proximate_weather_array[8][2]},0.6)`);
        gradientFill.addColorStop(0.5, `rgba(${data.proximate_weather_array[8][3]},0.6)`);
        gradientFill.addColorStop(0.6, `rgba(${data.proximate_weather_array[8][4]},0.6)`);
        gradientFill.addColorStop(0.8, `rgba(${data.proximate_weather_array[8][5]},0.6)`);
        gradientFill.addColorStop(1, `rgba(${data.proximate_weather_array[8][6]},0.6)`);
    } else {
        gradientStroke.addColorStop(0.1, `rgba(${data.proximate_weather_hourly_array[9][0]})`);
        gradientStroke.addColorStop(0.2, `rgba(${data.proximate_weather_hourly_array[9][1]})`);
        gradientStroke.addColorStop(0.35, `rgba(${data.proximate_weather_hourly_array[9][2]})`);
        gradientStroke.addColorStop(0.5, `rgba(${data.proximate_weather_hourly_array[9][3]})`);
        gradientStroke.addColorStop(0.6, `rgba(${data.proximate_weather_hourly_array[9][4]})`);
        gradientStroke.addColorStop(0.75, `rgba(${data.proximate_weather_hourly_array[9][5]})`);
        gradientStroke.addColorStop(0.85, `rgba(${data.proximate_weather_hourly_array[9][6]})`);
        gradientStroke.addColorStop(0.1, `rgba(${data.proximate_weather_hourly_array[9][7]})`);

        gradientFill.addColorStop(0.1, `rgba(${data.proximate_weather_hourly_array[9][0]},0.6)`);
        gradientFill.addColorStop(0.2, `rgba(${data.proximate_weather_hourly_array[9][1]},0.6)`);
        gradientFill.addColorStop(0.35, `rgba(${data.proximate_weather_hourly_array[9][2]},0.6)`);
        gradientFill.addColorStop(0.5, `rgba(${data.proximate_weather_hourly_array[9][3]},0.6)`);
        gradientFill.addColorStop(0.6, `rgba(${data.proximate_weather_hourly_array[9][4]},0.6)`);
        gradientFill.addColorStop(0.75, `rgba(${data.proximate_weather_hourly_array[9][5]},0.6)`);
        gradientFill.addColorStop(0.85, `rgba(${data.proximate_weather_hourly_array[9][6]},0.6)`);
        gradientFill.addColorStop(0.1, `rgba(${data.proximate_weather_hourly_array[9][7]},0.6)`);
    }

    var lables = [];
    var dataArray = [];
    if (chartElement.canvas.id === 'dayChart') {
        document.getElementById("dayChart").height = 100;
        lables = [
            data.proximate_weather_array[0].day,
            data.proximate_weather_array[1].day,
            data.proximate_weather_array[2].day,
            data.proximate_weather_array[3].day,
            data.proximate_weather_array[4].day,
            data.proximate_weather_array[5].day,
            data.proximate_weather_array[6].day
        ];

        dataArray = [
            data.proximate_weather_array[0].temperature,
            data.proximate_weather_array[1].temperature,
            data.proximate_weather_array[2].temperature,
            data.proximate_weather_array[3].temperature,
            data.proximate_weather_array[4].temperature,
            data.proximate_weather_array[5].temperature,
            data.proximate_weather_array[6].temperature,
        ];
    } else {
        document.getElementById("hourChart").height = 100;

        lables = [
            data.proximate_weather_hourly_array[0].hour,
            data.proximate_weather_hourly_array[1].hour,
            data.proximate_weather_hourly_array[2].hour,
            data.proximate_weather_hourly_array[3].hour,
            data.proximate_weather_hourly_array[4].hour,
            data.proximate_weather_hourly_array[5].hour,
            data.proximate_weather_hourly_array[6].hour,
            data.proximate_weather_hourly_array[7].hour,
        ];

        dataArray = [
            data.proximate_weather_hourly_array[0].temperature,
            data.proximate_weather_hourly_array[1].temperature,
            data.proximate_weather_hourly_array[2].temperature,
            data.proximate_weather_hourly_array[3].temperature,
            data.proximate_weather_hourly_array[4].temperature,
            data.proximate_weather_hourly_array[5].temperature,
            data.proximate_weather_hourly_array[6].temperature,
            data.proximate_weather_hourly_array[7].temperature,
        ];
    }

    var dayChart = new Chart(chartElement, {
        type: 'line',
        data: {
            labels: lables,
            datasets: [{
                borderColor: gradientStroke,
                pointBorderColor: gradientStroke,
                pointBackgroundColor: gradientStroke,
                pointHoverBackgroundColor: gradientStroke,
                pointHoverBorderColor: gradientStroke,
                pointBorderWidth: 5,
                pointHoverRadius: 5,
                pointHoverBorderWidth: tooltip_size,
                pointRadius: tooltip_size,
                fill: true,
                backgroundColor: gradientFill,
                borderWidth: 4,
                label: `Temperature`,
                data: dataArray,
                borderWidth: 1,
                lineTension: 0
            }]
        },
        options: {
            tooltips: {
                callbacks: {
                    title: function(tooltipItem, chartData) {
                        if (chartElement.canvas.id !== 'dayChart') {
                            return false;
                        }

                        var tooltip_index = tooltipItem[0]['index'];
                        var summaries = [];

                        for(var i = 0; i < data.proximate_weather_array.length; i++) {
                            if(typeof data.proximate_weather_array[i].summary !== 'undefined') {
                                summaries.push(data.proximate_weather_array[i].summary);
                            }
                        }

                        return chartData['labels'][tooltipItem[0]['index']] + ": " + summaries[tooltip_index];
                    },
                    label: function(tooltipItem, chartData) {
                        return "Temperature: " + chartData['datasets'][0]['data'][tooltipItem['index']] + "°C";
                    },
                }
            },
            legend: {
                display: false
            },
            scales: {
                yAxes: [{
                    gridLines: {
                        display:false
                    },
                    ticks: {
                        suggestedMin: (chartElement.canvas.id === 'dayChart') ? data.proximate_weather_array[7].min_temp : data.proximate_weather_hourly_array[8].min_temp,
                        suggestedMax: (chartElement.canvas.id === 'dayChart') ? data.proximate_weather_array[7].max_temp : data.proximate_weather_hourly_array[8].max_temp
                    }
                }],
                xAxes: [
                    {
                        gridLines: {
                            offsetGridLines: true
                        },
                    }
                ]
            }
        }
    });
}
