"use strict";
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
var fs = require('fs');
var path = require('path');
var parser = require('acorn');
var traverse = require('acorn/util/walk').simple;
var gettextParser = require('gettext-parser');
var regExpEscape = require('escape-string-regexp');

function isStringLiteral(node) {
  return node.type === 'Literal' && (typeof node.value === 'string');
}

function isObjectExp(node) {
  return node.type === 'ObjectExpression';
}

function isStrConcatExpr(node) {
  var left = node.left;
  var right = node.right;
  return node.type === "BinaryExpression" && node.operator === '+' && (
    (isStringLiteral(left) || isStrConcatExpr(left)) && (isStringLiteral(right) || isStrConcatExpr(right)));
}

function isValidArg(arg) {
  return (arg && (isStrConcatExpr(arg) || isStringLiteral(arg) || isObjectExp(arg)));
}

function extractArgs(args) {
  var results = args.filter(function(arg) {
    return isValidArg(arg);
  });
  return results.length > 0 ? results : false;
}

function getTranslatable(node, options) {
  // must be a call expression with arguments
  if (!node.arguments) return false;
  var callee = node.callee;
  var funcName = callee.name;
  var args = node.arguments;
  var prop;
  if (!funcName) {
    if (callee.type !== 'MemberExpression') return false;
    // Special case for functionName.call calls
    if (callee.property.name === 'call') {
      prop = callee.object.property;
      funcName = callee.object.name || prop && (prop.name || prop.value);
      args = node.arguments.slice(1); // skip context object
    } else {
      funcName = callee.property.name;
    }
  }
  if (options.keyword.indexOf(funcName) === -1) return false;
  var parsedArguments = extractArgs(args);
  if (parsedArguments) {
    return parsedArguments;
  }
  if (options.sanity) throw new Error("Could not parse translatable: " + JSON.stringify(args, null, 2));
}
// Assumes node is either a string Literal or a strConcatExpression
function extractStr(node, key) {
  if (isStringLiteral(node)) return node.value;
  else if (isObjectExp(node) && key) {
    if (node.properties) {
      var prop, propIndex;
      for (propIndex in node.properties) {
        prop = node.properties[propIndex];
        if (prop.key.name === key) {
          return prop.value.value;
        }
      }
    }
    return node.value;
  } else return extractStr(node.left) + extractStr(node.right);
}

function loadStrings(poFile) {
  try {
    return gettextParser.po.parse(fs.readFileSync(path.resolve(poFile)), "utf-8");
  } catch (e) {
    return null;
  }
}

function parse(sources, options) {
  var useExisting = options.joinExisting;
  var poJSON;
  if (useExisting) poJSON = loadStrings(path.resolve(path.join(options.outputDir || '', options.output)));
  if (!poJSON) {
    var headers = {
      "project-id-version": options.projectIdVersion || "PACKAGE VERSION",
      "language-team": "LANGUAGE <LL@li.org>",
      "report-msgid-bugs-to": options.reportBugsTo,
      "po-revision-date": "YEAR-MO-DA HO:MI+ZONE",
      "language": "",
      "mime-version": "1.0",
      "content-type": "text/plain; charset=utf-8",
      "content-transfer-encoding": "8bit"
    };
    poJSON = {
      charset: "utf-8",
      headers: headers,
      translations: {
        '': {}
      }
    };
  }
  var translations;
  try {
    poJSON.headers["pot-creation-date"] = new Date().toISOString().replace('T', ' ').replace(/:\d{2}.\d{3}Z/, '+0000');
    // Always use the default context for now
    // TODO: Take into account different contexts
    translations = poJSON.translations[''];
  } catch (err) {
    if (useExisting) throw new Error("An error occurred while using the provided PO file. Please make sure it is valid by using `msgfmt -c`.");
    else throw err;
  }
  options.keyword = options.keyword || ['gettext'];
  var tagName = options.addComments || "L10n:";
  var commentRegex = new RegExp(["^\\s*" + regExpEscape(tagName), // The "TAG" provided externally or "L10n:" by default
    "^\\/" // The "///" style comments which is the xgettext standard
  ].join("|"));
  Object.keys(sources).forEach(function(filename) {
    var source = sources[filename].replace(/^#.*/, ''); // strip leading hash-bang
    var astComments = [];
    var ast = parser.parse(source, {
      onComment: function(block, text, start, end, line /*, column*/ ) {
        text = text.match(commentRegex) && text.replace(/^\//, '').trim();
        if (!text) return;
        astComments.push({
          line: line,
          value: text
        });
      },
      locations: true
    });
    // finds comments that end on the previous line
    function findComments(comments, line) {
      return comments.map(function(node) {
        var commentLine = node.line.line;
        if (commentLine === line || commentLine + 1 === line) {
          return node.value;
        }
      }).filter(Boolean).join('\n');
    }
    traverse(ast, {
      'CallExpression': function(node) {
        var args = getTranslatable(node, options);
        if (!args) return;
        var msgid = extractStr(args[0]);
        var line = node.loc.start.line;
        var comments = findComments(astComments, line);
        var ref = filename + ':' + line;
        if (!translations[msgid]) {
          translations[msgid] = {
            msgid: msgid,
            msgstr: [],
            comments: {
              extracted: comments,
              reference: ref
            }
          };

          //Second argument may be either the plural or the object with context
          if (args.length > 1) {
            //If it's a string, it's the plural
            if (args[1].type === 'Literal') {
              translations[msgid].msgid_plural = extractStr(args[1]);
            } 
            //Oherwise, it's the object with a context
            else if (args[1].type === 'ObjectExpression') {
              var param1 = extractStr(args[1], 'context');
              if (param1) {
                translations[msgid].msgctxt = param1;
              }
            }
            //Third argument is the context
            if (args.length > 2) {
              var param2 = extractStr(args[2], 'context');
              if (param2) {
                translations[msgid].msgctxt = param2;
              }
            }
          }
        } else {
          translations[msgid].comments.reference += '\n' + ref;
          if (comments) translations[msgid].comments.extracted += '\n' + comments;
        }
      }
    });

    function dedupeNCoalesce(item, i, arr) {
      return item && arr.indexOf(item) === i;
    }
    Object.keys(translations).forEach(function(msgid) {
      var comments = translations[msgid].comments;
      if (!comments) return;
      if (comments.reference) comments.reference = comments.reference.split('\n').filter(dedupeNCoalesce).join('\n');
      if (comments.extracted) comments.extracted = comments.extracted.split('\n').filter(dedupeNCoalesce).join('\n');
    });
  });
  return poJSON;
}
exports.parse = parse;
// generate extracted strings file
function gen(sources, options) {
  return gettextParser.po.compile(parse(sources, options)).toString();
}
exports.generate = gen;
// Backwards compatibility interface for 0.3.x - Deprecated!
var parsers = require('./parsers');
Object.keys(parsers).forEach(function(parser) {
  parser = parsers[parser];
  exports['generateFrom' + parser.name] = parser;
});