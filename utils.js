// Martin Pravda
// utils.js
// A simple utility functions

/*jslint browser, node, bitwise */

function make_empty_list(length) {
    return [...new Array(length)];
}
//demo make_empty_list(5);

function decode_text(byte_array, encoding = "utf-8") {
    return new TextDecoder(encoding).decode(byte_array);
}
//demo const byte_array = new TextEncoder('utf-8').encode("geopackage");
//demo decode_text(byte_array);

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
//demo pair(1, 2);

function from_pairs(...pairs) {
    return pairs.reduce(function (record, [key, value]) {
        record[key] = value;
        return record;
    }, {});
}
//demo from_pairs(["a", 1], ["b", 2]);

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
//demo zip([1,2], [3,4]);

//test import jscheck from "./tools/jscheck.js";
//test const jsc = jscheck();

//test jsc.claim(
//test     "test zip for the same size of both arrays",
//test     function predicate(verdict, a, b) {
//test         return verdict(zip(a, b).length === 2);
//test     },
//test     [
//test         jsc.array(2, jsc.integer(1000)),
//test         jsc.array(2, jsc.integer(1000))
//test     ]
//test );

//test jsc.claim(
//test     "test zip for a shorter size of the first array",
//test     function predicate(verdict, a, b) {
//test         return verdict(zip(a, b).length === 2);
//test     },
//test     [
//test         jsc.array(4, jsc.integer(1000)),
//test         jsc.array(2, jsc.integer(1000))
//test     ]
//test );

//test jsc.claim(
//test     "test zip for a shorter size of the second array",
//test     function predicate(verdict, a, b) {
//test         return verdict(zip(a, b).length === 2);
//test     },
//test     [
//test         jsc.array(2, jsc.integer(1000)),
//test         jsc.array(4, jsc.integer(1000))
//test     ]
//test );

//test jsc.check({
//test     detail: 4,
//test     on_report: console.log
//test });


export default Object.freeze({
    decode_text,
    from_pairs,
    get_int,
    make_empty_list,
    pair,
    zip
});