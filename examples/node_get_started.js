import parser from "../parser.js";
import sqlite from "../sqlite.js";
import fs from "fs/promises";

// Read local file data.gpkg to ArrayBuffer
const file = await fs.readFile("./examples/test");
const arrayBuffer = file.buffer;
const parsed = parser(arrayBuffer);
const header = sqlite.header(arrayBuffer);
const master_schema = sqlite.master_schema(arrayBuffer);

parsed.pages.forEach((page) => {
    console.log("Page header");
    console.table([page.header]);
    console.log("Cells");
    console.table(page.cells);
    console.log("Records");
    console.table(page.records);
});

console.log("Database header", header);
console.log("Database master schema", JSON.stringify(master_schema, null, 2));