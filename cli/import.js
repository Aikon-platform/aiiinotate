import path from "path";
import fs from "fs";

import { Command, Option, Argument } from "commander";

import mongoClient from "#cli/mongoClient.js";
import { fromIiif2AnnotationList } from "#annotations/annotationsIiif2x.js";
import { annotationsInsertMany } from "#annotations/annotationsModel.js";


const cwd = process.cwd();  // directory the script is run from


// allowed imports
const importTypes = [
  "annotation",  // import a single annotation
  "annotation-list",  // import a IIIF 2.x annotationList
  "annotation-page",  // import a IIIF 3.x annotationPage
  "annotation-array",  // import a JSON array of IIIF annotations
  "manifest",  // import a single manifest
  "manifest-array"  // import a json array of manifests
]

/////////////////////////////////////////

/** @returns {Promise<boolean>} true if file `f` exists, false otherwise */
const fileOk = (f) =>
  fs.promises.access(f, fs.constants.R_OK)
    .then(() =>  true)
    .catch((err) => {
      console.log("file does not exist or could not be read: ", f);
      return false
    });


/** @return {Promise<string>}  */
const fileRead = (f) =>
  fs.promises.readFile(f, { encoding: 'utf8' })
    .then(data => data)
    .catch((err) => {
      console.log("error reading file: ", f);
    });

/**
 * take an input array of filepaths. convert the paths to absolute, and check that the files exist
 * exits if any of the files don't exist
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

const notImplementedExit = (method) => {
  console.log(`\n\nERROR: import is not implemented '${method}'`);
  process.exit(1);
}

const parseNumber = (x) => Number(x);

////////////////////////////////////////

async function importAnnotationList(fileArr, iiifVersion) {
  // TODO: define client,d at top level of CLI and pass it to subcommands.

  // RUN THE SCRIPT:
  // > npm run migrate-revert && npm run migrate-apply && npm run cli import -- annotation-list -i 2 -f ./data/aikon_wit9_man11_anno165_annotation_list.jsonld
  const {client, db} = await mongoClient();
  let totalImports = 0

  for (const file of fileArr) {
    let annotationList = JSON.parse(await fileRead(file));

    if ( iiifVersion === 2 ) {
      annotationList = fromIiif2AnnotationList(annotationList);
      const result = await annotationsInsertMany(db, annotationList);
      totalImports += result;
    } else {
      notImplementedExit("import from annotation list with IIIF version", iiifVersion);
      process.exit(1);
    }
  }

  console.log(`\n\nDONE: imported ${totalImports} annotations into Aiiinotate !`);

  client.close();

  //TOOD
}

/**
 * run the cli
 * @param {string} dataType: one of importTypes
 * @param {object} options
 * @param {import('commander').Command} command
 */
async function action(dataType, options, command) {
  /** @type {2 | 3} */
  const iiifVersion = options.iiifVersion;
  /** @type {string[]} */
  const file = options.file;
  /** @type {boolean} */
  const listFile = options.listFile;

  let filesToProcess = await fileArrayValidate(file)

  // if `listFile`, open the files containing paths of files to proces, and redo the same validation process for each file in a list file.
  if ( listFile ) {
    let allJsons = []
    await Promise.all(filesToProcess.map(async (theListFile) => {

      /** @type {string[]} list of file paths in `f` */
      const filesInListFile =
        await fileRead(theListFile).then(
          content => content
            .split("\n")
            .filter(l => !l.match(/^\s*$/g)));
      let _filesToProcess = await fileArrayValidate(filesInListFile);
      allJsons = allJsons.concat(_filesToProcess);

    }))
    filesToProcess = allJsons;
  }

  // run
  switch (dataType) {
    case ("annotation-list"):
      importAnnotationList(filesToProcess, iiifVersion);
      break;
    default:
      notImplementedExit(dataType);
  }

}

/////////////////////////////////////////

/** define the cli */
function makeImportCommand() {
  // argument and option name syntax:
  // --opt-name <requiredVal> => you mst provide a value after --opt-name
  // --opt-name [optionalVal] => if `optionalVal` is not provided, --opt-name will be treated as boolean
  const dataTypeArg =
    new Argument("<data-type>", "type of data to import")
      .choices(importTypes);

  const versionOpt =
    new Option("-i, --iiif-version <version>", "IIIF version")
      .choices(["2", "3"])
      .argParser(parseNumber)
      .makeOptionMandatory();

  const fileOpt =
    new Option("-f, --file <file...>", "files to process, either as: space-separated filepath(s) to the JSON(s) OR path to a file containing a list of paths to JSON files to process (1 line per path)")
      .makeOptionMandatory();

  const listFileOpt =
    new Option("-l, --list-file", "flag indicating that --file points to a file containing a list of JSON files to process (1 line per path)")

  return new Command("import")
    .description("import data into aiiinotate")
    .addArgument(dataTypeArg)
    .addOption(fileOpt)
    .addOption(versionOpt)
    .addOption(listFileOpt)
    .action(action)
}

export {
  makeImportCommand
}