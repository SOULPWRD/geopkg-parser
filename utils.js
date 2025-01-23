// Martin Pravda
// utils.js
// A simple utility functions

/*jslint browser, node, bitwise */

function make_empty_list(length) {
    return [...new Array(length)];
}

function decode_text(byte_array, encoding = "utf-8") {
    return new TextDecoder(encoding).decode(byte_array);
}

function get_int(count) {
    return function (view, offset) {
        return make_empty_list(count).map(function (ignore, index) {
            return view.getInt8(offset + index);
        }).reduce(function ([result, shift], value) {
            result |= value << shift;
            shift -= 8;
            return [result, shift];
        }, [0, (count * 8) - 8]);
    };
}

function pair(first_arg, second_arg) {
    return [first_arg, second_arg];
}

function from_pairs(pairs) {
    return pairs.reduce(function (record, [key, value]) {
        record[key] = value;
        return record;
    }, {});
}

function zip(first = [], second = []) {
    let list = make_empty_list(first.length);
    
    if (first.length !== second.length) {
        list = make_empty_list(
            first.length < second.length
            ? first.length
            : second.length
        );
    }

    return list.map(function (ignore, index) {
        return pair(first[index], second[index]);
    });
}

export default Object.freeze({
    decode_text,
    from_pairs,
    get_int,
    make_empty_list,
    pair,
    zip
});