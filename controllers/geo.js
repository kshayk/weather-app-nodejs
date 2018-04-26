const request = require('request');
const ip = require('ip');
const mongojs = require('mongojs');
const db = mongojs('address_searches', ['searches']); //specifiyng the database and table(s)
const api_keys = require('../api_keys');
const ObjectId = mongojs.ObjectId;
const user_ip = ip.address();

const google_api_endpoint = `https://maps.googleapis.com/maps/api/geocode/json?key=${api_keys.google_maps_api}&address=`;
const weather_api_endpoint = `http://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid=${api_keys.weather_api}`;
const proximate_weather_api_endpoint = `https://api.darksky.net/forecast/${api_keys.darksky_api}/{lat},{lon}`;

const light_red_rgb = '255,102,102';
const strong_red_rgb = '255,26,26';
const blue_rgb = '153,153,255';

const page_title = 'Real Time Weather Report';

var weekdays = [];
weekdays[0] = "Sunday";
weekdays[1] = "Monday";
weekdays[2] = "Tuesday";
weekdays[3] = "Wednesday";
weekdays[4] = "Thursday";
weekdays[5] = "Friday";
weekdays[6] = "Saturday";

class Geo {
    constructor() {

    }

    getWeatherReport(req, res) {
        var check_query_exists = this.checkQueryExists(req.body);

        // console.log(req.body.first_name);
        req.checkBody('address', 'address is reuired').notEmpty(); //express validator for empty value
        req.checkBody('city', 'City is required')
        req.checkBody('country', 'country is reuired').notEmpty();

        var errors = req.validationErrors(); //checking for erros based on validator

        var address = req.body.address;
        var city = req.body.city;
        var country = req.body.country;

        var form_parameters = {
          address,
          city,
          country
        };

        if(errors) {
          //re-rendering the form
          this.renderError(errors, form_parameters, res);
        } else {
          request({
            url: `${google_api_endpoint}${address} ${city} ${country}`,
            json: true
          }, (error, response, body) => {
              if(error || body.error_message) {
                if(error !== null) {
                    var request_error_array = [
                      {
                        msg: 'Connection with Google APIs has failed. try again later'
                      }
                    ];

                    this.renderError(request_error_array, form_parameters, res);
                } else {
                  var request_error_array = [
                    {
                      msg: body.error_message
                    }
                  ];

                  this.renderError(request_error_array, form_parameters, res);
                }
              } else {
                if(body.results.length === 0 || body.status === 'ZERO_RESULTS') {
                  //zero results - re-rendering the form
                  var request_error_array = [
                    {
                      msg: body.status
                    }
                  ];

                  this.renderError(request_error_array, form_parameters, res);
                } else {
                  var latitude = body.results[0].geometry.location.lat;
                  var longtitude = body.results[0].geometry.location.lng;

                  var weather_url = weather_api_endpoint.replace('{lat}', latitude).replace('{lon}', longtitude);

                  request({
                    url: weather_url,
                    json: true
                  }, (w_error, w_response, w_body) => {
                      //Now getting the proximate weather report
                      var proximate_weather_url = proximate_weather_api_endpoint.replace('{lat}', latitude).replace('{lon}', longtitude);

                      request({
                          url: proximate_weather_url,
                          json: true
                      }, (w2_error, w2_response, w2_body) => {
                          if(w2_error) {
                              var request_error_array = [
                                {
                                  msg: 'Connection with the weather APIs has failed. try again later'
                                }
                              ];

                              console.log(w2_error);

                              this.renderError(request_error_array, form_parameters, res);
                          } else {
                              var proximate_weather_array = [];
                              var proximate_weather_hourly_array = [];
                              var gradient_colors = [];
                              var gradient_colors_hourly = [];
                              var min_temp = null;
                              var min_temp_hourly = null;
                              var max_temp = null;
                              var max_temp_hourly = null;

                              var weather_data = w2_body.daily.data;
                              var weather_data_hourly = w2_body.hourly.data;

                              for(var i = 1; i <= weather_data.length-1; i++) {
                                  var d = new Date(0);
                                  d.setUTCSeconds(weather_data[i].time);
                                  var celcius_temp = Math.round((weather_data[i].temperatureHigh - 32) * 0.5556);

                                  if(celcius_temp < 20) {
                                      gradient_colors.push(blue_rgb);
                                  } else if(celcius_temp > 20 && celcius_temp < 30) {
                                      gradient_colors.push(light_red_rgb);
                                  } else {
                                      gradient_colors.push(strong_red_rgb);
                                  }

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

                                  var day_obj = {
                                      day: weekdays[d.getDay()],
                                      temperature: celcius_temp,
                                      summary: weather_data[i].summary
                                  };

                                  proximate_weather_array.push(day_obj);
                              }

                              proximate_weather_array.push({min_temp: min_temp-2, max_temp: max_temp+2});
                              proximate_weather_array.push(gradient_colors);

                              for(var h = 1; h <= 24; h++) {
                                  var d2 = new Date(0);
                                  d2.setUTCSeconds(weather_data_hourly[h].time);
                                  var celcius_temp_hourly = Math.round((weather_data_hourly[h].temperature - 32) * 0.5556);

                                  if((h % 3) === 0 ) {
                                      if(celcius_temp_hourly < 20) {
                                          gradient_colors_hourly.push(blue_rgb);
                                      } else if(celcius_temp_hourly >= 20 && celcius_temp_hourly < 30) {
                                          gradient_colors_hourly.push(light_red_rgb);
                                      } else {
                                          gradient_colors_hourly.push(strong_red_rgb);
                                      }


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

                                      var hour_obj = {
                                          hour,
                                          temperature: celcius_temp_hourly
                                      };

                                      proximate_weather_hourly_array.push(hour_obj);
                                  }
                              }

                              proximate_weather_hourly_array.push({min_temp: min_temp_hourly-2, max_temp: max_temp_hourly+2});
                              proximate_weather_hourly_array.push(gradient_colors_hourly);

                              console.log(proximate_weather_array);

                              if(w_error !== null) {
                                var request_error_array = [
                                  {
                                    msg: w_error
                                  }
                                ];

                                this.renderError(request_error_array, form_parameters, res);
                              } else {

                                var weather_obj = {
                                  temperature: w_body.main.temp - 273.15, //kelvin to celsius
                                  humidity_percent: w_body.main.humidity,
                                  clouds: w_body.weather[0].description,
                                  wind: w_body.wind.speed * 3.6//meters per second * 3.6 = km/hour
                                }

                                var newSearch = {
                                  address,
                                  city,
                                  country,
                                  ip: user_ip
                                };

                                if(check_query_exists) {
                                  //already has the same address and IP in DB
                                  db.searches.find({ip: user_ip}, (err, docs) => {
                                    form_parameters.formatted_address = body.results[0].formatted_address;

                                    res.render('index', {
                                      title: page_title,
                                      form_parameters,
                                      previous_searches: docs,
                                      google_success: true,
                                      weather_obj,
                                      proximate_weather_array,
                                      proximate_weather_hourly_array
                                    });
                                  });
                                } else {
                                  //doesnt have the same address and IP. insert it.
                                  db.searches.insert(newSearch, (err, result) => {
                                    if(err) {
                                        var request_error_array = [
                                          {
                                            msg: 'Failed to save your search. Try again later.'
                                          }
                                        ];

                                        this.renderError(request_error_array, form_parameters, res);
                                    }

                                    db.searches.find({ip: user_ip}, (err, docs) => {
                                        if(err) {
                                            var request_error_array = [
                                              {
                                                msg: 'Failed to get your previous searches. Try again later.'
                                              }
                                            ];

                                            this.renderError(request_error_array, form_parameters, res);
                                        }

                                        form_parameters.formatted_address = body.results[0].formatted_address;

                                        res.render('index', {
                                          title: page_title,
                                          form_parameters,
                                          previous_searches: docs,
                                          google_success: true,
                                          weather_obj,
                                          proximate_weather_array
                                        });
                                    });
                                  });
                                }
                              }
                          }
                      });
                  });
                }
              }
          });
        }
    }

