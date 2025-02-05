// wkb.js
// Martin Pravda

/*jslint browser, node, bitwise, for */

import utils from "./utils.js";

function encode_hex_string(buffer) {
    const view = new Uint8Array(buffer);
    return Array.from(view.values()).map(function (x) {
        const prefix = (
            x < 16
            ? "0"
            : ""
        );
        return prefix + Number(x).toString(16).toUpperCase();
    });
}

function decode_hex_string(text) {
    const buffer_length = text.length / 2;
    const buffer = new ArrayBuffer(buffer_length);
    const view = new DataView(buffer);

    utils.make_empty_list(buffer_length).forEach(function (ignore, index) {
        view.setUint8(index, parseInt(text.substr(index * 2, 2), 16));
    });

    return view;
}

function make_instance(view) {
    let offset_pointer = 0;
    let is_little_endian = false

    function read_uint8() {
        const data = view.getUint8(offset_pointer);
        offset_pointer += 1;
        return data;
    }

    function read_uint32() {
        const data = view.getUint32(offset_pointer, is_little_endian);
        offset_pointer += 4;
        return data;
    }

    function read_double() {
        const data = view.getFloat64(offset_pointer, is_little_endian);
        offset_pointer += 8;
        return data;
    }

// header data

    is_little_endian = read_uint8() > 0;
    const wkb_type = read_uint32();
    const wkb_type_thousandth = Math.floor(
        (wkb_type & 0x0fffffff) / 1000
    );
    const has_z = (
        Boolean(wkb_type & 0x80000000)
        || wkb_type_thousandth === 1
        || wkb_type_thousandth === 3
    );
    const has_m = (
        Boolean(wkb_type & 0x40000000)
        || wkb_type_thousandth === 2
        || wkb_type_thousandth === 3
    );

    const srid = (
        Boolean(wkb_type & 0x20000000)
        ? read_uint32()
        : undefined
    );

    const type_id = (wkb_type & 0x0fffffff) % 1000;

    function read_point() {
        const coords = [];
    
    // read x and y coord
    
        coords.push(read_double());
        coords.push(read_double());
    
    // read z and m coord if exist
    
        if (has_z) {
            coords.push(read_double());
        }
    
        if (has_m) {
            coords.push(read_double());
        }
    
        return coords;
    }

    function read_linestrig() {
        const num_points = read_uint32();
        const coords = [];
        for (let i = 0; i < num_points; i++) {
            coords.push(read_point());
            console.log({coords});
        }
        return coords;
    }

    function read_polygon() {
        const num_rings = read_uint32();
        const rings = [];
        for (let i = 0; i < num_rings; i++) {
            rings.push(read_linestrig());
            console.log({rings});
        }
        return rings;
    }

    const readers_map = {
        "1": read_point,
        "2": read_linestrig,
        "3": read_polygon
    };

    function header() {
        return Object.freeze({
            is_little_endian,
            type_id,
            has_z,
            has_m,
            srid
        });
    }

    function geometry() {
        return readers_map[type_id]();
    }

    return Object.freeze({
        geometry,
        header
    });
}

import wkb_mock from "./mocks/wkb.js";
const wkb = make_instance(decode_hex_string(wkb_mock.hex_string));
wkb.header();
try {
    wkb.geometry();
} catch (err) {
    console.log(err);
}



export default Object.freeze({
    decode_hex_string,
    encode_hex_string,
    make_instance
});