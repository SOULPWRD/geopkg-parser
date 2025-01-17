// Martin Pravda
// page.js

// A page parser
// A page is is a block of data of a fixed size
// A complete documentation for the B-Tree pages structure can be found here
// https://www.sqlite.org/fileformat.html#b_tree_pages

/* jslint browser, node */

import varint from "./varint64.js";
import utils from "./utils.js";

function parse_cell_pointers(view, offset, number_of_cells) {
    return utils.make_empty_list(number_of_cells).map(function (ignore, index) {
        return index;
    }).reduce(function (pointers, order) {
        pointers.push(view.getUint16(offset + order * 2));
        return pointers;
    }, []);
}

function parse_header(view, start) {
    const page_type = view.getUint8(start);
    const freeblock_start = view.getUint16(start + 1);
    const number_of_cells = view.getUint16(start + 3);
    const cell_content_area = view.getUint16(start + 5);
    const fragmented_free_bytes_nr = view.getUint8(start + 7);
    const right_most_pointer = view.getUint32(start + 8);

    return Object.freeze({
        cell_content_area,
        fragmented_free_bytes_nr,
        freeblock_start,
        number_of_cells,
        page_type,
        right_most_pointer
    });
}

function is_a_leaf(type) {
    return [10, 13].includes(type);
}

function decode_utf8(byte_array) {
    // Minimal decoding of a UTF-8 text column
    return new TextDecoder("utf-8").decode(byte_array);
  }

function parse_column(view, serial, offset) {
    // just parse text
    const size = (serial - 13) / 2;
    const text_bytes = new Uint8Array(view.buffer, offset, size);
    const value = decode_utf8(text_bytes);
    
    return Object.freeze({ 
        bytes_used: size,
        value
    });
}


function parse_record(view, offset = 0) {
    const header = varint.decode(view, offset);
    offset += header.size;

    const header_bytes_left = Number(header.data) - header.size;
    const [serial_types, serials_end] = utils.make_empty_list(
        header_bytes_left
    ).reduce(function ([types, offset]) {
        const serial = varint.decode(view, offset);
        types.push(Number(serial.data));
        return [
            types,
            offset + serial.size
        ];
    }, [[], offset]);

    // just test
    // take first serial
    
    // const column = parse_column(view, serial_types[0], serials_end);

    return Object.freeze({
        // column
    });
}

function parse_leaf(view, start) {
// 1) read varint for payload size
    const payload = varint.decode(view, start);
    start += payload.size;    

// 2) read varint for rowid
    const row = varint.decode(view, start);
    start += row.size;

    return Object.freeze({
        overflow_start: start + Number(payload.data),
        row_id: row.data,
        record_start: start,
        record_end: start + Number(payload.data),
    });
}

function parse_page(view, start) {
    const header = parse_header(view, start);
    const cell_pointers = parse_cell_pointers(
        view,
        (
            is_a_leaf(header.page_type)
            ? start + 8
            : start + 12
        ),
        header.number_of_cells
    );
    const cell_starts = cell_pointers.map(function (pointer) {
        return pointer;
    });

    const leaf_data = cell_starts.map(function (offset) {
        return parse_leaf(view, offset);
    });

    // test
    // const [leaf] = leaf_data;

    // const parsed_record = parse_record(view, leaf.record_start);

    return Object.freeze({
        header,
        cell_starts,
        leaf_data
    });
}

export default Object.freeze(parse_page);