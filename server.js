const http = require('http');
const port = 3100;
const fetch = require('node-fetch');

const app = {
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
  makeQuery: function(query) {
    return fetch('https://cmsproxy.publicradio.org/api/v1/graphql', {
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
  }
};

function requestHandler(req, res) {
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

  const queryRes = app.makeQuery(query);
  queryRes.then(() => {
    const xml = app.xmlbuilder(req.headers.host);
    res.setHeader('Content-Type', 'text/xml');
    res.end(xml);
  });
}

const server = http.createServer(requestHandler);

server.listen(port, () =>
  console.log(`Example app listening on port ${port}!`)
);
