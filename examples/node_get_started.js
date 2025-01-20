import parser from "../parser.js";
import fs from "fs/promises";

// Read local file data.gpkg to ArrayBuffer
const file = await fs.readFile("./examples/data.gpkg");
const arrayBuffer = file.buffer;
const parsed = parser(arrayBuffer);

parsed.pages.forEach((page) => {
    console.log("Page header");
    console.table([page.header]);
    console.log("Leafs");
    console.table(page.leaf_data);
});

console.log("Database header", parsed.header);