import parser from "../parser.js";
import { sqliteHeader, sqliteSchema } from "../sqlite.js";
import fs from "fs/promises";

// Read local file data.gpkg to ArrayBuffer
const file = await fs.readFile("./examples/test");
const arrayBuffer = file.buffer;
const parsed = parser(arrayBuffer);
const header = sqliteHeader(arrayBuffer);
const schema = sqliteSchema(arrayBuffer);

parsed.pages.forEach((page) => {
    console.log("Page header");
    console.table([page.header]);
    console.log("Cells");
    console.table(page.cells);
    console.log("Records");
    console.table(page.records);
});

console.log("Database header", header);
console.log("Database schema", schema);