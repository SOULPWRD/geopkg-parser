import parse_header from "./db_header.js";
import { parse_page } from "./page.js";

const SCHEMA_OFFSET = 100;

/**
 * Parses the SQLite database header from the provided buffer.
 *
 * @param {ArrayBuffer} buffer - The buffer containing the SQLite data.
 * @returns {Object} - An object representing the parsed SQLite header.
 */
export function sqliteHeader(buffer) {
  return parse_header(buffer);
}

/**
 * Parses the SQLite schema from the provided buffer.
 *
 * @param {ArrayBuffer} buffer - The buffer containing the SQLite data.
 * @returns {Array<Object>} - An array of column objects representing the schema.
 */
export function sqliteSchema(buffer) {
  const view = new DataView(buffer);
  return parse_page(view, SCHEMA_OFFSET)?.records?.map(
    (record) => record.columns
  );
}
