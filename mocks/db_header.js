/*jslint browser, node */

import jscheck from "../tools/jscheck.js";

const jsc = jscheck();
const data = [

// database page size

    jsc.one_of([
        jsc.number(512, 32768),
        jsc.number(1)
    ]),

// file format write version

    jsc.number(1, 2),

// file format read version

    jsc.number(1, 2),

// unused reserved space

    jsc.number(0),

// maximum embedded payload fraction

    jsc.number(64),

// minimum embedded payload fraction

    jsc.number(32),

// leaf payload fraction

    jsc.number(32),

// file change counter

    jsc.number(0, 2 ** 32),

// size of the database file in pages

    jsc.number(0, 2 ** 32),

// page number of the first freelist chunk

    jsc.number(0, 2 ** 32),

// number of freelist pages

    jsc.number(0, 2 ** 32),

// the schema cookie

    jsc.number(0, 2 ** 32),

// the schema format number

    jsc.number(1, 4),

// default page cache size

    jsc.number(0, 2 ** 32),

// the largest root b-tree page when in auto-vacuum or incremental-vacuum modes
// or zero otherwise

    jsc.one_of([
        jsc.number(0, 2 ** 32),
        jsc.number(0)
    ]),

// database text encoding

    jsc.number(1, 3),

// user version

    jsc.number(0, 2 ** 32),

// incremental-vacuum mode

    jsc.number(0, 2 ** 32),

// application ID

    jsc.number(0, 2 ** 32),

// reserved for expansion

    jsc.number(0),

// the version valid number for

    jsc.number(0, 2 ** 32),

// sqlite version number

    jsc.number(0, 2 ** 32)
];

function create_view() {
    const buffer = new ArrayBuffer(100);
    const view = new DataView(buffer);
    const [
        page_size,
        write_version,
        read_version,
        reserved_space,
        maximum_payload_fraction,
        minimum_payload_fraction,
        leaf_payload_fraction,
        file_change_counter,
        db_pages_count,
        free_list_trunk_page_nr,
        free_list_pages_count,
        schema_cookie,
        schema_format_nr,
        default_page_cache_size,
        largest_root_b_tree,
        db_text_encoding,
        user_version,
        incremental_vacuum_mode,
        application_id,
        version_valid_for,
        sqlite_version
    ] = data;

    new TextEncoder("utf-8").encode(
        "SQLite format 3\x00"
    ).forEach(function (code, offset) {
        view.setUint8(offset, code);
    });

    view.setUint16(16, page_size());
    view.setUint8(18, write_version());
    view.setUint8(19, read_version());
    view.setUint8(20, reserved_space());
    view.setUint8(21, maximum_payload_fraction());
    view.setUint8(22, minimum_payload_fraction());
    view.setUint8(23, leaf_payload_fraction());
    view.setUint32(24, file_change_counter());
    view.setUint32(28, db_pages_count());
    view.setUint32(32, free_list_trunk_page_nr());
    view.setUint32(36, free_list_pages_count());
    view.setUint32(40, schema_cookie());
    view.setUint32(44, schema_format_nr());
    view.setUint32(48, default_page_cache_size());
    view.setUint32(52, largest_root_b_tree());
    view.setUint32(56, db_text_encoding());
    view.setUint32(60, user_version());
    view.setUint32(64, incremental_vacuum_mode());
    view.setUint32(68, application_id());
    view.setUint32(92, version_valid_for());
    view.setUint32(96, sqlite_version());

    return view;
}

export default Object.freeze({
    create_view
});