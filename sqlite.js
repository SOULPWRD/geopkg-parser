// sqlite.js
// This file exports a public interface
// It is a main entry file for the sqlite module
// Sqlite instance exposes several methods that operate on top of given buffer
// It is also a main module for the geopackge module

/*jslint browser, node */

import page from "./page.js";
import utils from "./utils.js";
import parse from "./parser.js";

const sqlite_schema_attributes = [
    "type",
    "name",
    "tbl_name",
    "rootpage",
    "sql"
];

function sqlite(buffer) {
    const view = new DataView(buffer);
    const database = parse(view);

    function parsed(offset = 0, limit = undefined) {
        return Object.freeze({
            header: database.header,
            pages: database.pages.slice(offset, limit)
        });
    }

    function master_schema() {
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

    function from(table_name, offset = 0, limit = undefined) {
        const schema = master_schema();
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
        return page.parse(view, (
            rootpage - 1
        ) * database.header.page_size)?.records?.map(
            function (record) {
                return utils.from_pairs(
                    utils.zip(column_names, record.columns)
                );
            }
        ).slice(offset, limit);
    }

    return Object.freeze({
        from,
        master_schema,
        parsed
    });
}

export default Object.freeze(sqlite);
