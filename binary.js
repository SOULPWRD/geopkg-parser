// binary.js
// Martin Pravda

/*jslint browser, node */

const reader_map = {
    "float32": DataView.prototype.getFloat32,
    "float64": DataView.prototype.getFloat64,
    "int16": DataView.prototype.getInt16,
    "int32": DataView.prototype.getInt32,
    "int8": DataView.prototype.getInt8,
    "uint16": DataView.prototype.getUint16,
    "uint32": DataView.prototype.getUint32,
    "uint8": DataView.prototype.getUint8
};

function reader(view) {
    let cursor = 0;
    let is_little_endian = false;

    function read(type, increment) {
        return function (offset = 0) {
            const view_reader = reader_map[type];
            const data = view_reader.apply(view, [
                offset + cursor,
                is_little_endian
            ]);
            // console.log("before", {cursor});
            cursor += increment;
            // console.log("after", {cursor})
            return data;
        };
    }

    function set_little_endian(value = false) {
        is_little_endian = value;
    }

    function reset_cursor() {
        cursor = 0;
    }

    return Object.freeze({
        read_float32: read("float32", 4),
        read_float64: read("float64", 8),
        read_int16: read("int16", 2),
        read_int32: read("int32", 4),
        read_int8: read("int8", 1),
        read_uint16: read("uint16", 2),
        read_uint32: read("uint32", 4),
        read_uint8: read("uint8", 1),
        reset_cursor,
        set_little_endian
    });
}

export default Object.freeze({reader});