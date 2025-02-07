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

// The 'traverse' function accepts a page number and finds the page.
// If the given page is an interior page,
// it interates through the child pages untils it finds all leaf pages.

    function traverse(page_nr) {
        const leafs = [];
        const pages_queue = [
            database.pages[page_nr]
        ];

        while (pages_queue.length > 0) {
            const p = pages_queue.shift();

            if (page.is_leaf(p.header.page_type)) {
                leafs.push(p);
            } else {
                p.cells.forEach(function (cell) {
                    pages_queue.push(
                        database.pages[cell.left_child_page_nr - 1]
                    );
                });
            }
        }

        return leafs;
    }

    function parsed(offset = 0, limit = undefined) {
        return Object.freeze({
            header: database.header,
            pages: database.pages.slice(offset, limit)
        });
    }

    function master_schema() {
        return traverse(0).map(function (page) {
            return page?.records.filter(function (record) {

// get only tables for now

                return (
                    record.columns[0] === "table"
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
        }).flat();
    }

    function show_tables() {
        const schema = master_schema();
        return schema.filter(function (table) {
            return table.type === "table";
        }).map(function (table) {
            return {name: table.tbl_name};
        });
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

        return traverse(
            rootpage - 1
        ).map(function (page) {
            return page.records.map(function (record) {
                return utils.from_pairs(
                    utils.zip(column_names, record.columns)
                );
            });
        }).flat().slice(offset, limit);
    }

    return Object.freeze({
        from,
        master_schema,
        parsed,
        show_tables
    });
}

export default Object.freeze(sqlite);
