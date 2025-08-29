/**
 * test a fastify app
 */

import build from "#src/app.js";

async function test() {
    const fastify = await build({});
    console.log(fastify);
}

test();