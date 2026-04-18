/* ── Google Sheets Data Layer ─────────────────────────────────
   Fetches all sheet tabs from the Remodeling App spreadsheet.
   Data is available via AppData.tables after AppData.ready resolves.
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
    'DB_Costbook',
    'DB_Price_List',
    'DB_Divisions',
    'DB_Subdivisions',
    'DB_PL_Categories',
    'DB_PL_Subcategories',
  ];

  // Converts a sheet tab (rows of values) into an array of objects
  // using the first row as property names.
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

  // tables holds all fetched data keyed by tab name, e.g. AppData.tables.DB_People
  const tables = {};

  const ready = Promise.all(TABS.map(async tab => {
    tables[tab] = await _fetchTab(tab);
  })).catch(err => {
    console.error('AppData: failed to load sheet data', err);
  });

  async function refresh(tabs) {
    const targets = tabs || TABS;
    await Promise.all(targets.map(async tab => {
      tables[tab] = await _fetchTab(tab);
    }));
  }

  return { tables, ready, refresh };

}());
