const request = require('request');
const ip = require('ip');
const mongojs = require('mongojs');
const db = mongojs('address_searches', ['searches']); //specifiyng the database and table(s)
const ObjectId = mongojs.ObjectId;
const user_ip = ip.address();

const google_api_endpoint = 'https://maps.googleapis.com/maps/api/geocode/json?address=';
const weather_api_endpoint = 'http://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid=f8ce6d274cc4cdbf7d0239e388ecdd56';

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
                            title: 'Get weather result',
                            form_parameters,
                            previous_searches: docs,
                            google_success: true,
                            weather_obj
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
                                title: 'Get weather result',
                                form_parameters,
                                previous_searches: docs,
                                google_success: true,
                                weather_obj
                              });
                          });
                        });
                      }

                      console.log('success');
                    }
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

    renderError(errors, form_parameters, res) {
        db.searches.find({ip: user_ip}, (err, docs) => {
          res.render('index', {
            title: 'Get weather result',
            errors,
            form_parameters,
            previous_searches: docs
          });
        });
    }

    getPreviousSearches(res) {
        //fetching users from users table
        db.searches.find({ip: user_ip}, (err, docs) =>{
            res.render('index', {
              title: 'Get weather result',
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
