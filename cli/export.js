import path from "node:path";

import { Command, Option, Argument } from "commander";

import loadMongoClient from "#cli/utils/mongoClient.js";
import { dirOk, getCwd, writeCursorToJson } from "#cli/utils/io.js";

/** @typedef {import("#types").MongoDbType} MongoDbType */
/** @typedef {import("#types").MongoFindCursorType} MongoFindCursorType */
/** @typedef {import("fs").PathLike} PathLike */


const exportableCollections = [ "all", "annotations2", "annotations3", "manifests2", "manifests3" ];
const actualCollections = exportableCollections.filter(c => c!=="all");

/** @type {(outDir: string) => string} */
const getOutDir = (outDir) => {
  let success;
  if (outDir) {
    [ outDir, success ] = dirOk(outDir);
    if (!success) {
      console.error(`Error opening directory "${outDir}". Are you sure it exists ?`);
      process.exit(1);
    }
  } else {
    outDir = getCwd();
  }
  return outDir;
}

/** @type {() => (collectionName: string) => string|PathLike} */
const outFileNameFunc = () => {
  // we currify this function so that, if a user exports all collections,
  // output file nmaes share the same timestamp.
  const timestamp = (new Date).toISOString().slice(0,-2);
  return (outDir, collectionName) =>
    path.join(outDir, `${timestamp}-aiiinotate-${collectionName}.json`);
}
const outFileName = outFileNameFunc();

/**
 * if `count`, returns a function to count all documents in a collection.
 * else, returns a function to find all documents in a collection.
 * @type {(db:MongoClient) => (count: boolean) => (collectionName: string) => MongoFindCursorType|Promise<number>}
 */
const exportCmdFunc = (db) =>
  (count) =>
    (collectionName) => {
      const collection = db.collection(collectionName);
      return count
        ? collection.countDocuments()
        : collection.find().project({ _id: 0 })

    }

/**
 * export a single collection to a file
 * @param {MongoClient} db
 * @param {string} outDir
 * @returns {(collctionName: string) => Promise<void>}
 */
const exportCollectionFunc = (db, outDir) => {
  const exportCmd = exportCmdFunc(db)(false);
  const countFunc = exportCmdFunc(db)(true);

  return async (collectionName) => {
    const out = outFileName(outDir, collectionName);
    const collectionCursor = exportCmd(collectionName);
    const totalCount = await countFunc(collectionName);
    try {
      await writeCursorToJson(out, collectionCursor, totalCount);
      console.log(`Wrote export of collection "${collectionName}" (${totalCount} documents) to "${out}"\n`)
    } catch(e) {
      console.error(`Error writing export of collection "${collectionName}" to "${out}": ${e}`);
      process.exit(1);
    }
  }
}

/**
 * @param {string} collection
 * @param {object} options
 */
async function action(collection, options) {
  const { client, db } = loadMongoClient();
  const outDir = getOutDir(options.output);
  const collectionNameArray =collection === "all" ? actualCollections : [ collection ];
  const exportCollection = exportCollectionFunc(db, outDir);

  console.log(`\nExporting collection(s): ${collectionNameArray}\n`)

  // fetch and write to file
  for (const collectionName of collectionNameArray) {
    await exportCollection(collectionName);
  }

  console.log(`\nFinished exporting collection(s): ${collectionNameArray} to "${outDir}".`)
  await client.close();
  process.exit(0);
}

/** define the cli */
function makeExportCommand() {

  const collectionArg =
    new Argument("collection", `collection to export import: one of ${exportableCollections}`)
      .choices(exportableCollections);

  const outOpt = new Option("-o, --output <directory>", "Output directory (defaults to current working directory");

  return new Command("export")
    .description("export aiiinotate data")
    .addArgument(collectionArg)
    .addOption(outOpt)
    .action(async (collection, options, command) => await action(collection, options))
}

export default makeExportCommand;