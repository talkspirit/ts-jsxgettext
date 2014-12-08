"use strict";

var fs = require('fs');
var path = require('path');

var jsxgettext = require('../../lib/jsxgettext');
var handlebars = require('../../lib/parsers/handlebars').handlebars;

exports['test handlebars'] = function (assert, cb) {
  var inputFilename = path.join(__dirname, '..', 'inputs', 'example.handlebars');
  fs.readFile(inputFilename, "utf8", function (err, source) {
    var result = jsxgettext.generate.apply(jsxgettext, handlebars(
      {'inputs/example.handlebars': source}, { keyword: ['gettext'] })
    );
    assert.equal(typeof result, 'string', 'result is a string');
    assert.ok(result.length > 1, 'result is not empty');
    assert.equal(result.split(/msgid ".+"/).length, 6, 'exactly five strings are found');
    assert.equal(result.split(/msgctxt ".+"/).length, 3, 'exactly 2 strings with context are found');
    assert.equal(result.split(/msgid_plural ".+"/).length, 3, 'exactly 2 strings with plural are found');
    cb();
  });
};

if (module === require.main) require('test').run(exports);
