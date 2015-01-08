var fs = require('fs');
var path = require('path');

var jsxgettext = require('../../lib/jsxgettext');
var jsx = require('../../lib/parsers/jsx').jsx;

exports['test jsx'] = function (assert, cb) {
  var inputFilename = path.join(__dirname, '..', 'inputs', 'example.jsx');
  fs.readFile(inputFilename, 'utf8', function (err, source) {
    var result = jsxgettext.generate.apply(jsxgettext, jsx(
      {'inputs/example.jsx': source}, { keyword: ['Tr'] })
    );
    assert.equal(typeof result, 'string', 'result is a string');
    assert.ok(result.length > 1, 'result is not empty');
    assert.equal(result.split(/msgid ".+"/).length, 5, 'exactly 4 strings are found');
    assert.equal(result.split(/msgctxt ".+"/).length, 3, 'exactly 2 strings with context are found');
    assert.equal(result.split(/msgid_plural ".+"/).length, 3, 'exactly 2 strings with plural are found');
    cb();
  });
};

if (module === require.main) require('test').run(exports);
