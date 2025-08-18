import path from "path";
import fs from "fs";

const cwd = process.cwd();  // directory the script is run from

/** @returns {Promise<boolean>} true if file `f` exists, false otherwise */
const fileOk = (f) =>
  fs.promises.access(f, fs.constants.R_OK)
    .then(() =>  true)
    .catch((err) => {
      console.log("file does not exist or could not be read: ", f);
      return false
    });

/**
 * @param {string} f
 * @return {Promise<string>}
 */
const fileRead = (f) =>
  fs.promises.readFile(f, { encoding: 'utf8' })
    .then(data => data)
    .catch((err) => {
      console.log("error reading file: ", f);
    });

/**
 * take an input array of filepaths. convert the paths to absolute, and check that the files exist
 * the cli exits if any of the files don't exist
 * @param {string[]} fileArr
 * @returns { Promise<string[]> } array of absolute filepaths
 */
async function fileArrayValidate (fileArr) {
  // convert to absolute filepaths
  fileArr = fileArr.map(f =>
    path.isAbsolute(f) ? f : path.join(cwd, f));

  // validate paths
  // the `fileOk` map is wrapped in a `Promise.all`  because `fileOk` returns a promise,
  // so we `await` for all file checks to be performed before ensuring that all files have been found.
  const success = await Promise.all(
    fileArr.map(async (f) => await fileOk(f))
  ).then(filesExistArr =>
      filesExistArr.every(x => x===true)
  );

  if (!success) {
    console.log("\n\nERROR: some files could not be accessed. exiting...");
    process.exit(1);
  }
  return fileArr
}

/**
 * `file` is a path to a file containing paths to other files (1 file per line).
 * validate all paths and return them as absolute paths
 * @param {str} file
 * @returns {Promise<string[]>}
 */
async function getFilesInListFile(file) {
  return fileRead(file)
    .then(content =>
      content.split("\n").filter(l => !l.match(/^\s*$/g)) )
    .then(fileArrayValidate);
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
 * NOTE: file order is NOT PRESERVED since files are opened using async pools
 *
 * @param {string[]} fileArr
 * @param {boolean} listFiles
 * @returns {string[]}
 */
async function getFilesToProcess(fileArr, listFiles=false) {
  let filesToProcess = await fileArrayValidate(fileArr);

  // if `listFile`, open the files containing paths of files to proces, and redo the same validation process for each file in a list file.
  if ( listFiles ) {
    let filesInListFiles = []

    await Promise.all(filesToProcess.map(async (theListFile) => {
      const files = await getFilesInListFile(theListFile);
      filesInListFiles = filesInListFiles.concat(files);
    }))

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
