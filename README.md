# Encrypt + Decrypt a directory of files

> Uses the [tweetnacl](https://www.npmjs.com/package/tweetnacl) library to encrypt / decrypt files in a directory.

## Setup

clone this repo and run 

```sh
npm install
mkdir files_to_encrypt
mkdir files_to_decrypt
```

## Generate a key

```sh
$ node generateKey.js
```

~~~ Warning ~~~ 

Store this key somewhere sensible. If you lose the key, you can't decrypt your files. Fair warning.

## Encrypt files

Copy the files you want to encrypt into the `files_to_encrypt` folder.

Use your key to encrypt the files.

```sh
KEY=K6RchRUGO0FmWOyqBzCWMjaFPRs0D3undo46wrmrVdM= node encryptDir.js
```

Encrypted files are in the folder with an `.encrypted` suffix.

## Decrypt files

Copy the files you want to decrypt into the `files_to_decrypt` folder.

Use your key to decrypt the files.

```sh
KEY=K6RchRUGO0FmWOyqBzCWMjaFPRs0D3undo46wrmrVdM= node decryptDir.js
```

Decrypted files are in the folder _without_ an `.encrypted` suffix.
