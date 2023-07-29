# Monozip 📦🔑

Utility library providing encrypt/compress and decompress/decrypt using using **AES encryption** 🔐.

With a simple API, you can easily zip and encrypt a directory and later unzip and decrypt it.

## Features 🚀

- Generate encryption keys 🔑
- Encrypt and zip folders 📁➡️🔒📦
- Unzip and decrypt zipped files 📦➡️📂🔓

## CLI Usage 💻

Monozip can be used directly from the command line. The general structure of a command is:

```bash
monozip [command] [options]
```

### Installation 💾

To use the cli, install globally with npm:

```bash
npm install -g monozip
```

### Usage 📖

**To encrypt and zip a folder:**

You can specify an encryption key and an output path using the `-k` and `--output` options respectively. If not specified, a key will be generated automatically, and the output file will be saved in the current directory.

```bash
monozip encrypt ./path/to/folder
```

After running this command, it will print out the encryption key used (keep it safe, you will need it to decrypt 🔐), and the path to the zipped file.

**To unzip and decrypt a file:**

You need to provide the encryption key and the path to the zipped file. You can also specify an output path using the `-o` option. If not specified, the file will be unzipped in the current directory.

```bash
monozip decrypt your-key ./path/to/file.zip
```

After running this command, it will print out the path to the unzipped and decrypted files.

## Programmatic Usage 💡

### Installation 💾

Install the library using npm:

```bash
npm install monozip
```

### Encryption and Compression 🔐📦

To encrypt and zip a folder, you can use the `generateKey` and `encryptAndZipFolder` functions. Here is an example:

```javascript
import { generateKey, encryptAndZipFolder } from "monozip";

const folderPath = "downloads/myphotos";

// Generate a new encryption key
const secretKey = generateKey();

// Encrypt and zip the folder
await encryptAndZipFolder(secretKey, fixtureFolderPath);

console.info(`Encrypted with key ${secretKey} and zipped folder ${folderPath}`);
// Encrypted with key e96c9074fa... and zipped folder downloads/myphotos.zip. Keep the key safe!
```

### Decompression and Decryption 📂🔓

To unzip and decrypt a previously encrypted and zipped file, you can use the `unzipAndDecryptZip` function. Here is an example:

```javascript
import { generateKey, unzipAndDecryptZip } from "monozip";

// Assume the encryption key is known
const secretKey = "my-secret-key";

// Unzip and decrypt the zipped file
const zipPath = "downloads/myphotos.zip";
const outputPath = await unzipAndDecryptZip(secretKey, zipPath, {
  outputPath: "downloads/myphotos-decrypted",
});

console.info(`Unzipped and decrypted ${outputPath}`);
// Unzipped and decrypted downloads/myphotos-decrypted
```

## Testing 🧪

The project uses [Vitest](https://github.com/vitest-dev/vitest) for testing.

You can run the tests with:

```bash
npm test
```

## Contributing 🤝

We welcome contributions! Please see [here](./CONTRIBUTING.md) for details on how to contribute.

## License 📄

This project is open source, licensed under the MIT License. See [LICENSE](./LICENSE) for details.
