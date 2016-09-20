'use strict';
var express = require('express');
var router = express.Router();
var fs = require('fs');
var md5 = require('MD5');

router.get('/', function(req, res) {
  console.log("got browser request so Im up");
  res.sendfile('/www/body.log');
});

router.post('/feed1', function(req, res) {
  var contentType = req.headers['content-type'];
  var shortType = "";
  var type = "_notypedtected_";
  var rawXML;
  if (contentType === 'text/xml') {
    shortType = "text";
    type = 'text_';
    rawXML = req.body;
    if (rawXML.substring(0, 6).valueOf() === 'stats='.valueOf()) {
      rawXML = rawXML.slice(6);
    }

  } else if (contentType === 'application/x-www-form-urlencoded') {
    shortType = "urlencoded";
    console.log("received application/x-www-form-urlencoded");
    if (req.body.data) {
      rawXML = req.body.data;
      type = 'data';
    }
    if (req.body.static) {
      rawXML = req.body.static;
      type = 'static';
    }

  } else {
    console.error("Unexpected content-type header: " + contentType + "to " + req.url);
  }

  var hash = md5(rawXML);
  fs.appendFile('/xmlfiles/notParsed/' + type + "_" + shortType + "_" + new Date().valueOf() + "_" + hash, rawXML, function(err) {
    if (err) {
      res.set('Content-Type', 'text/plain');
      res.status(500).send('Something broke!');
    } else {
      res.set('Content-Type', 'text/plain');
      res.send('XML_RECEIVED_OK\n');
    }
  });

  //res.send('\n');
});


router.post('/bet', function(req, res) {
  var contentType = req.headers['content-type'];
  var shortType = "";
  var type = "_notypedtected_";
  var rawXML;
  if (contentType === 'text/xml') {
    shortType = "text";
    type = 'text_';
    rawXML = req.body;
    if (rawXML.substring(0, 6).valueOf() === 'stats='.valueOf()) {
      rawXML = rawXML.slice(6);
    }

  } else if (contentType === 'application/x-www-form-urlencoded') {
    shortType = "urlencoded";
    if (req.body.data) {
      rawXML = req.body.data;
      type = 'data';
    }
    if (req.body.static) {
      rawXML = req.body.static;
      type = 'static';
    }

  } else {
    console.error("Unexpected content-type header: " + contentType + "to " + req.url);
  }

  var hash = md5(rawXML);
  fs.appendFile('/xmlfiles/notParsed/' + 'bet_' + type + "_" + shortType + "_" + new Date().valueOf() + "_" + hash, rawXML, function(err) {
    if (err) {
      res.set('Content-Type', 'text/plain');
      res.status(500).send('Something broke!');
      console.error("file not received correctly: ");
    } else if (rawXML.indexOf("</BetradarBetData>") === -1) {
      res.set('Content-Type', 'text/plain');
      res.status(500).send('Something broke!');
      console.error("file not received correctly: ");
    } else {
      res.set('Content-Type', 'text/plain');
      res.send('XML_RECEIVED_OK\n');
    }
  });
});
router.post('*', function(req, res) {
  console.log("wrong URL " + req.originalUrl);
  res.status(404).send('Sorry, we cannot find that!');
});

module.exports = router;