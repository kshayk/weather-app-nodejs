const request = require("request");

var request_error_array;

let googleRequest = function(api_keys, form_parameters) {
    const google_api_endpoint = `https://maps.googleapis.com/maps/api/geocode/json?key=${api_keys.google_maps_api}&address=`;
    const weather_api_endpoint = `http://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid=${api_keys.weather_api}`;

    return new Promise((resolve, p_error) => {
        request({
            url: `${google_api_endpoint}${form_parameters.address} ${form_parameters.city} ${form_parameters.country}`,
            json: true
        }, (error, response, body) => {
            if (error || body.error_message) {
                if (error !== null) {
                    request_error_array = [
                        {
                            msg: 'Connection with Google APIs has failed. try again later'
                        }
                    ];

                    p_error({request_error_array});
                } else {
                    request_error_array = [
                        {
                            msg: body.error_message
                        }
                    ];

                    p_error(request_error_array);
                }
            } else {
                if (body.results.length === 0 || body.status === 'ZERO_RESULTS') {
                    //zero results - re-rendering the form
                    request_error_array = [
                        {
                            msg: body.status
                        }
                    ];

                    p_error(request_error_array);
                } else {
                    var latitude = body.results[0].geometry.location.lat;
                    var longitude = body.results[0].geometry.location.lng;

                    resolve({
                        api_url: weather_api_endpoint.replace('{lat}', latitude).replace('{lon}', longitude),
                        latitude,
                        longitude,
                        formatted_address: body.results[0].formatted_address
                    });
                }
            }
        });
    });
};

module.exports = googleRequest;