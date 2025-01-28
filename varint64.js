// Martin Pravda
// varint.js

// This is an enocde/decode varint implementation
// based on the sqlite implementation
// For more information please see the official GitHub implementation
// https://github.com/sqlite/sqlite

/*jslint node, browser, bitwise, for */

const MSB = 0x80;
const REST = 0x7F;
const ALL_EIGHT_BITS = 0xFF;

function decode(view, offset = 0) {
    let result = 0n;
    let old_offset = offset;
    let byte;

    do {
        byte = view.getUint8(offset);
        if (offset - old_offset < 8) {
            result = (result << 7n) + BigInt(byte & REST);
        } else {
            result = (result << 8n) + BigInt(byte & ALL_EIGHT_BITS);
        }
        offset += 1;
    } while (Boolean(byte & MSB));

    return Object.freeze({
        data: Number(result),
        size: offset - old_offset
    });
}


// I'll keep this for loop implementation here for a while
// until the decode implementation with a while loop gets properly tested

// function decode(view, offset = 0) {
//     let result = 0n;
//     let i;

//     // Read up to 8 bytes, each with the top bit set
//     for (i = 0; i < 8; i += 1) {
//         const byte = view.getUint8(offset + i);

//         // Incorporate the lower 7 bits
//         result = (result << 7n) | BigInt(byte & REST);

//         // If top bit is clear, we are done
//         if ((byte & MSB) === 0) {
//             // Sign-extend if the 64th bit is set (two's-complement)
//             if (Boolean(result & (1n << 63n)) === true) {
//                 result -= (1n << 64n);
//             }

//             if (result > BigInt(Number.MAX_SAFE_INTEGER)) {
//                 throw new RangeError(
//                     `The result ${result}
//                      is greater than Number.MAX_SAFE_INTEGER.`
//                 );
//             }

//             return { data: Number(result), size: i + 1 };
//         }
//     }

// // If we got here, we read 8 bytes all with top bit set
// // so we must read the 9th byte in full (8 bits)
//     const ninthByte = view.getUint8(offset + i);

// // Shift 8 bits for this last byte
//     result = (result << 8n) | BigInt(ninthByte & ALL_EIGHT_BITS);

// // Sign-extend if needed
//     if (Boolean(result & (1n << 63n)) === true) {
//         result -= (1n << 64n);
//     }

//     if (result > BigInt(Number.MAX_SAFE_INTEGER)) {
//         throw new RangeError(
//             `The result ${result} is greater than Number.MAX_SAFE_INTEGER.`
//         );
//     }

//     return { data: Number(result), size: i + 1 };
// }

//test decode(new DataView(new Uint8Array([130, 2]).buffer));

export default Object.freeze({
    decode
});