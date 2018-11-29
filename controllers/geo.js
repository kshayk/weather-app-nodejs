const api_keys = require('../api_keys');
const {country_index} = require('../lib/country_index');
// const user_ip = ip.address();
const weather_api_endpoint = `http://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid=${api_keys.weather_api}`;

const googleMaps = require('../lib/googleMaps');
const openWeather = require('../lib/openWeather');
const proximateWeather = require('../lib/proximateWeather');
const newsApi = require('../lib/newsApi');

const page_title = 'Real Time Weather Report';

class Geo {
    constructor() {

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

    getApiAddressResults(req) {
        var lon,
            lat,
            formatted_address,
            search_country;

        return new Promise((resolve, p_error) => {
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
                p_error({errors});
            }

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

                    resolve({
                        title: page_title,
                        form_parameters,
                        google_success: proximate_weather_res.google_success,
                        weather_obj: proximate_weather_res.weather_obj,
                        proximate_weather_array: proximate_weather_res.proximate_weather_array,
                        proximate_weather_hourly_array: proximate_weather_res.proximate_weather_hourly_array,
                        search_country,
                        now_icon: proximate_weather_res.now_icon
                    });
            }).catch((error) => {
                console.log("Address request", error.message);
                p_error({
                    errors: 'Failed to get the data'
                });
            });
        });

    }

    getApiCoordinatesResults(req) {
        var search_country;

        return new Promise((resolve, p_error) => {
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
                p_error({errors});
            }

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
                        proximate_weather_hourly_array: proximate_weather_res.proximate_weather_hourly_array,
                        search_country,
                        now_icon: proximate_weather_res.now_icon
                    };

                    resolve(res_object);
                }).catch((error) => {
                    console.log("Coordinates request", error.message);
                    p_error({
                        errors: 'Failed to get the data'
                    })
                });
        });

    }
}

module.exports = Geo;
