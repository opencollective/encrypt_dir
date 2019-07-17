const fs = require("fs");
const { decrypt, generateKey } = require("./");
const nodeDir = require("node-dir");
const pull = require("pull-stream");

const SUFFIX = ".encrypted";

const key = process.env.KEY;
if (!key)
  return console.error("KEY environment variable was not set, aborting");

console.log("key for encryptions is: ", key);

pull(
  pull.once(__dirname + "/files_to_decrypt"),
  pull.asyncMap((dir, cb) =>
    nodeDir.files(dir, "file", cb, { recursive: false })
  ),
  pull.flatten(),
  pull.asyncMap((fileName, cb) => {
    fs.readFile(fileName, (err, file) => {
      cb(err, { fileName, file });
    });
  }),
  pull.map(({ file, fileName }) => ({ file: decrypt(file, key), fileName })),
  pull.map(({ file, fileName }) => ({
    file,
    fileName: fileName.replace(new RegExp(SUFFIX), "")
  })),
  pull.asyncMap(({ file, fileName }, cb) => {
    fs.writeFile(fileName, file, cb);
  }),
  pull.collect((err, results) => {
    if (err) return console.log("Error encrypting: ", err);
    console.log(`Done encrypting ${results.length} files`);
  })
);
