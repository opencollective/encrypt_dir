var test = require("tape");

const { encodeUTF8 } = require("tweetnacl-util");

var { encrypt, decrypt, generateKey } = require("./");

test("it ok", function(t) {
  const key = generateKey();
  console.log(key);
  const msg = "scuttlebutt";
  const buff = Buffer.from(msg);

  const cypher = encrypt(buff, key);

  const result = encodeUTF8(decrypt(cypher, key));

  t.equal(result, msg);
  t.end();
});
