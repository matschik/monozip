import { describe, it } from "vitest";
import fse from "fs-extra";
import {
  generateKey,
  encryptAndZipFolder,
  unzipAndDecryptZip,
} from "./index.js";

await fse.remove("tmp");
await fse.ensureDir("tmp");

describe("monozip", () => {
  const cryptkey = generateKey();
  const fixtureFolderPath = "./fixtures/medias";
  const zipPath = "tmp/medias.zip";

  it("should encrypt & zip", async () => {
    const p = await encryptAndZipFolder(cryptkey, fixtureFolderPath, {
      outputPath: zipPath,
    });
    console.log(p);
  });

  it("should unzip & decrypt", async () => {
    await unzipAndDecryptZip(cryptkey, zipPath);
  });
});
