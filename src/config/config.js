import dotenv from "dotenv";
import path from "path";

function loadEnv() {
    dotenv.config({
        path: [ path.join(import.meta.dirname, ".env") ]
    })
}

export default loadEnv