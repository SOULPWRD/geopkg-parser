// sqlite.js
// This file exports a public interface
// It is a main entry file for the sqlite module
// Sqlite instance exposes several methods that operate on top of given buffer
// It is also a main module for the geopackge module

/*jslint browser, node */

import page from "./page.js";
import utils from "./utils.js";
import parse from "./parser.js";
import db_header from "./db_header.js";

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
        const pages = page.traverse(
            view,
            database.header.page_size,
            0,
            db_header.encodings[database.header.db_text_encoding - 1],
            100
        );

        return pages.map(function (page) {
            return page?.records.filter(function (record) {
                return (
                    record.columns[0] !== "index"
                    && record.columns[0] !== "trigger"
                );
            }).map(function (record) {
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
            });
        }).flat()
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

        return page.traverse(
            view, database.header.page_size, rootpage - 1
        ).map(function (page) {
            return page.records.map( function (record) {
                    return utils.from_pairs(
                        utils.zip(column_names, record.columns)
                    );
                })
        }).flat().slice(offset, limit);
    }

    return Object.freeze({
        from,
        master_schema,
        parsed
    });
}

export default Object.freeze(sqlite);
