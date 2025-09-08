import test from "node:test";

import build from "#src/app.js";


test("test annotation Routes", async (t) => {
  const app = await build("test");
})