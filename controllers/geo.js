const {country_index} = require('../lib/country_index');
// const user_ip = ip.address();
const weather_api_endpoint = `http://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid=${process.env.OPEN_WEATHER_MAP}`;

const googleMaps = require('../lib/googleMaps');
const openWeather = require('../lib/openWeather');
const proximateWeather = require('../lib/proximateWeather');

const page_title = 'Real Time Weather Report';

class Geo {
    constructor() {

    }

    getPreviousSearches(res, callback) {
        //fetching users from users table
        res.render('index', {
          title: page_title,
        }); //will fetch the index file aaccording app.set('views') config
    }

    async getApiAddressResults(req) {
        req.checkBody('address', 'address is required').notEmpty(); //express validator for empty value

        let errors = req.validationErrors(); //checking for erros based on validator

        if(errors) {
            //re-rendering the form
            throw new Error('Please use a correct address');
        }

        var address = req.body.address;

        try {
            const googleRes = await googleMaps(address);
            const openWeatherRes = await openWeather(googleRes.api_url);
            const proximateWeatherRes = await proximateWeather(openWeatherRes, googleRes.longitude, googleRes.latitude);

            let form_parameters = {
                formatted_address: googleRes.formatted_address,
                lon: googleRes.longitude,
                lat: googleRes.latitude
            };

            return {
                title: page_title,
                form_parameters,
                google_success: proximateWeatherRes.google_success,
                weather_obj: proximateWeatherRes.weather_obj,
                proximate_weather_array: proximateWeatherRes.proximate_weather_array,
                proximate_weather_hourly_array: proximateWeatherRes.proximate_weather_hourly_array,
                search_country: openWeatherRes.sys.country || '',
                now_icon: proximateWeatherRes.now_icon
            };
        } catch (e) {
            console.log('Address form error:', e);

            throw new Error("Failed to get weather data")
        }
    }

    async getApiCoordinatesResults(req) {
        req.checkBody('lat', 'latitude is required').notEmpty().isNumeric(); //express validator for empty value
        req.checkBody('lon', 'longitude is required').notEmpty().isNumeric();

        var errors = req.validationErrors(); //checking for erros based on validator

        if(errors) {
            //re-rendering the form
            throw new Error("Please provide valid coordinates");
        }

        var lat = req.body.lat;
        var lon = req.body.lon;

        try {
            const openWeatherRes = await openWeather(weather_api_endpoint.replace('{lat}', lat).replace('{lon}', lon));
            const proximateWeatherRes = await proximateWeather(openWeatherRes, lon, lat);

            return {
                title: page_title,
                form_parameters: {lat, lon},
                google_success: proximateWeatherRes.google_success,
                weather_obj: proximateWeatherRes.weather_obj,
                proximate_weather_array: proximateWeatherRes.proximate_weather_array,
                proximate_weather_hourly_array: proximateWeatherRes.proximate_weather_hourly_array,
                search_country: openWeatherRes.sys.country || '',
                now_icon: proximateWeatherRes.now_icon
            };
        } catch (e) {
            console.log('coordinate form error:', e);

            throw new Error("Failed to get the weather data");
        }
    }
}

module.exports = Geo;
