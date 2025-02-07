/*jslint browser, node, devel */

import sqlite from "../dist/geopkg.js";
import fs from "fs/promises";

// Read local file data.gpkg to ArrayBuffer
const file = await fs.readFile("./examples/data.gpkg");
const array_buffer = file.buffer;
const database = sqlite(array_buffer);
const master_schema = database.master_schema();
const parsed = database.parsed();

parsed.pages.forEach(function (page) {
    console.log("Page header");
    console.table([page.header]);
    console.log("Cells");
    console.table(page.cells);
    console.log("Records");
    console.table(page.records);
});

console.log("Database header", parsed.header);

master_schema.forEach(function (table) {
    console.log("Table: ", table.name);
    const data = database.from(table.name);
    console.table(data);
});