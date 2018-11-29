const csvtojson = require('csvtojson');
const _ = require('lodash');

const {country_index} = require('./country_index');

const csvFile = __dirname + '\\..\\public\\resources\\images\\country_flags.csv';

var getFlag = (country) => {
    if(country) {
        var country_name = country_index[country];

        return new Promise((resolve, reject) => {
            csvtojson().fromFile(csvFile)
                .then((jsonObj) => {
                    var picked = _.filter(jsonObj, x => x.Country === country_name);

                    if(picked && picked.length > 0) {
                        resolve(picked[0].ImageURL || '');
                    } else {
                        resolve('');
                    }
                }).catch((e) => {
                console.log(e.message);

                resolve('');
            });
        });
    } else {
        return Promise.resolve('');
    }
};

module.exports = getFlag;

