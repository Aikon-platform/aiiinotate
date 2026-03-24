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
 * @param {FastifyInstanceType} fastifyClient
 * @param {string[]} fileArr - array of full paths to annotationLists to insert.
 */
async function importAnnotationPage(fastifyClient, fileArr) {
  notImplementedExit(`${importAnnotationPage.name} is not implemented`)
}

/**
 * @param {FastifyClient} fastifyClient
 * @param {string[]} fileArr - array of full paths to annotationLists to insert.
 */
async function importAnnotationList(fastifyClient, fileArr) {
  // fileArr = fileArr.slice(0,10)

  const pb = new ProgressBar({ desc: "importing annotations", total: fileArr.length});
  const importErrors = [];
  let totalImports = 0

  for ( const [i, file] of fileArr.entries() ) {
    const
      annotationList = JSON.parse(fileRead(file)),
      [statusCode, resultPromise] = await fastifyClient.importAnnotationList(annotationList),
      result = await resultPromise;
    if ( statusCode <= 299 ) {
      totalImports += result.insertedCount;
    } else {
      importErrors.push(file);
    }
    pb.update(i)
  }

  if ( importErrors.length ) {
    logger.info(`There were problems importing annotations from the following ${importErrors.length} annotation lists: ${inspectObj(importErrors, -1)}`)
  }
  logger.info(`Imported ${totalImports} annotations into Aiiinotate !`);
  return
}

////////////////////////////////////////

/**
 * run the cli
 * @param {import('commander').Command} command
 * @param {object} options
 */
async function action(command, options) {

  /** @type {2 | 3} */
  const iiifVersion = options.iiifVersion;
  /** @type {string[]} */
  const inputFile = options.file;

  const fastifyClient = new FastifyClient();
  await fastifyClient.build();

  // run
  const filesToProcess = await parseImportInputFile(inputFile);
  if ( iiifVersion===2 ) {
    await importAnnotationList(fastifyClient, filesToProcess);
  } else {
    await importAnnotationPage(fastifyClient, filesToProcess);
  }
  // exit
  await fastifyClient.stop();
}

/////////////////////////////////////////

/** define the cli */
function makeImportCommand() {

  const versionOpt =
    new Option("-i, --iiif-version <version>", "IIIF version")
      .choices(["2", "3"])
      .argParser(parseNumber)
      .makeOptionMandatory();

  const filesOpt =
    new Option("-f, --file <file>", "file containing paths to AnnotationLists or AnnotationPages to process (1 line per path)")
      .makeOptionMandatory();

  return new Command("import")
    .description("import data into aiiinotate")
    .addOption(filesOpt)
    .addOption(versionOpt)
    .action((options, command) => action(command, options))
}

export default makeImportCommand;