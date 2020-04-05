#!/usr/bin/env node
import { sync } from "fast-glob";
import { promises, createReadStream, createWriteStream } from "fs";
import * as tmp from "tmp";

import { createInterface, ReadLineOptions } from "readline";

const patterns = process.argv.slice(2);
if (!patterns.length) {
  console.log("You should specify filenames or globs to process");
  process.exit(0);
}

const files = sync(patterns, { unique: true });

(async () => {
  for (const file of files) {
    await new Promise(async (resolve) => {
      {
        tmp.file({}, (_err, name, _fd) => {
          let trailingWhitespacesFound = false;
          if (_err) {
            console.log("ERR", _err);
          }
          const writeInterface = createWriteStream(name, {
            flags: "a",
            fd: _fd,
          });
          writeInterface.on("finish", async function () {
            if (trailingWhitespacesFound) await promises.copyFile(name, file);
            resolve();
          });
          const readInterface = createInterface({
            input: createReadStream(file),
            output: writeInterface,
          });
          readInterface
            .on("line", function (line) {
              const trimmed = line.trimRight();
              if (trimmed.length < line.length) {
                trailingWhitespacesFound = true;
              }
              // @ts-ignore
              (this as ReadLineOptions).output!.write(trimmed + "\n");
            })
            .on("close", async function () {
              // @ts-ignore
              (this as ReadLineOptions).output!.end();
            });
        });
      }
    });
  }
})();
