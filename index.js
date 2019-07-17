//This code is comes from https://github.com/dchest/tweetnacl-js/wiki/Examples. The api is different in that encrypt and decrypt expect to be passed buffers of bytes, not base64 encoded strings.
const {
  secretbox,
  randomBytes,
  secretbox: { nonceLength, keyLength }
} = require("tweetnacl");

const { encodeUTF8, encodeBase64, decodeBase64 } = require("tweetnacl-util");

const Nonce = () => randomBytes(nonceLength);

const generateKey = () => encodeBase64(randomBytes(keyLength));

const encrypt = (buff, key) => {
  const keyUint8Array = decodeBase64(key);

  const nonce = Nonce();
  const box = secretbox(buff, nonce, keyUint8Array);

  const fullMessage = new Uint8Array(nonce.length + box.length);
  fullMessage.set(nonce);
  fullMessage.set(box, nonce.length);

  return fullMessage;
};

const decrypt = (buffWithNonce, key) => {
  const keyUint8Array = decodeBase64(key);
  const nonce = buffWithNonce.slice(0, nonceLength);
  const message = buffWithNonce.slice(nonceLength, buffWithNonce.length);

  const decrypted = secretbox.open(message, nonce, keyUint8Array);

  if (!decrypted) {
    throw new Error("Could not decrypt message");
  }

  return decrypted;
};

module.exports = {
  encrypt,
  decrypt,
  generateKey
};
