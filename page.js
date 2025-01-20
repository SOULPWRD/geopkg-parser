// Martin Pravda
// page.js

// A page parser
// A page is is a block of data of a fixed size
// A page consists of:
// 1. Page header
// 2. An array of cell pointers
// 3. An unallocated space
// 4. Cell content area
// 5. A reserved region
// A complete documentation for the B-Tree pages structure can be found here
// https://www.sqlite.org/fileformat.html#b_tree_pages

/* jslint browser, node */

import cell from "./cell.js";

function parse_header(view, start) {
    const page_type = view.getUint8(start);
    const freeblock_start = view.getUint16(start + 1);
    const number_of_cells = view.getUint16(start + 3);
    const cell_content_area = view.getUint16(start + 5);
    const fragmented_free_bytes_nr = view.getUint8(start + 7);
    const right_most_pointer = view.getUint32(start + 8);

    return Object.freeze({
        cell_content_area,
        fragmented_free_bytes_nr,
        freeblock_start,
        number_of_cells,
        page_type,
        right_most_pointer
    });
}

function parse_page(view, start) {
    const header = parse_header(view, start);
    const cell_pointers = cell.parse_pointers(
        view,
        (
            cell.is_a_leaf(header.page_type)
            ? start + 8
            : start + 12
        ),
        header.number_of_cells
    );
    const cell_starts = cell_pointers.map(function (pointer) {
        return pointer;
    });

    const leaf_data = cell_starts.map(function (offset) {
        return cell.parse_leaf(view, offset);
    });

    // test
    // const [leaf] = leaf_data;

    // const parsed_record = parse_record(view, leaf.record_start);

    return Object.freeze({
        cell_starts,
        header,
        leaf_data
    });
}

export default Object.freeze(parse_page);