    checkQueryExists(request_body) {
        if(typeof request_body.existing_addresses === 'undefined') {
            return false;
        }

        var existing_addresses = JSON.parse(request_body.existing_addresses);
        if(existing_addresses.length === 0) {
            return false;
        };

        var new_address = {address: request_body.address, city: request_body.city, country: request_body.country};

        for(var i = 0; i <= existing_addresses.length - 1; i++) {
            if(existing_addresses[i].address === new_address.address
                && existing_addresses[i].city === new_address.city
                && existing_addresses[i].country === new_address.country) {
                  return true;
            }
        }

        return false;
    }

    renderError(errors, form_parameters, res, proximate_weather_array) {
        db.searches.find({ip: user_ip}, (err, docs) => {
          res.render('index', {
            title: page_title,
            errors,
            form_parameters,
            previous_searches: docs,
            proximate_weather_array
          });
        });
    }

    getPreviousSearches(res, callback) {
        //fetching users from users table
        db.searches.find({ip: user_ip}, (err, docs) =>{
            res.render('index', {
              title: page_title,
              previous_searches: docs
            }); //will fetch the index file aaccording app.set('views') config
        });
    }

    deletGeoRecord(req, res) {
        db.searches.remove({_id: ObjectId(req.params.id)}, (err) => {
          if(err) {
            console.log(err);
          }

          res.redirect('/');
        });
    }
}

module.exports = Geo;
