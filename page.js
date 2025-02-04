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
    const types = [10, 13];
    return types.includes(type);
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

// the start of the content area
// is defined in the spec file https://www.sqlite.org/fileformat2.html

        cell_content_area: (
            cell_content_area === 0
            ? 65536
            : cell_content_area
        ),
        fragmented_free_bytes_nr,
        freeblock_start,
        number_of_cells,
        page_type,
        right_most_pointer
    });
}

function parse_table_leaf_page(view, cell_pointers, encoding) {
    const cells = cell_pointers.map(function (offset) {
        return cell.parse_table_leaf(view, offset);
    });

    const records = cells.map(function (cell) {
        return record.parse(view, cell.payload_start, encoding);
    });

    return Object.freeze({
        cells,
        records
    });
}

function parse_table_interior_page(view, cell_pointers) {
    const cells = cell_pointers.map(function (offset) {
        return cell.parse_table_interior(view, offset);
    });

    return Object.freeze({
        cells
    });
}

function parse_index_leaf_page(view, cell_pointers, encoding) {
    const cells = cell_pointers.map(function (offset) {
        return cell.parse_index_leaf(view, offset);
    });

    const records = cells.map(function (cell) {
        return record.parse(view, cell.payload_start, encoding);
    });

    return Object.freeze({
        cells,
        records
    });
}

function parse_index_interior_page(view, cell_pointers, encoding) {
    const cells = cell_pointers.map(function (offset) {
        return cell.parse_index_interior(view, offset);
    });

    const records = cells.map(function (cell) {
        return record.parse(view, cell.payload_start, encoding);
    });

    return Object.freeze({
        cells,
        records
    });
}

function parse(view, offset, encoding) {
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

    let page = {};

// page type 2 indicates the page is an index btree interior page

    if (header.page_type === 2) {
        page = parse_index_interior_page(view, cell_pointers, encoding);
    }

// page type 5 indicates the page is a table btree interior page

    if (header.page_type === 5) {
        page = parse_table_interior_page(view, cell_pointers);
    }

// page type 10 indicates the page is an index btree leaf page

    if (header.page_type === 10) {
        page = parse_index_leaf_page(view, cell_pointers, encoding);
    }

// page type 13 indicates the page is a table btree leaf page

    if (header.page_type === 13) {
        page = parse_table_leaf_page(view, cell_pointers, encoding);
    }

    return Object.freeze(
        Object.assign({header}, page)
    );
}

// The traverse function traverse through each page within the given boundaries
// If the page is not a leaf page, it goes through the interior pages until it
// finds all leaf pages

function traverse(
    view,
    page_size,
    page_nr,
    page_offset = 0,
    encoding = "utf-8"
) {
    const cells_queue = [];
    const pages = [];

// Since the first page starts at the offset <100, page_size)
// we need to start with the default page_offset defined in the function params

    cells_queue.push({left_child_page_nr: page_nr, page_offset});

    while (cells_queue.length > 0) {
        const c = cells_queue.shift();
        page_offset = (
            page_size * c.left_child_page_nr + c.page_offset
        );
        const page = parse(
            view,
            page_offset,
            encoding
        );

        if (is_leaf(page.header.page_type)) {
            pages.push(page);
        } else {
            page.cells.forEach(function (cell) {
                cells_queue.push(

// for the consequent cells, additional page_offset is 0

                    Object.assign({}, cell, {page_offset: 0})
                );
            });
        }
    }

    return pages;
}

export default Object.freeze({
    parse,
    traverse
});