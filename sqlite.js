// sqlite.js
// This file export a public interface
// It is a main entry file for sqlite function

import parse_header from "./db_header.js";
import page from "./page.js";
import utils from "./utils.js";

const sqlite_schema_attributes = [
    "type",
    "name",
    "tbl_name",
    "rootpage",
    "sql"
];

/**
 * Parses the SQLite schema from the provided buffer.
 *
 * @param {ArrayBuffer} buffer - The buffer containing the SQLite data.
 * @returns {Array<Object>} - An array of column objects representing the schema.
 */
function master_schema(buffer) {
    const view = new DataView(buffer);
    return page.parse(view, 100)?.records?.map(
        function (record) {
            const pairs = utils.zip(
                sqlite_schema_attributes,
                record.columns
            );
            return utils.from_pairs(pairs);
        }
    );
}

export default Object.freeze({
    header: parse_header,
    master_schema
});
