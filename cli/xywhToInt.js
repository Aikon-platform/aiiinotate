import { Command, Option, Argument } from "commander";

import loadMongoClient from "#cli/utils/mongoClient.js";

/**
 * bash command to get faulty annotations from a docker aiiinotate instance:
 * ```
 * docker exec docker-mongo-1 mongosh vhs_aiiinotate --eval \
 *      "JSON.stringify(db.annotations2.find({ 'on.xywh': { \$type: 'double' } }, { '_id': 0 }).toArray(), null, 2);" \
 *      > aiiinotate_annotations_decimal_xywh.json
 * ```
 */

/**
 * bash command to import annotations exported above in a local mongo instance:
 * ```
 * mongoimport \
 *   --host localhost \
 *   --db aiiinotate \
 *   --collection annotations2 \
 *   --file ./aiiinotate_annotations_decimal_xywh.json \
 *   --jsonArray
 * ```
 */

// NOTE: annotations have been exported from vhs and imported in local aiiinotate instance.
async function action() {
    const { client, db } = loadMongoClient();
    const filter = { "on.xywh": {$type: "double"} };
    const totalCount = await db.collection("annotations2").countDocuments();
    const toUpdateCount = await db.collection("annotations2").countDocuments(filter);
    const annotations = db.collection("annotations2").find(filter);

    console.log(`total annotations: ${totalCount} ; annotations to update: ${toUpdateCount}`);
    return
}

function makeXywhToIntCommand() {
    return new Command("xywh-to-int")
        .description("convert all `db.annotations2.on.xywh` values from float to int")
        .action(async () => { return await action() });
}

export default makeXywhToIntCommand;
