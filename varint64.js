// Martin Pravda
// varint.js

// This is an enocde/decode varint implementation
// based on the sqlite implementation
// For more information please see the official GitHub implementation
// https://github.com/sqlite/sqlite

/*jslint node, browser */

const MSB = 0x80;
const REST = 0x7F;
const ALL_EIGHT_BITS = 0xFF;

function decode(view, offset = 0) {
    let result = 0n;
    let old_offset = offset;
    let byte;

    do {
        if (offset < 8) {
            byte = view.getUint8(offset);
            result = (result << 7n) + BigInt(byte & REST);
        } else {
            byte = view.getInt8(offset);
            result = (result << 8n) + BigInt(byte & ALL_EIGHT_BITS);
        }
        offset += 1;
    } while (byte & MSB);

    return Object.freeze({
        data: result,
        size: offset - old_offset
    });
}

// test
// console.log(decode(new DataView(new Uint8Array([130, 2]).buffer)));

export default Object.freeze({
    decode
});