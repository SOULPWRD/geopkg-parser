# Geopackage parser

This is a geopackage parser written completely in javascript.
It parses out all necessary data from geopackage and outputs them into a valid geojson format.

It is still very much a work in progress.

## API for SQLite

```javascript
// NodeJS

import sqlite from "./sqlite.js";
import fs from "node:fs";

// load sqlite
fs.readFile(
    "./path/to/your/favourite/sqlite/database/file",
    function (err, data) {
        if (err) {
            // handler error
        }

        const header = sqlite.header(data.buffer);
        const schema = sqlite.master_schema(data.buffer);
    }
);
```