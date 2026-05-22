import path from "path";
import fs from "fs";

import ProgressBar from "#cli/utils/progressbar.js";

/** @typedef {import("fs").WriteStream} WriteStreamType */

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
 * wrapper for writer.write(data) that respects writer backpressure
 *
 * we wrap the .write() in a Promise that checks on the rturn of `writer.write`
 * and drains the stream if necessary: if `writer.write()` returns
 * false, the write buffer is full  and must be drained by the OS
 * before continuing.
 *
 * this avoids:
 * - writes that are silently dropped or reordered
 * - corrupt/truncated JSON with no error thrown
 *
 * @type {(writer: WriteStreamType) => (data: string) => Promise<void> }
 */
const writeOrWait = (writer) =>
  (data) =>
    new Promise((resolve, reject) => {
      const ok = writer.write(data, (error) => {
        if (error) return reject(error);
      });
      if (ok) {
        resolve();  // buffer has room, keep going
      } else {
        writer.once("drain", resolve);  // buffer full, wait for drain
      }
    });

/**
 * WriteStream.write is actually asyncrhonous => for the last line,
 * we need to use `writer.end` to ensure everything has been written to file.
 *
 * @returns {Promise<void>}
 */
const endStream = (writer, data) =>
  new Promise((resolve, reject) => {
    writer.end(data, (error) => {
      if (error) return reject(error);
      resolve();
    });
  });

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
 * to check that the output is a valid JSON, use:
 * ```bash
 * python3 -mjson.tool path/to/json > /dev/null && echo "ok" || echo "err"
 * ````
 *
 * @param {string|PathLike} fp
 * @param {MongoFindCursorType} cursor
 * @param {number?} totalCount
 * @returns {Promise}
 */
const writeCursorToJson = async (fp, cursor, totalCount) => {
  const writer = fs.createWriteStream(fp);
  const onceWriter = writeOrWait(writer);

  let pb;
  if (totalCount) {
    pb = new ProgressBar({ desc: "writing documents to file", total: totalCount });
  } else {
    console.log("");
  }

  // we are writing an array => manually write the opening "[".
  await onceWriter("[");
  let i = 0
  for await (const doc of cursor) {
    i += 1;
    // if previous items were written to file, write a "," separator.
    if (i!=1) await onceWriter(", ");
    if (pb) {
      pb.update(i);
    } else {
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(`writing document #${i} to file`);
    }
    await onceWriter(JSON.stringify(doc));
  }
  // close the array with a "]" and end the stream.
  await endStream(writer, "]");

  if (!pb && i>0) console.log("");
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
