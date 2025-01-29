// Martin Pravda
// record.js

// This file is a main file for parsing out the record format
// and getting out the data for individual columns

/* jslint node, browser */


import varint from "./varint64.js";
import utils from "./utils.js";

function decode_blob(view, type, offset) {
    const size = (type - 12) / 2;

// comment for now

    // if (view.byteLength <= offset + size) {
    //     return Object.freeze({
    //         data: new Uint8Array(
    //             view.buffer,
    //             offset,
    //             (offset + size) - view.byteLength
    //         ),
    //         size: 0
    //     });
    // }
    return Object.freeze({
        data: new Uint8Array(view.buffer, offset, size),
        size
    });
}

function decode_text(view, type, offset, encoding = "utf-8") {
    const size = (type - 13) / 2;
    const bytes = new Uint8Array(view.buffer, offset, size);
    return Object.freeze({
        data: utils.decode_text(bytes, encoding),
        size
    });
}

function parse_column(view, type, offset = 0, encoding = "utf-8") {
    if (type === 0) {
        return Object.freeze({
            data: null,
            size: 0
        });
    }

    if (type === 1) {
        return Object.freeze({
            data: view.getInt8(offset),
            size: 1
        });
    }

    if (type === 2) {
        return Object.freeze({
            data: view.getInt16(offset),
            size: 2
        });
    }

    if (type === 3) {
        return Object.freeze({
            data: utils.get_int(24)(view, offset),
            size: 3
        });
    }

    if (type === 4) {
        return Object.freeze({
            data: view.getInt32(offset),
            size: 4
        });
    }

    if (type === 5) {
        return Object.freeze({
            data: utils.get_int(48)(view, offset),
            size: 6
        });
    }

    if (type === 6) {
        return Object.freeze({
// add support for 64 bit
            data: null,
            size: 8
        });
    }

    if (type === 7) {
        return Object.freeze({
            data: view.getFloat64(offset),
            size: 8
        });
    }

    if (type === 8) {
        return Object.freeze({
            data: 0,
            size: 0
        });
    }

    if (type === 9) {
        return Object.freeze({
            data: 1,
            size: 0
        });
    }

    if (type >= 12) {
        return (
            (type % 2) === 0
            ? decode_blob(view, type, offset)
            : decode_text(view, type, offset, encoding)
        );
    }

// return a default value

    return Object.freeze({
        data: null,
        size: 0
    });
}

function parse_serial_types(view, offset, header_bytes_left) {
    const types = [];

    while (header_bytes_left > 0) {
        const serial = varint.decode(view, offset);
        types.push(serial.data);
        offset += serial.size;
        header_bytes_left -= serial.size;
    }

    return Object.freeze({
        data: types,
        offset
    });
}

function parse_colums(view, serial_types, offset = 0, encoding = "utf-8") {
    return serial_types.reduce(function (columns, serial) {
        const column = parse_column(view, serial, columns.offset, encoding);
        columns.data.push(column.data);
        columns.offset += column.size;
        return columns;
    }, {data: [], offset});
}

function parse(view, offset, encoding = "utf-8") {
    const header = varint.decode(view, offset);
    const header_bytes_left = header.data - header.size;
    const serial_types = parse_serial_types(
        view,
        offset + header.size,
        header_bytes_left
    );
    const columns = parse_colums(
        view,
        serial_types.data,
        serial_types.offset,
        encoding
    );
    return Object.freeze({
        columns: columns.data,
        header
    });
}

export default Object.freeze({
    parse
});