module.exports = (app, geo, bodyParser, expressValidator) => {

    //global vars
    app.use((req, res, next) => {
      res.locals.errors = null;
      res.locals.form_parameters = {};
      res.locals.google_success = false;
      res.locals.weather_obj = null;
      res.locals.proximate_weather_array = [];
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
        geo.getWeatherReport(req, res);
    });

    app.delete('/search/delete/:id', (req, res) => {
        geo.deletGeoRecord(req, res);
    });
}
