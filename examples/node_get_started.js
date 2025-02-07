/*jslint node */

import sqlite from "../sqlite.js";
import fs from "fs/promises";

// Read local file data.gpkg to ArrayBuffer
const file = await fs.readFile("./examples/test");
const array_buffer = file.buffer;
const database = sqlite(array_buffer);
const parsed = database.parsed();
const master_schema = database.master_schema();
const tables = database.show_tables();

// Get lower level data from the parser
parsed.pages.forEach(function (page) {
    console.log("Page header");
    console.table([page.header]);
    console.log("Cells");
    console.table(page.cells);
    console.log("Records");
    console.table(page.records);
});

console.log("Database header", parsed.header);
console.log("Master schema");
console.table(master_schema);

console.log("Database tables");
console.table(tables);

// Get data from all tables from master schema
master_schema.forEach(function (table) {
    console.log("Table: ", table.name);
    const data = database.from(table.name);
    console.table(data);
});