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

//set static path
app.use(express.static(path.join(__dirname, 'public'))); //public folder for our app. now the app will search the index.html file and show it in the browser

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

//use routes outside of app.js
require('./routes')(app, geo, bodyParser, expressValidator(middlewareOptions));

app.listen(8080, () => {
  console.log('server started on port 8080');
});
