import path from "path"

import dotenv from "dotenv"
import dotenvExpand from "dotenv-expand";

// we use dotenv-expand to expand the variables used in the .env file.
const loadEnv = () => {
  dotenvExpand.expand(dotenv.config({
    path: [path.join(import.meta.dirname, ".env")]
  }));
}

export default loadEnv;
