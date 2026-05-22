import path from "path";
import fs from "fs";

import ProgressBar from "#cli/utils/progressbar.js";


const cwd = process.cwd();  // directory the script is run from
const getCwd = () => process.cwd();

/**
 * convert a filepath to absolute if it is relative.
 * @param {string} f
 * @returns {string}
 */
const toAbsPath = (f) => path.isAbsolute(f) ? f : path.join(cwd, f);

/**
 * @returns {[string, boolean]} - [<absolute file path>, <success?>]
 */
const fileOk = (f) => {
  f = toAbsPath(f);
  try {
    fs.accessSync(f, fs.constants.R_OK);  // will throw if there's a problem opening.
    return [ f, fs.lstatSync(f).isFile() ];
  } catch (e) {
    return [ f, false ]
  }
}

/** @returns {[PathLike, boolean]} */
const dirOk = (d) => {
  d = toAbsPath(d);
  try {
    fs.accessSync(d, fs.constants.R_OK);  // will throw if there's an error
    return [ d, fs.lstatSync(d).isDirectory() ]
  } catch (e) {
    return [ d, false ]
  }
}

/**
 * @param {string} f
 * @return {string?}
 */
const fileRead = (f) => {
  f = toAbsPath(f);
  try {
    return fs.readFileSync(f, { encoding: "utf8" })
  } catch (err) {
    console.error(`io.fileRead: could not read file: ${f}`);
  }
}

/**
 * take an input array of filepaths. convert the paths to absolute, and check that the files exist
 * the cli exits if any of the files don't exist
 * @param {string[]} fileArr
 * @returns { string[] } array of absolute filepaths
 */
function fileArrayValidate (fileArr) {
  // array of [<absolute filepath>, <success opening file?>]
  fileArr = fileArr.map(fileOk);
  const successCount = fileArr.filter(x => x[1]).length;
  if (successCount!==fileArr.length) {
    console.error(
      `io.fileArrayValidate: ${fileArr.length - successCount} files could not be accessed. exiting...`,
      fileArr.filter(x => !x[1]).map(x => x[0])
    );
    process.exit(1);
  }
  return fileArr.map(x => x[0]);
}

/**
 * `file` is a path to a file containing paths to other files (1 file per line).
 * parse the file and return an array of absolute paths to files.
 * @param {str} file
 * @returns {Promise<string[]>}
 */
async function parseImportInputFile(file) {
  // ensure input file exists
  const [ fileAbs, ok ] = fileOk(file);
  if (!ok) {
    console.error(`could not read import file: ${file}. exiting...`);
    process.exit(1);
  }

  // read `file` split it by lines, remove empty lines
  const fileArr =
    fileRead(fileAbs)
      .split("\n")
      .filter(l => !l.match(/^\s*$/g));
  return [ ...new Set(fileArrayValidate(fileArr)) ];
}

const fileWrite = (f, data) => {
  try {
    fs.writeFileSync(f, data, "utf-8");
  } catch (e) {
    throw new Error(`Error writing to file: ${f} because of error: ${e}`);
  }
}

/**
 * NOTE: this will NOT work on collections and huge objects. use streamWriteJson to write from Mongo Cursors.
 * @param {string|import("fs").PathLike} f
 * @param {Array|object} data
 * @returns {void}
 */
const fileWriteJson = (f, data) => {
  data = JSON.stringify(data)
  fileWrite(f, data);
}

/**
 * given a file path `fp` and a FindCursor `cursor`,
 * write all documents in `cursor` to a file.
 *
 * if `totalCount` is defined, print a progress bar as well.
 * else, just print the document number and update at each iteration.
 *
 * necessary to use a string when `cursor` stores a lot of documents
 * (instead of a simple file-write):
 * - cursor.toArray() uses TONS of memory and is slow
 * - JSON.stringify(), used to write JSONs to file, has a maximum
 *    size for arrays and will crash if stringifying huge arrays.
 *
 * @param {string|PathLike} fp
 * @param {MongoFindCursorType} cursor
 * @param {number?} totalCount
 * @returns {Promise}
 */
const writeCursorToJson = async (fp, cursor, totalCount) => {
  const writer = fs.createWriteStream(fp);

  let pb;
  if (totalCount) {
    pb = new ProgressBar({desc: "writing documents to file", total: totalCount});
  } else {
    console.log("");
  }

  let i = 0
  for await (const doc of cursor) {
    i += 1;
    if (pb) {
      pb.update(i);
    } else {
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(`writing document #${i} to file`);
    }
    writer.write(JSON.stringify(doc) + ", ");
  }

  writer.close();
  if (!pb && i>0) {
    console.log("");
  }
  return totalCount;
}


export {
  fileRead,
  fileOk,
  dirOk,
  fileWrite,
  fileWriteJson,
  getCwd,
  fileArrayValidate,
  parseImportInputFile,
  writeCursorToJson
}
