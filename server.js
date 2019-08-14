const express = require('express')
const app = express()
const port = 3000
const fetch = require('node-fetch')

const pageSize = 100;
  // RSS feeds for collections
  app.get(`/sitemap`, (req, res) => {
    res.header('Content-Type', 'text/xml');
    let xml = '<?xml version="1.0" encoding="UTF-8"?>';
    const query = JSON.stringify({
      query: `
        {
          sitemap: contentList(contentAreaSlug: "mprnews", contentTypes: [STORIES, PAGES, EPISODES], pageSize:${pageSize}) {
            totalPages
          }
        }
      `
    });
    xml +=
      '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`';
    const fetchFeedData = async (query) => {
      return await fetch("https://cmsproxy.publicradio.org/api/v1/graphql", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: query
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
    };
    const queryRes = fetchFeedData(query);
    queryRes.then(() => {
      // graphql limited to 100 for now
      // when that limit is solved,  use  results.data.sitemap.totalPages
      for (let page = 1; page <= 100; page++) {
        xml += '<sitemap>';
        xml += `<loc>${req.protocol}://${req.headers.host}/sitemap/urlset/${page}</loc>`;
        xml += '</sitemap>';
      }
      xml += '</sitemapindex>';
      res.set('Cache-Control', 'public, max-age=1800'); // 30 minutes
      res.send(xml);
    });
  });


app.listen(port, () => console.log(`Example app listening on port ${port}!`))
