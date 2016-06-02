const http = require('http');
const fs = require('fs');
const PORT = process.env.PORT || '9999';


function postcode_to_gss_code(postcode) {
  return 'E000001';
}

function handleRequest(request, response){
    response.setHeader('Access-Control-Allow-Origin', '*');
    let gss_code = postcode_to_gss_code('foobar');
    response.end(gss_code || '');
}

const server = http.createServer(handleRequest);

server.listen(PORT, function(){
    console.log("Server listening on: http://localhost:%s", PORT);
});
