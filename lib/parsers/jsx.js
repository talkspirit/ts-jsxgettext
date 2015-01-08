function parse(template, keywords) {
  
  //Extract the jsx text block matching the component keyword
  var extractTextBlocks = function(content, messages, regex) {
    var block;
    var cursor = 1;
    var output = [];
    var begin, end;
    while (cursor > -1) {
      cursor = content.search(regex.textStartTag);
      if (cursor > -1) {
        begin = cursor;
        end = content.indexOf(regex.textEndTag) + regex.textEndTag.length;
        block = content.substring(begin, end);
        output.push(block);
      } else {
        break;
      }
      content = content.substr(begin + block.length);
    }
    
    return extract(output, messages, regex);
  };
  //Extract the properties of the component and generate a js translation code
  var extract = function(textBlocks, messages, regex) {
    for (var textBlockIndex in textBlocks) {
      var attributes = [];
      var textBlock = textBlocks[textBlockIndex];
      var phrase = textBlock.replace(regex.phrase, '').replace(/[\n\s]+/g, ' ').trim();
      var attributeList = textBlock.match(regex.attributeList);
      if(attributeList) {
        attributeList = textBlock.match(regex.attributeList)[1].replace(/\s+/g, ' ').trim();
        var splitAttribsRegex = /(\w+?)(?:\s*)=(?:\s*)["](.*?)["]/g;
        while (true) {
          var res = splitAttribsRegex.exec(attributeList);
          if (res === null) {
            break;
          }
          attributes[res[1]] = res[2];
        }
      }
      //Generating the javascript translation
      messages += regex.keyword  + '("';
      messages += phrase;
      messages += '"';
      if(attributes['plural']) {
        messages += ', "';
        messages += attributes['plural'];
        messages += '"';
      }
      if(attributes['context']) {
        messages += ', {context: "';
        messages += attributes['context'];
        messages += '"}';
      }
      messages += ')\n';
    }
    return messages;
  };
  var messages = '';
   for(var keywordIndex in keywords) {
    var keyword = keywords[keywordIndex];
    messages = extractTextBlocks(template, messages, {
      keyword: keyword, 
      textStartTag : new RegExp('<' + keyword + '[^>]*>', 'm'),
      textEndTag: '</' + keyword + '>',
      phrase: new RegExp('^<' + keyword + '[^>]*>|<\/' + keyword + '>$', 'g'),
      attributeList : new RegExp('<' + keyword + '([^>]+)>')
    });
   }

   return messages;
}
// generate extracted strings file from Handlebars/Mustache templates
exports.jsx = function Jsx(hbSources, options) {
  Object.keys(hbSources).forEach(function(filename) {
    var parsed = parse(hbSources[filename], options.keyword);
    if (parsed) {
      hbSources[filename] = parsed;
    } else {
      delete hbSources[filename];
    }
  });
  console.log(hbSources);
  return [hbSources, options];
};