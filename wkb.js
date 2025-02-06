// wkb.js
// Martin Pravda
// A simple WKB reader

/*jslint browser, node, bitwise, for */

import utils from "./utils.js";
import binary from "./binary.js";

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

function calculate_geometry_props(wkb_type) {
    const is_ewkb = (
        wkb_type & 0x20000000
        || wkb_type & 0x40000000
        || wkb_type & 0x80000000
    );

    if (Boolean(is_ewkb) === false) {
        if (wkb_type >= 1000 && wkb_type < 2000) {
            return Object.freeze({
                geometry_type: wkb_type - 100,
                has_m: false,
                has_z: true
            });
        }

        if (wkb_type >= 2000 && wkb_type < 3000) {
            return Object.freeze({
                geometry_type: wkb_type - 2000,
                has_m: true,
                has_z: false
            });
        }

        if (wkb_type >= 3000 && wkb_type < 4000) {
            return Object.freeze({
                geometry_type: wkb_type - 3000,
                has_m: true,
                has_z: true
            });
        }

        return Object.freeze({
            geometry_type: wkb_type,
            has_m: false,
            has_z: false
        });
    }

    let has_z = false;
    let has_m = false;

    if (Boolean(wkb_type & 0x80000000)) {
        has_z = true;
    }

    if (Boolean(wkb_type & 0x40000000)) {
        has_m = true;
    }

    return Object.freeze({
        geometry_type: wkb_type & 0xF,
        has_m,
        has_z
    });
}

// header data
function read_header(binary_reader) {
    binary_reader.set_little_endian(
        binary_reader.read_uint8() > 0
    );

    const wkb_type = binary_reader.read_uint32();
    const srid = (
        Boolean(wkb_type & 0x20000000)
        ? binary_reader.read_uint32()
        : undefined
    );

    const {
        geometry_type,
        has_m,
        has_z
    } = calculate_geometry_props(wkb_type);

    return Object.freeze({
        geometry_type,
        has_m,
        has_z,
        srid,
        wkb_type
    });
}

function read_point(binary_reader, header) {
    const coords = [];

// read x and y coord

    coords.push(binary_reader.read_float64());
    coords.push(binary_reader.read_float64());

// read z and m coord if exist

    if (header.has_z) {
        coords.push(binary_reader.read_float64());
    }

    if (header.has_m) {
        coords.push(binary_reader.read_float64());
    }

    return coords;
}

function read_linestrig(binary_reader, header) {
    const num_points = binary_reader.read_uint32();
    return utils.make_empty_list(num_points).reduce(function (coords) {
        coords.push(read_point(binary_reader, header));
        return coords;
    }, []);
}

function read_polygon(binary_reader, header) {
    const num_rings = binary_reader.read_uint32();
    return utils.make_empty_list(num_rings).reduce(function (coords) {
        coords.push(read_linestrig(binary_reader, header));
        return coords;
    }, []);
}

function read_wkb_collection(read_fn) {
    return function (binary_reader) {
        const num = binary_reader.read_uint32();
        return utils.make_empty_list(num).reduce(function (coords) {
            coords.push(read_fn(binary_reader, read_header(binary_reader)));
            return coords;
        }, []);
    };
}

function read_payload(binary_reader, header) {
    const readers_map = {
        "1": read_point,
        "2": read_linestrig,
        "3": read_polygon,

// Multi geometries

        "4": read_wkb_collection(read_point),
        "5": read_wkb_collection(read_linestrig),
        "6": read_wkb_collection(read_polygon),

// Geometry collection

        "7": read_wkb_collection(read_payload)
    };

    return readers_map[header.geometry_type](binary_reader, header);
}

function read(view) {
    const binary_reader = binary.reader(view);
    const header = read_header(binary_reader);
    return read_payload(binary_reader, header);
}

//demo import wkb_mock from "./mocks/wkb.js";
//demo const wkb_point = read(decode_hex_string(wkb_mock.point));
//demo const wkb_polygon = read(decode_hex_string(wkb_mock.polygon));
//demo const wkb_multipolygon = read(
//demo     decode_hex_string(wkb_mock.multipolygon
//demo ));
//demo const wkb_linstring = read(decode_hex_string(wkb_mock.linestring));
//demo const wkb_collection = read(decode_hex_string(wkb_mock.collection));


export default Object.freeze({
    decode_hex_string,
    encode_hex_string,
    read
});