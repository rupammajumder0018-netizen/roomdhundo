/**
 * Roomdhundo — Supabase Mutation & Schema Compatibility Helpers
 *
 * Migrated and hardened from legacy `files6.0/script.js` (lines 5247–5291).
 *
 * In the legacy codebase, `supabaseMutateWithoutUnknownColumns` silently stripped
 * missing database columns and retried queries without warning the user or caller,
 * leading to silent data loss when schema migrations were pending.
 *
 * This modernized module:
 * 1. Preserves payload cloning and column extraction helpers.
 * 2. Emits explicit warnings/errors when schema divergence is detected.
 * 3. Requires explicit opt-in (`allowStripping: true`) before dropping any fields.
 */

/**
 * Creates a shallow copy of an object payload or array of object payloads.
 *
 * @param {Object|Array<Object>} payload
 * @returns {Object|Array<Object>} Cloned payload
 */
export function cloneSupabasePayload(payload) {
  if (Array.isArray(payload)) {
    return payload.map((row) => ({ ...row }));
  }
  return { ...payload };
}

/**
 * Extracts the unknown column name from a PostgREST / PostgreSQL error message.
 *
 * Matches known error formats:
 * - PostgREST: "Could not find the 'column_name' column of 'table_name' in the schema cache"
 * - PostgreSQL: 'column "column_name" does not exist'
 * - PostgreSQL: "column column_name does not exist"
 *
 * @param {string} message
 * @returns {string|null} Column name or null if no match
 */
export function unknownColumnFromError(message) {
  const text = String(message || "");
  const match =
    text.match(/Could not find the '([^']+)' column/i) ||
    text.match(/'([^']+)' column of/i) ||
    text.match(/column "([^"]+)"/i) ||
    text.match(/column ([a-zA-Z0-9_]+) does not exist/i);

  return match ? match[1] : null;
}

/**
 * Strips a column name from a payload object or array of objects.
 * Returns a new object/array without modifying the input in-place.
 *
 * @param {Object|Array<Object>} payload
 * @param {string} column
 * @returns {Object|Array<Object>} Payload with column removed
 */
export function stripUnknownColumn(payload, column) {
  if (!column) return payload;

  if (Array.isArray(payload)) {
    return payload.map((row) => {
      const next = { ...row };
      delete next[column];
      return next;
    });
  }

  const next = { ...payload };
  delete next[column];
  return next;
}

/**
 * Executes a Supabase insert or update mutation with schema compatibility checks.
 *
 * @param {Object} params
 * @param {Object} params.client Supabase client instance
 * @param {string} params.table Table name
 * @param {'insert'|'update'} params.mode Mutation mode
 * @param {Object|Array<Object>} params.payload Record(s) to insert or update
 * @param {Function} [params.applyFilters] Optional query filter callback (e.g. `(q) => q.eq("id", id)`)
 * @param {boolean} [params.allowStripping=false] When true, enables legacy retry-by-stripping with loud warnings.
 *                                                When false (default), preserves data integrity and reports error.
 * @param {number} [params.maxAttempts=16] Maximum retry attempts if stripping is enabled
 * @returns {Promise<{ data: any, error: any, strippedColumns?: string[] }>}
 */
export async function executeSafeMutation({
  client,
  table,
  mode,
  payload,
  applyFilters,
  allowStripping = false,
  maxAttempts = 16,
}) {
  if (!client) {
    return {
      data: null,
      error: new Error(
        `[Roomdhundo] Cannot execute mutation on '${table}': Supabase client is not configured.`
      ),
    };
  }

  let body = cloneSupabasePayload(payload);
  const strippedColumns = [];

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let query = client.from(table)[mode](body);

    if (typeof applyFilters === "function") {
      query = applyFilters(query);
    }

    const result = await (mode === "insert" && !Array.isArray(body)
      ? query.select().single()
      : query.select());

    if (!result.error) {
      return {
        data: result.data,
        error: null,
        strippedColumns: strippedColumns.length > 0 ? strippedColumns : undefined,
      };
    }

    const column = unknownColumnFromError(result.error.message);
    const sample = Array.isArray(body) ? body[0] || {} : body;

    if (column && Object.prototype.hasOwnProperty.call(sample, column)) {
      if (!allowStripping) {
        console.error(
          `[Roomdhundo Data Integrity Warning] Table '${table}' rejected column '${column}' because it is missing from the database schema.\n` +
            `To prevent silent data loss, this mutation was aborted.\n` +
            `Error message: ${result.error.message}`
        );
        result.error.unknownColumn = column;
        return result;
      }

      console.warn(
        `[Roomdhundo Legacy Schema Fallback] Stripping missing column '${column}' from '${table}' mutation (attempt ${attempt + 1}/${maxAttempts}).\n` +
          `A database migration is required to persist this field.`
      );

      body = stripUnknownColumn(body, column);
      strippedColumns.push(column);
      continue;
    }

    return result;
  }

  return {
    data: null,
    error: new Error(
      `[Roomdhundo] Mutation on '${table}' aborted after exceeding maximum retry attempts (${maxAttempts}) due to schema mismatches.`
    ),
    strippedColumns,
  };
}

