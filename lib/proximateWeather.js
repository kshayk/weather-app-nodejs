const request = require("request");

const orange_rgb = '255,165,129';
const light_red_rgb = '255,102,102';
const strong_red_rgb = '255,26,26';
const blue_rgb = '153,153,255';

var gradient_colors = [];
var gradient_colors_hourly = [];
var min_temp = null;
var min_temp_hourly = null;
var max_temp = null;
var max_temp_hourly = null;

var weekdays = [];
weekdays[0] = "Sunday";
weekdays[1] = "Monday";
weekdays[2] = "Tuesday";
weekdays[3] = "Wednesday";
weekdays[4] = "Thursday";
weekdays[5] = "Friday";
weekdays[6] = "Saturday";

var request_error_array;

var proximateWeather = function (open_weather_body , api_keys, longitude, latitude) {
    const proximate_weather_api_endpoint = `https://api.darksky.net/forecast/${api_keys.darksky_api}/{lat},{lon}`;
    var proximate_weather_url = proximate_weather_api_endpoint.replace('{lat}', latitude).replace('{lon}', longitude);

    return new Promise((resolve, p_error) => {
        request({
            url: proximate_weather_url,
            json: true
        }, (w2_error, w2_response, w2_body) => {
            if(w2_error) {
                request_error_array = [
                    {
                        msg: 'Connection with the weather APIs has failed. try again later'
                    }
                ];

                p_error(request_error_array);
            } else {
                var proximate_weather_array = [];
                var proximate_weather_hourly_array = [];
                gradient_colors = [];
                gradient_colors_hourly = [];
                min_temp = null;
                min_temp_hourly = null;
                max_temp = null;
                max_temp_hourly = null;

                var weather_data = w2_body.daily.data;
                var weather_data_hourly = w2_body.hourly.data;

                for(var i = 1; i <= weather_data.length-1; i++) {
                    var day_obj = createDayObject(weather_data[i]);

                    proximate_weather_array.push(day_obj);
                }

                proximate_weather_array.push({min_temp: min_temp-2, max_temp: max_temp+2});
                proximate_weather_array.push(gradient_colors);

                for(var h = 1; h <= 24; h++) {
                    if((h % 3) === 0 ) {
                        var hour_obj = createHourObject(weather_data_hourly, h);

                        proximate_weather_hourly_array.push(hour_obj);
                    }
                }

                proximate_weather_hourly_array.push({min_temp: min_temp_hourly-2, max_temp: max_temp_hourly+2});
                proximate_weather_hourly_array.push(gradient_colors_hourly);

                var weather_obj = {
                    temperature: open_weather_body.main.temp - 273.15, //kelvin to celsius
                    humidity_percent: open_weather_body.main.humidity,
                    clouds: open_weather_body.weather[0].description,
                    wind: open_weather_body.wind.speed * 3.6//meters per second * 3.6 = km/hour
                };

                resolve({
                    google_success: true,
                    weather_obj,
                    proximate_weather_array,
                    proximate_weather_hourly_array
                })

                // res.render('index', {
                //     title: page_title,
                //     form_parameters,
                //     google_success: true,
                //     weather_obj,
                //     proximate_weather_array,
                //     proximate_weather_hourly_array
                // });
            }
        });
    })
};

var createDayObject = function(weather_data) {
    var d = new Date(0);
    d.setUTCSeconds(weather_data.time);
    var celcius_temp = Math.round((weather_data.temperatureHigh - 32) * 0.5556);

    gradient_colors.push(chooseTemperatureColor(celcius_temp));

    if(min_temp === null) {
        min_temp = celcius_temp;
        max_temp = celcius_temp;
    } else {
        if(celcius_temp < min_temp) {
            min_temp = celcius_temp;
        }

        if(max_temp === null || celcius_temp > max_temp) {
            max_temp = celcius_temp;
        }
    }

    return  {
        day: weekdays[d.getDay()],
        temperature: celcius_temp,
        summary: weather_data.summary,
        icon: weather_data.icon
    };
};

var createHourObject = function(weather_data_hourly, index) {
    var d2 = new Date(0);
    d2.setUTCSeconds(weather_data_hourly[index].time);
    var celcius_temp_hourly = Math.round((weather_data_hourly[index].temperature - 32) * 0.5556);

    gradient_colors_hourly.push(chooseTemperatureColor(celcius_temp_hourly));

    if(min_temp_hourly === null) {
        min_temp_hourly = celcius_temp_hourly;
        max_temp_hourly = celcius_temp_hourly;
    } else {
        if(celcius_temp_hourly < min_temp_hourly) {
            min_temp_hourly = celcius_temp_hourly;
        }

        if(max_temp_hourly === null || celcius_temp_hourly > max_temp_hourly) {
            max_temp_hourly = celcius_temp_hourly;
        }
    }

    var original_hour = d2.getHours();
    if(original_hour < 10) {
        var hour = `0${original_hour}:00`
    } else {
        var hour = `${original_hour}:00`
    }

    return {
        hour,
        temperature: celcius_temp_hourly
    };
};

var chooseTemperatureColor = function(temperature) {
    if(temperature < 15) {
        return blue_rgb;
    } else if(temperature >= 15 && temperature < 25) {
        return orange_rgb;
    } else if(temperature >=25 && temperature < 35) {
        return light_red_rgb;
    } else {
        return strong_red_rgb;
    }
};

module.exports = proximateWeather;