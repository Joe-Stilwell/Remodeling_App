/* ── Data Access Layer ─────────────────────────────────────────
   MODULE: data.js
   Owns:   AppData — the single source of truth for all in-memory
           table data fetched from Google Sheets.
   Public: AppData.get, AppData.find, AppData.upsert, AppData.set,
           AppData.insert, AppData.refresh, AppData.ready,
           AppData.isReady, AppData.hasError
   Reads:  Google Sheets API (via fetch)
   Never:  Business logic, UI rendering, widget state

   FULL BUILD NOTE:
   get / find are sync against the in-memory cache.
   In the full build these become async calls to the real DB/API.
   All call sites should be written to tolerate that transition —
   avoid caching return values across ticks.
──────────────────────────────────────────────────────────────── */

const AppData = (function () {

  const SHEET_ID  = '1aOtUxmsYts4e2p6IZhR9MHuHrzA5ID5zI4QWWOwwXNI';
  const API_KEY   = 'AIzaSyDavT12P56X3-PNfIlOS9jE8qOpEAs7yts';
  const BASE_URL  = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values`;

  const TABS = [
    'DB_Company',
    'DB_People',
    'DB_Property',
    'DB_Estimates',
    'DB_Vendor',
    'DB_Workflow_Templates',
    'Link_Company_People',
    'Link_Property_People',
    'Link_Property_Company',
    'Link_People_Relationship',
    'DB_Costbook_Items',
    'DB_Costbooks',
    'DB_Price_List',
    'DB_Divisions',
    'DB_Subdivisions',
    'DB_Price_List_Categories',
    'DB_Price_List_Subcategories',
    'DB_Lookup_Lists',
    'DB_Tax_Rates',
    'DB_Documents',
    'DB_Price_List_Vendors',
    'DB_Price_List_History',
  ];

  // Primary key field for each table — used by find() and upsert()
  const _pk = {
    DB_People:                  'People_ID',
    DB_Company:                 'Company_ID',
    DB_Property:                'Property_ID',
    DB_Estimates:               'Estimate_ID',
    DB_Vendor:                  'Company_ID',
    DB_Costbook_Items:          'Item_ID',
    DB_Costbooks:               'Costbook_ID',
    DB_Price_List:              'Item_ID',
    DB_Workflow_Templates:      'Template_ID',
    DB_Divisions:               'Division_ID',
    DB_Subdivisions:            'Subdivision_ID',
    DB_Price_List_Categories:   'Category_ID',
    DB_Price_List_Subcategories:'Subcategory_ID',
    DB_Tax_Rates:               'Tax_Rate_ID',
    DB_Documents:               'Document_ID',
  };

  function _rowsToObjects(rows) {
    if (!rows || rows.length < 2) return [];
    const headers = rows[0];
    return rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i] ?? ''; });
      return obj;
    });
  }

  async function _fetchTab(tabName) {
    const url = `${BASE_URL}/${encodeURIComponent(tabName)}`
              + `?valueRenderOption=UNFORMATTED_VALUE`
              + `&key=${API_KEY}`;
    const res  = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch tab "${tabName}": ${res.status}`);
    const json = await res.json();
    return _rowsToObjects(json.values);
  }

  const tables = {};

  let _ready    = false;
  let _hasError = false;

  const ready = Promise.all(TABS.map(async tab => {
    tables[tab] = await _fetchTab(tab);
  })).then(() => {
    _ready = true;
    document.dispatchEvent(new CustomEvent('appdata-ready'));
  }, err => {
    _hasError = true;
    console.error('AppData: failed to load sheet data', err);
    document.dispatchEvent(new CustomEvent('appdata-error', { detail: { error: err } }));
    throw err;
  });

  async function refresh(tabs) {
    const targets = tabs || TABS;
    await Promise.all(targets.map(async tab => {
      tables[tab] = await _fetchTab(tab);
    }));
  }

  // ── Read API ────────────────────────────────────────────────

  // Returns all records for a table. Always an array — never null.
  function get(table) {
    return tables[table] || [];
  }

  // Returns the first record matching id on the primary key (or a
  // specified field). Returns undefined if not found.
  function find(table, id, field) {
    const key = field || _pk[table];
    if (!key) return undefined;
    return (tables[table] || []).find(r => r[key] === id);
  }

  // ── Write API (in-memory for prototype) ─────────────────────
  // FULL BUILD: these become async API calls (POST/PUT/DELETE).

  // Insert a record. Returns the record.
  function insert(table, record) {
    if (!tables[table]) tables[table] = [];
    tables[table].push(record);
    return record;
  }

  // Update an existing record by PK (or field), or insert if not found.
  // Merges updates into the existing record. Returns the record.
  function upsert(table, record, field) {
    const key = field || _pk[table];
    if (!tables[table]) tables[table] = [];
    const idx = key ? tables[table].findIndex(r => r[key] === record[key]) : -1;
    if (idx >= 0) {
      tables[table][idx] = { ...tables[table][idx], ...record };
      return tables[table][idx];
    }
    tables[table].push(record);
    return record;
  }

  // Replace an entire table's records (e.g. after a filtered save).
  function set(table, records) {
    tables[table] = records;
  }

  function isReady()   { return _ready; }
  function hasError()  { return _hasError; }

  return { tables, ready, refresh, get, find, insert, upsert, set, isReady, hasError };

}());
