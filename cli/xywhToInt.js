import { Command, Option, Argument } from "commander";

import loadMongoClient from "#cli/utils/mongoClient.js";
import ProgressBar from "#cli/utils/progressbar.js";
import { maybeToArray } from "#src/utils/utils.js";

/** @typedef {import("mongodb").Db} Db */

/**
 * bash command to get faulty annotations from a docker aiiinotate instance:
 * ```
 * docker exec docker-mongo-1 mongosh vhs_aiiinotate --eval \
 *      "JSON.stringify(db.annotations2.find({ 'on.xywh': { \$type: 'double' } }, { '_id': 0 }).toArray(), null, 2);" \
 *      > mogno_export.json
 * ```
 *
 * bash command to import annotations exported above in a local mongo instance:
 * ```
 * mongoimport \
 *   --host localhost \
 *   --db aiiinotate \
 *   --collection annotations2 \
 *   --file ./mogno_export.json \
 *   --jsonArray
 * ```
 */

/**
 * round an xywh bounding box to integers.
 * the bouding box should be within the image (otherwise, reading the XYWH bbox into a IIIF
 * Image API URL will fail):
 * - `x` and `y` should be positive integers => round them to larger integer
 * - `x+w` and `y+h` should be smaller than the image's width and height
 *    => round them to the smallest integer.
 * this really only matters if a bbox is on the boundaries of an image.
 * @type {(xywh: number[]) => number[]}
 */
const xywhToInt = ([x,y,w,h]) => (
  // convert to int
  [
    Math.ceil(x),
    Math.ceil(y),
    Math.floor(w),
    Math.floor(h)
  ]
  // 1st failsafe: value may be converted to `-0`, which will
  // demand us to reupdate the documents everytime for some obscure reason
  .map((v) => v===-0 ? 0 : v)
  // 2nd failsafe: use Math.trunc to ensure the returned number is an int.
  .map(Math.trunc)
)

/**
 *
 * @param {Db} db - the mongo database
 * @param {object} annotation - the annotation to update
 * @param {boolean} dryRun - if `false`, don't update the annotation in database
 */
async function updateAnnotation(db, annotation, dryRun) {
  let [annotationTargetArray, converted] = maybeToArray(annotation.on, true);

  annotationTargetArray = annotationTargetArray.map((target) => {
    target.xywh = xywhToInt(target.xywh);
    console.log(target.xywh);
    return target;
  });
  annotation.on = converted
    ? annotationTargetArray[0]
    : annotationTargetArray;

    // console.log("post: ", annotation.on);
  // we need to do 1 update / document, since the @id filter can select 1 document at a time.
  if ( !dryRun ) {
    await db.collection("annotations2").updateOne(
      { "@id": annotation["@id"] },
      { $set: annotation },
      { upsert: false }
    );
  }
  return
}

// NOTE: annotations have been exported from vhs and imported in local aiiinotate instance.
async function action(options) {
  const dryRun = options.dryRun || false;

  const summary = { total: 0, ok: 0, error: 0 };

  const { client, db } = loadMongoClient();
  const filter = { "on.xywh": { $type: "double" } };
  const toUpdateCount = await db.collection("annotations2").countDocuments(filter);
  const annotationsCursor = db.collection("annotations2").find(filter);
  summary.total = toUpdateCount;

  const pb = new ProgressBar({ desc: "updating annotations", total: toUpdateCount });
  let i = 0;
  while (await annotationsCursor.hasNext()) {
    i += 1;
    pb.update(i);
    const annotation = await annotationsCursor.next();
    try {
      await updateAnnotation(db, annotation, dryRun);
      summary.ok += 1;
    } catch (e) {
      console.error(e);
      summary.error += 1
    }
  }

  console.log(`converting annotation.on.xywh to int (dry run=${dryRun}). results:`, summary);
  await client.close()
  process.exit(0);
}

function makeXywhToIntCommand() {
  const dryRunOpt = new Option("-d, --dry-run", "dry run (don't update data)");

  return new Command("xywh-to-int")
    .description("convert all `db.annotations2.on.xywh` values from float to int")
    .addOption(dryRunOpt)
    .action(async (options, command) => { return await action(options) });
}

export default makeXywhToIntCommand;
