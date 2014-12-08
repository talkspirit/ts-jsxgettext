# tk-jsxgettext
Created from the node module jsxgettext (https://github.com/zaach/jsxgettext)

A node module with a CLI that extracts gettext strings from JavaScript, EJS, and Handlebars files. Uses a real parser, [acorn](https://github.com/marijnh/acorn), for JavaScript files and recognizes the following uses:

```javascript
tr("Hello world!");
tr("Hello" + ' world!');
tr("My message", "My messages", {context:"wall", count:3} );

```
```ejs
<div><%= tr("Hello world!");%></div>
<div><% tr("Hello" + ' world!'); %></div>

```

```handlebars
<div>{{tr "Hello world!" }}</div>
</div>{{tr "My message" "My messages" context:"wall" count="3" }}</div>

```


## Use

    $ jsxgettext


    Usage: jsxgettext [options] [file ...]
  
    Options:
  
      -h, --help                      output usage information
      -V, --version                   output the version number
      -o, --output <file>             write output to specified <file>
      -p, --output-dir <path>         output files will be placed in directory <path>
      -k, --keyword [keywords]        additional keywords to be looked for
      -j, --join-existing             join messages with existing file
      -L, --language [lang]           use the specified language (javascript, ejs,handlebars) [javascript]
      -s, --sanity                    sanity check during the extraction
      --project-id-version [version]  This is the project name and version of the generated package/catalog.