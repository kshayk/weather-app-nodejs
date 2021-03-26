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

    app.post('/address/search', async (req, res) => {
        try {
            const weatherRes = await geo.getApiAddressResults(req);
            const newsRes = await news.getNews(weatherRes.search_country);
            const flagsRes = await flags(weatherRes.search_country);

            if (newsRes.length > 0) {
                weatherRes.news = newsRes;
            }

            if (flagsRes) {
                weatherRes.flag = flagsRes;
            }

            res.send(weatherRes);
        } catch (e) {
            res.status(400).send({errors: e.message});
        }
    });

    app.post('/address/coordinate-search', async (req, res) => {
        try {
            const weatherRes = await geo.getApiCoordinatesResults(req);
            const newsRes = await news.getNews(weatherRes.search_country);
            const flagsRes = await flags(weatherRes.search_country);

            if (newsRes.length > 0) {
                weatherRes.news = newsRes;
            }

            if (flagsRes) {
                weatherRes.flag = flagsRes;
            }

            res.send(weatherRes);
        } catch (e) {
            res.status(400).send({errors: e.message});
        }
    });
};
