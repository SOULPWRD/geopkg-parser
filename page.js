// Martin Pravda
// page.js

// A page parser
// A page is is a block of data of a fixed size
// There are 4 types of pages
// 1. Table b-tree leaf page
// 2. Table b-tree interior page
// 3. Index b-tree leaf page
// 4. Index b-tree interion page

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
import record from "./record.js";

function is_leaf(type) {
    return [10, 13].includes(type);
}

function parse_header(view, offset, page_start) {
    const page_type = view.getUint8(offset);
    const freeblock_start = view.getUint16(offset + 1);
    const number_of_cells = view.getUint16(offset + 3);

// cell content area is start of the cells
// since start of the cell is an offset of the cell within the page
// we need to sum start (offset) of the page with the offset of the cell

    const cell_content_area = page_start + view.getUint16(offset + 5);
    const fragmented_free_bytes_nr = view.getUint8(offset + 7);
    const right_most_pointer = view.getUint32(offset + 8);

    return Object.freeze({
        cell_content_area,
        fragmented_free_bytes_nr,
        freeblock_start,
        number_of_cells,
        page_type,
        right_most_pointer
    });
}

function parse(view, offset) {
    const page_start = (
        offset === 100
            ? 0
            : offset
    );
    const header = parse_header(view, offset, page_start);
    const cell_pointers = cell.parse_pointers(
        view,
        page_start,
        (
            is_leaf(header.page_type)
            ? offset + 8
            : offset + 12
        ),
        header.number_of_cells
    );
    const cells = cell_pointers.map(function (offset) {
        return cell.parse(view, offset);
    });

    const records = cells.map(function (cell) {
        return record.parse(view, cell.payload_start);
    });

    return Object.freeze({
        cells,
        header,
        records
    });
}

export default Object.freeze({parse});