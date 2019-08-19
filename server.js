const express = require('express');
const app = express();
const port = 3100;
const fetch = require('node-fetch');
const https = require('https');
const agent = new https.Agent({ keepAlive: true });
const Memcached = require('memcached');

let memcached = new Memcached('127.0.0.1:11211');

let memcachedMiddleware = (duration) => {
  return (req, res, next) => {
    let key = '__express__' + req.originalUrl || req.url;
    memcached.get(key, function(err, data) {
      if (data) {
        res.send(data);
        return;
      } else {
        res.sendResponse = res.send;
        res.send = (body) => {
          memcached.set(key, body, duration, function(err) {
            //err
          });
          res.sendResponse(body);
        };
        next();
      }
    });
  };
};

const wtf = function() {
  return {
    xmlbuilder: function(host) {
      let xml = '<?xml version="1.0" encoding="UTF-8"?>';
      xml +=
        '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`';
      // graphql limited to 100 for now
      // when that limit is solved,  use  results.data.sitemap.totalPages
      for (let page = 1; page <= 100; page++) {
        xml += '<sitemap>';
        xml += `<loc>http://${host}/sitemap/urlset/${page}</loc>`;
        xml += '</sitemap>';
      }
      xml += '</sitemapindex>';
      return xml;
    },
    makeQuery: async function() {
      return await fetch('https://cms.splendidtable.org/api/home', {
        method: 'GET',
        agent: agent
      })
        .then((response) => {
          return response.json();
        })
        .then((response) => {
          return response;
        })
        .catch((err) => {
          // eslint-disable-next-line
          console.error('Error: ', err);
        });
    }
  };
};

app.get('/', memcachedMiddleware(20), (req, res) => {
  const pageSize = 100;
  const query = JSON.stringify({
    query: `
        {
          sitemap: contentList(contentAreaSlug: "mprnews", contentTypes: [STORIES, PAGES, EPISODES], pageSize:${pageSize}) {
            totalPages
          }
        }
      `
  });

  let wtfReally = new wtf();
  const queryRes = wtfReally.makeQuery(query);
  const xml = wtfReally.xmlbuilder(req.headers.host);
  res.setHeader('Content-Type', 'text/xml');
  wtfReally = null;
  res.end(xml);
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
