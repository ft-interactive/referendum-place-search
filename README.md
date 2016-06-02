# EU referendum place search

## Run locally

```
npm start
```

## Using the service

**`/?q={POSTCODE}`**

Returns the GSS code for the local EU referendum voting area. If the postcode isn't geographic or is for a place not voting in the referendum then returns a `404`.

The space between the outcode and incode is optional: both `SE19HL` and `SE1 9HL` are fine. Also the postcode can be upper or lower case.

Invalid postcodes will get a `400` error.

Example:

```
curl -v "http://localhost:9999/?q=SE19HL"

HTTP/1.1 200 OK
Access-Control-Allow-Origin: *
Cache-Control: max-age=31536000
Content-Type: text/plain

E09000028
```

**`/__gtg`**

Used to test the service is alive. Simply returns a `200` statusCode and and `OK` in the body.
