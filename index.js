#!/usr/bin/env node

const fg = require("fast-glob");
const readline = require("readline");
const fs = require("fs");
const tmp = require("tmp");
const removeTrailingSpaces = require("remove-trailing-spaces");

const patterns = process.argv.slice(2);

const files = fg.sync(patterns, { unique: true });
console.log(process.argv);
console.log(files);
for (const i of files) {
  const tmpobj = tmp.fileSync();
  const readInterface = readline.createInterface({
    input: fs.createReadStream(i),
    output: fs.createWriteStream(tmpobj.name, { flags: "a" }),
    console: false
  });

  readInterface
    .on("line", function(line) {
      this.output.write(removeTrailingSpaces(line) + "\n");
    })
    .on("close", function(line) {
      this.output.end();
      fs.copyFileSync(tmpobj.name, i);
      tmpobj.removeCallback();
    });
}
