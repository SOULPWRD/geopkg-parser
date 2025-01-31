// Martin Pravda
// header.js

// This file contains an implementation for header parser.
// It parses out all necessary information stored in the header.
// Header allocates first 100 bytes

// A complete documentation regarding the sqlite file format
// can be found here - https://www.sqlite.org/fileformat.html

/*jslint browser, node */

import utils from "./utils.js";

const encodings = [
    "utf-8",
    "utf-16le",
    "utf-16be"
];

function parse(view) {

// the sqlite magic header is first 16 bytes

    const header_string = utils.decode_text(
        new Uint8Array(view.buffer).slice(0, 16)        
    );

// size 2 bytes

    const page_size = view.getUint16(16);

// size 1 bytes

    const write_version = view.getUint8(18);
    const read_version = view.getUint8(19);
    const reserved_space = view.getUint8(20);
    const maximum_payload_fraction = view.getUint8(21);
    const minimum_payload_fraction = view.getUint8(22);
    const leaf_payload_fraction = view.getUint8(23);

// size 4 bytes

    const file_change_counter = view.getUint32(24);
    const db_pages_count = view.getUint32(28);
    const free_list_trunk_page_nr = view.getUint32(32);
    const free_list_pages_count = view.getUint32(36);
    const schema_cookie = view.getUint32(40);
    const schema_format_nr = view.getUint32(44);
    const default_page_cache_size = view.getUint32(48);
    const largest_root_b_tree = view.getUint32(52);
    const db_text_encoding = view.getUint32(56);
    const user_version = view.getUint32(60);
    const incremental_vacuum_mode = view.getUint32(64);
    const application_id = view.getUint32(68);

// there's 20 bytes reserved for expansion
// so we skip 71 - 91 bytes

    const version_valid_for = view.getUint32(92);
    const sqlite_version = view.getUint32(96);

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

//demo import header_test from "./mocks/db_header.js"
//demo parse(header_test.create_view());

export default Object.freeze({encodings, parse});