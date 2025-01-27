// sqlite.js
// This file export a public interface
// It is a main entry file for sqlite function

import parse_db_header from "./db_header.js";
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
 * @returns {Array<Object>} - An array of column objects representing the schema
 */
function master_schema(buffer) {
    const view = new DataView(buffer);
    return page.parse(view, 100)?.records?.map(
        function (record) {
            const sql_create = record.columns[record.columns.length - 1];
            const columns = utils.from_sql(sql_create);
            const pairs = utils.zip(
                sqlite_schema_attributes,
                record.columns
            );
            const result = utils.from_pairs(pairs);
            return Object.assign(
                result,
                {columns}
            );
        }
    );
}

/**
 * Retrieves the data for a given SQLite table from the provided buffer.
 *
 * @param {ArrayBuffer} buffer - The buffer containing the SQLite data.
 * @param {string} table_name - The name of the table to retrieve records for.
 * @returns {Array<Object>} - An array of objects representing the table data.
 */
function from(buffer, table_name) {
    const view = new DataView(buffer);
    const schema = master_schema(buffer);
    const schema_row = schema?.find(
        function (row) {
            const {tbl_name, type} = row;
            return table_name === tbl_name && type === "table";
        }
    );
    const {columns, rootpage} = schema_row;
    const column_names = columns.map(function (column) {
        return column.name;
    });
    const page_size = parse_db_header(buffer).page_size;
    return page.parse(view, (rootpage - 1) * page_size)?.records?.map(
        function (record) {
            return utils.from_pairs(
                utils.zip(column_names, record.columns)
            );
        }
    );

}

export default Object.freeze({
    from,
    header: parse_db_header,
    master_schema
});
