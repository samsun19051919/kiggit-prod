/*global config*/
"use strict";
var express = require('express');
var router = express.Router();
var userModel = require('../model/userModel');
var jwt = require('jsonwebtoken');
var util = require('util');
var bcrypt = require('bcrypt');
const saltRounds = 10;
/**
 * Autheticate a user
 */
router.post('/authenticate', function(req, res) {
  var received = req.body;
  userModel.getUser(received.email, function(result) {
    //if there was no data in the db
    if (result === undefined) {
      res.json({
        success: false,
        message: "Audthentication failed reult undefined"
      });
    } else {
      bcrypt.compare(received.password, result.password, function(err, authSucess) {
        if (!authSucess) {
          res.json({
            success: false,
            message: "Authentication failed"
          });
        } else {
          var token = jwt.sign({
            userType: 'admin'
          }, config.kiggit.secret);
          res.cookie("jwt", token);
          res.json({
            success: true,
            message: "you are authenticated",
            token: token
          });
        }

      });
    }
  });
});
/**
 * Middleware that check if a user is authenticated.
 * sets req.autheticated to the type of user
 */
router.all('/*', function(req, res, next) {
  let token = req.cookies.jwt;
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
router.get('/getAllUsers', function(req, res) {
  if (req.authenticated == 'admin') {
    userModel.all(function(data) {
      res.json(data);
    });
  } else {
    res.json({
      message: 'Access denied'
    });
  }
});
router.post('/updateUser', function(req, res) {
  if ((req.authenticated == 'admin')) {
    var json = req.body;
    json.userrights = 1;
    var passw = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,20}$/; 
    if(!(json.password.match(passw))){
      res.json({err: "The password should be at least 8 characters and contain at least one numeric digit, one uppercase and one lowercase letter"});
    } else {
      bcrypt.hash(json.password, saltRounds, function(err, hash) {
        json.hash = hash;
        userModel.updateUser(json, function(err, result) {
          if (err) {
            res.json(err);
            console.error("users.js updateUser error: " + util.inspect(err, false, null));
            return;
          }
          res.json({
            message: 'updated user'
          });
        });
      });
    }
  } else {
    res.json({
      message: 'Access denied'
    });
  }
});
router.get('*', function(req, res) {
  res.send("404. We don't know that page");
});

module.exports = router;