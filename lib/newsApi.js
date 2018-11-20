const request = require("request");

const today = new Date().toJSON().slice(0,10);
const news_api_endpoint = `https://newsapi.org/v2/top-headlines?q={country}&from=${today}&sortBy=publishedAt&apiKey={api_key}`;
const all_news_api_endpoint = `https://newsapi.org/v2/everything?q={country}&from=${today}&sortBy=publishedAt&apiKey={api_key}`;

var newsApi = function(country, api_key, all_articles = false) {
    return new Promise((resolve, p_error) => {
        var url;
        if(all_articles) {
            url = all_news_api_endpoint.replace('{country}', country).replace('{api_key}', api_key);
        } else {
            url = news_api_endpoint.replace('{country}', country).replace('{api_key}', api_key);
        }

        console.log(url);

        try {
            request({
                url,
                json: true
            }, (w_error, w_response, w_body) => {
                if (w_error !== null || w_body.status !== 'ok') {
                    p_error(w_error);
                }

                var articles = [];
                var article_index = 0;

                //pick the top 3 (might be less than 3)
                do {
                    if(typeof w_body.articles[article_index] === 'undefined') {
                        break;
                    }

                    let article = w_body.articles[article_index];

                    let article_parts = {
                        title: article.title,
                        image: article.urlToImage,
                        link:  article.url,
                        source: article.source.name,
                    };

                    articles.push(article_parts);

                    article_index++
                } while(article_index < 3);

                resolve(articles);
            });
        } catch (e) {
            p_error(e)
        }
    });
};

module.exports = newsApi;