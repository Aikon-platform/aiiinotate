import url from "node:url";
import path from "node:path";
import fs from "node:fs";

// path to dirctory of curent file
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
// path to fixtures/data
const dataDir = path.join(__dirname, "data");

const availableFiles = fs.readdirSync(dataDir);

/**
 * for simplicity, `readFileToObject` is synchronous. given that `fixtures` should only be used in tests, there is no performance downgrade for the prod server.
 * @param {string} fn: the filename
 * @returns {object}
 */
const readFileToObject = (fn) => {
  if ( !availableFiles.includes(fn) ) {
    throw new Error(`file not found: ${fn}`);
  }
  return JSON.parse(fs.readFileSync(path.join(dataDir, fn), { encoding: "utf8" }));
}

/**
 * @param {string} fn
 * @returns {string}
 */
const toUrl = (fn) => `${process.env.AIIINOTATE_BASE_URL}/fixtures/${fn}`;


export {
  dataDir,
  readFileToObject,
  toUrl
}