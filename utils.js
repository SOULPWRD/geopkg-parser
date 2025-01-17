// Martin Pravda
// utils.js

/*jslint browser, node */

function make_empty_list(length) {
    return [...new Array(length)];
}

export default Object.freeze({
    make_empty_list
});