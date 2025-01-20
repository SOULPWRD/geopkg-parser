// Martin Pravda
// cell.js

// Cell in the sqlite terminology is a place where rowid
// and record payload are stored.
// There are 4 types of cells:
// 1. A table leaf cell
// 2. A table interior cell
// 3. An index leaf cell
// 4. An index interior cell

/*jslint browser, node */

import utils from "./utils.js";
import varint from "./varint64.js";

function is_a_leaf(type) {
    return [10, 13].includes(type);
}

function parse_pointers(view, offset, number_of_cells) {
    return utils.make_empty_list(number_of_cells).map(function (ignore, index) {
        return index;
    }).reduce(function (pointers, order) {
        pointers.push(view.getUint16(offset + order * 2));
        return pointers;
    }, []);
}

function parse_leaf(view, start) {
// 1) read varint for payload size
    const payload = varint.decode(view, start);
    start += payload.size;

// 2) read varint for rowid
    const row = varint.decode(view, start);
    start += row.size;

    // return offsets
    return Object.freeze({
        overflow_start: start + Number(payload.data),
        payload_end: start + Number(payload.data),
        payload_start: start,
        row_id: row.data
    });
}

export default Object.freeze({
    is_a_leaf,
    parse_leaf,
    parse_pointers
});