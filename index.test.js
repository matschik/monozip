import { describe, it, expect } from "vitest";
import fsx from "fs-extra";
import {
  generateKey,
  encryptAndZipFolder,
  unzipAndDecryptZip,
} from "./index.js";

await fsx.remove("tmp");
await fsx.ensureDir("tmp");

describe("monozip", () => {
  const cryptkey = generateKey();
  const fixtureFolderPath = "./fixtures/medias";
  const zipPath = "tmp/medias.zip";

  it("should encrypt & zip", async () => {
    await encryptAndZipFolder(cryptkey, fixtureFolderPath, {
      outputPath: zipPath,
    });
    expect(await fsx.pathExists(zipPath)).toBe(true);
  });

  it("should unzip & decrypt", async () => {
    await unzipAndDecryptZip(cryptkey, zipPath);
    expect(await fsx.pathExists("tmp/medias-decrypted")).toBe(true);
    expect(await fsx.pathExists("tmp/medias-decrypted/seoul.mp4")).toBe(true);
    expect(await fsx.pathExists("tmp/medias-decrypted/hello.txt")).toBe(true);
    expect(
      await fsx.readFile("tmp/medias-decrypted/hello.txt", "utf-8")
    ).toEqual("hello");
  });
});
