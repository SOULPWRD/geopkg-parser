// utils.js
function make_empty_list(length) {
  return [...new Array(length)];
}
function decode_text(byte_array, encoding = "utf-8") {
  return new TextDecoder(encoding).decode(byte_array);
}
function get_int(count) {
  return function(view, offset) {
    return make_empty_list(count).map(function(ignore, index) {
      return view.getInt8(offset + index);
    }).reduce(function([result, shift], value) {
      result |= value << shift;
      shift -= 8;
      return [result, shift];
    }, [0, count * 8 - 8]);
  };
}
function pair(first_arg, second_arg) {
  return [first_arg, second_arg];
}
function from_pairs(pairs) {
  return pairs.reduce(function(record, [key, value]) {
    record[key] = value;
    return record;
  }, {});
}
function zip(first = [], second = []) {
  let list = make_empty_list(first.length);
  if (first.length !== second.length) {
    list = make_empty_list(
      first.length < second.length ? first.length : second.length
    );
  }
  return list.map(function(ignore, index) {
    return pair(first[index], second[index]);
  });
}
function from_sql(sql = "") {
  const match = sql.match(/\((.*)\)/);
  if (!match) {
    return [];
  }
  return match[1].split(",").map(function(col) {
    const parts = col.trim().split(" ");
    return {
      name: parts[0],
      type: parts[1]
    };
  });
}
var utils_default = Object.freeze({
  decode_text,
  from_pairs,
  from_sql,
  get_int,
  make_empty_list,
  pair,
  zip
});

// varint64.js
var MSB = 128;
var REST = 127;
var ALL_EIGHT_BITS = 255;
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
var varint64_default = Object.freeze({
  decode
});

// cell.js
function parse_pointers(view, page_start, pointers_offset, number_of_cells) {
  return utils_default.make_empty_list(
    number_of_cells
  ).map(function(ignore, index) {
    return index * 2;
  }).reduce(function(pointers, order) {
    const pointer_offset = view.getUint16(pointers_offset + order);
    pointers.push(page_start + pointer_offset);
    return pointers;
  }, []);
}
function parse_table_interior(view, start) {
  const left_child_page_nr = view.getUint32(start);
  const row = varint64_default.decode(view, start + 4);
  return Object.freeze({
    left_child_page_nr,
    row_id: row.data
  });
}
function parse_table_leaf(view, start) {
  const payload = varint64_default.decode(view, start);
  start += payload.size;
  const row = varint64_default.decode(view, start);
  start += row.size;
  return Object.freeze({
    // keep overflow empty for now
    // overflow_start: view.getUint32(start + payload.data),
    payload_end: start + payload.data,
    payload_start: start,
    row_id: row.data
  });
}
function parse_index_leaf(view, start) {
  const payload = varint64_default.decode(view, start);
  start += payload.size;
  return Object.freeze({
    // keep overflow empty for now
    // overflow_start: view.getUint32(start + payload.data),
    payload_end: start + payload.data,
    payload_start: start
  });
}
function parse_index_interior(view, start) {
  const left_child_page_nr = view.getUint32(start);
  const payload = varint64_default.decode(view, start);
  start += payload.size;
  return Object.freeze({
    // keep overflow empty for now
    // overflow_start: view.getUint32(start + payload.data),
    left_child_page_nr,
    payload_end: start + payload.data,
    payload_start: start
  });
}
var cell_default = Object.freeze({
  parse_index_interior,
  parse_index_leaf,
  parse_pointers,
  parse_table_interior,
  parse_table_leaf
});

