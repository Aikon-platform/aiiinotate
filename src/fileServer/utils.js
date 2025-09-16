import url from "node:url";
import path from "node:path";
import fs from "node:fs";

// path to dirctory of curent file
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
// path to fileServer/data
const dataDir = path.join(__dirname, "data");

const availableFiles = fs.readdirSync(dataDir);

/**
 * for simplicity, `readFileToObject` is synchronous. given that `fileServer` should only be used in tests, there is no performance downgrade for the prod server.
 * @param {string} fn: the filename
 * @returns {object}
 */
const readFileToObject = (fn) => {
  if ( !availableFiles.includes(fn) ) {
    throw new Error(`file not found: ${fn}`);
  }
  return JSON.parse(fs.readFileSync(path.join(dataDir, fn), { encoding: "utf8" }));
}

export {
  dataDir,
  readFileToObject
}