const WeatherController = require('../controllers/geo'); //no need for geo.js since this file is with .js extension
const NewsController = require('../controllers/news');
const flags = require('../lib/flags');

var geo = new WeatherController();
var news = new NewsController();

module.exports = (app, bodyParser, expressValidator) => {

    //global vars
    app.use((req, res, next) => {
      res.locals.errors = null;
      res.locals.form_parameters = {};
      res.locals.google_success = false;
      res.locals.weather_obj = null;
      res.locals.proximate_weather_array = [];
      res.locals.proximate_weather_hourly_array = [];
      next();
    });

    //body-parser middleware
    app.use(bodyParser.json()); // handling json content
    app.use(bodyParser.urlencoded({extended: false}));

    app.use(expressValidator);

    app.get('/', (req, res) => {
        geo.getPreviousSearches(res);
    });

    app.post('/address/search', (req, res) => {
        var payload;

        geo.getApiAddressResults(req)
            .then((geo_res) => {
                payload = geo_res;
                return news.getNews(geo_res.search_country);
            }).then((news_data) => {
                if(news_data.length > 0) {
                    payload.news = news_data;
                }

                return flags(payload.search_country);
                // res.send(payload);
            }).then((country_flag) => {
                if(country_flag) {
                    payload.flag = country_flag;
                }

                res.send(payload);
            })
            .catch((e) => {
                //e must equal to an object with a key of "errors" which can be a string or array
               res.status(400).send(e);
            });
    });

    app.post('/address/coordinate-search', (req, res) => {
        var payload;

        geo.getApiCoordinatesResults(req)
            .then((geo_res) => {
                payload = geo_res;
                return news.getNews(geo_res.search_country);
            }).then((news_data) => {
                if(news_data.length > 0) {
                    payload.news = news_data;
                }

                return flags(payload.search_country);
                //res.send(payload);
            }).then((country_flag) => {
                if(country_flag) {
                    payload.flag = country_flag;
                }

                res.send(payload);
            }).catch((e) => {
                res.status(400).send(e);
            })
    });
};
