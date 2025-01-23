// Martin Pravda
// parser.js

// This file contains the main implementation of the geopackage parser
// which extracts tabular data and turns them into IR format
// This is an isomorphic file that can be used in both environments
// either in browser or on the server side using nodejs, deno
// or other server side runtimes.

/*jslint browser, node */

import parse_header from "./db_header.js";
import { parse_page } from "./page.js";
import utils from "./utils.js";

function parse(buffer) {
    const view = new DataView(buffer);
    const header = parse_header(buffer);
    const pages = utils.make_empty_list(
        header.db_pages_count
    ).map(function (ignore, page_number) {
        console.log("Parsing page", page_number);
        if (page_number === 0) {

// database header resides within the first 100 bytes of the first page
// thus we need to start from the offset 100 in order to parse the page
            return parse_page(view, 100);
        }
        return parse_page(view, page_number * header.page_size);
    });

    return Object.freeze({
        header,
        pages
    });
}

export default Object.freeze(parse);