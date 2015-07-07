'use strict';

var fs = require('fs');
var sass = require('node-sass');
var opts = { file: './demo/style.scss' };

sass.render(opts, function(error, result) {
  if (error) {
    console.log("Error compiling SASS:", error.status, error.column, error.message, error.line);
    return;
  }
  // Output to stylesheet
  fs.writeFileSync('./demo/style.css', result.css.toString());
});
