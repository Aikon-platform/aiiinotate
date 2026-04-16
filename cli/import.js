import { Command, Option, Argument } from "commander";

import { fileRead, parseImportInputFile } from "#cli/utils/io.js";
import FastifyClient from "#cli/utils/fastifyClient.js";
import ProgressBar from "#cli/utils/progressbar.js";
import logger from "#utils/logger.js";
import { inspectObj } from "#utils/utils.js";

/** @typedef {import("#types").FastifyInstanceType} FastifyInstanceType */

////////////////////////////////////////

const notImplementedExit = (method) => {
  logger.error(`\n\nERROR: import is not implemented '${method}'`);
  process.exit(1);
}

const parseNumber = (x) => Number(x);

////////////////////////////////////////

/**
 * @param {FastifyClient} fastifyClient
 * @param {string[]} fileArr - array of full paths to annotationLists to insert.
 */
async function importData(importFunc, datatype, fileArr) {

  let totalImports = 0
  const
    pb = new ProgressBar({ desc: `importing ${datatype}s`, total: fileArr.length}),
    importErrors = [];

  for ( let [i, file] of fileArr.entries() ) {
    i += 1
    const
      data = JSON.parse(fileRead(file)),
      [statusCode, resultPromise] = await importFunc(data),
      result = await resultPromise;
    if ( statusCode <= 299 ) {
      totalImports += result.insertedCount;
    } else {
      console.log(result);
      importErrors.push(file);
    }
    pb.update(i)
  }
  return [totalImports, importErrors]
}

////////////////////////////////////////

/**
 * run the cli
 * @param {import('commander').Command} command
 * @param {"manifest"|"annotation"} datatype
 * @param {object} options
 */
async function action(command, datatype, options) {
  /** @type {2 | 3} */
  const iiifVersion = options.iiifVersion;
  /** @type {string[]} */
  const inputFile = options.file;

  if (iiifVersion===3) {
    notImplementedExit(`CLI imports for IIIF presentation V3 is not implemented`);
  }

  const fastifyClient = new FastifyClient();
  await fastifyClient.build();
  const importFunc = fastifyClient.importData(iiifVersion, datatype);

  // run
  const fileArr = await parseImportInputFile(inputFile);
  const [totalImports, importErrors] = await importData(importFunc, datatype, fileArr);

  if ( importErrors.length ) {
    logger.info(`There were problems importing ${datatype}s from the following ${importErrors.length} files: ${inspectObj(importErrors, -1)}`)
  }
  logger.info(`Imported ${totalImports} ${datatype}s into aiiinotate !`);
  await fastifyClient.stop(); // TODO app keeps idling after that ....
  return
}

/////////////////////////////////////////

/** define the cli */
function makeImportCommand() {

  const datatypeArg =
    new Argument("datatype", "type of data to import: manifests or annotations")
      .choices(["manifest", "annotation"]);

  const versionOpt =
    new Option("-i, --iiif-version <version>", "IIIF version")
      .choices(["2", "3"])
      .argParser(parseNumber)
      .makeOptionMandatory();

  const filesOpt =
    new Option("-f, --file <file>", "file containing paths to AnnotationLists, AnnotationPages or Manifests to process (1 line per path)")
      .makeOptionMandatory();

  return new Command("import")
    .description("import data into aiiinotate")
    .addArgument(datatypeArg)
    .addOption(filesOpt)
    .addOption(versionOpt)
    .action((datatype, options, command) => action(command, datatype, options))
}

export default makeImportCommand;