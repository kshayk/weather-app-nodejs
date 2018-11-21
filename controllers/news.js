const api_keys = require('../api_keys');
const {country_index} = require('../lib/country_index');
const newsApi = require('../lib/newsApi');

class News {
    constructor() {

    }

    getNews(search_country) {
        return new Promise((resolve, p_error) => {
            if (search_country) {
                var country_name = country_index[search_country];
                var encoded_country_name = encodeURI(country_name);

                //get news for that country based on country code
                newsApi(encoded_country_name, api_keys.news_api)
                    .then((data) => {
                        resolve(data);
                    }).catch((e) => {
                        console.log('news error', e);
                        p_error({errors: "Failed to get "});
                    });
            } else {
                resolve([]);
            }
        });
    }
}

module.exports = News;