// record.js
function decode_blob(view, type, offset) {
  const size = (type - 12) / 2;
  return Object.freeze({
    data: new Uint8Array(view.buffer, offset, size),
    size
  });
}
function decode_text2(view, type, offset, encoding = "utf-8") {
  const size = (type - 13) / 2;
  const bytes = new Uint8Array(view.buffer, offset, size);
  return Object.freeze({
    data: utils_default.decode_text(bytes, encoding),
    size
  });
}
function parse_column(view, type, offset = 0, encoding = "utf-8") {
  if (type === 0) {
    return Object.freeze({
      data: null,
      size: 0
    });
  }
  if (type === 1) {
    return Object.freeze({
      data: view.getInt8(offset),
      size: 1
    });
  }
  if (type === 2) {
    return Object.freeze({
      data: view.getInt16(offset),
      size: 2
    });
  }
  if (type === 3) {
    return Object.freeze({
      data: utils_default.get_int(24)(view, offset),
      size: 3
    });
  }
  if (type === 4) {
    return Object.freeze({
      data: view.getInt32(offset),
      size: 4
    });
  }
  if (type === 5) {
    return Object.freeze({
      data: utils_default.get_int(48)(view, offset),
      size: 6
    });
  }
  if (type === 6) {
    return Object.freeze({
      // add support for 64 bit
      data: null,
      size: 8
    });
  }
  if (type === 7) {
    return Object.freeze({
      data: view.getFloat64(offset),
      size: 8
    });
  }
  if (type === 8) {
    return Object.freeze({
      data: 0,
      size: 0
    });
  }
  if (type === 9) {
    return Object.freeze({
      data: 1,
      size: 0
    });
  }
  if (type >= 12) {
    return type % 2 === 0 ? decode_blob(view, type, offset) : decode_text2(view, type, offset, encoding);
  }
  return Object.freeze({
    data: null,
    size: 0
  });
}
function parse_serial_types(view, offset, header_bytes_left) {
  const types = [];
  while (header_bytes_left > 0) {
    const serial = varint64_default.decode(view, offset);
    types.push(serial.data);
    offset += serial.size;
    header_bytes_left -= serial.size;
  }
  return Object.freeze({
    data: types,
    offset
  });
}
function parse_colums(view, serial_types, offset = 0, encoding = "utf-8") {
  return serial_types.reduce(function(columns, serial) {
    const column = parse_column(view, serial, columns.offset, encoding);
    columns.data.push(column.data);
    columns.offset += column.size;
    return columns;
  }, { data: [], offset });
}
function parse(view, offset, encoding = "utf-8") {
  const header = varint64_default.decode(view, offset);
  const header_bytes_left = header.data - header.size;
  const serial_types = parse_serial_types(
    view,
    offset + header.size,
    header_bytes_left
  );
  const columns = parse_colums(
    view,
    serial_types.data,
    serial_types.offset,
    encoding
  );
  return Object.freeze({
    columns: columns.data,
    header
  });
}
var record_default = Object.freeze({
  parse
});

// page.js
function is_leaf(type) {
  const types = [10, 13];
  return types.includes(type);
}
function parse_header(view, offset, page_start) {
  const page_type = view.getUint8(offset);
  const freeblock_start = view.getUint16(offset + 1);
  const number_of_cells = view.getUint16(offset + 3);
  const cell_content_area = page_start + view.getUint16(offset + 5);
  const fragmented_free_bytes_nr = view.getUint8(offset + 7);
  const right_most_pointer = view.getUint32(offset + 8);
  return Object.freeze({
    // the start of the content area
    // is defined in the spec file https://www.sqlite.org/fileformat2.html
    cell_content_area: cell_content_area === 0 ? 65536 : cell_content_area,
    fragmented_free_bytes_nr,
    freeblock_start,
    number_of_cells,
    page_type,
    right_most_pointer
  });
}
function parse_table_leaf_page(view, cell_pointers, encoding) {
  const cells = cell_pointers.map(function(offset) {
    return cell_default.parse_table_leaf(view, offset);
  });
  const records = cells.map(function(cell) {
    return record_default.parse(view, cell.payload_start, encoding);
  });
  return Object.freeze({
    cells,
    records
  });
}
function parse_table_interior_page(view, cell_pointers) {
  const cells = cell_pointers.map(function(offset) {
    return cell_default.parse_table_interior(view, offset);
  });
  return Object.freeze({
    cells
  });
}
function parse_index_leaf_page(view, cell_pointers, encoding) {
  const cells = cell_pointers.map(function(offset) {
    return cell_default.parse_index_leaf(view, offset);
  });
  const records = cells.map(function(cell) {
    return record_default.parse(view, cell.payload_start, encoding);
  });
  return Object.freeze({
    cells,
    records
  });
}
function parse_index_interior_page(view, cell_pointers, encoding) {
  const cells = cell_pointers.map(function(offset) {
    return cell_default.parse_index_interior(view, offset);
  });
  const records = cells.map(function(cell) {
    return record_default.parse(view, cell.payload_start, encoding);
  });
  return Object.freeze({
    cells,
    records
  });
}
function parse2(view, offset, encoding) {
  const page_start = offset === 100 ? 0 : offset;
  const header = parse_header(view, offset, page_start);
  const cell_pointers = cell_default.parse_pointers(
    view,
    page_start,
    is_leaf(header.page_type) ? offset + 8 : offset + 12,
    header.number_of_cells
  );
  let page = {};
  if (header.page_type === 2) {
    page = parse_index_interior_page(view, cell_pointers, encoding);
  }
  if (header.page_type === 5) {
    page = parse_table_interior_page(view, cell_pointers);
  }
  if (header.page_type === 10) {
    page = parse_index_leaf_page(view, cell_pointers, encoding);
  }
  if (header.page_type === 13) {
    page = parse_table_leaf_page(view, cell_pointers, encoding);
  }
  return Object.freeze(
    Object.assign({ header }, page)
  );
}
var page_default = Object.freeze({
  is_leaf,
  parse: parse2
});

