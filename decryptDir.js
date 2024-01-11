const fs = require("fs");
const { decrypt } = require("./");
const nodeDir = require("node-dir");
const pull = require("pull-stream");
const path = require("path");
const { parseArgs } = require("node:util");
const { createHash } = require("node:crypto");

const { values: args } = parseArgs({
  options: {
    input: {
      type: "string",
      default: path.join(__dirname, "files_to_decrypt"),
      short: "i",
    },
    output: {
      type: "string",
      default: path.join(__dirname, "decrypted"),
      short: "o",
    },
  },
});

function sha512(content) {
  return createHash("sha512").update(content).digest("hex");
}

// Validate directories
if (!fs.existsSync(args.input)) {
  throw new Error(`Input directory "${args.input}" does not exist`);
}

// Create output directory if it doesn't exist
if (!fs.existsSync(args.output)) {
  fs.mkdirSync(args.output, { recursive: true });
  console.log(`Created output directory: ${args.output}`);
}

const ABSOLUTE_INPUT_DIR = path.resolve(args.input);
const ABSOLUTE_OUTPUT_DIR = path.resolve(args.output);

const key = process.env.KEY;
if (!key) {
  return console.error("KEY environment variable was not set, aborting");
}

const getOutputPath = (inputPath) => {
  let documentPath = inputPath.replace(ABSOLUTE_INPUT_DIR, ABSOLUTE_OUTPUT_DIR);
  if (!documentPath.includes("/US_TAX_FORM/20")) {
    // Get year from filename (US_TAX_FORM_2020_xxx.pdf)
    const year = inputPath.match(/US_TAX[ _]FORM_(\d{4})/i)[1];
    documentPath = documentPath
      .replace(
        ABSOLUTE_OUTPUT_DIR,
        path.join(ABSOLUTE_OUTPUT_DIR, `US_TAX_FORM/${year}`)
      ) // Move to year folder
      .replace(/US_TAX_FORM_\d{4}_/, ""); // Remove year prefix from filename
  }

  // Some legacy files have a ".encrypted" suffix
  return documentPath.replace(/\.encrypted$/, "");
};

const filesToIgnore = [
  "836d1933a98ff6a351f95f63278b491fedcb2103fe046a4038584b498fcee750aefd86d45f6d5d28499742134c8630f2f0c292b4b9739d4db3b33778e052a9e7", // Robots.txt
  // Not sure where this one is coming from, it's not linked in the DB
  "85035c12d11fc3e1397f9f32d77849a40841c33e82aea39ab6b46ed7b2aa851e2852efe15e414dbdbda26a73bb419a9a6055f24427d0d28df3e9e21845f57c12",
  "66c81ef7edf76801ca3174e998693de42f66ee9abe3626038f179d89d6d709f7ab552b72fff8f4451615d162554d471394deff19770093b075bc68512d3c879d",
];

pull(
  pull.once(args.input),
  pull.asyncMap((dir, cb) =>
    nodeDir.files(dir, "file", cb, { recursive: true })
  ),
  pull.flatten(),
  pull.asyncMap((filePath, cb) => {
    fs.readFile(filePath, (err, inputFile) => {
      cb(err, { filePath, inputFile });
    });
  }),
  // Remove ignored files
  pull.filter(
    ({ filePath }) => !filesToIgnore.includes(sha512(path.basename(filePath)))
  ),
  // Log & decrypt
  pull.map((args) => {
    console.log(`Decrypting ${args.filePath}`);
    return { ...args, file: decrypt(args.inputFile, key) };
  }),
  pull.asyncMap(({ file, filePath }, cb) => {
    const outPath = getOutputPath(filePath);
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
