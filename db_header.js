// Martin Pravda
// header.js

// This file contains an implementation for header parser.
// It parses out all necessary information stored in the header.
// Header allocates first 100 bytes

// A complete documentation regarding the sqlite file format
// can be found here - https://www.sqlite.org/fileformat.html

/*jslint browser, node */

// the sqlite magic header is first 16 bytes

import utils from "./utils.js";

function decode_ascii(buffer, start, end, encoding = "utf-8") {
    return utils.decode_text(
        new Uint8Array(buffer).slice(start, end),
        encoding
    );
}

function decode32bit(buffer, start) {
    return new DataView(buffer).getUint32(start);
}

function decode16bit(buffer, start) {
    return new DataView(buffer).getUint16(start);
}

function decode8bit(buffer, start) {
    return new DataView(buffer).getUint8(start);
}

function parse(buffer) {
    const header_string = decode_ascii(buffer, 0, 16);

// size 2 bytes

    const page_size = decode16bit(buffer, 16);

// size 1 bytes

    const write_version = decode8bit(buffer, 18);
    const read_version = decode8bit(buffer, 19);
    const reserved_space = decode8bit(buffer, 20);
    const maximum_payload_fraction = decode8bit(buffer, 21);
    const minimum_payload_fraction = decode8bit(buffer, 22);
    const leaf_payload_fraction = decode8bit(buffer, 23);

// size 4 bytes

    const file_change_counter = decode32bit(buffer, 24);
    const db_pages_count = decode32bit(buffer, 28);
    const free_list_trunk_page_nr = decode32bit(buffer, 32);
    const free_list_pages_count = decode32bit(buffer, 36);
    const schema_cookie = decode32bit(buffer, 40);
    const schema_format_nr = decode32bit(buffer, 44);
    const default_page_cache_size = decode32bit(buffer, 48);
    const largest_root_b_tree = decode32bit(buffer, 52);
    const db_text_encoding = decode32bit(buffer, 56);
    const user_version = decode32bit(buffer, 60);
    const incremental_vacuum_mode = decode32bit(buffer, 64);
    const application_id = decode32bit(buffer, 68);

// there's 20 bytes reserved for expansion
// so we skip 71 - 91 bytes

    const version_valid_for = decode32bit(buffer, 92);
    const sqlite_version = decode32bit(buffer, 96);

    return Object.freeze({
        application_id,
        db_pages_count,
        db_text_encoding,
        default_page_cache_size,
        file_change_counter,
        free_list_pages_count,
        free_list_trunk_page_nr,
        header_string,
        incremental_vacuum_mode,
        largest_root_b_tree,
        leaf_payload_fraction,
        maximum_payload_fraction,
        minimum_payload_fraction,
        page_size,
        read_version,
        reserved_space,
        schema_cookie,
        schema_format_nr,
        sqlite_version,
        user_version,
        version_valid_for,
        write_version
    });
}


// tests
// split the text into the array of charcodes
// const the_header_string = "SQLite format 3";
// function create_test_header() {
//     const header_buffer = new ArrayBuffer(100);
//     const view = new DataView(header_buffer);

//     // fill first 16 bytes with the header string
//     // offset 0 - 16
//     the_header_string.slice(0, 16).split("").forEach(function (char, offset) {
//         view.setUint8(offset, char.charCodeAt(0));
//     });

//     // add page size
//     // offset 16 - 18
//     // value between 512 and 32768 inclusive
//     // or the value 1 representing a page size of 65536
//     view.setUint16(16, 512, false);

//     // file format write version
//     // values between 1 (legacy) or 2 (wal)
//     view.setUint8(18, 2);
//     // file format read version
//     // values between 1 (legacy) or 2 (wal)
//     view.setUint8(19, 2);

//     return header_buffer;
// }


// // make a buffer of a fix length with a corresponeding view
// // and fill the buffer via view
// const buffer = create_test_header();

// console.log(decode_ascii(buffer, 0, 16));
// console.log(decode16bit(buffer, 16));

export default Object.freeze(parse);