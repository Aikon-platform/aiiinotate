#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// get input argument or default my-folder and hello.txt for
// folder and file name respectively
const folderName = process.argv[2] || "my-folder";

// create folder in root folder and file inside the given folder.
const folderPath = path.join(process.cwd(), folderName);

console.log("#".repeat(100))
console.log(folderName)
console.log(folderPath)
console.log("#".repeat(100))
