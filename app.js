//getting address from form - showing map and weather - saving searches for later base on IP maybe

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const ip = require('ip');
const mongojs = require('mongojs');
const request = require('request');

const db = mongojs('address_searches', ['searches']); //specifiyng the database and table(s)
const ObjectId = mongojs.ObjectId;
const user_ip = ip.address();

const google_api_endpoint = 'https://maps.googleapis.com/maps/api/geocode/json?address=';
const weather_api_endpoint = 'http://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={your_key}';

var expressValidator = require('express-validator');

const app = express();

var logger = (req, res, next) => {
  console.log('logging....');
  next();
};

// app.use(logger); //logger will trigger whenever there is a request to the server, such as refreshing the main page. it must be above the routing in the code

var renderError = (errors, form_parameters, res) => {
  db.searches.find({ip: user_ip}, (err, docs) => {
    res.render('index', {
      title: 'Get weather result',
      errors,
      form_parameters,
      previous_searches: docs
    });
  });
};

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
  //fetching users from users table
  db.searches.find({ip: user_ip}, (err, docs) =>{
      res.render('index', {
        title: 'Get weather result',
        previous_searches: docs
      }); //will fetch the index file aaccording app.set('views') config
  });
});

var checkQueryExists = (request_body) => {
  var existing_addresses = JSON.parse(request_body.existing_addresses);
  if(existing_addresses.length === 0) {
    return false;
  };

  var new_address = {address: request_body.address, city: request_body.city, country: request_body.country};

  for(var i = 0; i <= existing_addresses.length - 1; i++) {
    if(existing_addresses[i].address === new_address.address
      && existing_addresses[i].city === new_address.city
      && existing_addresses[i].country === new_address.country) {
        return true;
    }
  }

  return false;
};

app.post('/address/search', (req, res) => {

  var check_query_exists = checkQueryExists(req.body);

  // console.log(req.body.first_name);
  req.checkBody('address', 'address is reuired').notEmpty(); //express validator for empty value
  req.checkBody('city', 'City is required')
  req.checkBody('country', 'country is reuired').notEmpty();

  var errors = req.validationErrors(); //checking for erros based on validator

  console.log(errors);

  var address = req.body.address;
  var city = req.body.city;
  var country = req.body.country;

  form_parameters = {
    address,
    city,
    country
  };

  if(errors) {
    //re-rendering the form
    renderError(errors, form_parameters, res);
  } else {
    request({
      url: `${google_api_endpoint}${address} ${city} ${country}`,
      json: true
    }, (error, response, body) => {
        if(error || body.error_message) {
          if(error !== null) {
            console.log('error occured');
          } else {
            var request_error_array = [
              {
                msg: body.error_message
              }
            ];

            renderError(request_error_array, form_parameters, res);
          }
        } else {
          if(body.results.length === 0 || body.status === 'ZERO_RESULTS') {
            //zero results - re-rendering the form
            var request_error_array = [
              {
                msg: body.status
              }
            ];

            renderError(request_error_array, form_parameters, res);
          } else {
            var latitude = body.results[0].geometry.location.lat;
            var longtitude = body.results[0].geometry.location.lng;

            var weather_url = weather_api_endpoint.replace('{lat}', latitude).replace('{lon}', longtitude);

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

                console.log('weather error', w_error);
                renderError(request_error_array, form_parameters, res);
              } else {

                var weather_obj = {
                  temperature: w_body.main.temp - 273.15, //kelvin to celsius
                  humidity_percent: w_body.main.humidity,
                  clouds: w_body.weather[0].description,
                  wind: w_body.wind.speed * 3.6//meters per second * 3.6 = km/hour
                }

                var newSearch = {
                  address,
                  city,
                  country,
                  ip: user_ip
                };

                if(check_query_exists) {
                  //already has the same address and IP in DB
                  db.searches.find({ip: user_ip}, (err, docs) => {
                    form_parameters.formatted_address = body.results[0].formatted_address;

                    res.render('index', {
                      title: 'Get weather result',
                      form_parameters,
                      previous_searches: docs,
                      google_success: true,
                      weather_obj
                    });
                  });
                } else {
                  //doesnt have the same address and IP. insert it.
                  db.searches.insert(newSearch, (err, result) => {
                    if(err) {
                      console.log(err);
                    }

                    db.searches.find({ip: user_ip}, (err, docs) => {
                      form_parameters.formatted_address = body.results[0].formatted_address;

                      res.render('index', {
                        title: 'Get weather result',
                        form_parameters,
                        previous_searches: docs,
                        google_success: true,
                        weather_obj
                      });
                    });
                  });
                }

                console.log('success');
              }
            });
          }
        }
    });
  }
});

app.delete('/search/delete/:id', (req, res) => {
  db.searches.remove({_id: ObjectId(req.params.id)}, (err) => {
    if(err) {
      console.log(err);
    }

    res.redirect('/');
  });
});

app.listen(3000, () => {
  console.log('server started on port 3000');
});
