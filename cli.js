#!/usr/bin/env node
import { Command } from "commander";
import {
  generateKey,
  encryptAndZipFolder,
  unzipAndDecryptZip,
} from "./index.js";

const program = new Command();

program
  .command("encrypt <dir>")
  .option("-k, --key [value]")
  .option("-o, --output [value]")
  .description("encrypt and zip a directory")
  .action(async (dir, output) => {
    const options = program.opts();
    const secretKey = options.key || generateKey();
    const outputPath = await encryptAndZipFolder(secretKey, dir, {
      outputPath: options.output,
      logger: console.info,
    });
    console.info("Encrypted with key:", secretKey);
    console.info("Zipped folder:", outputPath);
    console.info("Keep the secret key safe");
  });

program
  .command("decrypt <key> <zipPath>")
  .option("-o, --output [value]")
  .description("unzip and decrypt a zip file")
  .action(async (key, zipPath) => {
    const outputPath = await unzipAndDecryptZip(key, zipPath, {
      outputPath: program.opts().output,
      logger: console.info,
    });
    console.info(`Unzipped and decrypted: ${outputPath}`);
  });

program.parse(process.argv);
