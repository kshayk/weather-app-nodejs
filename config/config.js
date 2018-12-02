var env = process.env.NODE_ENV || 'development';

if(env === 'development' || env === 'test') {
    var api_keys = require('./api_keys.json');

    Object.keys(api_keys).forEach((api_name) => {
        process.env[api_name] = api_keys[api_name];
    })
}