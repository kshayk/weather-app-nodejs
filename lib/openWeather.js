const request = require("request");

var openWeatherRequest = function(weather_url) {
    return new Promise((resolve, p_error) => {
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

                p_error(request_error_array);
            }

            resolve(w_body);
        });
    });
};

module.exports = openWeatherRequest;