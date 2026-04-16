import path from "path";
import fs from "fs";


const cwd = process.cwd();  // directory the script is run from

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
  // read `file` split it by lines, remove empty lines
  const fileArr =
    fileRead(file)
      .split("\n")
      .filter(l => !l.match(/^\s*$/g));
  return [ ...new Set(fileArrayValidate(fileArr)) ];
}

export {
  fileRead,
  fileOk,
  fileArrayValidate,
  parseImportInputFile
}
