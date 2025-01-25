# Geopackage parser

This is a geopackage parser written completely in javascript.
It parses out all necessary data from geopackage and outputs them into a valid geojson format.

It is still very much a work in progress.

## Installation
```
npm install
```

## Demos and testing
For testing and running demos we use an interactive [Replete](https://github.com/jamesdiacono/Replete) environment. Please note, it is necessary to have [nodejs](https://nodejs.org/en) and [deno](https://deno.com/) installed on your local machine.
Code imlementation, a simple demos and tests - all exists within a single file. There's no separation of concerns. It provides a strong file integrity and portability.

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
        const data = sqlite.from(data.buffer, "<TABLE NAME>");
    }
);
```

## Examples

Follow the [examples](./examples) folder and run it with `node <file_name>.js`. We will add also browser examples soon.