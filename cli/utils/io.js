import path from "path";
import fs from "fs";


const cwd = process.cwd();  // directory the script is run from

/**
 * convert a filepath to absolute if it is relative.
 * @param {string} f
 * @returns {string}
 */
const toAbsPath = (f) => path.isAbsolute(f) ? f : path.join(cwd, f);

/** @returns {boolean} true if file `f` exists, false otherwise */
const fileOk = (f) => {
  f = toAbsPath(f);
  try {
    fs.accessSync(f, fs.constants.R_OK);
    return true;
  } catch (e) {
    console.error(`io.fileOk: file does not exist or could not be read: ${f}`);
    return false
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
  // convert to absolute filepaths
  const success = fileArr.every(fileOk);
  if (!success) {
    console.error("io.fileArrayValidate: some files could not be accessed. exiting...");
    process.exit(1);
  }
  return fileArr
}

/**
 * `file` is a path to a file containing paths to other files (1 file per line).
 * validate all paths and return them as absolute paths
 * @param {str} file
 * @returns {string[]}
 */
async function getFilesInListFile(file) {
  // read `file` split it by lines, remove empty lines
  const fileArr =
    fileRead(file)
      .split("\n")
      .filter(l => !l.match(/^\s*$/g));
  return fileArrayValidate(fileArr);
}

/**
 * get the files to import and return them as absolute paths
 *
 * `fileArr` is a list of paths to either:
 *  - (fileArr=false) JSON files to import
 *  - (fileArr=true)  text files containing paths to the JSONS to import
 * => take `fileArr`, validate that all files exist, extract all filepaths
 * from `fileArr`, and return the array of actual JSON paths to process.
 *
 * @param {string[]} fileArr
 * @param {boolean} listFiles
 * @returns {string[]} the list of existing files to process.
 */
function getFilesToProcess(fileArr, listFiles=false) {
  let filesToProcess = fileArrayValidate(fileArr);

  // if `listFile`, open the files containing paths of files to proces, and redo the same validation process for each file in a list file.
  if ( listFiles ) {
    let filesInListFiles = []

    filesToProcess.map((theListFile) => {
      const files = getFilesInListFile(theListFile);
      filesInListFiles = filesInListFiles.concat(files);
    })

    filesToProcess = [...new Set(filesInListFiles)];  // deduplicate
  }

  return filesToProcess
}

export {
  fileRead,
  fileOk,
  fileArrayValidate,
  getFilesToProcess
}
