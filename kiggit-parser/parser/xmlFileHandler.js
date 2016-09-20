"use strict";
var fs = require('fs');
var path = require('path');
var async = require('async');
var notParsed = "/xmlfiles/notParsed";
var parsed = "/xmlfiles/parsed";
var parser = require('./parser.js');

var MAX_FILES = 1000000; // max files to process at once

var parseFiles = function () {
    fs.readdir(notParsed, function(err, files) {
        if (err) {
            console.error("Could not list the directory.", err);
            process.exit(1);
        }

        async.eachLimit(files, MAX_FILES, function(file, callback) {
            var fromPath = path.join(notParsed, file);
            var toPath = path.join(parsed, file);
            console.log('Processing file ' + file);

            fs.stat(fromPath, function(error, stat) {
                if (error) {
                    console.error("Error stating file.", error);
                    return;
                }
                if (stat.isFile()) {
                    console.log("processing '%s'", fromPath);
                } else if (stat.isDirectory()) {
                    console.error("'%s' is a directory.", fromPath);
                }
                fs.readFile(fromPath, 'utf8', function(err, data) {
                    if (err) {
                        console.error(err);
                    } else {
                        parser(data, file, function(err) {
                            if (err) {
                                console.error('xmlFilehandler error: could not move file: ' + file + "   error: " + err )
                                callback()
                            } else  {
                                fs.rename(fromPath, toPath, function(error) {
                                    if (error) {
                                        callback("File moving error. caller: " + error);
                                    } else {
                                        console.log('xmlFilehandler: moving file ' + file )
                                        callback();
                                    }
                                });
                            }
                        });
                    }
                });
            });
        }, function(err) {
            if (err) {
                // One of the iterations produced an error.
                // All processing will now stop.
                console.log('A file failed to process');
                 setTimeout(parseFiles, 100);
            } else {
                
                setTimeout(parseFiles, 1);
            }
        });

    });
};
module.exports.parseFiles = parseFiles;
