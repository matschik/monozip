import fs from "node:fs/promises";
import { createReadStream, createWriteStream } from "node:fs";
import crypto from "node:crypto";
import path from "node:path";

import { globby } from "globby";
import fsx from "fs-extra";
import { temporaryDirectoryTask, temporaryFileTask } from "tempy";
import archiver from "archiver";
import StreamZip from "node-stream-zip";

export function generateKey() {
  const key = crypto.randomBytes(32);
  return key.toString("hex");
}

export async function unzipAndDecryptZip(
  cryptkey,
  zipPath,
  { logger = () => {}, outputPath } = {}
) {
  const textcrypt = textAES(cryptkey);
  const filecrypt = fileStreamAES(cryptkey);
  const unzippedFolderPath =
    outputPath || `${removeExtension(zipPath)}-decrypted`;

  await fsx.ensureDir(unzippedFolderPath);
  const zip = new StreamZip.async({ file: zipPath });
  await zip.extract(null, unzippedFolderPath);

  await zip.close();
  const filepaths = await globby([`${unzippedFolderPath}/**/*`]);
  for (const filepath of filepaths) {
    const filePathParsed = path.parse(filepath);
    const destFilePath = path.format({
      dir: filePathParsed.dir,
      base: textcrypt.decrypt(filePathParsed.base),
    });
    await temporaryFileTask(async (tempFilePath) => {
      await filecrypt.decrypt(filepath, tempFilePath);
      await fs.rename(tempFilePath, destFilePath);
    });
    await fs.rm(filepath);
  }

  return unzippedFolderPath;
}

export async function encryptAndZipFolder(
  cryptkey,
  folderPath,
  { logger = () => {}, outputPath } = {}
) {
  const textcrypt = textAES(cryptkey);
  const filecrypt = fileStreamAES(cryptkey);
  const filepaths = await globby([`${folderPath}/**/*`]);
  const zipPath = outputPath || `${folderPath}.zip`;

  let processedCount = 0;

  await temporaryFileTask(async (tempZipPath) => {
    await temporaryDirectoryTask(
      async (tempDirPath) => {
        const output = createWriteStream(tempZipPath);
        const archive = archiver("zip");

        archive.pipe(output);

        for (const filepath of filepaths) {
          const srcFilePathParsed = path.parse(
            filepath.replace(`${folderPath}/`, "")
          );
          const srcFilePath = path.format({
            dir: srcFilePathParsed.dir,
            base: textcrypt.encrypt(srcFilePathParsed.base),
          });

          const destCrypt = `${tempDirPath}/${srcFilePath}`;

          await fsx.ensureDir(path.parse(destCrypt).dir);
          await filecrypt.encrypt(filepath, destCrypt);

          archive.file(destCrypt, { name: srcFilePath });

          // increment the processed count
          processedCount++;

          // calculate and log the progress percentage
          const progressPercentage = Math.round(
            (processedCount / filepaths.length) * 100
          );
          logger(`Encrypt progress: ${progressPercentage}%`);
        }

        let entryCount = 0;
        archive.on("entry", () => {
          entryCount++;
          logger(
            `Compress progress: ${Math.round(
              (entryCount / filepaths.length) * 100
            )}%`
          );
        });

        await new Promise(async (resolve, reject) => {
          output.on("error", (err) => {
            reject(err);
          });
          output.on("close", resolve);

          archive.on("error", (err) => {
            reject(err);
          });

          archive.finalize();
        });

        await fs.rename(tempZipPath, zipPath);
      },
      {
        prefix: "encryptZipFolder2_",
      }
    );
  });

  return zipPath;
}

function fileStreamAES(secretKey) {
  const algorithm = "aes-256-cbc";
  const key = Buffer.from(secretKey, "hex");
  const ivNumberOfBytes = 16;

  return {
    async encrypt(src, dest) {
      const iv = crypto.randomBytes(ivNumberOfBytes);

      const cipher = crypto.createCipheriv(algorithm, key, iv);
      const input = createReadStream(src);
      const output = createWriteStream(dest);

      output.write(iv);

      input.pipe(cipher).pipe(output);

      await asyncStream(output);
      return dest;
    },
    async decrypt(src, dest) {
      const iv = await readFirstNbBytes(src, ivNumberOfBytes);
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      const input = createReadStream(src, { start: ivNumberOfBytes });
      const output = createWriteStream(dest);

      input.pipe(decipher).pipe(output);

      await asyncStream(output);

      return dest;
    },
  };
}

async function readFirstNbBytes(filePath, nbOfBytes) {
  const fileHandle = await fs.open(filePath, "r");
  const buffer = Buffer.alloc(nbOfBytes);
  await fileHandle.read(buffer, 0, nbOfBytes, 0);
  await fileHandle.close();
  return buffer;
}

async function asyncStream(stream) {
  return new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("end", resolve);
    stream.on("error", reject);
  });
}

function removeExtension(filename) {
  const filePath = path.parse(filename);

  return path.format({
    dir: filePath.dir,
    name: filePath.name,
  });
}

function textAES(secretKey) {
  const algorithm = "aes-256-cbc";
  const key = Buffer.from(secretKey, "hex");
  const ivNumberOfBytes = 16;

  return {
    encrypt(text) {
      const iv = crypto.randomBytes(ivNumberOfBytes);
      const cipher = crypto.createCipheriv(algorithm, key, iv);
      const encrypted = Buffer.concat([
        iv,
        cipher.update(text, "utf8"),
        cipher.final(),
      ]);

      return encrypted.toString("hex");
    },
    decrypt(encryptedText) {
      const data = new Uint8Array(Buffer.from(encryptedText, "hex"));
      const iv = data.subarray(0, ivNumberOfBytes);
      const textBytes = data.subarray(ivNumberOfBytes);

      const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv));
      let decrypted = decipher.update(Buffer.from(textBytes));
      decrypted += decipher.final("utf8");

      return decrypted;
    },
  };
}
