//getting address from form - showing map and weather - saving searches for later base on IP maybe

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const WeatherController = require('./controllers/geo'); //no need for geo.js since this file is with .js extension

var expressValidator = require('express-validator');

const app = express();
var geo = new WeatherController();

var logger = (req, res, next) => {
  console.log('logging....');
  next();
};

// app.use(logger); //logger will trigger whenever there is a request to the server, such as refreshing the main page. it must be above the routing in the code

//view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//body-parser middleware
app.use(bodyParser.json()); // handling json content
app.use(bodyParser.urlencoded({extended: false}));

//set static path
app.use(express.static(path.join(__dirname, 'public'))) //public folder for our app. now the app will search the index.html file and show it in the browser

//global vars
app.use((req, res, next) => {
  res.locals.errors = null;
  res.locals.form_parameters = {};
  res.locals.google_success = false;
  res.locals.weather_obj = null;
  res.locals.proximate_weather_array = [];
  next();
})

//express validator middleware
var middlewareOptions = {
  errorFormatter: function(param, msg, value) {
    var namespace = param.split('.'),
    root = namespace.shift(),
    formParam = root;

    while (namespace.length) {
      formParam += `[${namespace.shift()}]`;
    }
    return {
      param: formParam,
      msg: msg,
      value: value
    }
  }
};

app.use(expressValidator(middlewareOptions));

app.get('/', (req, res) => {
    geo.getPreviousSearches(res);
});

app.post('/address/search', (req, res) => {
    geo.getWeatherReport(req, res);
});

app.delete('/search/delete/:id', (req, res) => {
    geo.deletGeoRecord(req, res);
});

app.listen(3000, () => {
  console.log('server started on port 3000');
});
