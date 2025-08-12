import dotenv from "dotenv";
import path from "path";

function loadEnv() {
    dotenv.config({
        path: [ path.join(import.meta.dirname, ".env") ]
    })
}

const config = {
    mongodbConnString: `mongodb://${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}/${process.env.MONGODB_DB}`,
}

export default {
    loadEnv,
    config
}