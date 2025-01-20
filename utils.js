// Martin Pravda
// utils.js
// A simple utility functions

/*jslint browser, node */

const utf8_decoder = new TextDecoder("utf-8");

function make_empty_list(length) {
    return [...new Array(length)];
}

function decode_text(byte_array) {
    return utf8_decoder.decode(byte_array);
}

export default Object.freeze({
    decode_text,
    make_empty_list
});