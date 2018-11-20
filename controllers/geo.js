const api_keys = require('../api_keys');
const {country_index} = require('../lib/country_index');
// const user_ip = ip.address();
const weather_api_endpoint = `http://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid=${api_keys.weather_api}`;

const googleMaps = require('../lib/googleMaps');
const openWeather = require('../lib/openWeather');
const proximateWeather = require('../lib/proximateWeather');
const newsApi = require('../lib/newsApi');

const page_title = 'Real Time Weather Report';

var search_country = '';

class Geo {
    constructor() {

    }

    getWeatherReport(req, res) {
        req.checkBody('address', 'address is required').notEmpty(); //express validator for empty value
        req.checkBody('city', 'City is required');
        req.checkBody('country', 'country is required').notEmpty();

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
            res.status(400).send({errors});
        } else {
            this.getApiAddressResults(form_parameters, req, res);
        }
    }

    getWeatherReportByCoordinates(req, res) {
        req.checkBody('lat', 'latitude is required').notEmpty(); //express validator for empty value
        req.checkBody('lon', 'longitude is required').notEmpty();

        var errors = req.validationErrors(); //checking for erros based on validator

        var lat = req.body.lat;
        var lon = req.body.lon;

        var form_parameters = {
          lat,
          lon
        };

        if(errors) {
          //re-rendering the form
            res.status(400).send({errors});
        } else {
            this.getApiCoordinatesResults(form_parameters, req, res);
        }
    }

    renderError(errors, form_parameters, res, proximate_weather_array) {
      res.render('index', {
        title: page_title,
        errors,
        form_parameters,
        proximate_weather_array
      });
    }

    getPreviousSearches(res, callback) {
        //fetching users from users table
        res.render('index', {
          title: page_title,
        }); //will fetch the index file aaccording app.set('views') config
    }

    getApiAddressResults(form_parameters, req, res) {
        var lon;
        var lat;
        var formatted_address;

        googleMaps(api_keys, form_parameters)
            .then((result_obj) => {
                lon = result_obj.longitude;
                lat = result_obj.latitude;
                formatted_address = result_obj.formatted_address;

                return openWeather(result_obj.api_url)
            }).then((open_weather_body) => {
                search_country = open_weather_body.sys.country || '';

                return proximateWeather(open_weather_body, api_keys, lon, lat);
            }).then((proximate_weather_res) => {
                form_parameters.fomatted_address = formatted_address;
                form_parameters.lon = lon;
                form_parameters.lat = lat;

                var res_object = {
                    title: page_title,
                    form_parameters,
                    google_success: proximate_weather_res.google_success,
                    weather_obj: proximate_weather_res.weather_obj,
                    proximate_weather_array: proximate_weather_res.proximate_weather_array,
                    proximate_weather_hourly_array: proximate_weather_res.proximate_weather_hourly_array
                };

                //check if desired location is inside a country (not a sea). if so, get the news for that country
                if(search_country) {
                    var country_name = country_index[search_country];
                    var encoded_country_name = encodeURI(country_name);

                    //get news for that country based on country code
                    newsApi(encoded_country_name, api_keys.news_api)
                        .then((data) => {
                            if(data.length > 0) {
                                //add the news data to the res object
                                res_object.news = data;
                                res.send(res_object);
                            } else {
                                res.send(res_object);
                            }
                        }).catch((e) => {
                            console.log('news error', e);
                            res.send(res_object);
                        });
                } else {
                    res.send(res_object);
                }
            }).catch((error) => {
                console.log(error.message);
                res.status(400).send({
                    errors: 'Failed to get the data'
                })
            });
    }

    getApiCoordinatesResults(form_parameters, req, res) {
        openWeather(weather_api_endpoint.replace('{lat}', form_parameters.lat).replace('{lon}', form_parameters.lon))
            .then((open_weather_body) => {
                search_country = open_weather_body.sys.country || '';

                return proximateWeather(open_weather_body, api_keys, form_parameters.lon, form_parameters.lat);
            }).then((proximate_weather_res) => {
                var res_object = {
                    title: page_title,
                    form_parameters,
                    google_success: proximate_weather_res.google_success,
                    weather_obj: proximate_weather_res.weather_obj,
                    proximate_weather_array: proximate_weather_res.proximate_weather_array,
                    proximate_weather_hourly_array: proximate_weather_res.proximate_weather_hourly_array
                };

                //check if desired location is inside a country (not a sea). if so, get the news for that country
                if(search_country) {
                    var country_name = country_index[search_country];
                    var encoded_country_name = encodeURI(country_name);

                    //get news for that country based on country code
                    newsApi(encoded_country_name, api_keys.news_api)
                        .then((data) => {
                            if(data.length > 0) {
                                //add the news data to the res object
                                res_object.news = data;
                                res.send(res_object);
                            } else {
                                res.send(res_object);
                            }
                        }).catch((e) => {
                            console.log('news error', e);
                            res.send(res_object);
                        });
                } else {
                    res.send(res_object);
                }
            }).catch((error) => {
                res.status(400).send({
                    errors: 'Failed to get the data'
                })
            });
    }
}

module.exports = Geo;
