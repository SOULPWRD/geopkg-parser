// Martin Pravda
// cell.js

// Cell in the sqlite terminology is a place where rowid
// and record payload are stored.

/*jslint browser, node */

import utils from "./utils.js";
import varint from "./varint64.js";

function parse_pointers(view, page_start, pointers_offset, number_of_cells) {
    return utils.make_empty_list(
        number_of_cells
    ).map(function (ignore, index) {

// since cell pointers are the array of 2 byte pointers
// we need to calculate even numbers based on the number of cells

        return index * 2;
    }).reduce(function (pointers, order) {
        const pointer_offset = view.getUint16(pointers_offset + order);
        pointers.push(page_start + pointer_offset);
        return pointers;
    }, []);
}

function parse_table_interior(view, start) {

// read varint for rowid

    const row = varint.decode(view, start);

    return Object.freeze({
        row_id: row.data
    });
}

function parse_table_leaf(view, start) {

// read varint for payload size

    const payload = varint.decode(view, start);
    start += payload.size;

// read varint for rowid

    const row = varint.decode(view, start);
    start += row.size;

// return offset references


    return Object.freeze({

// keep overflow empty for now

        // overflow_start: view.getUint32(start + payload.data),
        payload_end: start + payload.data,
        payload_start: start,
        row_id: row.data
    });
}

export default Object.freeze({
    parse_table_leaf,
    parse_table_interior,
    parse_pointers
});