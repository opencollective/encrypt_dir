const fs = require("fs");
const { decrypt, generateKey } = require("./");
const nodeDir = require("node-dir");
const pull = require("pull-stream");
const path = require("path");

const key = process.env.KEY;
if (!key) {
  return console.error("KEY environment variable was not set, aborting");
}

const filesToIgnore = [
  "robots.txt",
  // Not sure where this one is coming from, it's not linked in the DB
  "US_TAX_FORM_matthew-davis1.pdf",
  "US_TAX_FORM_matthew-davis1.pdf.encrypted",
];

pull(
  pull.once(__dirname + "/files_to_decrypt"),
  pull.asyncMap((dir, cb) =>
    nodeDir.files(dir, "file", cb, { recursive: true })
  ),
  pull.flatten(),
  pull.asyncMap((fileName, cb) => {
    fs.readFile(fileName, (err, file) => {
      cb(err, { fileName, file });
    });
  }),
  pull.filter(
    ({ fileName }) => !filesToIgnore.includes(path.basename(fileName))
  ),
  pull.map(
    ({ file, fileName }) =>
      console.log(fileName) || { file: decrypt(file, key), fileName }
  ),
  pull.map(({ file, fileName }) => ({
    file,
    fileName: fileName.replace(/\.encrypted$/, ""),
  })),
  pull.asyncMap(({ file, fileName }, cb) => {
    let outPath = fileName.replace("/files_to_decrypt/", "/decrypted/");
    if (!outPath.includes("/US_TAX_FORM/20")) {
      // Get year from filename (US_TAX_FORM_2020_xxx.pdf)
      console.log(fileName);
      const year = fileName.match(/US_TAX[ _]FORM_(\d{4})/i)[1];
      outPath = outPath.replace(
        "/decrypted/",
        `/decrypted/US_TAX_FORM/${year}/`
      );
    }

    const outDir = path.dirname(outPath);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    fs.writeFile(outPath, file, cb);
  }),
  pull.collect((err, results) => {
    if (err) return console.log("Error decrypting: ", err);
    console.log(`Done decrypting ${results.length} files`);
  })
);
