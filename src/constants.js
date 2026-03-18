/** @type {boolean} */
const STRICT_MODE = process.env.AIIINOTATE_STRICT_MODE?.toLowerCase() === "true";
/** @type {"app"|"cli"|"test"} */
const TARGET = process.env.AIIINOTATE_TARGET || "app";

export {
    STRICT_MODE,
    TARGET,
}