// db_header.js
var encodings = [
  "utf-8",
  "utf-16le",
  "utf-16be"
];
function parse3(view) {
  const header_string = utils_default.decode_text(
    new Uint8Array(view.buffer).slice(0, 16)
  );
  const page_size = view.getUint16(16);
  const write_version = view.getUint8(18);
  const read_version = view.getUint8(19);
  const reserved_space = view.getUint8(20);
  const maximum_payload_fraction = view.getUint8(21);
  const minimum_payload_fraction = view.getUint8(22);
  const leaf_payload_fraction = view.getUint8(23);
  const file_change_counter = view.getUint32(24);
  const db_pages_count = view.getUint32(28);
  const free_list_trunk_page_nr = view.getUint32(32);
  const free_list_pages_count = view.getUint32(36);
  const schema_cookie = view.getUint32(40);
  const schema_format_nr = view.getUint32(44);
  const default_page_cache_size = view.getUint32(48);
  const largest_root_b_tree = view.getUint32(52);
  const db_text_encoding = view.getUint32(56);
  const user_version = view.getUint32(60);
  const incremental_vacuum_mode = view.getUint32(64);
  const application_id = view.getUint32(68);
  const version_valid_for = view.getUint32(92);
  const sqlite_version = view.getUint32(96);
  return Object.freeze({
    application_id,
    db_pages_count,
    db_text_encoding,
    default_page_cache_size,
    file_change_counter,
    free_list_pages_count,
    free_list_trunk_page_nr,
    header_string,
    incremental_vacuum_mode,
    largest_root_b_tree,
    leaf_payload_fraction,
    maximum_payload_fraction,
    minimum_payload_fraction,
    page_size,
    read_version,
    reserved_space,
    schema_cookie,
    schema_format_nr,
    sqlite_version,
    user_version,
    version_valid_for,
    write_version
  });
}
var db_header_default = Object.freeze({ encodings, parse: parse3 });

// parser.js
function parse4(view) {
  const header = db_header_default.parse(view);
  const enconding = db_header_default.encodings[header.db_text_encoding - 1];
  const pages = utils_default.make_empty_list(
    header.db_pages_count
  ).map(function(ignore, page_number) {
    if (page_number === 0) {
      return page_default.parse(view, 100, enconding);
    }
    return page_default.parse(view, page_number * header.page_size, enconding);
  });
  return Object.freeze({
    header,
    pages
  });
}
var parser_default = Object.freeze(parse4);

// sqlite.js
var sqlite_schema_attributes = [
  "type",
  "name",
  "tbl_name",
  "rootpage",
  "sql"
];
function sqlite(buffer) {
  const view = new DataView(buffer);
  const database = parser_default(view);
  function traverse(page_nr) {
    const leafs = [];
    const pages_queue = [
      database.pages[page_nr]
    ];
    while (pages_queue.length > 0) {
      const p = pages_queue.shift();
      if (page_default.is_leaf(p.header.page_type)) {
        leafs.push(p);
      } else {
        p.cells.forEach(function(cell) {
          pages_queue.push(
            database.pages[cell.left_child_page_nr - 1]
          );
        });
      }
    }
    return leafs;
  }
  function parsed(offset = 0, limit = void 0) {
    return Object.freeze({
      header: database.header,
      pages: database.pages.slice(offset, limit)
    });
  }
  function master_schema() {
    return traverse(0).map(function(page) {
      return page?.records.filter(function(record) {
        return record.columns[0] === "table";
      }).map(function(record) {
        const sql_create = record.columns[record.columns.length - 1];
        const columns = utils_default.from_sql(sql_create);
        const pairs = utils_default.zip(
          sqlite_schema_attributes,
          record.columns
        );
        const result = utils_default.from_pairs(pairs);
        return Object.assign(
          result,
          { columns }
        );
      });
    }).flat();
  }
  function show_tables() {
    const schema = master_schema();
    return schema.filter(function(table) {
      return table.type === "table";
    }).map(function(table) {
      return { name: table.tbl_name };
    });
  }
  function from(table_name, offset = 0, limit = void 0) {
    const schema = master_schema();
    const schema_row = schema?.find(
      function(row) {
        const { tbl_name, type } = row;
        return table_name === tbl_name && type === "table";
      }
    );
    const { columns, rootpage } = schema_row;
    const column_names = columns.map(function(column) {
      return column.name;
    });
    return traverse(
      rootpage - 1
    ).map(function(page) {
      return page.records.map(function(record) {
        return utils_default.from_pairs(
          utils_default.zip(column_names, record.columns)
        );
      });
    }).flat().slice(offset, limit);
  }
  return Object.freeze({
    from,
    master_schema,
    parsed,
    show_tables
  });
}
var sqlite_default = Object.freeze(sqlite);
export {
  sqlite_default as default
};
