var Handlebars = require('handlebars');

function parse(template, keywords) {
  var tree = Handlebars.parse(template);
  var isMsg = function(msgs, statement) {
    statement = statement.sexpr || statement;
    switch (statement.type) {
      case 'sexpr':
        if (keywords && keywords.indexOf(statement.id.string) >= 0) {
          var param = statement.params[0];
          msgs += statement.id.string;
          msgs += '("';
          msgs += param.string;
          msgs += '"';
          if (statement.params[1]) {
            msgs += ', "';
            msgs += statement.params[1].string;
            msgs += '"';
          }

          if (statement.hash) {
            var hashInd;
            for (hashInd in statement.hash.pairs) {
              if (statement.hash.pairs[hashInd][0] === 'context') {
                msgs += ', {context: "';
                msgs += statement.hash.pairs[hashInd][1].string;
                msgs += '"}';
              }
            }
          }
          if (statement.params[2]) {
            msgs += ', "';
            msgs += statement.params[1].string.replace(/"/g, '\\"');
            msgs += '"';
          }

          msgs += ')\n';
        }
        msgs = statement.params.reduce(isMsg, msgs);
        
        break;
      case 'block':

        if (statement.program) {
          msgs = statement.program.statements.reduce(isMsg, msgs);
        }
        if (statement.inverse) {
          msgs = statement.inverse.statements.reduce(isMsg, msgs);
        }
        break;
      default:
      break;
    }
    return msgs;
  };
  return tree.statements.reduce(isMsg, '');
}
// generate extracted strings file from Handlebars/Mustache templates
exports.handlebars = function Handlebars(hbSources, options) {
  Object.keys(hbSources).forEach(function(filename) {
    var parsed = parse(hbSources[filename], options.keyword);
    if (parsed) {
      hbSources[filename] = parsed;
    } else {
      delete hbSources[filename];
    }
  });
  return [hbSources, options];
};