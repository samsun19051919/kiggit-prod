/*global config*/
"use strict";
var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var request = require('request');
var matchModel = require('../model/matchModel');
var betslipModel = require('../model/betslipModel');
var tournamentModel = require('../model/tournamentModel');
/**
 * Reset password for kiggit users
 */
router.get('/resetPassword/', function(req, res) {
  var user_id = req.query.user_id;
  res.render('index', {
    title: 'Kiggit. Reset Password',
    user_id: user_id,
    password: "pppp",
    code: "code"
  });
});
router.post('/resetPassword/', function(req, res) {
  var user_id = req.query.user_id;
  var body = req.body;
  body.user_id = user_id;
  delete body.confirmPassword;
  console.log(body);
  if (body.password.length < 6) {
    console.log("password to short ");
    res.render('index', {
      title: 'Kiggit. Reset Password',
      alert: "Password was to short. It should be at least 6 characters long"
    });
  } else {
    request({
        url: config.kiggit.serverUrl + "/users/password/forgot",
        method: 'PUT',
        json: body,
        rejectUnauthorized: false,
        requestCert: true,
        agent: false
      },
      function(error, response, responseBody) {
        if (error) {
          console.error(error);
          res.render('index', {
            title: 'Kiggit. Reset Password',
            alert: "Something went wrong the password was not changed"
          });
        } else {
          console.log(responseBody);
          res.render('index', {
            title: 'Kiggit. Reset Password',
            message: "Password was successfully changed"
          });
        }
      }
    );
  }
});

router.all('/*', function(req, res, next) {
  let token = req.cookies.jwt;
  //  var token = req.headers.token;

  jwt.verify(token, config.kiggit.secret, function(err, decoded) {
    if (decoded) {
      req.authenticated = decoded.userType;
      next();
    } else {

      req.authenticated = null;
      next();
    }
  });
});
router.get('/tournaments/getAll', function(req, res) {
  if (req.authenticated == 'admin') {
    tournamentModel.all(function(data) {
      res.json(data);
    });
  } else {
    res.json({
      message: 'Access denied'
    });
  }
});
router.post('/tournaments', function(req, res) {

  if (req.authenticated == 'admin') {
    var body = req.body.tournament;
    tournamentModel.update(body, function (err) {
      if(err){
        console.error(err);
        return;
      }
      res.json({message: 'row saved'});
    });
  } else {
    res.json({
      message: 'Access denied'
    });
  }
});
router.get('/betslips/getAll', function(req, res) {
  if (req.authenticated == 'admin') {
    betslipModel.all(function(data) {
      res.json(data);
    });
  } else {
    res.json({
      message: 'Access denied'
    });
  }
});
router.post('/kiggitbetslip_create', function(req, res) {

  if (req.authenticated == 'admin') {
    var body = req.body;
    var predictions = body.matches.reduce(function(newArray, p) {
      if (p.bettype.result) {
        newArray.push({
          match_id: p.match_id,
          type: 1
        });
      }
      if (p.bettype.outcome) {
        newArray.push({
          match_id: p.match_id,
          type: 2
        });
      }
      return newArray;
    }, []);

    var newBody = {
      data: {
        creator: config.kiggit.kiggitUserId,
        bet_size: body.betsize *100,
        price: 1,
        betslip_type: "kiggit",
        predictions: predictions
      }
    };
    request({
        url: config.kiggit.serverUrl + "/betslips/create",
        method: 'POST',
        json: newBody,
        rejectUnauthorized: false,
        requestCert: true,
        agent: false
      },
      function(error, response, body) {
        if (error) {
          console.log(error);
          res.json(response);
        } else {
          res.json(body);
        }
      }
    );
  } else {
    res.json({
      message: 'Access denied'
    });
  }
});
router.get('/upcoming', function(req, res) {
  if (req.authenticated == 'admin') {
    matchModel.upcoming(function(data) {
      res.json(data);
    });
  } else {
    res.json({
      message: 'Access denied'
    });
  }
});

router.get('/out', function(req, res) {
  if (req.authenticated == 'admin') {
    res.sendFile('/logfiles/out.log');
  } else {
    res.json({
      message: 'Access denied'
    });
  }
});
router.get('/err', function(req, res) {
  if (req.authenticated == 'admin') {
    res.sendFile('/logfiles/err.log');
  } else {
    res.json({
      message: 'Access denied'
    });
  }
});
/**
 * Send the index.html file
 */
router.get('/', function(req, res) {
  res.sendFile('./public/index.html');
});


module.exports = router;