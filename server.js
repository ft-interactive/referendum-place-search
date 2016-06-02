const http = require('http');
const fs = require('fs');
const url = require('url');
const csv = require('csv-parser');
const LRU = require('./lru-cache');

const PORT = process.env.PORT || '9999';

const cache = LRU(1.5e6);

const error_cache = LRU({
  max: 10000,
  maxAge: 60
});

const match_postcode = /[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}/g;
const match_outcode = /^[A-Z]{1,2}[0-9][0-9A-Z]/g;
const match_incode = /[0-9][A-Z]{2}$/g;


// TODO: uncaught exception handler

function postcode_to_gss_code(postcode, cb) {

  postcode = postcode.toUpperCase();

  if (postcode.indexOf(' ') === -1) {
    const oc = postcode.length - 3;
    postcode = postcode.substr(0, oc) + ' ' + postcode.substr(oc);
  }

  if (error_cache.has(postcode)) {
    cb(null, '');
    return;
  }

  // Northern Ireland
  if (postcode.startsWith('BT')) {
    cb(null, 'N92000002');
    return;
  }

  // Gibralter
  if (postcode.startsWith('GX')) {
    cb(null, 'G99999999');
    return;
  }

  // Return the LA code if already cached
  if (cache.has(postcode)) {
    cb(null, cache.get(postcode));
    return;
  }

  let sent = false;

  function send_error(e) {
    if (sent) return;
    error_cache.set(postcode, true);
    if (e instanceof Error) {
      if (e.code === 'ENOENT') {
        e = new Error('No such file');
      }
      cb(e, '');
    } else {
      cb(null, '');
    }
  }

  const stream = fs.createReadStream('data/test.csv');
  stream.on('error', send_error);
  stream.pipe(csv())
        .on('data', data => {
          cache.set(data.pc, data.ca);
          if (data.pc === postcode) {
            cb(null, data.ca)
            sent = true;
          }
        })
        .on('end', send_error)
        .on('error', send_error);

}

function handleRequest(request, response){

    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Cache-Control', 'max-age=31536000');
    response.setHeader('Content-Type', 'text/plain');

    const url_params = url.parse(request.url, true);
    const q = url_params.query.q;

    if (!q) {
      response.statusCode = 400;
      response.end('q parameter required');
      return;
    }

    const postcode = (q.toUpperCase().match(match_postcode) || [])[0];

    if (!postcode) {
      response.statusCode = 400;
      response.end('a valid postcode is required');
      return;
    }

    postcode_to_gss_code(postcode, (err, gss_code) => {
      if (err) {
        console.error(err.stack);
        response.statusCode = 500;
        response.end(err.message);
      } else if (!gss_code) {
        response.statusCode = 404;
        response.end('not found');
      } else {
        response.statusCode = 200;
        response.end(gss_code);
      }
    });
}

const server = http.createServer(handleRequest);

server.listen(PORT, function(){
    console.log("Server listening on: http://localhost:%s", PORT);
});
