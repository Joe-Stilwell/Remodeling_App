/* --- Estimating Module --- */
const Estimating = (function () {

  /* ── Costbook data — loaded from Google Sheets via AppData ─── */
  /* Kept as fallback in case the sheet is unavailable           */
  const COSTBOOK_FALLBACK = [
    // 02 · Plans & Permits
    { divNum:'02', divName:'Plans & Permits',       subNum:'010', subName:'Plans',                 sortWeight:10,  itemId:'02.010.0001', description:'Plan Reproductions',               uom:'EA', labor:0,     material:0,      sub:0, other:45.00  },
    { divNum:'02', divName:'Plans & Permits',       subNum:'010', subName:'Plans',                 sortWeight:20,  itemId:'02.010.0002', description:"Architect's Fee",                  uom:'EA', labor:0,     material:0,      sub:0, other:0      },
    { divNum:'02', divName:'Plans & Permits',       subNum:'020', subName:'Permits',               sortWeight:10,  itemId:'02.020.0001', description:'New Primary Structure',             uom:'EA', labor:0,     material:188.00, sub:0, other:0      },
    { divNum:'02', divName:'Plans & Permits',       subNum:'020', subName:'Permits',               sortWeight:20,  itemId:'02.020.0002', description:'New Addition or Accessory',         uom:'EA', labor:0,     material:140.00, sub:0, other:0      },
    { divNum:'02', divName:'Plans & Permits',       subNum:'020', subName:'Permits',               sortWeight:30,  itemId:'02.020.0003', description:'Plus Per Unit',                     uom:'EA', labor:0,     material:29.00,  sub:0, other:0      },
    // 04 · Demolition & Cleanup
    { divNum:'04', divName:'Demolition & Cleanup',  subNum:'010', subName:'Project Prep & Cleanup',sortWeight:10,  itemId:'04.010.0001', description:'10 Yard Dumpster',                  uom:'EA', labor:0,     material:0,      sub:0, other:350.00 },
    { divNum:'04', divName:'Demolition & Cleanup',  subNum:'010', subName:'Project Prep & Cleanup',sortWeight:20,  itemId:'04.010.0002', description:'20 Yard Dumpster',                  uom:'EA', labor:0,     material:0,      sub:0, other:400.00 },
    { divNum:'04', divName:'Demolition & Cleanup',  subNum:'010', subName:'Project Prep & Cleanup',sortWeight:30,  itemId:'04.010.0003', description:'30 Yard Dumpster',                  uom:'EA', labor:0,     material:0,      sub:0, other:475.00 },
    { divNum:'04', divName:'Demolition & Cleanup',  subNum:'010', subName:'Project Prep & Cleanup',sortWeight:40,  itemId:'04.010.0004', description:'40 Yard Dumpster',                  uom:'EA', labor:0,     material:0,      sub:0, other:575.00 },
    { divNum:'04', divName:'Demolition & Cleanup',  subNum:'010', subName:'Project Prep & Cleanup',sortWeight:50,  itemId:'04.010.0005', description:'Port-O-Let',                        uom:'MO', labor:0,     material:0,      sub:0, other:110.00 },
    { divNum:'04', divName:'Demolition & Cleanup',  subNum:'010', subName:'Project Prep & Cleanup',sortWeight:60,  itemId:'04.010.0006', description:'Scaffolding - Per Section',          uom:'DY', labor:0,     material:0,      sub:0, other:10.00  },
    { divNum:'04', divName:'Demolition & Cleanup',  subNum:'010', subName:'Project Prep & Cleanup',sortWeight:70,  itemId:'04.010.0007', description:'Scaffolding - Per Wall',             uom:'DY', labor:0,     material:0,      sub:0, other:5.00   },
    { divNum:'04', divName:'Demolition & Cleanup',  subNum:'020', subName:'Demolition',            sortWeight:10,  itemId:'04.020.0001', description:'Selective Demolition',              uom:'HR', labor:65.00, material:0,      sub:0, other:0      },
    { divNum:'04', divName:'Demolition & Cleanup',  subNum:'020', subName:'Demolition',            sortWeight:20,  itemId:'04.020.0002', description:'Remove Existing Roofing',           uom:'SQ', labor:85.00, material:0,      sub:0, other:0      },
    // 06 · Foundation Systems
    { divNum:'06', divName:'Foundation Systems',    subNum:'010', subName:'Excavation',            sortWeight:10,  itemId:'06.010.0001', description:'Machine Excavation',                uom:'HR', labor:125.00,material:0,      sub:0, other:0      },
    { divNum:'06', divName:'Foundation Systems',    subNum:'010', subName:'Excavation',            sortWeight:20,  itemId:'06.010.0002', description:'Hand Excavation',                   uom:'HR', labor:65.00, material:0,      sub:0, other:0      },
    { divNum:'06', divName:'Foundation Systems',    subNum:'010', subName:'Excavation',            sortWeight:30,  itemId:'06.010.0003', description:'Trench for Buried Electrical',      uom:'LF', labor:30.00, material:0,      sub:0, other:0      },
    { divNum:'06', divName:'Foundation Systems',    subNum:'020', subName:'Footings & Foundation', sortWeight:10,  itemId:'06.020.0001', description:'Continuous Concrete Footing',        uom:'LF', labor:8.50,  material:12.00,  sub:0, other:0      },
    { divNum:'06', divName:'Foundation Systems',    subNum:'020', subName:'Footings & Foundation', sortWeight:20,  itemId:'06.020.0002', description:'Concrete Pier Footing',              uom:'EA', labor:45.00, material:28.00,  sub:0, other:0      },
    { divNum:'06', divName:'Foundation Systems',    subNum:'030', subName:'Waterproofing',         sortWeight:10,  itemId:'06.030.0001', description:'Foundation Waterproofing',           uom:'SF', labor:1.50,  material:2.25,   sub:0, other:0      },
    { divNum:'06', divName:'Foundation Systems',    subNum:'030', subName:'Waterproofing',         sortWeight:20,  itemId:'06.030.0002', description:'Install 4" PVC Drainage',            uom:'LF', labor:5.00,  material:8.00,   sub:0, other:0      },
    // 08 · Masonry
    { divNum:'08', divName:'Masonry',               subNum:'010', subName:'Block Work',            sortWeight:10,  itemId:'08.010.0001', description:'8" Block - Standard Addition',       uom:'SF', labor:4.50,  material:5.50,   sub:0, other:0      },
    { divNum:'08', divName:'Masonry',               subNum:'010', subName:'Block Work',            sortWeight:20,  itemId:'08.010.0002', description:'8" Block - Two Story',               uom:'SF', labor:5.25,  material:5.50,   sub:0, other:0      },
    { divNum:'08', divName:'Masonry',               subNum:'020', subName:'Brick Work',            sortWeight:10,  itemId:'08.020.0001', description:'1st Floor Brick',                    uom:'SF', labor:12.00, material:30.00,  sub:0, other:0      },
    { divNum:'08', divName:'Masonry',               subNum:'020', subName:'Brick Work',            sortWeight:20,  itemId:'08.020.0002', description:'2nd Floor Brick',                    uom:'SF', labor:14.00, material:30.00,  sub:0, other:0      },
    // 10 · Concrete
    { divNum:'10', divName:'Concrete',              subNum:'010', subName:'Flatwork',              sortWeight:10,  itemId:'10.010.0001', description:'Concrete Slab on Grade 4"',          uom:'SF', labor:2.50,  material:3.75,   sub:0, other:0      },
    { divNum:'10', divName:'Concrete',              subNum:'010', subName:'Flatwork',              sortWeight:20,  itemId:'10.010.0002', description:'Concrete Driveway 4"',               uom:'SF', labor:2.75,  material:3.75,   sub:0, other:0      },
    { divNum:'10', divName:'Concrete',              subNum:'020', subName:'Concrete Steps',        sortWeight:10,  itemId:'10.020.0001', description:'Concrete Steps - Per Step',          uom:'EA', labor:85.00, material:45.00,  sub:0, other:0      },
    // 12 · Framing
    { divNum:'12', divName:'Framing',               subNum:'010', subName:'Floor Framing',         sortWeight:10,  itemId:'12.010.0001', description:'Floor Joist 2x10 16" OC',            uom:'SF', labor:1.85,  material:2.40,   sub:0, other:0      },
    { divNum:'12', divName:'Framing',               subNum:'010', subName:'Floor Framing',         sortWeight:20,  itemId:'12.010.0002', description:'3/4" T&G Subfloor',                  uom:'SF', labor:0.95,  material:1.85,   sub:0, other:0      },
    { divNum:'12', divName:'Framing',               subNum:'020', subName:'Wall Framing',          sortWeight:10,  itemId:'12.020.0001', description:'Exterior Wall 2x6 16" OC',           uom:'LF', labor:4.50,  material:6.80,   sub:0, other:0      },
    { divNum:'12', divName:'Framing',               subNum:'020', subName:'Wall Framing',          sortWeight:20,  itemId:'12.020.0002', description:'Interior Wall 2x4 16" OC',           uom:'LF', labor:3.25,  material:4.20,   sub:0, other:0      },
    { divNum:'12', divName:'Framing',               subNum:'020', subName:'Wall Framing',          sortWeight:30,  itemId:'12.020.0003', description:'LVL Beam 3.5" x 9.5"',              uom:'LF', labor:8.50,  material:18.00,  sub:0, other:0      },
    { divNum:'12', divName:'Framing',               subNum:'030', subName:'Roof Framing',          sortWeight:10,  itemId:'12.030.0001', description:'Roof Rafters 2x8 24" OC',            uom:'SF', labor:2.10,  material:2.85,   sub:0, other:0      },
    { divNum:'12', divName:'Framing',               subNum:'030', subName:'Roof Framing',          sortWeight:20,  itemId:'12.030.0002', description:'Ridge Board 2x10',                   uom:'LF', labor:3.50,  material:2.20,   sub:0, other:0      },
    { divNum:'12', divName:'Framing',               subNum:'030', subName:'Roof Framing',          sortWeight:30,  itemId:'12.030.0003', description:'7/16" OSB Roof Sheathing',           uom:'SF', labor:0.65,  material:0.85,   sub:0, other:0      },
    // 14 · Exterior Siding & Trim
    { divNum:'14', divName:'Exterior Siding & Trim',subNum:'010', subName:'Soffit & Fascia',       sortWeight:10,  itemId:'14.010.0001', description:'Soffit - 36" Plywood',               uom:'LF', labor:5.75,  material:7.50,   sub:0, other:0      },
    { divNum:'14', divName:'Exterior Siding & Trim',subNum:'010', subName:'Soffit & Fascia',       sortWeight:20,  itemId:'14.010.0002', description:'5/4 x 4 Boral',                      uom:'LF', labor:1.50,  material:4.50,   sub:0, other:0      },
    { divNum:'14', divName:'Exterior Siding & Trim',subNum:'010', subName:'Soffit & Fascia',       sortWeight:30,  itemId:'14.010.0003', description:'5/4 x 8 Boral',                      uom:'LF', labor:2.00,  material:7.10,   sub:0, other:0      },
    { divNum:'14', divName:'Exterior Siding & Trim',subNum:'020', subName:'Hardie Trim',           sortWeight:10,  itemId:'14.020.0001', description:'1 x 3 Hardie Trim',                  uom:'LF', labor:0.50,  material:1.10,   sub:0, other:0      },
    { divNum:'14', divName:'Exterior Siding & Trim',subNum:'020', subName:'Hardie Trim',           sortWeight:20,  itemId:'14.020.0002', description:'1 x 6 Hardie Trim',                  uom:'LF', labor:1.75,  material:3.40,   sub:0, other:0      },
    { divNum:'14', divName:'Exterior Siding & Trim',subNum:'020', subName:'Hardie Trim',           sortWeight:30,  itemId:'14.020.0003', description:'5/16" HardiePanel Smooth',           uom:'SF', labor:1.25,  material:2.00,   sub:0, other:0      },
    { divNum:'14', divName:'Exterior Siding & Trim',subNum:'020', subName:'Hardie Trim',           sortWeight:40,  itemId:'14.020.0004', description:'Z-Flashing',                         uom:'LF', labor:0.50,  material:1.25,   sub:0, other:0      },
    // 18 · Roofing
    { divNum:'18', divName:'Roofing',               subNum:'010', subName:'Shingle Roofing',       sortWeight:10,  itemId:'18.010.0001', description:'Architectural Shingles',             uom:'SQ', labor:85.00, material:110.00, sub:0, other:0      },
    { divNum:'18', divName:'Roofing',               subNum:'010', subName:'Shingle Roofing',       sortWeight:20,  itemId:'18.010.0002', description:'Ridge Cap',                          uom:'LF', labor:2.50,  material:1.80,   sub:0, other:0      },
    { divNum:'18', divName:'Roofing',               subNum:'020', subName:'Underlayment & Flashing',sortWeight:10, itemId:'18.020.0001', description:'30# Felt Underlayment',              uom:'SQ', labor:12.00, material:18.00,  sub:0, other:0      },
    { divNum:'18', divName:'Roofing',               subNum:'020', subName:'Underlayment & Flashing',sortWeight:20, itemId:'18.020.0002', description:'Ice & Water Shield',                 uom:'SQ', labor:14.00, material:28.00,  sub:0, other:0      },
    { divNum:'18', divName:'Roofing',               subNum:'020', subName:'Underlayment & Flashing',sortWeight:30, itemId:'18.020.0003', description:'Step Flashing',                      uom:'LF', labor:3.50,  material:2.20,   sub:0, other:0      },
    // 20 · Windows & Exterior Doors
    { divNum:'20', divName:'Windows & Exterior Doors',subNum:'010',subName:'Windows',              sortWeight:10,  itemId:'20.010.0001', description:'Double Hung Window Installation',    uom:'EA', labor:95.00, material:0,      sub:0, other:0      },
    { divNum:'20', divName:'Windows & Exterior Doors',subNum:'010',subName:'Windows',              sortWeight:20,  itemId:'20.010.0002', description:'Casement Window Installation',       uom:'EA', labor:110.00,material:0,      sub:0, other:0      },
    { divNum:'20', divName:'Windows & Exterior Doors',subNum:'020',subName:'Exterior Doors',       sortWeight:10,  itemId:'20.020.0001', description:'Exterior Door Installation',         uom:'EA', labor:185.00,material:0,      sub:0, other:0      },
    { divNum:'20', divName:'Windows & Exterior Doors',subNum:'020',subName:'Exterior Doors',       sortWeight:20,  itemId:'20.020.0002', description:'Sliding Patio Door Installation',    uom:'EA', labor:225.00,material:0,      sub:0, other:0      },
    // 26 · Electrical
    { divNum:'26', divName:'Electrical',            subNum:'010', subName:'Rough Electrical',      sortWeight:10,  itemId:'26.010.0001', description:'Install 4" PVC Conduit',             uom:'LF', labor:5.00,  material:8.00,   sub:0, other:0      },
    { divNum:'26', divName:'Electrical',            subNum:'010', subName:'Rough Electrical',      sortWeight:20,  itemId:'26.010.0002', description:'Electrical Panel Upgrade 200A',      uom:'EA', labor:0,     material:0,      sub:1850.00, other:0  },
    { divNum:'26', divName:'Electrical',            subNum:'020', subName:'Finish Electrical',     sortWeight:10,  itemId:'26.020.0001', description:'Standard Outlet',                    uom:'EA', labor:18.00, material:6.00,   sub:0, other:0      },
    { divNum:'26', divName:'Electrical',            subNum:'020', subName:'Finish Electrical',     sortWeight:20,  itemId:'26.020.0002', description:'GFCI Outlet',                        uom:'EA', labor:22.00, material:18.00,  sub:0, other:0      },
    { divNum:'26', divName:'Electrical',            subNum:'020', subName:'Finish Electrical',     sortWeight:30,  itemId:'26.020.0003', description:'Recessed Light - 4"',                uom:'EA', labor:35.00, material:28.00,  sub:0, other:0      },
    // 28 · Insulation
    { divNum:'28', divName:'Insulation',            subNum:'010', subName:'Batt Insulation',       sortWeight:10,  itemId:'28.010.0001', description:'R-15 Batt Insulation - Walls',       uom:'SF', labor:0.65,  material:0.85,   sub:0, other:0      },
    { divNum:'28', divName:'Insulation',            subNum:'010', subName:'Batt Insulation',       sortWeight:20,  itemId:'28.010.0002', description:'R-30 Batt Insulation - Ceiling',     uom:'SF', labor:0.75,  material:1.10,   sub:0, other:0      },
    { divNum:'28', divName:'Insulation',            subNum:'020', subName:'Spray Foam',            sortWeight:10,  itemId:'28.020.0001', description:'Closed Cell Spray Foam 2"',          uom:'SF', labor:1.25,  material:2.80,   sub:0, other:0      },
    // 30 · Drywall & Plaster
    { divNum:'30', divName:'Drywall & Plaster',     subNum:'010', subName:'Drywall',               sortWeight:10,  itemId:'30.010.0001', description:'1/2" Drywall Hung & Finished',       uom:'SF', labor:1.85,  material:0.65,   sub:0, other:0      },
    { divNum:'30', divName:'Drywall & Plaster',     subNum:'010', subName:'Drywall',               sortWeight:20,  itemId:'30.010.0002', description:'5/8" Type X Drywall',                uom:'SF', labor:1.95,  material:0.80,   sub:0, other:0      },
    { divNum:'30', divName:'Drywall & Plaster',     subNum:'020', subName:'Ceiling Texture',       sortWeight:10,  itemId:'30.020.0001', description:'Skip Trowel Texture',                uom:'SF', labor:0.65,  material:0.12,   sub:0, other:0      },
    // 34 · Interior Trim
    { divNum:'34', divName:'Interior Trim',         subNum:'010', subName:'Door Casing & Base',    sortWeight:10,  itemId:'34.010.0001', description:'3.5" Colonial Base',                 uom:'LF', labor:1.20,  material:1.85,   sub:0, other:0      },
    { divNum:'34', divName:'Interior Trim',         subNum:'010', subName:'Door Casing & Base',    sortWeight:20,  itemId:'34.010.0002', description:'Door Casing Set',                    uom:'EA', labor:35.00, material:18.00,  sub:0, other:0      },
    { divNum:'34', divName:'Interior Trim',         subNum:'020', subName:'Interior Doors',        sortWeight:10,  itemId:'34.020.0001', description:'Pre-Hung Interior Door Install',     uom:'EA', labor:95.00, material:0,      sub:0, other:0      },
    // 40 · Ceramic Tile
    { divNum:'40', divName:'Ceramic Tile',          subNum:'010', subName:'Floor Tile',            sortWeight:10,  itemId:'40.010.0001', description:'Ceramic Floor Tile Install',         uom:'SF', labor:6.50,  material:0,      sub:0, other:0      },
    { divNum:'40', divName:'Ceramic Tile',          subNum:'010', subName:'Floor Tile',            sortWeight:20,  itemId:'40.010.0002', description:'Tile Underlayment / Mud Bed',        uom:'SF', labor:3.50,  material:1.80,   sub:0, other:0      },
    { divNum:'40', divName:'Ceramic Tile',          subNum:'020', subName:'Wall Tile',             sortWeight:10,  itemId:'40.020.0001', description:'Ceramic Wall Tile Install',          uom:'SF', labor:8.50,  material:0,      sub:0, other:0      },
    // 44 · Painting
    { divNum:'44', divName:'Painting',              subNum:'010', subName:'Interior Painting',     sortWeight:10,  itemId:'44.010.0001', description:'Interior Walls - Prime & 2 Coats',   uom:'SF', labor:0.75,  material:0.35,   sub:0, other:0      },
    { divNum:'44', divName:'Painting',              subNum:'010', subName:'Interior Painting',     sortWeight:20,  itemId:'44.010.0002', description:'Interior Ceilings - Prime & 2 Coats',uom:'SF', labor:0.85,  material:0.38,   sub:0, other:0      },
    { divNum:'44', divName:'Painting',              subNum:'020', subName:'Exterior Painting',     sortWeight:10,  itemId:'44.020.0001', description:'Exterior Siding - Prime & 2 Coats',  uom:'SF', labor:1.10,  material:0.45,   sub:0, other:0      },
    { divNum:'44', divName:'Painting',              subNum:'020', subName:'Exterior Painting',     sortWeight:20,  itemId:'44.020.0002', description:'Exterior Trim Paint',                uom:'LF', labor:0.65,  material:0.28,   sub:0, other:0      },
  ];

  /* ── Map a raw DB_Costbook_Items sheet row to the internal format ── */
  function _mapRow(row, index) {
    return {
      divNum:      String(row.Div_ID    || '').trim(),
      divName:     String(row.Div_Name  || '').trim(),
      subNum:      String(row.Subdiv_ID   || '').trim(),
      subName:     String(row.Subdiv_Name || '').trim(),
      sortWeight:  parseFloat(row.Sort_Weight)   || index,
      itemId:      String(row.Item_ID            || '').trim(),
      description: String(row.Item_Description  || '').trim(),
      uom:         String(row.Unit_Of_Measure    || '').trim(),
      labor:       parseFloat(row.Cost_Labor)        || 0,
      material:    parseFloat(row.Cost_Material)     || 0,
      sub:         parseFloat(row.Cost_Sub)           || 0,
      equipment:   parseFloat(row.Cost_Equipment)    || 0,
      other:       parseFloat(row.Cost_Other)        || 0,
      laborHours:  parseFloat(row.Labor_Hours)       || 0,
      masterItemId: String(row.Master_Item_ID || '').trim(),
      specs:       String(row.Item_Specifications || '').trim(),
      // Adjustment % per cost type
      adjMaterial:  parseFloat(row.Adj_Material)  || 0,
      adjLabor:     parseFloat(row.Adj_Labor)      || 0,
      adjSub:       parseFloat(row.Adj_Sub)        || 0,
      adjEquipment: parseFloat(row.Adj_Equipment)  || 0,
      adjOther:     parseFloat(row.Adj_Other)      || 0,
      // Is_Allowance flags per cost type
      allowMaterial:  _truthy(row.Allow_Material),
      allowLabor:     _truthy(row.Allow_Labor),
      allowSub:       _truthy(row.Allow_Sub),
      allowEquipment: _truthy(row.Allow_Equipment),
      allowOther:     _truthy(row.Allow_Other),
      // Tax % — applies to Material only
      tax: parseFloat(row.Tax_Pct) || 0,
      // Vendor, lock, archived state, dates
      priceLocked: _truthy(row.Price_Locked),
      isArchived:  _truthy(row.Is_Archived),
      entrySource: String(row.Entry_Source || '').trim(),
      dateCreated:  String(row.Date_Created  || '').trim(),
      dateModified: String(row.Date_Modified || '').trim(),
    };
  }

  /* ── Helpers ──────────────────────────────────────────────── */

  function _truthy(v) {
    return v === true || v === 'TRUE' || v === 'true' || v === 1 || v === '1';
  }

  function _fmtDate(d) {
    return (d.getMonth() + 1) + '/' + d.getDate() + '/' + String(d.getFullYear()).slice(2);
  }

  function _fmt(n) {
    if (!n) return '';
    return n.toFixed(2);
  }

  /* Base unit cost for costbook grid display — no adjustments applied */
  function _unitCost(item) {
    return (item.labor || 0) + (item.material || 0) + (item.sub || 0) + (item.equipment || 0) + (item.other || 0);
  }

  /* Full unit cost with per-row adjustment % and Tax % on material — used in ECI */
  function _eciCalcTotal(item) {
    const mat = (item.material  || 0) * (1 + (item.adjMaterial  || 0) / 100);
    const tax = mat * ((item.tax || 0) / 100);
    const lab = (item.labor     || 0) * (1 + (item.adjLabor     || 0) / 100);
    const sub = (item.sub       || 0) * (1 + (item.adjSub       || 0) / 100);
    const eqp = (item.equipment || 0) * (1 + (item.adjEquipment || 0) / 100);
    const oth = (item.other     || 0) * (1 + (item.adjOther     || 0) / 100);
    return mat + tax + lab + sub + eqp + oth;
  }

  /* Build a structured tree: [ { divNum, divName, subs: [ { subNum, subName, items: [...] } ] } ] */
  function _buildTree(data) {
    const divMap = new Map();
    data.forEach(item => {
      if (!divMap.has(item.divNum)) {
        divMap.set(item.divNum, { divNum: item.divNum, divName: item.divName, subs: new Map() });
      }
      const div = divMap.get(item.divNum);
      if (!div.subs.has(item.subNum)) {
        div.subs.set(item.subNum, { subNum: item.subNum, subName: item.subName, items: [] });
      }
      div.subs.get(item.subNum).items.push(item);
    });
    return [...divMap.values()].map(d => ({ ...d, subs: [...d.subs.values()] }));
  }

  /* ── Costbook HTML ────────────────────────────────────────── */

  function _cbNavHTML(tree) {
    return tree.map(div => `
      <div class="cb-nav-div" data-div="${div.divNum}">
        <span class="cb-nav-div-name">${div.divName}</span>
      </div>
    `).join('');
  }

  function _cbRowsHTML(tree) {
    return tree.map(div => {
      const divSubCount  = div.subs.length;
      const divItemCount = div.subs.reduce((n, s) => n + s.items.length, 0);
      return `
      <div class="cgrid-row cgrid-t1 cb-row cb-row-div" data-div="${div.divNum}" data-expanded="false">
        <span class="cb-drag-handle" data-tip="Drag to reorder">&#8942;&#8942;</span>
        <button class="cb-edit-del" data-tip="Delete Division">&#10005;</button>
        <button class="cb-edit-add-sub btn-secondary" data-tip="Add Sub-Division">+ Sub</button>
        <span class="cb-tag-slot"></span>
        <span class="cb-row-div-name cgrid-col-name" data-tip="Double-click to rename"><span class="cgrid-expand">&#9654;</span><span class="cgrid-cell-text">${div.divName}</span></span>
        <span class="cb-col-uom"></span>
        <span class="cb-col-labor"></span>
        <span class="cb-col-mat"></span>
        <span class="cb-col-subc"></span>
        <span class="cb-col-equip"></span>
        <span class="cb-col-other"></span>
        <span class="cb-col-unit"></span>
        <span class="cb-col-specs"></span>
        <span class="cb-edit-count">${divSubCount} sub${divSubCount !== 1 ? 's' : ''}, ${divItemCount} item${divItemCount !== 1 ? 's' : ''}</span>
      </div>
      ${div.subs.map(sub => {
        const subItemCount = sub.items.length;
        return `
        <div class="cgrid-row cgrid-t2 cb-row cb-row-sub" data-div="${div.divNum}" data-sub="${sub.subNum}" data-expanded="false" style="display:none">
          <span class="cb-drag-handle" data-tip="Drag to reorder">&#8942;&#8942;</span>
          <button class="cb-edit-del" data-tip="Delete Sub-Division">&#10005;</button>
          <span class="cb-tag-slot"></span>
          <span class="cb-row-sub-name cgrid-col-name" data-tip="Double-click to rename"><span class="cgrid-expand">&#9654;</span><span class="cgrid-cell-text">${sub.subName}</span></span>
          <span class="cb-col-uom"></span>
          <span class="cb-col-labor"></span>
          <span class="cb-col-mat"></span>
          <span class="cb-col-subc"></span>
          <span class="cb-col-equip"></span>
          <span class="cb-col-other"></span>
          <span class="cb-col-unit"></span>
          <span class="cb-col-specs"></span>
          <span class="cb-edit-count">${subItemCount} item${subItemCount !== 1 ? 's' : ''}</span>
        </div>
        ${sub.items.map(item => {
          const uc = _unitCost(item);
          return `
          <div class="cgrid-row cgrid-t3 cb-row cb-row-item" data-div="${div.divNum}" data-sub="${sub.subNum}" data-item="${item.itemId}" draggable="true" style="display:none">
            <span class="cb-drag-handle" data-tip="Drag to reorder">&#8942;&#8942;</span>
            <input type="checkbox" class="cb-tag cb-tag-item" data-item="${item.itemId}" data-div="${div.divNum}" data-sub="${sub.subNum}">
            <span class="cb-col-desc cgrid-col-name"><span class="cgrid-cell-text">${item.description}</span></span>
            <span class="cb-col-uom">${item.uom}</span>
            <span class="cb-col-labor">${_fmt(item.labor)}</span>
            <span class="cb-col-mat">${_fmt(item.material)}</span>
            <span class="cb-col-subc">${_fmt(item.sub)}</span>
            <span class="cb-col-equip">${_fmt(item.equipment)}</span>
            <span class="cb-col-other">${_fmt(item.other)}</span>
            <span class="cb-col-unit">${_fmt(uc)}</span>
            <span class="cb-col-specs"><input class="cb-specs-input" type="text" value="${item.specs || ''}" placeholder="Notes / specs..."></span>
          </div>`;
        }).join('')}
      `; }).join('')}
    `; }).join('');
  }

  function _costbookHTML(tree) {
    const navDivs  = _cbNavHTML(tree);
    const gridRows = _cbRowsHTML(tree);

    return `
      <div class="sp-widget cb-widget">

        <div class="sp-toolbar cb-toolbar">
          <button class="btn-secondary sp-btn sp-normal-ctrl" data-action="edit-structure">Edit Divisions</button>
          <button class="btn-secondary sp-btn sp-edit-ctrl" data-action="edit-done">&#9664; Done</button>
          <button class="btn-secondary sp-btn sp-edit-ctrl" data-action="edit-expand-all">Expand All</button>
          <button class="btn-primary sp-btn sp-edit-ctrl" data-action="add-div">+ Add Division</button>
          <button class="btn-secondary sp-btn sp-normal-ctrl" data-action="toggle-expand-all">Expand All</button>
          <input class="cb-nav-search sp-normal-ctrl" type="text" placeholder="Search items..." autocomplete="off">
          <button class="btn-secondary sp-btn sp-btn-icon cb-undo-btn sp-normal-ctrl" data-action="cb-undo" disabled title="Undo">&#8617;</button>
          <button class="btn-secondary sp-btn sp-btn-icon cb-redo-btn sp-normal-ctrl" data-action="cb-redo" disabled title="Redo">&#8618;</button>
          <button class="btn-secondary sp-btn sp-btn-icon sp-normal-ctrl" data-action="cb-print" title="Print">&#9113;</button>
          <button class="btn-secondary sp-btn sp-btn-icon sp-normal-ctrl" data-action="cb-refresh" title="Refresh">&#8635;</button>
          <button class="btn-primary sp-btn sp-normal-ctrl" data-action="transfer" disabled>Transfer</button>
          <span class="cb-tag-count sp-normal-ctrl" data-count="0"></span>
        </div>

        <div class="sp-body cb-body">

          <!-- Left: Division navigator -->
          <div class="sp-nav cb-nav">
            <div class="cb-nav-header">Divisions</div>
            <div class="cb-nav-list">${navDivs}</div>
          </div>

          <!-- Resizable divider -->
          <div class="sp-divider cb-panel-resize"></div>

          <!-- Right: Grid -->
          <div class="sp-main cb-main">
            <div class="cb-header">
              <span class="cb-header-grip"></span>
              <span class="cb-header-tag">Tag</span>
              <span class="cb-col-desc cb-rz-hd" data-col="--cb-w-desc"><span class="cb-hdr-label">Description</span><span class="cb-col-resize"></span></span>
              <span class="cb-col-uom cb-rz-hd" data-col="--cb-w-uom"><span class="cb-hdr-label">U/M</span><span class="cb-col-resize"></span></span>
              <span class="cb-col-labor cb-rz-hd" data-col="--cb-w-labor"><span class="cb-hdr-label">Labor</span><span class="cb-col-resize"></span></span>
              <span class="cb-col-mat cb-rz-hd" data-col="--cb-w-mat"><span class="cb-hdr-label">Material</span><span class="cb-col-resize"></span></span>
              <span class="cb-col-subc cb-rz-hd" data-col="--cb-w-subc"><span class="cb-hdr-label">Sub</span><span class="cb-col-resize"></span></span>
              <span class="cb-col-equip cb-rz-hd" data-col="--cb-w-equip"><span class="cb-hdr-label">Equip</span><span class="cb-col-resize"></span></span>
              <span class="cb-col-other cb-rz-hd" data-col="--cb-w-other"><span class="cb-hdr-label">Other</span><span class="cb-col-resize"></span></span>
              <span class="cb-col-unit cb-rz-hd" data-col="--cb-w-unit"><span class="cb-hdr-label">Unit Cost</span><span class="cb-col-resize"></span></span>
              <span class="cb-col-specs cb-rz-hd" data-col="--cb-w-specs"><span class="cb-hdr-label">Specifications</span><span class="cb-col-resize"></span></span>
            </div>
            <div class="cb-edit-header">Edit Divisions Mode</div>
            <div class="cb-rows">
              ${gridRows}
            </div>
          </div>

        </div>
      </div>`;
  }

  /* ── Bind costbook interactions ───────────────────────────── */

  function _bindCostbook(widgetId) {
    const el = document.getElementById('widget-' + widgetId);
    if (!el) return;

    const rowsEl      = el.querySelector('.cb-rows');
    const tagCountEl  = el.querySelector('.cb-tag-count');
    const transferBtn = el.querySelector('[data-action="transfer"]');

    /* --- Panel resize handle --- */
    SplitPanel.bindDivider(el.querySelector('.cb-panel-resize'), {
      navEl: el.querySelector('.cb-nav'),
      min: 80, max: 340,
    });

    /* --- Tag count (items only, not div/sub header checkboxes) --- */
    function _updateTagCount() {
      const n           = el.querySelectorAll('.cb-tag-item:checked').length;
      const hasEstimate = _getOpenEstimates().length > 0;
      tagCountEl.textContent   = n > 0 ? `${n} item${n === 1 ? '' : 's'} selected` : '';
      tagCountEl.dataset.count = n;
      transferBtn.disabled     = n === 0 || !hasEstimate;
    }

    function _applyTagState() {
      const hasEstimate = _getOpenEstimates().length > 0;
      el.querySelectorAll('.cb-tag-item').forEach(cb => {
        cb.disabled = !hasEstimate;
        cb.title    = hasEstimate ? '' : 'Open an estimate to enable transfer';
      });
      _updateTagCount();
    }

    /* Called externally when an estimate opens/closes */
    function _notifyCostbookTagStateLocal() { _applyTagState(); }
    if (!window._cbTagListeners) window._cbTagListeners = [];
    window._cbTagListeners.push(_notifyCostbookTagStateLocal);

    _applyTagState();

    /* --- Column resize with localStorage persistence --- */
    const mainEl = el.querySelector('.cb-main');
    const CB_COL_KEY  = 'cb-col-widths';
    const CB_COL_VARS = ['--cb-w-desc','--cb-w-uom','--cb-w-labor','--cb-w-mat','--cb-w-subc','--cb-w-equip','--cb-w-other','--cb-w-unit','--cb-w-specs'];

    // Restore saved widths on load
    try {
      const saved = JSON.parse(localStorage.getItem(CB_COL_KEY) || '{}');
      CB_COL_VARS.forEach(v => { if (saved[v]) mainEl.style.setProperty(v, saved[v]); });
    } catch (err) { /* ignore */ }

    function _saveColWidths() {
      try {
        const widths = {};
        CB_COL_VARS.forEach(v => {
          const val = mainEl.style.getPropertyValue(v);
          if (val) widths[v] = val;
        });
        localStorage.setItem(CB_COL_KEY, JSON.stringify(widths));
      } catch (err) { /* ignore */ }
    }

    el.querySelectorAll('.cb-col-resize').forEach(handle => {
      handle.addEventListener('mousedown', function (e) {
        e.preventDefault();
        e.stopPropagation();
        const headerCell = this.closest('[data-col]');
        const colVar     = headerCell.dataset.col;
        const startX     = e.clientX;
        const startW     = headerCell.offsetWidth; // actual rendered px, not CSS var value
        document.body.classList.add('is-dragging');
        function onMove(e) {
          mainEl.style.setProperty(colVar, Math.max(40, startW + (e.clientX - startX)) + 'px');
        }
        function onUp() {
          document.body.classList.remove('is-dragging');
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          _saveColWidths();
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    });

    /* --- Expand / collapse a division row --- */
    function _toggleDiv(divRow) {
      const divNum   = divRow.dataset.div;
      const expanded = divRow.dataset.expanded === 'true';
      divRow.dataset.expanded = !expanded;
      divRow.querySelector('.cgrid-expand').classList.toggle('is-open', !expanded);
      // Show/hide all sub rows for this div
      el.querySelectorAll(`.cb-row-sub[data-div="${divNum}"]`).forEach(sub => {
        sub.style.display = expanded ? 'none' : '';
        // Collapse sub when div collapses
        if (expanded) {
          sub.dataset.expanded = 'false';
          sub.querySelector('.cgrid-expand').classList.remove('is-open');
          const s = sub.dataset.sub;
          el.querySelectorAll(`.cb-row-item[data-div="${divNum}"][data-sub="${s}"], .cb-row-hdr[data-div="${divNum}"][data-sub="${s}"]`)
            .forEach(item => item.style.display = 'none');
        }
      });
    }

    /* --- Expand / collapse a subdivision row --- */
    function _toggleSub(subRow) {
      const divNum   = subRow.dataset.div;
      const subNum   = subRow.dataset.sub;
      const expanded = subRow.dataset.expanded === 'true';
      subRow.dataset.expanded = !expanded;
      subRow.querySelector('.cgrid-expand').classList.toggle('is-open', !expanded);
      el.querySelectorAll(`.cb-row-item[data-div="${divNum}"][data-sub="${subNum}"], .cb-row-hdr[data-div="${divNum}"][data-sub="${subNum}"]`)
        .forEach(item => item.style.display = expanded ? 'none' : '');
    }

    /* --- Row clicks --- */
    rowsEl.addEventListener('click', function (e) {
      const divRow = e.target.closest('.cb-row-div');
      const subRow = e.target.closest('.cb-row-sub');
      if (divRow && !e.target.matches('.cb-tag, input') && !e.target.closest('.cb-edit-del, .cb-edit-add-sub')) _toggleDiv(divRow);
      if (subRow && !e.target.matches('.cb-tag, input') && !e.target.closest('.cb-edit-del')) _toggleSub(subRow);
    });

    /* --- Tag checkboxes (items and headers only) --- */
    rowsEl.addEventListener('change', function (e) {
      const cb = e.target;
      if (!cb.matches('.cb-tag-item')) return;
      _updateTagCount();
    });

    /* Transfer button → open Transfer widget */
    transferBtn.addEventListener('click', () => {
      const tagged = [...el.querySelectorAll('.cb-tag-item:checked')].map(cb => ({
        itemId: cb.dataset.item, divNum: cb.dataset.div, subNum: cb.dataset.sub,
      }));
      openTransfer(tagged, 'costbook');
    });

    /* --- Expand All / Collapse All toggle --- */
    el.querySelector('[data-action="toggle-expand-all"]').addEventListener('click', function () {
      const allDivs  = [...el.querySelectorAll('.cb-row-div')];
      const expanding = allDivs.some(r => r.dataset.expanded !== 'true');
      if (expanding) {
        allDivs.forEach(row => {
          row.dataset.expanded = 'true';
          row.querySelector('.cgrid-expand').classList.add('is-open');
        });
        el.querySelectorAll('.cb-row-sub').forEach(row => {
          row.style.display = '';
          row.dataset.expanded = 'true';
          row.querySelector('.cgrid-expand').classList.add('is-open');
        });
        el.querySelectorAll('.cb-row-item, .cb-row-hdr').forEach(row => row.style.display = '');
        this.textContent = 'Collapse All';
      } else {
        allDivs.forEach(row => {
          row.dataset.expanded = 'false';
          row.querySelector('.cgrid-expand').classList.remove('is-open');
        });
        el.querySelectorAll('.cb-row-sub').forEach(row => {
          row.style.display = 'none';
          row.dataset.expanded = 'false';
          row.querySelector('.cgrid-expand').classList.remove('is-open');
        });
        el.querySelectorAll('.cb-row-item, .cb-row-hdr').forEach(row => row.style.display = 'none');
        this.textContent = 'Expand All';
      }
    });

    /* --- Left nav: click division → scroll grid to that division row --- */
    el.querySelector('.cb-nav-list').addEventListener('click', function (e) {
      const divItem = e.target.closest('.cb-nav-div');
      if (!divItem) return;
      const divNum = divItem.dataset.div;

      // Highlight active division in nav
      el.querySelectorAll('.cb-nav-div').forEach(d => d.classList.remove('is-active'));
      divItem.classList.add('is-active');

      // Scroll grid so that division row is at the top
      const divRow = rowsEl.querySelector(`.cb-row-div[data-div="${divNum}"]`);
      if (!divRow) return;
      rowsEl.scrollTop = divRow.offsetTop - rowsEl.offsetTop;
    });

    /* --- Drag-and-drop reordering --- */
    let dragEl = null;

    // Collect a row and all its dependents (subs+items for div, items for sub)
    function _dragGroup(row) {
      const divNum = row.dataset.div;
      const subNum = row.dataset.sub;
      if (row.classList.contains('cb-row-div')) {
        return [row, ...rowsEl.querySelectorAll(`.cb-row[data-div="${divNum}"]:not(.cb-row-div)`)];
      }
      if (row.classList.contains('cb-row-sub')) {
        return [row, ...rowsEl.querySelectorAll(`.cb-row-item[data-div="${divNum}"][data-sub="${subNum}"], .cb-row-hdr[data-div="${divNum}"][data-sub="${subNum}"]`)];
      }
      return [row];
    }

    // Last DOM row belonging to a target (its subs/items if div or sub)
    function _lastInGroup(row) {
      const all = _dragGroup(row);
      return all[all.length - 1];
    }

    // Are dragged row and target row compatible drop targets?
    function _compatible(target, dragged) {
      if (!target || target === dragged) return false;
      if (dragged.classList.contains('cb-row-div')) return target.classList.contains('cb-row-div');
      if (dragged.classList.contains('cb-row-sub')) return target.classList.contains('cb-row-sub') && target.dataset.div === dragged.dataset.div;
      // items and headers are interchangeable within the same subdivision
      const dIsItemLike = dragged.classList.contains('cb-row-item') || dragged.classList.contains('cb-row-hdr');
      const tIsItemLike = target.classList.contains('cb-row-item')  || target.classList.contains('cb-row-hdr');
      if (dIsItemLike) return tIsItemLike && target.dataset.div === dragged.dataset.div && target.dataset.sub === dragged.dataset.sub;
      return false;
    }

    rowsEl.addEventListener('dragstart', function (e) {
      const row = e.target.closest('.cb-row[draggable]');
      if (!row || e.target.matches('.cb-tag, input')) { e.preventDefault(); return; }
      dragEl = row;
      row.classList.add('cb-row-dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    rowsEl.addEventListener('dragover', function (e) {
      e.preventDefault();
      if (!dragEl) return;
      const target = e.target.closest('.cb-row');
      rowsEl.querySelectorAll('.cb-drop-before, .cb-drop-after').forEach(r => r.classList.remove('cb-drop-before', 'cb-drop-after'));
      if (!_compatible(target, dragEl)) return;
      const mid = target.getBoundingClientRect().top + target.getBoundingClientRect().height / 2;
      target.classList.add(e.clientY < mid ? 'cb-drop-before' : 'cb-drop-after');
      e.dataTransfer.dropEffect = 'move';
    });

    rowsEl.addEventListener('dragleave', function (e) {
      if (!rowsEl.contains(e.relatedTarget))
        rowsEl.querySelectorAll('.cb-drop-before, .cb-drop-after').forEach(r => r.classList.remove('cb-drop-before', 'cb-drop-after'));
    });

    rowsEl.addEventListener('drop', function (e) {
      e.preventDefault();
      if (!dragEl) return;
      const target = e.target.closest('.cb-row');
      rowsEl.querySelectorAll('.cb-drop-before, .cb-drop-after').forEach(r => r.classList.remove('cb-drop-before', 'cb-drop-after'));
      if (!_compatible(target, dragEl)) return;
      const mid    = target.getBoundingClientRect().top + target.getBoundingClientRect().height / 2;
      const before = e.clientY < mid;
      const group  = _dragGroup(dragEl);
      if (before) {
        group.forEach(r => rowsEl.insertBefore(r, target));
      } else {
        let anchor = _lastInGroup(target);
        group.forEach(r => { anchor.after(r); anchor = r; });
      }
    });

    rowsEl.addEventListener('dragend', function () {
      if (dragEl) dragEl.classList.remove('cb-row-dragging');
      dragEl = null;
      rowsEl.querySelectorAll('.cb-drop-before, .cb-drop-after').forEach(r => r.classList.remove('cb-drop-before', 'cb-drop-after'));
    });

    /* --- Add header row (shared by button and context menu) --- */
    function _addHeaderAfter(anchor) {
      const divNum = anchor.dataset.div;
      const subNum = anchor.dataset.sub;
      const hdrId  = 'hdr-' + Date.now();
      const hdrRow = document.createElement('div');
      hdrRow.className = 'cb-row cb-row-hdr';
      hdrRow.dataset.div  = divNum;
      hdrRow.dataset.sub  = subNum;
      hdrRow.dataset.item = hdrId;
      hdrRow.draggable    = true;
      hdrRow.innerHTML = `
        <span class="cb-drag-handle">&#8942;&#8942;</span>
        <input type="checkbox" class="cb-tag cb-tag-item" data-item="${hdrId}" data-div="${divNum}" data-sub="${subNum}">
        <div class="cb-col-desc cgrid-col-name"><input class="cb-hdr-input" type="text" placeholder="Header label..."></div>
        <span class="cb-col-uom"></span>
        <span class="cb-col-labor"></span>
        <span class="cb-col-mat"></span>
        <span class="cb-col-subc"></span>
        <span class="cb-col-equip"></span>
        <span class="cb-col-other"></span>
        <span class="cb-col-unit"></span>
        <span class="cb-col-specs"></span>
      `;
      // Sub row: insert right after the sub (becomes first item under it)
      // Item or hdr row: insert directly before it
      if (anchor.classList.contains('cb-row-sub')) {
        anchor.after(hdrRow);
      } else {
        anchor.before(hdrRow);
      }
      const inp = hdrRow.querySelector('.cb-hdr-input');
      inp.focus();
    }

    /* --- Context menu: right-click to add header row --- */
    let ctxMenu = null;

    function _closeCtx() {
      if (ctxMenu) { ctxMenu.remove(); ctxMenu = null; }
    }

    rowsEl.addEventListener('contextmenu', function (e) {
      const itemRow = e.target.closest('.cb-row-item');
      const hdrRow  = e.target.closest('.cb-row-hdr');
      if (!itemRow && !hdrRow) return;
      e.preventDefault();
      _closeCtx();

      ctxMenu = document.createElement('div');
      ctxMenu.className = 'cb-ctx-menu';

      function _item(label, cls, fn) {
        const d = document.createElement('div');
        d.className = 'cb-ctx-item' + (cls ? ' ' + cls : '');
        d.textContent = label;
        d.addEventListener('click', () => { _closeCtx(); fn(); });
        ctxMenu.appendChild(d);
      }
      function _sep() {
        const d = document.createElement('div');
        d.className = 'cb-ctx-sep';
        ctxMenu.appendChild(d);
      }

      if (itemRow) {
        const itemId = itemRow.dataset.item;
        _item('+ Cost Item',       '',              () => openEditCostItem(null,   widgetId));
        _item('+ Header',          '',              () => _addHeaderAfter(itemRow));
        _item('Edit Cost Item',    '',              () => openEditCostItem(itemId, widgetId));
        _sep();
        _item('Archive Cost Item', '',              () => { /* TODO */ });
        _item('Delete Cost Item',  'cb-ctx-danger', () => { /* TODO */ });
      } else {
        _item('+ Add Header', '', () => _addHeaderAfter(hdrRow));
      }

      document.body.appendChild(ctxMenu);
      ctxMenu.style.left = e.clientX + 'px';
      ctxMenu.style.top  = e.clientY + 'px';
    });

    document.addEventListener('click', function (e) {
      if (ctxMenu && !ctxMenu.contains(e.target)) _closeCtx();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') _closeCtx();
    });

    /* --- Item row: double-click to open Edit Cost Item widget --- */
    rowsEl.addEventListener('dblclick', function (e) {
      const itemRow = e.target.closest('.cb-row-item');
      if (!itemRow) return;
      openEditCostItem(itemRow.dataset.item, widgetId);
    });

    /* --- Header row label: double-click to edit, Enter/blur to lock --- */
    rowsEl.addEventListener('dblclick', function (e) {
      const hdrRow = e.target.closest('.cb-row-hdr');
      if (!hdrRow) return;
      const inp = hdrRow.querySelector('.cb-hdr-input');
      if (!inp || !inp.readOnly) return;
      inp.readOnly = false;
      inp.focus();
      inp.select();
    });

    rowsEl.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      const inp = e.target.closest ? e.target : null;
      if (!inp || !inp.classList.contains('cb-hdr-input')) return;
      inp.readOnly = true;
      inp.blur();
    });

    rowsEl.addEventListener('focusout', function (e) {
      const inp = e.target;
      if (!inp.classList.contains('cb-hdr-input')) return;
      inp.readOnly = true;
    });

    /* --- Search: floating results dropdown --- */
    const searchInp = el.querySelector('.cb-nav-search');
    let cbSearchDrop = null;

    function _cbCloseDrop() {
      if (cbSearchDrop) { cbSearchDrop.remove(); cbSearchDrop = null; }
    }

    function _cbNavigateTo(divNum, subNum, itemId) {
      _cbCloseDrop();
      searchInp.value = '';

      // Collapse everything first for a clean reveal
      el.querySelectorAll('.cb-row-div').forEach(r => {
        r.dataset.expanded = 'false';
        r.querySelector('.cgrid-expand').classList.remove('is-open');
        r.style.display = '';
      });
      el.querySelectorAll('.cb-row-sub, .cb-row-item, .cb-row-hdr').forEach(r => r.style.display = 'none');

      // Expand target division
      const divRow = el.querySelector(`.cb-row-div[data-div="${divNum}"]`);
      if (divRow) {
        divRow.dataset.expanded = 'true';
        divRow.querySelector('.cgrid-expand').classList.add('is-open');
        el.querySelectorAll(`.cb-row-sub[data-div="${divNum}"]`).forEach(r => r.style.display = '');
        el.querySelectorAll(`.cb-row-hdr[data-div="${divNum}"]`).forEach(r => r.style.display = '');
      }

      // Expand target sub-division (if specified)
      if (subNum) {
        const subRow = el.querySelector(`.cb-row-sub[data-div="${divNum}"][data-sub="${subNum}"]`);
        if (subRow) {
          subRow.dataset.expanded = 'true';
          subRow.querySelector('.cgrid-expand').classList.add('is-open');
          el.querySelectorAll(`.cb-row-item[data-div="${divNum}"][data-sub="${subNum}"]`).forEach(r => r.style.display = '');
          el.querySelectorAll(`.cb-row-hdr[data-div="${divNum}"][data-sub="${subNum}"]`).forEach(r => r.style.display = '');
        }
      }

      // Scroll to and highlight target row
      const targetSel = itemId
        ? `.cb-row-item[data-item="${itemId}"]`
        : subNum
          ? `.cb-row-sub[data-div="${divNum}"][data-sub="${subNum}"]`
          : `.cb-row-div[data-div="${divNum}"]`;
      const targetRow = el.querySelector(targetSel);
      if (targetRow) {
        targetRow.scrollIntoView({ block: 'center', behavior: 'smooth' });
        const highlightCell = targetRow.querySelector('.cb-col-desc') || targetRow;
        highlightCell.classList.add('cb-search-highlight');
        setTimeout(() => highlightCell.classList.remove('cb-search-highlight'), 2000);
      }

      // Sync left nav
      el.querySelectorAll('.cb-nav-div').forEach(n => n.classList.toggle('is-active', n.dataset.div === divNum));
    }

    let cbDropIndex = -1;

    function _cbDropItems() {
      return cbSearchDrop ? [...cbSearchDrop.querySelectorAll('.cb-search-result')] : [];
    }

    function _cbDropSetActive(index) {
      const items = _cbDropItems();
      items.forEach((r, i) => r.classList.toggle('is-active', i === index));
      if (items[index]) items[index].scrollIntoView({ block: 'nearest' });
      cbDropIndex = index;
    }

    function _cbBuildDrop(q) {
      _cbCloseDrop();
      cbDropIndex = -1;
      if (!q) return;

      const results = [];

      // Match items by description
      el.querySelectorAll('.cb-row-item').forEach(itemRow => {
        const divNum  = itemRow.dataset.div;
        const subNum  = itemRow.dataset.sub;
        const itemId  = itemRow.dataset.item;
        const desc    = itemRow.querySelector('.cb-col-desc').textContent;
        const divName = el.querySelector(`.cb-row-div[data-div="${divNum}"] .cb-row-div-name`)?.textContent || '';
        const subName = el.querySelector(`.cb-row-sub[data-div="${divNum}"][data-sub="${subNum}"] .cb-row-sub-name`)?.textContent || '';
        if (desc.toLowerCase().includes(q)) {
          results.push({ type: 'item', label: desc, sub: divName + ' › ' + subName, divNum, subNum, itemId });
        }
      });

      if (!results.length) {
        results.push({ type: 'empty', label: 'No results', sub: null });
      }

      // Build dropdown
      cbSearchDrop = document.createElement('div');
      cbSearchDrop.className = 'cb-search-drop';

      results.slice(0, 30).forEach(r => {
        if (r.type === 'empty') {
          const row = document.createElement('div');
          row.className = 'cb-search-empty';
          row.textContent = r.label;
          cbSearchDrop.appendChild(row);
          return;
        }
        const row = document.createElement('div');
        row.className = 'cb-search-result cb-search-type-' + r.type;
        row.innerHTML = `<span class="cb-sr-label">${r.label}</span>${r.sub ? `<span class="cb-sr-path">${r.sub}</span>` : ''}`;
        row.addEventListener('mousedown', function (e) {
          e.preventDefault(); // keep search input focused
          _cbNavigateTo(r.divNum, r.subNum, r.itemId);
        });
        cbSearchDrop.appendChild(row);
      });

      // Position below the search input
      const rect = searchInp.getBoundingClientRect();
      cbSearchDrop.style.top   = rect.bottom + 4 + 'px';
      cbSearchDrop.style.left  = rect.left + 'px';
      cbSearchDrop.style.width = Math.max(rect.width, 280) + 'px';
      document.body.appendChild(cbSearchDrop);
    }

    if (searchInp) {
      searchInp.addEventListener('input', function () {
        _cbBuildDrop(this.value.trim().toLowerCase());
      });
      searchInp.addEventListener('blur', function () {
        // Short delay so mousedown on a result fires first
        setTimeout(_cbCloseDrop, 150);
      });
      searchInp.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { _cbCloseDrop(); this.value = ''; return; }
        if (!cbSearchDrop) return;
        const items = _cbDropItems();
        if (!items.length) return;
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          _cbDropSetActive(Math.min(cbDropIndex + 1, items.length - 1));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          _cbDropSetActive(Math.max(cbDropIndex - 1, 0));
        } else if (e.key === 'Enter') {
          e.preventDefault();
          const idx = cbDropIndex >= 0 ? cbDropIndex : 0;
          if (items[idx]) items[idx].dispatchEvent(new MouseEvent('mousedown'));
        }
      });
    }

    /* ── Edit Cost Items Mode ────────────────────────────────── */

    const widgetEl  = el.querySelector('.cb-widget');
    const navListEl = el.querySelector('.cb-nav-list');


    /* ── Edit Structure Mode ─────────────────────────────────── */

    function _isEditMode() {
      return widgetEl.classList.contains('cb-edit-mode');
    }

    /* --- Tooltip --- */
    const tipEl = document.createElement('div');
    tipEl.className = 'cb-tip';
    document.body.appendChild(tipEl);

    let tipTimer          = null;
    let tipCurrentTarget  = null;
    let tipMouseX         = 0;
    let tipMouseY         = 0;

    function _showTip() {
      if (!tipCurrentTarget) return;
      tipEl.textContent    = tipCurrentTarget.dataset.tip;
      tipEl.style.display  = 'block';
      tipEl.style.left     = (tipMouseX + 12) + 'px';
      tipEl.style.top      = (tipMouseY - tipEl.offsetHeight - 8) + 'px';
    }

    function _hideTip() {
      clearTimeout(tipTimer);
      tipTimer         = null;
      tipCurrentTarget = null;
      tipEl.style.display = 'none';
    }

    rowsEl.addEventListener('mousemove', function (e) {
      tipMouseX = e.clientX;
      tipMouseY = e.clientY;

      const target = e.target.closest('[data-tip]');

      if (!target) { _hideTip(); return; }

      // Outside edit mode only show tooltips on item rows
      if (!_isEditMode() && !target.closest('.cb-row-item')) { _hideTip(); return; }

      // Keep updating position while tooltip is visible
      if (tipEl.style.display === 'block') {
        tipEl.style.left = (tipMouseX + 12) + 'px';
        tipEl.style.top  = (tipMouseY - tipEl.offsetHeight - 8) + 'px';
      }

      if (target === tipCurrentTarget) return;

      // Moved to a new target — reset timer
      clearTimeout(tipTimer);
      tipEl.style.display = 'none';
      tipCurrentTarget    = target;
      tipTimer = setTimeout(_showTip, 500);
    });

    rowsEl.addEventListener('mouseleave', _hideTip);

    function _enterEditMode() {
      widgetEl.classList.add('cb-edit-mode');
      el.querySelectorAll('.cb-row-div, .cb-row-sub').forEach(r => r.setAttribute('draggable', 'true'));
      // Collapse all divisions on entry
      el.querySelectorAll('.cb-row-div').forEach(r => {
        if (r.dataset.expanded === 'true') _toggleDiv(r);
      });
      const expandBtn = el.querySelector('[data-action="edit-expand-all"]');
      if (expandBtn) expandBtn.textContent = 'Expand All';
    }

    function _exitEditMode() {
      _hideTip();
      widgetEl.classList.remove('cb-edit-mode');
      el.querySelectorAll('.cb-row-div, .cb-row-sub').forEach(r => r.removeAttribute('draggable'));
      // Rebuild nav from current div rows
      navListEl.innerHTML = [...rowsEl.querySelectorAll('.cb-row-div')].map(r => `
        <div class="cb-nav-div" data-div="${r.dataset.div}">
          <span class="cb-nav-div-name">${r.querySelector('.cb-row-div-name').textContent.trim()}</span>
        </div>
      `).join('');
      // Collapse all to default state
      el.querySelectorAll('.cb-row-div').forEach(r => {
        r.dataset.expanded = 'false';
        r.querySelector('.cgrid-expand').classList.remove('is-open');
      });
      el.querySelectorAll('.cb-row-sub').forEach(r => {
        r.style.display = 'none';
        r.dataset.expanded = 'false';
        r.querySelector('.cgrid-expand').classList.remove('is-open');
      });
      el.querySelectorAll('.cb-row-item, .cb-row-hdr').forEach(r => r.style.display = 'none');
    }

    /* --- Toolbar: edit-structure / edit-done / add-div / edit-expand-all --- */
    el.querySelector('.cb-toolbar').addEventListener('click', function (e) {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (action === 'edit-structure') { _enterEditMode(); return; }
      if (action === 'edit-done')      { _exitEditMode(); return; }
      if (action === 'add-div')        { _addDivision(); return; }
      if (action === 'edit-expand-all') {
        const btn     = e.target.closest('[data-action]');
        const allDivs = [...rowsEl.querySelectorAll('.cb-row-div')];
        const expand  = allDivs.some(r => r.dataset.expanded !== 'true');
        allDivs.forEach(r => {
          if (expand  && r.dataset.expanded !== 'true') _toggleDiv(r);
          if (!expand && r.dataset.expanded === 'true')  _toggleDiv(r);
        });
        btn.textContent = expand ? 'Collapse All' : 'Expand All';
        return;
      }
      if (action === 'cb-refresh') {
        const btn = e.target.closest('[data-action]');
        btn.disabled = true;
        AppData.refresh(['DB_Costbook_Items']).then(() => {
          const raw  = AppData.tables['DB_Costbook_Items'];
          const data = (raw && raw.length)
            ? raw.filter(r => r.Item_Description && !_truthy(r.Is_Archived)).map(_mapRow)
            : COSTBOOK_FALLBACK.filter(r => !r.isArchived);
          const tree = _buildTree(data);
          rowsEl.innerHTML  = _cbRowsHTML(tree);
          navListEl.innerHTML = _cbNavHTML(tree);
          _updateTagCount();
          btn.disabled = false;
        }).catch(() => { btn.disabled = false; });
        return;
      }
    });

    /* --- Inline rename (double-click div/sub name in edit mode) --- */
    function _startRename(nameEl) {
      const prev = nameEl.textContent.trim();
      nameEl.contentEditable = 'true';
      nameEl.focus();
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(nameEl);
      sel.removeAllRanges();
      sel.addRange(range);

      function finish(save) {
        nameEl.contentEditable = 'false';
        const val = nameEl.textContent.trim();
        if (!save || !val) nameEl.textContent = prev;
      }
      nameEl.addEventListener('blur', () => finish(true), { once: true });
      nameEl.addEventListener('keydown', function onKey(e) {
        if (e.key === 'Enter')  { e.preventDefault(); nameEl.removeEventListener('keydown', onKey); nameEl.blur(); }
        if (e.key === 'Escape') { e.preventDefault(); nameEl.removeEventListener('keydown', onKey); finish(false); }
      });
    }

    rowsEl.addEventListener('dblclick', function (e) {
      if (!_isEditMode()) return;
      const nameEl = e.target.closest('.cb-row-div-name, .cb-row-sub-name');
      if (nameEl) _startRename(nameEl);
    });

    /* --- Add Division --- */
    function _addDivision() {
      const divId  = 'new-' + Date.now();
      const divRow = document.createElement('div');
      divRow.className        = 'cgrid-row cgrid-t1 cb-row cb-row-div';
      divRow.dataset.div      = divId;
      divRow.dataset.expanded = 'true';
      divRow.setAttribute('draggable', 'true');
      divRow.innerHTML = `
        <span class="cb-drag-handle" data-tip="Drag to reorder">&#8942;&#8942;</span>
        <button class="cb-edit-del" data-tip="Delete Division">&#10005;</button>
        <button class="cb-edit-add-sub btn-secondary" data-tip="Add Sub-Division">+ Sub</button>
        <span class="cb-tag-slot"></span>
        <span class="cgrid-expand is-open">&#9654;</span>
        <span class="cb-row-div-name cgrid-col-name cgrid-cell-text" data-tip="Double-click to rename">New Division</span>
        <span class="cb-col-uom"></span><span class="cb-col-labor"></span><span class="cb-col-mat"></span>
        <span class="cb-col-subc"></span><span class="cb-col-equip"></span><span class="cb-col-other"></span>
        <span class="cb-col-unit"></span><span class="cb-col-specs"></span>
        <span class="cb-edit-count">0 subs, 0 items</span>`;
      rowsEl.appendChild(divRow);
      _startRename(divRow.querySelector('.cb-row-div-name'));
    }

    /* --- Add Sub-Division under a given division row --- */
    function _addSubDivision(divRow) {
      const divId  = divRow.dataset.div;
      const subId  = 'new-' + Date.now();
      const subRow = document.createElement('div');
      subRow.className        = 'cgrid-row cgrid-t2 cb-row cb-row-sub';
      subRow.dataset.div      = divId;
      subRow.dataset.sub      = subId;
      subRow.dataset.expanded = 'true';
      subRow.setAttribute('draggable', 'true');
      subRow.innerHTML = `
        <span class="cb-drag-handle" data-tip="Drag to reorder">&#8942;&#8942;</span>
        <button class="cb-edit-del" data-tip="Delete Sub-Division">&#10005;</button>
        <span class="cb-tag-slot"></span>
        <span class="cgrid-expand">&#9654;</span>
        <span class="cb-row-sub-name cgrid-col-name cgrid-cell-text" data-tip="Double-click to rename">New Sub-Division</span>
        <span class="cb-col-uom"></span><span class="cb-col-labor"></span><span class="cb-col-mat"></span>
        <span class="cb-col-subc"></span><span class="cb-col-equip"></span><span class="cb-col-other"></span>
        <span class="cb-col-unit"></span><span class="cb-col-specs"></span>
        <span class="cb-edit-count">0 items</span>`;
      // Insert after the last sub/item of this division, or directly after the div row
      const siblings = [...rowsEl.querySelectorAll(`.cb-row[data-div="${divId}"]:not(.cb-row-div)`)];
      const anchor   = siblings.length ? siblings[siblings.length - 1] : divRow;
      anchor.after(subRow);
      _startRename(subRow.querySelector('.cb-row-sub-name'));
    }

    /* --- Delete Division or Sub-Division --- */
    function _deleteDivision(divRow) {
      const divId     = divRow.dataset.div;
      const subCount  = rowsEl.querySelectorAll(`.cb-row-sub[data-div="${divId}"]`).length;
      const itemCount = rowsEl.querySelectorAll(`.cb-row-item[data-div="${divId}"]`).length;
      const name      = divRow.querySelector('.cb-row-div-name').textContent.trim();
      let msg = `Delete division "${name}"?`;
      if (subCount || itemCount) {
        msg += `\n\nThis will also remove ${subCount} sub-division${subCount !== 1 ? 's' : ''}`;
        if (itemCount) msg += ` and ${itemCount} item${itemCount !== 1 ? 's' : ''}`;
        msg += '.';
      }
      if (!confirm(msg)) return;
      rowsEl.querySelectorAll(`.cb-row[data-div="${divId}"]`).forEach(r => r.remove());
    }

    function _deleteSubDivision(subRow) {
      const divId     = subRow.dataset.div;
      const subId     = subRow.dataset.sub;
      const itemCount = rowsEl.querySelectorAll(
        `.cb-row-item[data-div="${divId}"][data-sub="${subId}"], .cb-row-hdr[data-div="${divId}"][data-sub="${subId}"]`
      ).length;
      const name = subRow.querySelector('.cb-row-sub-name').textContent.trim();
      let msg = `Delete sub-division "${name}"?`;
      if (itemCount) msg += `\n\nThis will also remove ${itemCount} item${itemCount !== 1 ? 's' : ''}.`;
      if (!confirm(msg)) return;
      rowsEl.querySelectorAll(
        `.cb-row-item[data-div="${divId}"][data-sub="${subId}"], .cb-row-hdr[data-div="${divId}"][data-sub="${subId}"]`
      ).forEach(r => r.remove());
      subRow.remove();
    }

    /* --- Edit action button clicks (del + add-sub) --- */
    rowsEl.addEventListener('click', function (e) {
      if (!_isEditMode()) return;
      const delBtn    = e.target.closest('.cb-edit-del');
      const addSubBtn = e.target.closest('.cb-edit-add-sub');
      if (delBtn) {
        e.stopPropagation();
        const divRow = delBtn.closest('.cb-row-div');
        const subRow = delBtn.closest('.cb-row-sub');
        if (divRow) _deleteDivision(divRow);
        if (subRow) _deleteSubDivision(subRow);
      }
      if (addSubBtn) {
        e.stopPropagation();
        const divRow = addSubBtn.closest('.cb-row-div');
        if (divRow) _addSubDivision(divRow);
      }
    });

  }

  /* ── Edit Cost Item Widget ────────────────────────────────── */

  const _ECI_UOM = ['EA','SF','LF','SQ','CY','MO','DY','HR','LS','LOT','ALLOW','BF'];

  function _eciDivisions() {
    const raw = AppData.tables['DB_Costbook_Items'] || [];
    const seen = new Map();
    raw.forEach(r => {
      const num  = String(r.Div_ID   || '').trim();
      const name = String(r.Div_Name || '').trim();
      if (num && name && !seen.has(num)) seen.set(num, name);
    });
    return [...seen.entries()].map(([num, name]) => ({ num, name }));
  }

  function _eciSubs(divNum) {
    const raw = AppData.tables['DB_Costbook_Items'] || [];
    const seen = new Map();
    raw.filter(r => String(r.Div_ID || '').trim() === divNum)
       .forEach(r => {
         const num  = String(r.Subdiv_ID   || '').trim();
         const name = String(r.Subdiv_Name || '').trim();
         if (num && name && !seen.has(num)) seen.set(num, name);
       });
    return [...seen.entries()].map(([num, name]) => ({ num, name }));
  }

  function _divOpts(divs, sel) {
    return '<option value="">— select —</option>' +
      divs.map(d => `<option value="${d.num}"${d.num === sel ? ' selected' : ''}>${d.name}</option>`).join('');
  }

  function _subOpts(subs, sel) {
    if (!subs.length) return '<option value="">— select division first —</option>';
    return '<option value="">— select —</option>' +
      subs.map(s => `<option value="${s.num}"${s.num === sel ? ' selected' : ''}>${s.name}</option>`).join('');
  }

  function _eciAliasRowHTML(a) {
    return `
      <span class="eci-alias-cell">${a.divName}</span>
      <span class="eci-alias-cell">${a.subName}</span>
      <span class="eci-alias-cell">${a.description}</span>
      <span class="eci-alias-cell muted">${a.specs || ''}</span>
      <button class="eci-alias-remove" data-alias-id="${a.itemId || ''}" title="Remove alias">&#215;</button>`;
  }

  function _eciHTML(item, aliases) {
    const divs    = _eciDivisions();
    const subs    = _eciSubs(item.divNum);
    const uomOpts = _ECI_UOM.map(u =>
      `<option value="${u}"${u === item.uom ? ' selected' : ''}>${u}</option>`).join('');

    const aliasRowsHTML = aliases.map(a => `
      <div class="eci-alias-grid-row" data-alias-id="${a.itemId || ''}">
        ${_eciAliasRowHTML(a)}
      </div>`).join('');

    const unitTotal = _eciCalcTotal(item);
    function cb(val) { return val ? ' checked' : ''; }
    function nv(n)   { return n   ? n          : ''; }

    /* Helper: one cost row — cost input | adj% input | allow checkbox | formula btn or spacer */
    function costRow(label, costField, adjField, allowField, hasFormula) {
      return `
        <span class="eci-cost-label">${label}</span>
        <input class="eci-input eci-cost-input" type="number" min="0" step="0.01"
          data-field="${costField}" value="${nv(item[costField])}" placeholder="0.00">
        <input class="eci-adj-inp" type="number" min="-100" step="0.1"
          data-field="${adjField}" value="${nv(item[adjField])}" placeholder="">
        <input type="checkbox" class="eci-allow-cb" data-field="${allowField}"${cb(item[allowField])}>
        ${hasFormula
          ? `<button class="btn-secondary sp-btn eci-formula-btn" title="Formula builder (coming soon)">ƒ</button>`
          : '<span></span>'}`;
    }

    return `
      <div class="eci-widget">

        <!-- Toolbar: Add New | Save & New | Copy | ‹ | › | Archive — Delete (right) -->
        <div class="eci-toolbar">
          <button class="btn-secondary sp-btn eci-new-btn">Add New</button>
          <button class="btn-primary sp-btn eci-save-new-btn">Save &amp; New</button>
          <button class="btn-secondary sp-btn sp-btn-icon eci-copy-btn" title="Copy item">&#10697;</button>
          <button class="btn-secondary sp-btn sp-btn-icon eci-prev-btn" title="Previous item">&#8249;</button>
          <button class="btn-secondary sp-btn sp-btn-icon eci-next-btn" title="Next item">&#8250;</button>
          <label class="eci-archive-label">
            Archive <input type="checkbox" class="eci-active-cb" data-field="isArchived"${cb(item.isArchived)}>
          </label>
          <button class="btn-secondary sp-btn eci-delete-btn" style="margin-left:auto">Delete</button>
        </div>

        <div class="eci-body">

          <!-- Top: identity (left) + costs (right) -->
          <div class="eci-top-row">

            <!-- Identity column -->
            <div class="eci-identity">
              <div class="eci-row">
                <span class="eci-label">Division</span>
                <select class="eci-select eci-div-sel">${_divOpts(divs, item.divNum)}</select>
              </div>
              <div class="eci-row">
                <span class="eci-label">Sub-Division</span>
                <select class="eci-select eci-sub-sel">${_subOpts(subs, item.subNum)}</select>
              </div>
              <div class="eci-row">
                <span class="eci-label">U/M</span>
                <select class="eci-select eci-uom-sel" style="flex:none;width:54px">${uomOpts}</select>
              </div>
              <div class="eci-row">
                <span class="eci-label">Hours / U/M</span>
                <input class="eci-input eci-cost-input" type="number" min="0" step="0.01"
                  style="flex:none;width:54px"
                  data-field="laborHours" value="${nv(item.laborHours)}" placeholder="0.00">
              </div>
              <div class="eci-row">
                <span class="eci-label">Date Created</span>
                <span class="eci-date-val">${item.dateCreated || '—'}</span>
              </div>
              <div class="eci-row">
                <span class="eci-label">Last Modified</span>
                <span class="eci-date-val">${item.dateModified || '—'}</span>
              </div>
            </div><!-- /.eci-identity -->

            <!-- Costs column -->
            <div class="eci-costs">
              <div class="eci-item-id">${item.itemId || 'New Item'}</div>

              <!-- Cost grid header row -->
              <div class="eci-cost-grid">
                <span></span>
                <span></span>
                <span class="eci-cost-col-hdr" style="text-align:center">Adj %</span>
                <span class="eci-cost-col-hdr" style="text-align:center">Allow</span>
                <span></span>

                ${costRow('Material',     'material',  'adjMaterial',  'allowMaterial',  true)}
                ${costRow('Labor',        'labor',     'adjLabor',     'allowLabor',     true)}
                ${costRow('Subcontractor','sub',       'adjSub',       'allowSub',       true)}
                ${costRow('Equipment',    'equipment', 'adjEquipment', 'allowEquipment', false)}
                ${costRow('Other',        'other',     'adjOther',     'allowOther',     false)}

                <!-- Tax: cost input only, no waste/allow/formula -->
                <span class="eci-cost-label">Tax</span>
                <input class="eci-input eci-cost-input eci-tax-pct" type="number" min="0" max="100" step="0.01"
                  data-field="tax" value="${nv(item.tax)}" placeholder="0.00">
                <span></span><span></span><span></span>
              </div>

              <!-- Total Unit Cost -->
              <div class="eci-total-row">
                <span class="eci-label">Unit Cost</span>
                <div class="eci-total-value">${_fmt(unitTotal) || '0.00'}</div>
              </div>
            </div><!-- /.eci-costs -->

          </div><!-- /.eci-top-row -->

          <hr class="eci-sep">

          <!-- Description + Specs side by side -->
          <div class="eci-desc-row">
            <div class="eci-desc-col">
              <div class="eci-field-label">Item Description</div>
              <textarea class="eci-textarea" data-field="description"
                rows="3" placeholder="Item description...">${(item.description || '').replace(/</g, '&lt;')}</textarea>
            </div>
            <div class="eci-desc-col">
              <div class="eci-field-label">Detailed Specifications</div>
              <textarea class="eci-textarea" data-field="specs"
                rows="3" placeholder="Notes and specifications...">${(item.specs || '').replace(/</g, '&lt;')}</textarea>
            </div>
          </div>

          <!-- Aliases -->
          <div class="eci-aliases-section">
            <div class="eci-aliases-hdr">Aliases</div>
            <div class="eci-alias-grid">
              <div class="eci-alias-col-hdr">Division</div>
              <div class="eci-alias-col-hdr">Sub-Division</div>
              <div class="eci-alias-col-hdr">Description</div>
              <div class="eci-alias-col-hdr">Specifications</div>
              <div class="eci-alias-col-hdr"></div>
              ${aliasRowsHTML}
              <div class="eci-alias-add-row" style="display:none">
                <select class="eci-select eci-alias-div-sel" style="margin:3px 0">${_divOpts(divs, '')}</select>
                <select class="eci-select eci-alias-sub-sel" style="margin:3px 0"><option value="">— select division —</option></select>
                <input class="eci-input eci-alias-desc-inp" type="text" style="margin:3px 0" placeholder="Description (optional)">
                <input class="eci-input eci-alias-specs-inp" type="text" style="margin:3px 0" placeholder="Specs (optional)">
                <span></span>
              </div>
            </div>
            <div class="eci-add-alias-btn-row">
              <button class="btn-secondary sp-btn eci-add-alias-btn">+ Add Alias</button>
              <button class="btn-primary sp-btn eci-confirm-alias-btn" style="display:none">Add</button>
              <button class="btn-secondary sp-btn eci-cancel-alias-btn" style="display:none">Cancel</button>
            </div>
          </div>

          <!-- Formula placeholder -->
          <div class="eci-formula-bar">
            <button class="btn-secondary sp-btn" disabled title="Formula builder — coming in a future update">ƒ Formula</button>
            <span class="eci-formula-placeholder">Formula builder — coming soon</span>
          </div>

        </div><!-- /.eci-body -->

        <!-- Footer: Delete (left) | Cancel | Save & Close (locked right) -->
        <div class="eci-footer">
          <div class="eci-footer-right">
            <button class="btn-secondary sp-btn eci-cancel-btn">Cancel</button>
            <button class="btn-primary sp-btn eci-save-close-btn">Save &amp; Close</button>
          </div>
        </div>

      </div>`;
  }

  function _bindECI(wid, item, allItems) {
    const el = document.getElementById(wid);
    if (!el) return;

    /* Live total recalculation — mirrors _eciCalcTotal but reads from DOM */
    function _recalc() {
      const v = f => parseFloat(el.querySelector(`.eci-cost-input[data-field="${f}"]`)?.value) || 0;
      const a = f => parseFloat(el.querySelector(`.eci-adj-inp[data-field="${f}"]`)?.value) || 0;
      const taxPct = parseFloat(el.querySelector('.eci-tax-pct')?.value) || 0;
      const mat = v('material') * (1 + a('adjMaterial') / 100);
      const tax = mat * (taxPct / 100);
      const total = mat + tax
        + v('labor')     * (1 + a('adjLabor')     / 100)
        + v('sub')       * (1 + a('adjSub')       / 100)
        + v('equipment') * (1 + a('adjEquipment') / 100)
        + v('other')     * (1 + a('adjOther')     / 100);
      const tv = el.querySelector('.eci-total-value');
      if (tv) tv.textContent = _fmt(total) || '0.00';
    }

    el.querySelectorAll('.eci-cost-input, .eci-adj-inp, .eci-tax-pct')
      .forEach(inp => inp.addEventListener('input', _recalc));


    /* Auto-expanding textareas */
    el.querySelectorAll('.eci-textarea').forEach(ta => {
      ta.addEventListener('input', function () {
        this.style.overflowY = this.scrollHeight > this.clientHeight ? 'auto' : 'hidden';
      });
      new ResizeObserver(() => WidgetManager.resizeToContent(wid)).observe(ta);
    });

    /* Division → Subdivision cascade */
    const divSel = el.querySelector('.eci-div-sel');
    const subSel = el.querySelector('.eci-sub-sel');
    divSel?.addEventListener('change', () => {
      subSel.innerHTML = _subOpts(_eciSubs(divSel.value), '');
    });

    /* Formula button placeholder */
    el.querySelector('.eci-formula-btn')?.addEventListener('click', () => { /* TODO */ });

    /* Alias: remove */
    el.querySelector('.eci-alias-grid')?.addEventListener('click', e => {
      const btn = e.target.closest('.eci-alias-remove');
      if (!btn) return;
      btn.closest('.eci-alias-grid-row')?.remove();
    });

    /* Alias: show / hide add form */
    const addBtn     = el.querySelector('.eci-add-alias-btn');
    const confirmBtn = el.querySelector('.eci-confirm-alias-btn');
    const cancelBtn  = el.querySelector('.eci-cancel-alias-btn');
    const addRow     = el.querySelector('.eci-alias-add-row');

    function _showAliasForm(show) {
      addRow.style.display     = show ? 'contents' : 'none';
      addBtn.style.display     = show ? 'none' : '';
      confirmBtn.style.display = show ? '' : 'none';
      cancelBtn.style.display  = show ? '' : 'none';
    }

    addBtn?.addEventListener('click', () => _showAliasForm(true));
    cancelBtn?.addEventListener('click', () => _showAliasForm(false));

    /* Alias add form: division cascade */
    const aliasDivSel = el.querySelector('.eci-alias-div-sel');
    const aliasSubSel = el.querySelector('.eci-alias-sub-sel');
    aliasDivSel?.addEventListener('change', () => {
      aliasSubSel.innerHTML = _subOpts(_eciSubs(aliasDivSel.value), '');
    });

    confirmBtn?.addEventListener('click', () => {
      const divNum = aliasDivSel?.value;
      const subNum = aliasSubSel?.value;
      if (!divNum || !subNum) return;
      const divName = aliasDivSel.options[aliasDivSel.selectedIndex]?.text || '';
      const subName = aliasSubSel.options[aliasSubSel.selectedIndex]?.text || '';
      const desc    = el.querySelector('.eci-alias-desc-inp')?.value.trim() || item.description || '';
      const specs   = el.querySelector('.eci-alias-specs-inp')?.value.trim() || '';
      const row = document.createElement('div');
      row.className = 'eci-alias-grid-row';
      row.innerHTML = _eciAliasRowHTML({ divName, subName, description: desc, specs, itemId: '' });
      addRow.parentElement.insertBefore(row, addRow);
      el.querySelector('.eci-alias-desc-inp').value  = '';
      el.querySelector('.eci-alias-specs-inp').value = '';
      aliasDivSel.value = '';
      aliasSubSel.innerHTML = '<option value="">— select division —</option>';
      _showAliasForm(false);
    });

    /* Toolbar: navigation helpers */
    const masterItems = allItems ? allItems.filter(i => !i.masterItemId) : [];
    const curIdx      = masterItems.findIndex(i => i.itemId === item.itemId);

    function _navTo(idx) {
      if (idx < 0 || idx >= masterItems.length) return;
      WidgetManager.close(wid);
      openEditCostItem(masterItems[idx].itemId, 'costbook');
    }

    el.querySelector('.eci-prev-btn')?.addEventListener('click', () => _navTo(curIdx - 1));
    el.querySelector('.eci-next-btn')?.addEventListener('click', () => _navTo(curIdx + 1));

    el.querySelector('.eci-new-btn')?.addEventListener('click', () => {
      WidgetManager.close(wid);
      openEditCostItem(null, 'costbook');
    });

    el.querySelector('.eci-copy-btn')?.addEventListener('click', () => {
      /* TODO: open new ECI pre-filled as an independent copy */
      WidgetManager.close(wid);
    });

    el.querySelector('.eci-delete-btn')?.addEventListener('click', () => {
      /* TODO: confirm + delete from sheet */
    });

    el.querySelector('.eci-save-close-btn')?.addEventListener('click', () => {
      /* TODO: persist to Sheets */
      WidgetManager.close(wid);
    });

    el.querySelector('.eci-save-new-btn')?.addEventListener('click', () => {
      /* TODO: persist to Sheets, then open blank */
      WidgetManager.close(wid);
      openEditCostItem(null, 'costbook');
    });

    el.querySelector('.eci-cancel-btn')?.addEventListener('click', () => {
      WidgetManager.close(wid);
    });
  }

  function openEditCostItem(itemId, parentWidgetId) {
    const raw      = AppData.tables['DB_Costbook_Items'] || [];
    const allItems = raw.filter(r => r.Item_Description).map(_mapRow);

    let item;
    if (!itemId) {
      // New blank item
      const today = _fmtDate(new Date());
      item = {
        divNum: '', divName: '', subNum: '', subName: '',
        sortWeight: 0, itemId: '',
        description: '', uom: 'EA',
        labor: 0, material: 0, sub: 0, equipment: 0, other: 0,
        laborHours: 0, masterItemId: '', specs: '',
        adjMaterial: 0, adjLabor: 0, adjSub: 0, adjEquipment: 0, adjOther: 0,
        allowMaterial: false, allowLabor: false, allowSub: false,
        allowEquipment: false, allowOther: false,
        tax: 0, vendor: '', priceLocked: false, isArchived: false,
        entrySource: 'Manual', dateCreated: today, dateModified: today,
      };
    } else {
      item = allItems.find(i => i.itemId === itemId);
      if (!item) return;
    }

    /* Resolve alias → always edit the master */
    if (item.masterItemId) {
      item = allItems.find(i => i.itemId === item.masterItemId) || item;
    }

    const aliases = allItems.filter(i => i.masterItemId === item.itemId);

    const wid   = 'edit-cost-item';
    const title = itemId ? 'Edit Cost Item' : 'New Cost Item';
    if (WidgetManager.open(wid, title, _eciHTML(item, aliases), {
      width: 550, height: 650, minWidth: 550, minHeight: 500, category: 'estimating',
      centeredOn: parentWidgetId,
    }) !== false) {
      _bindECI(wid, item, allItems);
    }
  }

  /* ── Public: open costbook widget ────────────────────────── */

  async function openCostbook() {
    await AppData.ready;
    const raw  = AppData.tables['DB_Costbook_Items'];
    const data = (raw && raw.length)
      ? raw.filter(r => r.Item_Description && !_truthy(r.Is_Archived)).map(_mapRow)
      : COSTBOOK_FALLBACK.filter(r => !r.isArchived);
    const id   = 'costbook';
    const tree = _buildTree(data);
    if (WidgetManager.open(id, 'Costbook', _costbookHTML(tree), {
      width: 1060, height: 620, minWidth: 600, minHeight: 400, category: 'estimating',
    }) !== false) {
      _bindCostbook(id);
    }
  }

  /* ── Price List ───────────────────────────────────────────── */

  const PL_CATEGORIES = {
    'Lumber':                ['Dimensional', 'Engineered', 'Treated', 'Hardwood', 'Timbers'],
    'Sheet Goods':           ['Plywood', 'OSB', 'Drywall', 'Cement Board', 'Sheathing'],
    'Fasteners & Hardware':  ['Nails & Staples', 'Screws & Bolts', 'Anchors', 'Connectors & Hangers'],
    'Concrete & Masonry':    ['Concrete Mix', 'Rebar', 'CMU Block', 'Brick', 'Mortar'],
    'Insulation':            ['Batt', 'Rigid Foam', 'Spray Foam', 'Blown-In'],
    'Roofing':               ['Shingles', 'Underlayment', 'Flashing', 'Ice & Water Shield', 'Ridge Vent'],
    'Windows & Doors':       ['Windows', 'Exterior Doors', 'Interior Doors', 'Patio Doors'],
    'Flooring':              ['Hardwood', 'LVP / LVT', 'Tile', 'Carpet', 'Subfloor Materials'],
    'Paint & Coatings':      ['Primer', 'Interior Paint', 'Exterior Paint', 'Stain & Sealer'],
    'Plumbing Materials':    ['Pipe & Fittings', 'Fixtures', 'Water Heaters', 'Valves'],
    'Electrical Materials':  ['Wire & Cable', 'Devices & Panels', 'Lighting Fixtures'],
    'HVAC Materials':        ['Ductwork', 'Equipment', 'Controls & Thermostats'],
    'Adhesives & Sealants':  ['Construction Adhesive', 'Caulk', 'Foam Sealant'],
    'Landscaping':           ['Topsoil & Mulch', 'Gravel & Stone', 'Plants & Sod'],
  };

  const PL_UOM = ['EA', 'LF', 'SF', 'SY', 'CY', 'BF', 'SHT', 'LB', 'TON', 'GAL', 'BAG', 'PR', 'HR', 'LS'];

  function _plCatOptions(allItems) {
    return [...new Set([
      ...Object.keys(PL_CATEGORIES),
      ...allItems.map(r => r.category).filter(Boolean),
    ])].sort();
  }

  function _plSubOptions(cat, allItems) {
    return [...new Set([
      ...(PL_CATEGORIES[cat] || []),
      ...allItems.filter(r => r.category === cat).map(r => r.subCategory).filter(Boolean),
    ])].sort();
  }

  function _mapPriceRow(row) {
    const active = row.Is_Active;
    return {
      itemId:       String(row.Item_ID         || '').trim(),
      category:     String(row.PL_Cat_ID    || '').trim(),
      subCategory:  String(row.PL_Subcat_ID || '').trim(),
      itemName:     String(row.Item_Name       || '').trim(),
      uom:          String(row.Unit_Of_Measure || '').trim(),
      currentCost:  parseFloat(row.Current_Cost)  || 0,
      startingCost: parseFloat(row.Starting_Cost) || 0,
      masterId:     String(row.Master_Price_ID || '').trim(),
      isActive:     active !== 'FALSE' && active !== false && active !== 0 && active !== '0',
      dateCreated:  String(row.Date_Created  || '').trim(),
      dateModified: String(row.Date_Modified || '').trim(),
    };
  }

  function _plDelta(item) {
    if (!item.startingCost) return null;
    return ((item.currentCost - item.startingCost) / item.startingCost) * 100;
  }

  function _plDeltaHTML(item) {
    const d = _plDelta(item);
    if (d === null) return '<span class="pl-delta-none">—</span>';
    const cls = d > 0 ? 'pl-delta-up' : d < 0 ? 'pl-delta-dn' : 'pl-delta-flat';
    const sign = d > 0 ? '+' : '';
    return `<span class="${cls}">${sign}${d.toFixed(1)}%</span>`;
  }

  const PL_COL_DEFAULTS = { name: 200, uom: 55, cost: 75, start: 75, datemod: 75, delta: 55, master: 20 };
  const PL_COL_VER = '5'; // bump to discard stale localStorage widths

  function _plFmtDate(val) {
    if (!val) return '—';
    if (typeof val === 'number') {
      // Google Sheets date serial (days since Dec 30, 1899)
      const d = new Date(Math.round((val - 25569) * 86400 * 1000));
      return (d.getMonth() + 1) + '/' + d.getDate() + '/' + String(d.getFullYear()).slice(2);
    }
    return String(val).trim() || '—';
  }

  const PL_SEED = [
    { Item_ID:'PL-S01', PL_Cat_ID:'Lumber',               PL_Subcat_ID:'Dimensional',     Item_Name:'2x4x8 Stud',               Unit_Of_Measure:'EA',  Current_Cost:4.25,   Starting_Cost:3.89,   Date_Modified:'4/14/26',  Is_Active:'TRUE' },
    { Item_ID:'PL-S02', PL_Cat_ID:'Lumber',               PL_Subcat_ID:'Dimensional',     Item_Name:'2x6x8',                    Unit_Of_Measure:'EA',  Current_Cost:6.75,   Starting_Cost:5.99,   Date_Modified:'4/14/26',  Is_Active:'TRUE' },
    { Item_ID:'PL-S03', PL_Cat_ID:'Lumber',               PL_Subcat_ID:'Engineered',      Item_Name:'LVL 1-3/4"x9-1/2" x20\'', Unit_Of_Measure:'EA',  Current_Cost:145.00, Starting_Cost:138.00, Date_Modified:'3/22/26',  Is_Active:'TRUE' },
    { Item_ID:'PL-S04', PL_Cat_ID:'Sheet Goods',          PL_Subcat_ID:'Plywood',         Item_Name:'3/4" AC Plywood 4x8',      Unit_Of_Measure:'SHT', Current_Cost:52.50,  Starting_Cost:48.00,  Date_Modified:'4/14/26',  Is_Active:'TRUE' },
    { Item_ID:'PL-S05', PL_Cat_ID:'Sheet Goods',          PL_Subcat_ID:'Drywall',         Item_Name:'1/2" Drywall 4x8',         Unit_Of_Measure:'SHT', Current_Cost:14.75,  Starting_Cost:13.50,  Date_Modified:'2/10/26',  Is_Active:'TRUE' },
    { Item_ID:'PL-S06', PL_Cat_ID:'Sheet Goods',          PL_Subcat_ID:'OSB',             Item_Name:'7/16" OSB 4x8',            Unit_Of_Measure:'SHT', Current_Cost:22.00,  Starting_Cost:20.50,  Date_Modified:'2/10/26',  Is_Active:'TRUE' },
    { Item_ID:'PL-S07', PL_Cat_ID:'Concrete & Masonry',   PL_Subcat_ID:'Concrete Mix',    Item_Name:'80 lb Concrete Mix',       Unit_Of_Measure:'BAG', Current_Cost:7.25,   Starting_Cost:6.50,   Date_Modified:'1/5/26',   Is_Active:'TRUE' },
    { Item_ID:'PL-S08', PL_Cat_ID:'Insulation',           PL_Subcat_ID:'Batt',            Item_Name:'R-13 Batt 15"x93"',        Unit_Of_Measure:'EA',  Current_Cost:18.50,  Starting_Cost:16.99,  Date_Modified:'3/22/26',  Is_Active:'TRUE' },
    { Item_ID:'PL-S09', PL_Cat_ID:'Insulation',           PL_Subcat_ID:'Rigid Foam',      Item_Name:'2" Rigid Foam 4x8',        Unit_Of_Measure:'SHT', Current_Cost:28.00,  Starting_Cost:25.50,                            Is_Active:'TRUE' },
    { Item_ID:'PL-S10', PL_Cat_ID:'Roofing',              PL_Subcat_ID:'Shingles',        Item_Name:'Arch. Shingles 30yr',      Unit_Of_Measure:'SQ',  Current_Cost:95.00,  Starting_Cost:87.50,  Date_Modified:'4/1/26',   Is_Active:'TRUE' },
    { Item_ID:'PL-S11', PL_Cat_ID:'Roofing',              PL_Subcat_ID:'Underlayment',    Item_Name:'Synthetic Underlayment',   Unit_Of_Measure:'SQ',  Current_Cost:12.50,  Starting_Cost:11.00,                            Is_Active:'TRUE' },
    { Item_ID:'PL-S12', PL_Cat_ID:'Flooring',             PL_Subcat_ID:'LVP / LVT',       Item_Name:'LVP 6" Click Lock',        Unit_Of_Measure:'SF',  Current_Cost:2.85,   Starting_Cost:2.65,   Date_Modified:'3/5/26',   Is_Active:'TRUE' },
    { Item_ID:'PL-S13', PL_Cat_ID:'Flooring',             PL_Subcat_ID:'Tile',            Item_Name:'12x24 Porcelain Tile',     Unit_Of_Measure:'SF',  Current_Cost:4.10,   Starting_Cost:3.75,                            Is_Active:'TRUE' },
    { Item_ID:'PL-S14', PL_Cat_ID:'Paint & Coatings',     PL_Subcat_ID:'Interior Paint',  Item_Name:'Interior Latex Paint',     Unit_Of_Measure:'GAL', Current_Cost:38.00,  Starting_Cost:34.50,  Date_Modified:'4/14/26',  Is_Active:'TRUE' },
    { Item_ID:'PL-S15', PL_Cat_ID:'Paint & Coatings',     PL_Subcat_ID:'Primer',          Item_Name:'PVA Drywall Primer',       Unit_Of_Measure:'GAL', Current_Cost:22.00,  Starting_Cost:19.99,                            Is_Active:'TRUE' },
    { Item_ID:'PL-S16', PL_Cat_ID:'Fasteners & Hardware', PL_Subcat_ID:'Nails & Staples', Item_Name:'16d Framing Nails 50lb',   Unit_Of_Measure:'EA',  Current_Cost:42.00,  Starting_Cost:39.99,  Date_Modified:'1/5/26',   Is_Active:'TRUE' },
    { Item_ID:'PL-S17', PL_Cat_ID:'Fasteners & Hardware', PL_Subcat_ID:'Screws & Bolts',  Item_Name:'#8 x 1-5/8" Coarse 5lb',  Unit_Of_Measure:'EA',  Current_Cost:14.50,  Starting_Cost:13.00,                            Is_Active:'TRUE' },
    { Item_ID:'PL-S18', PL_Cat_ID:'Plumbing Materials',   PL_Subcat_ID:'Pipe & Fittings', Item_Name:'1/2" PEX-A Tubing',        Unit_Of_Measure:'LF',  Current_Cost:0.55,   Starting_Cost:0.48,   Date_Modified:'2/28/26',  Is_Active:'TRUE' },
    { Item_ID:'PL-S19', PL_Cat_ID:'Electrical Materials', PL_Subcat_ID:'Wire & Cable',    Item_Name:'12/2 Romex 250ft',         Unit_Of_Measure:'EA',  Current_Cost:78.00,  Starting_Cost:72.50,  Date_Modified:'3/5/26',   Is_Active:'TRUE' },
    { Item_ID:'PL-S20', PL_Cat_ID:'Adhesives & Sealants', PL_Subcat_ID:'Caulk',           Item_Name:'Paintable Latex Caulk',    Unit_Of_Measure:'EA',  Current_Cost:3.25,   Starting_Cost:2.99,                            Is_Active:'TRUE' },
    { Item_ID:'PL-S21', PL_Cat_ID:'Windows & Doors',      PL_Subcat_ID:'Windows',         Item_Name:'3050 DH Window',           Unit_Of_Measure:'EA',  Current_Cost:285.00, Starting_Cost:265.00, Date_Modified:'4/1/26',   Is_Active:'TRUE' },
    { Item_ID:'PL-S22', PL_Cat_ID:'Windows & Doors',      PL_Subcat_ID:'Exterior Doors',  Item_Name:'6-Panel Steel Entry Door', Unit_Of_Measure:'EA',  Current_Cost:320.00, Starting_Cost:298.00, Date_Modified:'4/1/26',   Is_Active:'TRUE' },
  ];

  function _plSeedData() {
    const tbl = AppData.tables['DB_Price_List'];
    if (!tbl || tbl.length > 0) return; // only seed if sheet is empty
    PL_SEED.forEach(row => tbl.push(row));
  }

  function _priceListHTML() {
    return `<div class="sp-widget pl-widget">
      <div class="sp-toolbar pl-toolbar">
        <button class="btn-secondary sp-btn pl-sidebar-edit-cat-btn" data-action="pl-edit-layout">Edit Categories</button>
        <button class="btn-secondary sp-btn sp-edit-ctrl" data-action="pl-edit-done">&#9664; Done</button>
        <button class="btn-secondary sp-btn sp-edit-ctrl" data-action="pl-edit-expand-all">Expand All</button>
        <button class="btn-primary sp-btn sp-edit-ctrl" data-action="pl-add-cat">+ Category</button>
        <button class="btn-secondary sp-btn sp-normal-ctrl" data-action="pl-expand-all">Expand All</button>
        <input class="pl-search sp-normal-ctrl" type="text" placeholder="Search items..." autocomplete="off">
        <button class="btn-secondary sp-btn sp-btn-icon pl-undo-btn sp-normal-ctrl" data-action="pl-undo" disabled title="Undo">&#8617;</button>
        <button class="btn-secondary sp-btn sp-btn-icon pl-redo-btn sp-normal-ctrl" data-action="pl-redo" disabled title="Redo">&#8618;</button>
        <button class="btn-secondary sp-btn sp-btn-icon sp-normal-ctrl" data-action="pl-print" title="Print">&#9113;</button>
        <button class="btn-secondary sp-btn sp-btn-icon sp-normal-ctrl" data-action="pl-refresh" title="Refresh">&#8635;</button>
      </div>
      <div class="sp-body">
        <div class="sp-nav pl-sidebar">
          <div class="pl-sidebar-hdr">
            <span class="pl-sidebar-hdr-title">Categories</span>
          </div>
          <div class="pl-sidebar-nav">
            <div class="pl-cat-list"></div>
          </div>
        </div>
        <div class="sp-divider pl-panel-divider"></div>
        <div class="sp-main pl-main">
          <div class="pl-list-view">
          <div class="pl-ctx-menu" style="display:none">
            <div class="pl-ctx-item" data-action="ctx-new">New Item Above</div>
            <div class="pl-ctx-item" data-action="ctx-edit">Edit Item</div>
            <div class="pl-ctx-sep"></div>
            <div class="pl-ctx-item" data-action="ctx-archive">Archive</div>
            <div class="pl-ctx-item pl-ctx-danger" data-action="ctx-delete">Delete</div>
          </div>
          <div class="pl-edit-tree"></div>
          <div class="pl-col-headers sp-normal-ctrl">
            <span class="pl-drag-cell"></span>
            <div class="pl-col pl-col-hdr pl-col-name"><span class="pl-hdr-label">Item Name</span><span class="pl-col-handle" data-col="name"></span></div>
            <div class="pl-col pl-col-hdr pl-col-uom"><span class="pl-hdr-label">U/M</span><span class="pl-col-handle" data-col="uom"></span></div>
            <div class="pl-col pl-col-hdr pl-col-cost"><span class="pl-hdr-label">Current Cost</span><span class="pl-col-handle" data-col="cost"></span></div>
            <div class="pl-col pl-col-hdr pl-col-datemod"><span class="pl-hdr-label">Date Modified</span><span class="pl-col-handle" data-col="datemod"></span></div>
            <div class="pl-col pl-col-hdr pl-col-start"><span class="pl-hdr-label">Starting Cost</span><span class="pl-col-handle" data-col="start"></span></div>
            <div class="pl-col pl-col-hdr pl-col-delta"><span class="pl-hdr-label">Δ %</span><span class="pl-col-handle" data-col="delta"></span></div>
            <div class="pl-col pl-col-hdr pl-col-master" title="Linked to master price">🔗</div>
          </div>
          <div class="pl-list-wrap sp-normal-ctrl">
            <div class="pl-list"></div>
          </div>
          <div class="widget-footer">
          </div>
        </div>
        </div>
      </div>
    </div>`;
  }

  function _plRender(listEl, items, searchText, showInactive) {
    const q = searchText.toLowerCase();
    let pool = items;
    if (!showInactive) pool = pool.filter(r => r.isActive);

    // Build Category → Sub-Category → items hierarchy
    const catMap = new Map();
    pool.forEach(r => {
      if (!catMap.has(r.category)) catMap.set(r.category, new Map());
      const subMap = catMap.get(r.category);
      if (!subMap.has(r.subCategory)) subMap.set(r.subCategory, []);
      subMap.get(r.subCategory).push(r);
    });

    const sortedCats = [...catMap.keys()].sort();
    const parts = [];

    sortedCats.forEach(cat => {
      const subMap     = catMap.get(cat);
      const sortedSubs = [...subMap.keys()].sort();

      const subsWithItems = sortedSubs.map(sub => ({
        sub,
        items: subMap.get(sub)
          .filter(r => !q || r.itemName.toLowerCase().includes(q) || r.subCategory.toLowerCase().includes(q) || r.category.toLowerCase().includes(q))
          .sort((a, b) => (a.itemName || '').localeCompare(b.itemName || ''))
      })).filter(s => !q || s.items.length > 0);

      if (!subsWithItems.length) return;
      const totalItems = subsWithItems.reduce((n, s) => n + s.items.length, 0);

      const midCells = `<div class="pl-cell pl-col-uom"></div><div class="pl-cell pl-col-cost"></div><div class="pl-cell pl-col-datemod"></div><div class="pl-cell pl-col-start"></div><div class="pl-cell pl-col-delta"></div>`;

      parts.push(`<div class="cgrid-row cgrid-t1 pl-row pl-row-cat" data-cat="${cat}" data-expanded="false">
        <span class="pl-drag-cell"></span>
        <div class="pl-cell pl-col-name cgrid-col-name"><span class="cgrid-expand">&#9654;</span><span class="cgrid-cell-text">${cat || '—'}</span></div>
        ${midCells}
        <div class="pl-cell pl-col-master pl-hier-count">${subsWithItems.length} sub${subsWithItems.length !== 1 ? 's' : ''}, ${totalItems} item${totalItems !== 1 ? 's' : ''}</div>
      </div>`);

      subsWithItems.forEach(({ sub, items: subItems }) => {
        parts.push(`<div class="cgrid-row cgrid-t2 pl-row pl-row-sub" data-cat="${cat}" data-sub="${sub}" data-expanded="false" style="display:none">
          <span class="pl-drag-cell"></span>
          <div class="pl-cell pl-col-name cgrid-col-name"><span class="cgrid-expand">&#9654;</span><span class="cgrid-cell-text">${sub || '—'}</span></div>
          ${midCells}
          <div class="pl-cell pl-col-master pl-hier-count">${subItems.length} item${subItems.length !== 1 ? 's' : ''}</div>
        </div>`);

        subItems.forEach(r => {
          const inactive = !r.isActive ? ' pl-row-inactive' : '';
          const master   = r.masterId ? '<span title="Linked to master price">🔗</span>' : '';
          parts.push(`<div class="cgrid-row cgrid-t3 pl-row${inactive}" data-cat="${cat}" data-sub="${sub}" data-item-id="${r.itemId}" draggable="true" style="display:none">
            <span class="pl-drag-cell"><span class="pl-item-drag">&#8942;&#8942;</span></span>
            <div class="pl-cell pl-col-name pl-name-cell cgrid-col-name"><span class="cgrid-cell-text">${r.itemName || '—'}</span></div>
            <div class="pl-cell pl-col-uom">${r.uom || '—'}</div>
            <div class="pl-cell pl-col-cost pl-cost-cell" data-item-id="${r.itemId}" tabindex="0">${r.currentCost.toFixed(2)}</div>
            <div class="pl-cell pl-col-datemod">${_plFmtDate(r.dateModified)}</div>
            <div class="pl-cell pl-col-start">${r.startingCost ? r.startingCost.toFixed(2) : '—'}</div>
            <div class="pl-cell pl-col-delta">${_plDeltaHTML(r)}</div>
            <div class="pl-cell pl-col-master">${master}</div>
          </div>`);
        });
      });
    });

    listEl.innerHTML = parts.length ? parts.join('') : '<div class="pl-empty">No items found</div>';
  }

  function _plGetCatsAndSubs(currentItems) {
    const dbCats    = (AppData.tables['DB_Price_List_Categories']    || []).filter(r => r.PL_Cat_Name);
    const dbSubcats = (AppData.tables['DB_Price_List_Subcategories'] || []).filter(r => r.PL_Subcat_Name);
    if (dbCats.length) {
      return {
        cats:    dbCats.sort((a,b) => (+a.Sort_Weight||0) - (+b.Sort_Weight||0)),
        subcats: dbSubcats.sort((a,b) => (+a.Sort_Weight||0) - (+b.Sort_Weight||0)),
      };
    }
    // Fallback: derive from PL_CATEGORIES + item data
    const catNames = [...new Set([...Object.keys(PL_CATEGORIES), ...currentItems.map(i=>i.category).filter(Boolean)])].sort();
    const cats = catNames.map((name,i) => ({ PL_Cat_ID: name, PL_Cat_Name: name, Sort_Weight: i*10 }));
    const subSeen = new Map();
    catNames.forEach(cat => {
      (PL_CATEGORIES[cat]||[]).forEach(sub => {
        const key = cat+'||'+sub;
        if (!subSeen.has(key)) subSeen.set(key, { PL_Subcat_ID: sub, PL_Subcat_Name: sub, Sort_Weight: subSeen.size*10, PL_Cat_ID: cat });
      });
    });
    currentItems.forEach(i => {
      if (!i.category || !i.subCategory) return;
      const key = i.category+'||'+i.subCategory;
      if (!subSeen.has(key)) subSeen.set(key, { PL_Subcat_ID: i.subCategory, PL_Subcat_Name: i.subCategory, Sort_Weight: subSeen.size*10, PL_Cat_ID: i.category });
    });
    return { cats, subcats: [...subSeen.values()] };
  }

  function _bindPriceList(widgetId) {
    const el = document.getElementById('widget-' + widgetId);
    if (!el) return;

    const raw   = AppData.tables['DB_Price_List'] || [];
    let items   = raw.filter(r => r.Item_Name).map(_mapPriceRow);

    let searchText   = '';
    let showInactive = false;
    let searchTimer  = null;
    let pendingFocus = null; // { itemId, direction } — consumed after render()
    let ctxItemId    = null; // item id of the right-clicked row

    // ── Undo / Redo command stack ──────────────────────────────
    // Each entry: { itemId, field, oldVal, newVal }
    // TODO (full-stack): call _plPushUndo() inside any save function before
    // writing the new value; wire _plUndo/_plRedo to Sheets update calls.
    const undoStack = [];
    const redoStack = [];

    function _plUpdateUndoBtns() {
      el.querySelector('.pl-undo-btn').disabled = undoStack.length === 0;
      el.querySelector('.pl-redo-btn').disabled = redoStack.length === 0;
    }

    function _plPushUndo(record) {
      // record = { itemId, field, oldVal, newVal }
      undoStack.push(record);
      if (undoStack.length > 50) undoStack.shift(); // cap at 50 steps
      redoStack.length = 0; // clear redo on new action
      _plUpdateUndoBtns();
    }

    function _plUndo() {
      if (!undoStack.length) return;
      const record = undoStack.pop();
      redoStack.push(record);
      // TODO: restore record.oldVal to record.itemId[record.field] and persist
      _plUpdateUndoBtns();
    }

    function _plRedo() {
      if (!redoStack.length) return;
      const record = redoStack.pop();
      undoStack.push(record);
      // TODO: restore record.newVal to record.itemId[record.field] and persist
      _plUpdateUndoBtns();
    }

    const listEl    = el.querySelector('.pl-list');
    const listWrap  = el.querySelector('.pl-list-wrap');
    const catList   = el.querySelector('.pl-cat-list');
    const listView  = el.querySelector('.pl-list-view');
    const widgetEl  = el.querySelector('.pl-widget');
    const ctxMenu   = el.querySelector('.pl-ctx-menu');
    const treeEl    = el.querySelector('.pl-edit-tree');

    // Column widths — CSS custom properties on .pl-widget
    // Version-stamped: stale saved widths are discarded when PL_COL_VER changes
    const _savedWidths = JSON.parse(localStorage.getItem('pl_col_widths') || '{}');
    const colWidths = _savedWidths._v === PL_COL_VER
      ? { ...PL_COL_DEFAULTS, ..._savedWidths }
      : { ...PL_COL_DEFAULTS };
    function applyColWidths() {
      Object.entries(colWidths).forEach(([col, w]) => {
        if (col !== '_v') widgetEl.style.setProperty('--pl-col-' + col, w + 'px');
      });
    }
    applyColWidths();

    // Column resize drag
    el.querySelector('.pl-col-headers').addEventListener('mousedown', function (e) {
      const handle = e.target.closest('.pl-col-handle');
      if (!handle) return;
      e.preventDefault();
      e.stopPropagation();
      const colKey = handle.dataset.col;
      const startX = e.clientX;
      const startW = colWidths[colKey] || PL_COL_DEFAULTS[colKey] || 80;
      document.body.classList.add('is-dragging');
      function onMove(e) {
        colWidths[colKey] = Math.max(30, startW + e.clientX - startX);
        widgetEl.style.setProperty('--pl-col-' + colKey, colWidths[colKey] + 'px');
      }
      function onUp() {
        document.body.classList.remove('is-dragging');
        colWidths._v = PL_COL_VER;
        localStorage.setItem('pl_col_widths', JSON.stringify(colWidths));
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });

    // Populate category sidebar
    const cats = [...new Set(items.map(r => r.category).filter(Boolean))].sort();
    catList.innerHTML = cats.map(c =>
      `<button class="pl-nav-btn" data-cat="${c}">${c}</button>`
    ).join('');

    // ── Expand/collapse helpers for the main item list ──────────
    function _plToggleCatRow(catRow) {
      const expanded = catRow.dataset.expanded === 'true';
      const cat = catRow.dataset.cat;
      catRow.dataset.expanded = expanded ? 'false' : 'true';
      catRow.querySelector('.cgrid-expand').classList.toggle('is-open', !expanded);
      if (expanded) {
        listEl.querySelectorAll('.pl-row-sub').forEach(r => {
          if (r.dataset.cat !== cat) return;
          r.style.display = 'none';
          r.dataset.expanded = 'false';
          r.querySelector('.cgrid-expand').classList.remove('is-open');
        });
        listEl.querySelectorAll('.pl-row:not(.pl-row-cat):not(.pl-row-sub)').forEach(r => {
          if (r.dataset.cat === cat) r.style.display = 'none';
        });
      } else {
        listEl.querySelectorAll('.pl-row-sub').forEach(r => {
          if (r.dataset.cat === cat) r.style.display = '';
        });
      }
    }

    function _plToggleSubRow(subRow) {
      const expanded = subRow.dataset.expanded === 'true';
      const cat = subRow.dataset.cat;
      const sub = subRow.dataset.sub;
      subRow.dataset.expanded = expanded ? 'false' : 'true';
      subRow.querySelector('.cgrid-expand').classList.toggle('is-open', !expanded);
      listEl.querySelectorAll('.pl-row:not(.pl-row-cat):not(.pl-row-sub)').forEach(r => {
        if (r.dataset.cat === cat && r.dataset.sub === sub) r.style.display = expanded ? 'none' : '';
      });
    }

    function _plEnsureVisible(cell) {
      const itemRow = cell.closest('.pl-row');
      if (!itemRow) return;
      const cat = itemRow.dataset.cat;
      const sub = itemRow.dataset.sub;
      listEl.querySelectorAll('.pl-row-cat').forEach(r => {
        if (r.dataset.cat === cat && r.dataset.expanded !== 'true') _plToggleCatRow(r);
      });
      listEl.querySelectorAll('.pl-row-sub').forEach(r => {
        if (r.dataset.cat === cat && r.dataset.sub === sub && r.dataset.expanded !== 'true') _plToggleSubRow(r);
      });
    }

    function _getExpandState() {
      const cats = new Set(), subs = new Set();
      listEl.querySelectorAll('.pl-row-cat[data-expanded="true"]').forEach(r => cats.add(r.dataset.cat));
      listEl.querySelectorAll('.pl-row-sub[data-expanded="true"]').forEach(r => subs.add(r.dataset.cat + '||' + r.dataset.sub));
      return { cats, subs };
    }

    function _applyExpandState(state) {
      listEl.querySelectorAll('.pl-row-cat').forEach(catRow => {
        if (!state.cats.has(catRow.dataset.cat)) return;
        const cat = catRow.dataset.cat;
        catRow.dataset.expanded = 'true';
        catRow.querySelector('.cgrid-expand').classList.add('is-open');
        listEl.querySelectorAll('.pl-row-sub').forEach(subRow => {
          if (subRow.dataset.cat !== cat) return;
          subRow.style.display = '';
          if (!state.subs.has(cat + '||' + subRow.dataset.sub)) return;
          const sub = subRow.dataset.sub;
          subRow.dataset.expanded = 'true';
          subRow.querySelector('.cgrid-expand').classList.add('is-open');
          listEl.querySelectorAll('.pl-row:not(.pl-row-cat):not(.pl-row-sub)').forEach(r => {
            if (r.dataset.cat === cat && r.dataset.sub === sub) r.style.display = '';
          });
        });
      });
    }

    function render() {
      const shouldRestore = !searchText;
      const state = shouldRestore ? _getExpandState() : null;
      _plRender(listEl, items, searchText, showInactive);

      if (state) {
        _applyExpandState(state);
      } else if (searchText) {
        // Expand all cats/subs that have matching items
        listEl.querySelectorAll('.pl-row-cat').forEach(catRow => {
          catRow.dataset.expanded = 'true';
          catRow.querySelector('.cgrid-expand').classList.add('is-open');
          const cat = catRow.dataset.cat;
          listEl.querySelectorAll('.pl-row-sub').forEach(subRow => {
            if (subRow.dataset.cat !== cat) return;
            subRow.style.display = '';
            subRow.dataset.expanded = 'true';
            subRow.querySelector('.cgrid-expand').classList.add('is-open');
            const sub = subRow.dataset.sub;
            listEl.querySelectorAll('.pl-row:not(.pl-row-cat):not(.pl-row-sub)').forEach(r => {
              if (r.dataset.cat === cat && r.dataset.sub === sub) r.style.display = '';
            });
          });
        });
      }

      if (pendingFocus) {
        const { itemId, direction } = pendingFocus;
        pendingFocus = null;
        const allCost = [...listEl.querySelectorAll('.pl-cost-cell')];
        const idx  = allCost.findIndex(c => c.dataset.itemId === itemId);
        const target =
          direction === 'same' ? allCost[idx] :
          direction === 'next' ? allCost[idx + 1] :
          direction === 'prev' ? allCost[idx - 1] : null;
        if (target) { _plEnsureVisible(target); target.focus(); }
      }
    }

    function _refreshItems() {
      const stored = JSON.parse(localStorage.getItem('pl_price_items') || '[]');
      items = raw.filter(r => r.Item_Name).map(_mapPriceRow).map(item => {
        const edit = stored.find(s => s.itemId === item.itemId);
        return edit ? { ...item, ...edit } : item;
      });
      stored.filter(s => s._new).forEach(s => {
        if (!items.find(i => i.itemId === s.itemId)) items.push(s);
      });
    }

    function _saveCostToStorage(id, val) {
      const stored = JSON.parse(localStorage.getItem('pl_price_items') || '[]');
      const idx    = stored.findIndex(s => s.itemId === id);
      if (idx >= 0) stored[idx].currentCost = val;
      else          stored.push({ itemId: id, currentCost: val });
      localStorage.setItem('pl_price_items', JSON.stringify(stored));
      const item = items.find(i => i.itemId === id);
      if (item) item.currentCost = val;
      const tbl = AppData.tables['DB_Price_List'] || [];
      const row = tbl.find(r => r.Item_ID === id);
      if (row) row.Current_Cost = val;
    }

    function _activateCostCell(cell) {
      if (cell.querySelector('input')) return;
      const id  = cell.dataset.itemId;
      const cur = cell.textContent.trim();
      cell.innerHTML = `<input class="pl-cost-inp" type="number" min="0" step="0.01" value="${cur}">`;
      const inp = cell.querySelector('input');
      inp.focus();
      inp.select();
      let didNavigate = false;
      inp.addEventListener('keydown', function (ke) {
        if (ke.key === 'Escape') { didNavigate = true; render(); return; }
        const dir =
          (ke.key === 'ArrowUp'   || (ke.key === 'Tab' && ke.shiftKey)) ? 'prev' :
          (ke.key === 'ArrowDown' || ke.key === 'Enter' || ke.key === 'Tab') ? 'next' : null;
        if (dir) {
          ke.preventDefault();
          didNavigate = true;
          const val = parseFloat(inp.value);
          if (!isNaN(val)) _saveCostToStorage(id, val);
          pendingFocus = { itemId: id, direction: dir };
          render();
        }
      });
      inp.addEventListener('blur', function () {
        if (!didNavigate) {
          const val = parseFloat(inp.value);
          if (!isNaN(val)) _saveCostToStorage(id, val);
          render();
        }
      });
    }

    function _insertNewRow(refItemId) {
      const existing = listEl.querySelector('.pl-row-new');
      if (existing) existing.remove();
      const refRowEl = refItemId ? listEl.querySelector(`[data-item-id="${refItemId}"]`) : null;
      const cat      = refRowEl ? (refRowEl.dataset.cat || '') : '';
      const subcat   = refRowEl ? (refRowEl.dataset.sub || '') : '';
      const uomOpts  = PL_UOM.map(u => `<option>${u}</option>`).join('');
      const rowEl    = document.createElement('div');
      rowEl.className = 'cgrid-row cgrid-t3 pl-row pl-row-new';
      if (cat)    rowEl.dataset.cat = cat;
      if (subcat) rowEl.dataset.sub = subcat;
      rowEl.innerHTML = `
        <div class="pl-cell pl-col-name">
          <input class="pl-grid-inp" data-col="name" value="" placeholder="Item name" autocomplete="off">
        </div>
        <div class="pl-cell pl-col-uom">
          <select class="pl-grid-sel" data-col="uom"><option value="">—</option>${uomOpts}</select>
        </div>
        <div class="pl-cell pl-col-cost">
          <input class="pl-grid-inp pl-grid-num" data-col="cost" type="number" min="0" step="0.01" placeholder="0.00">
        </div>
        <div class="pl-cell pl-col-datemod">—</div>
        <div class="pl-cell pl-col-start">—</div>
        <div class="pl-cell pl-col-delta">—</div>
        <div class="pl-cell pl-col-master"></div>`;
      if (refRowEl) listEl.insertBefore(rowEl, refRowEl);
      else          listEl.appendChild(rowEl);
      rowEl.querySelector('[data-col="name"]').focus();
      let newRowSaved = false;
      function _saveNewRow() {
        if (newRowSaved) return;
        newRowSaved = true;
        const get  = col => rowEl.querySelector(`[data-col="${col}"]`);
        const name = get('name').value.trim();
        if (!name) { rowEl.remove(); return; }
        const pfData = {
          itemId:       'PL-' + Date.now(),
          category:     cat,
          subCategory:  subcat,
          itemName:     name,
          uom:          get('uom').value,
          currentCost:  parseFloat(get('cost').value) || 0,
          startingCost: 0,
          masterId:     '',
          isActive:     true,
          _new:         true,
        };
        const stored = JSON.parse(localStorage.getItem('pl_price_items') || '[]');
        stored.push(pfData);
        localStorage.setItem('pl_price_items', JSON.stringify(stored));
        const tbl = AppData.tables['DB_Price_List'] || [];
        tbl.push({ Item_ID: pfData.itemId, PL_Cat_ID: pfData.category, PL_Subcat_ID: pfData.subCategory,
          Item_Name: pfData.itemName, Unit_Of_Measure: pfData.uom, Current_Cost: pfData.currentCost,
          Starting_Cost: 0, Is_Active: 'TRUE' });
        pendingFocus = { itemId: pfData.itemId, direction: 'same' };
        _refreshItems();
        render();
      }
      const costInp = rowEl.querySelector('[data-col="cost"]');
      rowEl.addEventListener('keydown', function (ke) {
        if (ke.key === 'Escape') { ke.stopPropagation(); rowEl.remove(); }
        if (ke.key === 'Enter')  { ke.stopPropagation(); _saveNewRow(); }
        if (ke.key === 'Tab' && ke.target === costInp && !ke.shiftKey) { ke.preventDefault(); _saveNewRow(); }
      });
      rowEl.addEventListener('focusout', function () {
        setTimeout(() => { if (!rowEl.contains(document.activeElement)) _saveNewRow(); }, 150);
      });
    }

    _refreshItems();
    render();

    // Re-render when Edit Price Item widget saves
    document.addEventListener('pl-item-saved', function _onPlItemSaved() {
      _refreshItems();
      render();
    });

    // ── Edit Layout Mode ─────────────────────────────────────
    const plTipEl = document.createElement('div');
    plTipEl.className = 'cb-tip';
    document.body.appendChild(plTipEl);
    let plTipTimer = null, plTipTarget = null, plTipX = 0, plTipY = 0;
    function _plShowTip() {
      if (!plTipTarget) return;
      plTipEl.textContent   = plTipTarget.dataset.tip;
      plTipEl.style.display = 'block';
      plTipEl.style.left    = (plTipX + 12) + 'px';
      plTipEl.style.top     = (plTipY - plTipEl.offsetHeight - 8) + 'px';
    }
    function _plHideTip() {
      clearTimeout(plTipTimer); plTipTimer = null; plTipTarget = null;
      plTipEl.style.display = 'none';
    }
    treeEl.addEventListener('mousemove', function (e) {
      plTipX = e.clientX; plTipY = e.clientY;
      const t = e.target.closest('[data-tip]');
      if (!t) { _plHideTip(); return; }
      if (plTipEl.style.display === 'block') {
        plTipEl.style.left = (plTipX + 12) + 'px';
        plTipEl.style.top  = (plTipY - plTipEl.offsetHeight - 8) + 'px';
      }
      if (t === plTipTarget) return;
      clearTimeout(plTipTimer);
      plTipEl.style.display = 'none';
      plTipTarget = t;
      plTipTimer = setTimeout(_plShowTip, 500);
    });
    treeEl.addEventListener('mouseleave', _plHideTip);

    function _plBuildTree() {
      const { cats, subcats } = _plGetCatsAndSubs(items);
      treeEl.innerHTML = cats.map(cat => {
        const subs      = subcats.filter(s => s.PL_Cat_ID === cat.PL_Cat_ID);
        const itemCount = items.filter(i => i.category === cat.PL_Cat_Name).length;
        const subHTML   = subs.map(sub => {
          const subItemCount = items.filter(i => i.category === cat.PL_Cat_Name && i.subCategory === sub.PL_Subcat_Name).length;
          return `<div class="pl-er-row pl-er-sub" data-cat-id="${cat.PL_Cat_ID}" data-sub-id="${sub.PL_Subcat_ID}" draggable="true" style="display:none">
            <span class="pl-er-drag" data-tip="Drag to reorder">&#8942;&#8942;</span>
            <button class="pl-er-del" data-tip="Delete Sub-Category">&#10005;</button>
            <span class="pl-er-name" data-tip="Double-click to rename">${sub.PL_Subcat_Name}</span>
            <span class="pl-er-count">${subItemCount} item${subItemCount !== 1 ? 's' : ''}</span>
          </div>`;
        }).join('');
        return `<div class="pl-er-row pl-er-cat" data-cat-id="${cat.PL_Cat_ID}" data-expanded="false" draggable="true">
          <span class="pl-er-drag" data-tip="Drag to reorder">&#8942;&#8942;</span>
          <button class="pl-er-del" data-tip="Delete Category">&#10005;</button>
          <button class="pl-er-add-sub btn-secondary" data-tip="Add Sub-Category">+ Sub</button>
          <span class="pl-er-exp">&#9654;</span>
          <span class="pl-er-name" data-tip="Double-click to rename">${cat.PL_Cat_Name}</span>
          <span class="pl-er-count">${subs.length} sub${subs.length !== 1 ? 's' : ''}, ${itemCount} item${itemCount !== 1 ? 's' : ''}</span>
        </div>${subHTML}`;
      }).join('');
    }


    function _plEnterEditMode() {
      widgetEl.classList.add('pl-edit-mode');
      _plBuildTree();
      const btn = el.querySelector('[data-action="pl-edit-expand-all"]');
      if (btn) btn.textContent = 'Expand All';
    }

    function _plExitEditMode() {
      _plHideTip();
      widgetEl.classList.remove('pl-edit-mode');
      // Rebuild sidebar from current tree cat names
      const catRows = [...treeEl.querySelectorAll('.pl-er-cat')];
      catList.innerHTML = catRows.map(r => {
        const name = r.querySelector('.pl-er-name').textContent.trim();
        return `<button class="pl-nav-btn" data-cat="${name}">${name}</button>`;
      }).join('');
      treeEl.innerHTML = '';
    }

    function _plStartRename(nameEl) {
      const prev = nameEl.textContent.trim();
      nameEl.contentEditable = 'true';
      nameEl.focus();
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(nameEl);
      sel.removeAllRanges();
      sel.addRange(range);
      function finish(save) {
        nameEl.contentEditable = 'false';
        const val = nameEl.textContent.trim();
        if (!save || !val) nameEl.textContent = prev;
      }
      nameEl.addEventListener('blur', () => finish(true), { once: true });
      nameEl.addEventListener('keydown', function onKey(e) {
        if (e.key === 'Enter')  { e.preventDefault(); nameEl.blur(); nameEl.removeEventListener('keydown', onKey); }
        if (e.key === 'Escape') { finish(false); nameEl.removeEventListener('keydown', onKey); }
      });
    }

    function _plToggleCat(catRow) {
      const expanded = catRow.dataset.expanded === 'true';
      const catId    = catRow.dataset.catId;
      catRow.dataset.expanded = expanded ? 'false' : 'true';
      catRow.querySelector('.pl-er-exp').classList.toggle('is-open', !expanded);
      treeEl.querySelectorAll(`.pl-er-sub[data-cat-id="${catId}"]`).forEach(r => {
        r.style.display = expanded ? 'none' : '';
      });
    }

    function _plAddCat() {
      const catId  = 'new-' + Date.now();
      const catRow = document.createElement('div');
      catRow.className        = 'pl-er-row pl-er-cat';
      catRow.dataset.catId    = catId;
      catRow.dataset.expanded = 'true';
      catRow.setAttribute('draggable', 'true');
      catRow.innerHTML = `
        <span class="pl-er-drag" data-tip="Drag to reorder">&#8942;&#8942;</span>
        <button class="pl-er-del" data-tip="Delete Category">&#10005;</button>
        <button class="pl-er-add-sub btn-secondary" data-tip="Add Sub-Category">+ Sub</button>
        <span class="pl-er-exp is-open">&#9654;</span>
        <span class="pl-er-name" data-tip="Double-click to rename">New Category</span>
        <span class="pl-er-count">0 subs, 0 items</span>`;
      treeEl.appendChild(catRow);
      _plStartRename(catRow.querySelector('.pl-er-name'));
    }

    function _plAddSub(catRow) {
      const catId  = catRow.dataset.catId;
      const subId  = 'new-' + Date.now();
      const subRow = document.createElement('div');
      subRow.className     = 'pl-er-row pl-er-sub';
      subRow.dataset.catId = catId;
      subRow.dataset.subId = subId;
      subRow.setAttribute('draggable', 'true');
      subRow.innerHTML = `
        <span class="pl-er-drag" data-tip="Drag to reorder">&#8942;&#8942;</span>
        <button class="pl-er-del" data-tip="Delete Sub-Category">&#10005;</button>
        <span class="pl-er-name" data-tip="Double-click to rename">New Sub-Category</span>
        <span class="pl-er-count">0 items</span>`;
      const subs   = [...treeEl.querySelectorAll(`.pl-er-sub[data-cat-id="${catId}"]`)];
      const anchor = subs.length ? subs[subs.length - 1] : catRow;
      anchor.after(subRow);
      if (catRow.dataset.expanded !== 'true') _plToggleCat(catRow);
      _plStartRename(subRow.querySelector('.pl-er-name'));
    }

    function _plDeleteCat(catRow) {
      const catId     = catRow.dataset.catId;
      const name      = catRow.querySelector('.pl-er-name').textContent.trim();
      const subCount  = treeEl.querySelectorAll(`.pl-er-sub[data-cat-id="${catId}"]`).length;
      const itemCount = items.filter(i => i.category === name).length;
      let msg = `Delete category "${name}"?`;
      if (subCount || itemCount) {
        msg += `\n\nThis contains ${subCount} sub-categor${subCount !== 1 ? 'ies' : 'y'}`;
        if (itemCount) msg += ` and ${itemCount} item${itemCount !== 1 ? 's' : ''}`;
        msg += '.';
      }
      if (!confirm(msg)) return;
      treeEl.querySelectorAll(`.pl-er-sub[data-cat-id="${catId}"]`).forEach(r => r.remove());
      catRow.remove();
    }

    function _plDeleteSub(subRow) {
      const catId  = subRow.dataset.catId;
      const catRow = treeEl.querySelector(`.pl-er-cat[data-cat-id="${catId}"]`);
      const catName = catRow ? catRow.querySelector('.pl-er-name').textContent.trim() : '';
      const name    = subRow.querySelector('.pl-er-name').textContent.trim();
      const itemCount = items.filter(i => i.category === catName && i.subCategory === name).length;
      let msg = `Delete sub-category "${name}"?`;
      if (itemCount) msg += `\n\nThis contains ${itemCount} item${itemCount !== 1 ? 's' : ''}.`;
      if (!confirm(msg)) return;
      subRow.remove();
    }

    // ── Edit tree: click (expand/del/add-sub) + dblclick (rename) ──
    treeEl.addEventListener('click', function (e) {
      const delBtn    = e.target.closest('.pl-er-del');
      const addSubBtn = e.target.closest('.pl-er-add-sub');
      const catRow    = e.target.closest('.pl-er-cat');
      const subRow    = e.target.closest('.pl-er-sub');
      if (delBtn) {
        e.stopPropagation();
        if (catRow) _plDeleteCat(catRow);
        else if (subRow) _plDeleteSub(subRow);
        return;
      }
      if (addSubBtn) {
        e.stopPropagation();
        if (catRow) _plAddSub(catRow);
        return;
      }
      if (catRow && !e.target.closest('.pl-er-del, .pl-er-add-sub')) {
        _plToggleCat(catRow);
      }
    });

    treeEl.addEventListener('dblclick', function (e) {
      const nameEl = e.target.closest('.pl-er-name');
      if (nameEl) { e.stopPropagation(); _plStartRename(nameEl); }
    });

    // ── Edit tree: drag-to-reorder ──
    let plDragRow = null, plDragCatId = null;
    treeEl.addEventListener('dragstart', function (e) {
      const row = e.target.closest('.pl-er-row');
      if (!row) return;
      plDragRow   = row;
      plDragCatId = row.dataset.catId;
      row.classList.add('pl-er-dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    treeEl.addEventListener('dragend', function () {
      if (plDragRow) plDragRow.classList.remove('pl-er-dragging');
      treeEl.querySelectorAll('.pl-er-drag-over').forEach(r => r.classList.remove('pl-er-drag-over'));
      plDragRow = null; plDragCatId = null;
    });
    treeEl.addEventListener('dragover', function (e) {
      if (!plDragRow) return;
      e.preventDefault();
      const target    = e.target.closest('.pl-er-row');
      if (!target || target === plDragRow) return;
      const isCatDrag = plDragRow.classList.contains('pl-er-cat');
      const isSubDrag = plDragRow.classList.contains('pl-er-sub');
      if (isCatDrag && !target.classList.contains('pl-er-cat')) return;
      if (isSubDrag && (!target.classList.contains('pl-er-sub') || target.dataset.catId !== plDragCatId)) return;
      treeEl.querySelectorAll('.pl-er-drag-over').forEach(r => r.classList.remove('pl-er-drag-over'));
      target.classList.add('pl-er-drag-over');
    });
    treeEl.addEventListener('drop', function (e) {
      e.preventDefault();
      const target = e.target.closest('.pl-er-row');
      treeEl.querySelectorAll('.pl-er-drag-over').forEach(r => r.classList.remove('pl-er-drag-over'));
      if (!plDragRow || !target || target === plDragRow) return;
      const isCatDrag = plDragRow.classList.contains('pl-er-cat');
      const isSubDrag = plDragRow.classList.contains('pl-er-sub');
      if (isCatDrag && !target.classList.contains('pl-er-cat')) return;
      if (isSubDrag && (!target.classList.contains('pl-er-sub') || target.dataset.catId !== plDragCatId)) return;
      if (isCatDrag) {
        // Move cat + all its subs together
        const catId = plDragRow.dataset.catId;
        const subs  = [...treeEl.querySelectorAll(`.pl-er-sub[data-cat-id="${catId}"]`)];
        target.after(plDragRow);
        subs.reverse().forEach(s => plDragRow.after(s));
      } else {
        target.after(plDragRow);
      }
    });

    // ── Sidebar category nav (scroll-to, no filter) ──
    el.querySelector('.pl-sidebar').addEventListener('click', function (e) {
      const btn = e.target.closest('.pl-nav-btn');
      if (!btn) return;
      const cat    = btn.dataset.cat;
      const catRow = listEl.querySelector(`.pl-row-cat[data-cat="${cat}"]`);
      if (!catRow) return;
      if (catRow.dataset.expanded !== 'true') _plToggleCatRow(catRow);
      listWrap.scrollTop = catRow.offsetTop - listWrap.offsetTop;
    });

    // ── Show inactive toggle (main list — no longer in toolbar; kept for safety) ──
    const showInactiveCb = el.querySelector('.pl-show-inactive');
    if (showInactiveCb) showInactiveCb.addEventListener('change', function () {
      showInactive = this.checked;
      render();
    });

    // ── Search ──
    el.querySelector('.pl-search').addEventListener('input', function () {
      clearTimeout(searchTimer);
      const val = this.value;
      searchTimer = setTimeout(() => { searchText = val; render(); }, 200);
    });

    // ── Cost cell: focus via Tab activates it ──
    listEl.addEventListener('focusin', function (e) {
      const cell = e.target.closest('.pl-cost-cell');
      if (cell) _activateCostCell(cell);
    });

    // ── Row clicks: expand/collapse cat/sub; name cell opens Edit form ──
    listEl.addEventListener('click', function (e) {
      if (e.target.closest('.pl-cost-cell')) return; // handled by focusin
      const catRow = e.target.closest('.pl-row-cat');
      if (catRow) { _plToggleCatRow(catRow); return; }
      const subRow = e.target.closest('.pl-row-sub');
      if (subRow) { _plToggleSubRow(subRow); return; }
    });

    listEl.addEventListener('dblclick', function (e) {
      const nameCell = e.target.closest('.pl-name-cell');
      if (!nameCell) return;
      const id = nameCell.closest('.pl-row')?.dataset.itemId;
      if (id) openEditPriceItem(id, undefined, widgetId);
    });

    // ── Main list drag-to-reorder within same sub-category ──
    let plMainDragEl = null;
    listEl.addEventListener('dragstart', function (e) {
      const row = e.target.closest('.pl-row:not(.pl-row-cat):not(.pl-row-sub)');
      if (!row || e.target.matches('input')) { e.preventDefault(); return; }
      plMainDragEl = row;
      row.classList.add('cb-row-dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    listEl.addEventListener('dragover', function (e) {
      if (!plMainDragEl) return;
      const target = e.target.closest('.pl-row:not(.pl-row-cat):not(.pl-row-sub)');
      if (!target || target === plMainDragEl) return;
      if (target.dataset.cat !== plMainDragEl.dataset.cat || target.dataset.sub !== plMainDragEl.dataset.sub) return;
      e.preventDefault();
      listEl.querySelectorAll('.cb-drop-before, .cb-drop-after').forEach(r => r.classList.remove('cb-drop-before', 'cb-drop-after'));
      const mid = target.getBoundingClientRect().top + target.getBoundingClientRect().height / 2;
      target.classList.add(e.clientY < mid ? 'cb-drop-before' : 'cb-drop-after');
    });
    listEl.addEventListener('dragleave', function (e) {
      if (!listEl.contains(e.relatedTarget))
        listEl.querySelectorAll('.cb-drop-before, .cb-drop-after').forEach(r => r.classList.remove('cb-drop-before', 'cb-drop-after'));
    });
    listEl.addEventListener('drop', function (e) {
      e.preventDefault();
      if (!plMainDragEl) return;
      const target = e.target.closest('.pl-row:not(.pl-row-cat):not(.pl-row-sub)');
      listEl.querySelectorAll('.cb-drop-before, .cb-drop-after').forEach(r => r.classList.remove('cb-drop-before', 'cb-drop-after'));
      if (!target || target === plMainDragEl) { plMainDragEl.classList.remove('cb-row-dragging'); plMainDragEl = null; return; }
      const after = e.clientY > target.getBoundingClientRect().top + target.getBoundingClientRect().height / 2;
      if (after) target.after(plMainDragEl);
      else       target.before(plMainDragEl);
      plMainDragEl.classList.remove('cb-row-dragging');
      plMainDragEl = null;
    });
    listEl.addEventListener('dragend', function () {
      if (plMainDragEl) { plMainDragEl.classList.remove('cb-row-dragging'); plMainDragEl = null; }
      listEl.querySelectorAll('.cb-drop-before, .cb-drop-after').forEach(r => r.classList.remove('cb-drop-before', 'cb-drop-after'));
    });

    // ── Right-click context menu ──
    listEl.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      const row = e.target.closest('.pl-row:not(.pl-row-new):not(.pl-row-cat):not(.pl-row-sub)');
      if (!row) return;
      ctxItemId = row.dataset.itemId;
      const item = items.find(i => i.itemId === ctxItemId);
      const archEl = ctxMenu.querySelector('[data-action="ctx-archive"]');
      if (archEl) archEl.textContent = (item && !item.isActive) ? 'Restore' : 'Archive';
      ctxMenu.style.left    = e.clientX + 'px';
      ctxMenu.style.top     = e.clientY + 'px';
      ctxMenu.style.display = 'block';
    });

    document.addEventListener('mousedown', function (e) {
      if (!ctxMenu.contains(e.target)) ctxMenu.style.display = 'none';
    });

    ctxMenu.addEventListener('click', function (e) {
      const action = e.target.closest('[data-action]')?.dataset.action;
      ctxMenu.style.display = 'none';
      if (!action || !ctxItemId) return;
      const item = items.find(i => i.itemId === ctxItemId);
      if (action === 'ctx-new') {
        _insertNewRow(ctxItemId);
      } else if (action === 'ctx-edit') {
        if (item) openEditPriceItem(item.itemId, undefined, widgetId);
      } else if (action === 'ctx-archive') {
        if (!item) return;
        item.isActive = !item.isActive;
        const stored = JSON.parse(localStorage.getItem('pl_price_items') || '[]');
        const idx = stored.findIndex(s => s.itemId === item.itemId);
        if (idx >= 0) stored[idx].isActive = item.isActive;
        else          stored.push({ itemId: item.itemId, isActive: item.isActive });
        localStorage.setItem('pl_price_items', JSON.stringify(stored));
        render();
      } else if (action === 'ctx-delete') {
        if (!item || !confirm(`Delete "${item.itemName}"?`)) return;
        const stored = JSON.parse(localStorage.getItem('pl_price_items') || '[]');
        localStorage.setItem('pl_price_items', JSON.stringify(stored.filter(s => s.itemId !== item.itemId)));
        AppData.tables['DB_Price_List'] = (AppData.tables['DB_Price_List'] || []).filter(r => r.Item_ID !== item.itemId);
        _refreshItems();
        render();
      }
    });

    // ── Panel divider drag ──
    SplitPanel.bindDivider(el.querySelector('.pl-panel-divider'), {
      navEl: el.querySelector('.pl-sidebar'),
      min: 100, max: 240,
    });

    // ── Close / Form Save & Cancel ──
    el.addEventListener('click', function (e) {
      // Refresh
      if (e.target.closest('[data-action="pl-refresh"]')) {
        const btn = e.target.closest('[data-action]');
        btn.disabled = true;
        AppData.refresh(['DB_Price_List', 'DB_Price_List_Categories', 'DB_Price_List_Subcategories']).then(() => {
          const raw = AppData.tables['DB_Price_List'] || [];
          items = raw.filter(r => r.Item_Name).map(_mapPriceRow);
          render();
          btn.disabled = false;
        }).catch(() => { btn.disabled = false; });
        return;
      }
      // Undo / Redo
      if (e.target.closest('[data-action="pl-undo"]')) { _plUndo(); return; }
      if (e.target.closest('[data-action="pl-redo"]')) { _plRedo(); return; }
      // Expand All / Collapse All (main list)
      if (e.target.closest('[data-action="pl-expand-all"]')) {
        const btn  = e.target.closest('[data-action]');
        const expanding = btn.textContent.trim() === 'Expand All';
        listEl.querySelectorAll('.pl-row-cat').forEach(catRow => {
          if (expanding && catRow.dataset.expanded !== 'true') _plToggleCatRow(catRow);
          if (!expanding && catRow.dataset.expanded === 'true') _plToggleCatRow(catRow);
        });
        if (expanding) {
          listEl.querySelectorAll('.pl-row-sub').forEach(subRow => {
            if (subRow.dataset.expanded !== 'true') _plToggleSubRow(subRow);
          });
        }
        btn.textContent = expanding ? 'Collapse All' : 'Expand All';
        return;
      }
      // Edit Layout Mode toolbar actions
      if (e.target.closest('[data-action="pl-edit-layout"]'))     { _plEnterEditMode(); return; }
      if (e.target.closest('[data-action="pl-edit-done"]'))       { _plExitEditMode(); return; }
      if (e.target.closest('[data-action="pl-add-cat"]'))         { _plAddCat(); return; }
      if (e.target.closest('[data-action="pl-edit-expand-all"]')) {
        const btn     = e.target.closest('[data-action]');
        const allCats = [...treeEl.querySelectorAll('.pl-er-cat')];
        const expand  = allCats.some(r => r.dataset.expanded !== 'true');
        allCats.forEach(r => {
          if (expand  && r.dataset.expanded !== 'true') _plToggleCat(r);
          if (!expand && r.dataset.expanded === 'true')  _plToggleCat(r);
        });
        btn.textContent = expand ? 'Collapse All' : 'Expand All';
        return;
      }

    });
  }

  function _buildFormFields(item, allItems) {
    const v       = item || {};
    const cats    = _plCatOptions(allItems);
    const subs    = _plSubOptions(v.category || '', allItems);
    const masters = allItems.filter(r => !r.masterId && r.itemId !== v.itemId);

    const catDatalist = cats.map(c => `<option value="${c}">`).join('');
    const subDatalist = subs.map(s => `<option value="${s}">`).join('');
    const uomOpts     = PL_UOM.map(u => `<option${u === v.uom ? ' selected' : ''}>${u}</option>`).join('');
    const masterOpts  = masters.map(m =>
      `<option value="${m.itemId}"${m.itemId === v.masterId ? ' selected' : ''}>${m.itemName} (${m.category})</option>`
    ).join('');

    return `
      <div class="form-row">
        <div class="form-group f-grow">
          <label class="form-label">Category</label>
          <input class="form-input" data-pf="category" list="pf-cat-opts" value="${v.category || ''}" placeholder="Select or type new...">
          <datalist id="pf-cat-opts">${catDatalist}</datalist>
        </div>
        <div class="form-group f-grow">
          <label class="form-label">Sub-Category</label>
          <input class="form-input" data-pf="sub-category" list="pf-sub-opts" value="${v.subCategory || ''}" placeholder="Select or type new...">
          <datalist id="pf-sub-opts">${subDatalist}</datalist>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group f-grow">
          <label class="form-label">Item Name</label>
          <input class="form-input" data-pf="name" value="${v.itemName || ''}" placeholder="e.g. 2x4x8 Stud">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group" style="flex:0 0 80px">
          <label class="form-label">U/M</label>
          <select class="form-select" data-pf="uom">
            <option value="">—</option>${uomOpts}
          </select>
        </div>
        <div class="form-group f-grow">
          <label class="form-label">Current Cost</label>
          <input class="form-input" data-pf="current-cost" type="number" min="0" step="0.01" value="${v.currentCost || ''}">
        </div>
        <div class="form-group f-grow">
          <label class="form-label">Starting Cost</label>
          <input class="form-input" data-pf="starting-cost" type="number" min="0" step="0.01" value="${v.startingCost || ''}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group f-grow">
          <label class="form-label">Master Price (optional)</label>
          <select class="form-select" data-pf="master-id">
            <option value="">— None (standalone) —</option>
            ${masterOpts}
          </select>
        </div>
      </div>
      `;
  }

  /* ── Edit Price Item Widget ──────────────────────────────── */

  function _plEditItemHTML(item, allItems) {
    const isNew = !item;
    return `<div class="sp-widget plei-widget">
      <div class="sp-toolbar plei-toolbar">
        <button class="btn-secondary sp-btn" data-action="plei-add">Add New</button>
        <button class="btn-primary sp-btn" data-action="plei-save-new">Save &amp; New</button>
        <button class="btn-secondary sp-btn sp-btn-icon" data-action="plei-copy"${isNew ? ' disabled' : ''} title="Copy item">&#10697;</button>
        <button class="btn-secondary sp-btn sp-btn-icon plei-prev-btn" data-action="plei-prev" title="Previous item">&#8249;</button>
        <button class="btn-secondary sp-btn sp-btn-icon plei-next-btn" data-action="plei-next" title="Next item">&#8250;</button>
        <label class="eci-archive-label">
          Archive <input type="checkbox" data-pf="archive"${item && !item.isActive ? ' checked' : ''}>
        </label>
        <button class="btn-secondary sp-btn" data-action="plei-delete"${isNew ? ' disabled' : ''} style="margin-left:auto">Delete</button>
      </div>
      <div class="plei-body">
        ${_buildFormFields(item, allItems)}
      </div>
      <div class="plei-footer">
        <button class="btn-secondary sp-btn" data-action="plei-cancel">Cancel</button>
        <button class="btn-primary sp-btn" data-action="plei-save">Save &amp; Close</button>
      </div>
    </div>`;
  }

  function openEditPriceItem(itemId, templateItem, parentWidgetId) {
    const raw      = AppData.tables['DB_Price_List'] || [];
    const allItems = raw.filter(r => r.Item_Name).map(_mapPriceRow);
    const item     = templateItem || (itemId ? allItems.find(i => i.itemId === itemId) || null : null);
    const id       = 'edit-price-item';
    const title    = (item && !templateItem) ? 'Edit Price Item' : 'New Price Item';
    if (WidgetManager.open(id, title, _plEditItemHTML(item, allItems), {
      width: 480, height: 390, minWidth: 380, minHeight: 320, category: 'estimating',
      centeredOn: parentWidgetId,
    }) !== false) {
      _bindEditPriceItem(id, item, templateItem ? null : itemId, allItems);
    }
  }

  function _bindEditPriceItem(widgetId, initialItem, itemId, allItems) {
    const el = document.getElementById('widget-' + widgetId);
    if (!el) return;

    let editing = initialItem;
    const bodyEl = el.querySelector('.plei-body');

    function _rebuildForm(item) {
      editing = item;
      bodyEl.innerHTML = _buildFormFields(item, allItems);
      const catInp  = bodyEl.querySelector('[data-pf="category"]');
      const subList = bodyEl.querySelector('#pf-sub-opts');
      if (catInp && subList) {
        catInp.addEventListener('input', function () {
          subList.innerHTML = _plSubOptions(this.value.trim(), allItems).map(s => `<option value="${s}">`).join('');
        });
      }
    }

    function _readForm() {
      const f = name => bodyEl.querySelector(`[data-pf="${name}"]`);
      return {
        itemId:       editing?.itemId || ('PL-' + Date.now()),
        itemName:     f('name').value.trim(),
        category:     f('category').value.trim(),
        subCategory:  f('sub-category').value.trim(),
        uom:          f('uom').value.trim(),
        currentCost:  parseFloat(f('current-cost').value) || 0,
        startingCost: parseFloat(f('starting-cost').value) || 0,
        masterId:     f('master-id').value,
        isActive:     !(el.querySelector('[data-pf="archive"]')?.checked ?? false),
        _new:         !editing,
      };
    }

    function _persist(pfData) {
      const stored = JSON.parse(localStorage.getItem('pl_price_items') || '[]');
      const idx    = stored.findIndex(s => s.itemId === pfData.itemId);
      if (idx >= 0) stored[idx] = { ...stored[idx], ...pfData };
      else          stored.push(pfData);
      localStorage.setItem('pl_price_items', JSON.stringify(stored));
      const tbl    = AppData.tables['DB_Price_List'] || [];
      const ri     = tbl.findIndex(r => r.Item_ID === pfData.itemId);
      const merged = {
        Item_ID: pfData.itemId, PL_Cat_ID: pfData.category, PL_Subcat_ID: pfData.subCategory,
        Item_Name: pfData.itemName, Unit_Of_Measure: pfData.uom, Current_Cost: pfData.currentCost,
        Starting_Cost: pfData.startingCost, Master_Price_ID: pfData.masterId,
        Is_Active: pfData.isActive ? 'TRUE' : 'FALSE',
      };
      if (ri >= 0) tbl[ri] = merged;
      else         tbl.push(merged);
      AppData.tables['DB_Price_List'] = tbl;
      document.dispatchEvent(new CustomEvent('pl-item-saved'));
    }

    function _navigate(dir) {
      const all = (AppData.tables['DB_Price_List'] || []).filter(r => r.Item_Name).map(_mapPriceRow);
      if (!editing || !all.length) return;
      const idx  = all.findIndex(i => i.itemId === editing.itemId);
      const next = dir === 'next' ? all[idx + 1] : all[idx - 1];
      if (!next) return;
      WidgetManager.close(widgetId);
      openEditPriceItem(next.itemId, undefined, 'price-list');
    }

    el.querySelector('.plei-toolbar').addEventListener('click', function (e) {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (!action) return;
      if (action === 'plei-cancel') { WidgetManager.close(widgetId); return; }
      if (action === 'plei-save') {
        const pfData = _readForm();
        if (!pfData.itemName) return;
        _persist(pfData);
        WidgetManager.close(widgetId);
        return;
      }
      if (action === 'plei-save-new') {
        const pfData = _readForm();
        if (!pfData.itemName) return;
        _persist(pfData);
        WidgetManager.close(widgetId);
        openEditPriceItem(null, undefined, 'price-list');
        return;
      }
      if (action === 'plei-add') {
        WidgetManager.close(widgetId);
        openEditPriceItem(null, undefined, 'price-list');
        return;
      }
      if (action === 'plei-copy') {
        if (!editing) return;
        const copy = { ...editing, itemId: null };
        WidgetManager.close(widgetId);
        openEditPriceItem(null, copy, 'price-list');
        return;
      }
      if (action === 'plei-delete') {
        if (!editing) return;
        if (!confirm(`Delete "${editing.itemName}"?`)) return;
        const stored = JSON.parse(localStorage.getItem('pl_price_items') || '[]');
        localStorage.setItem('pl_price_items', JSON.stringify(stored.filter(s => s.itemId !== editing.itemId)));
        const tbl = AppData.tables['DB_Price_List'] || [];
        AppData.tables['DB_Price_List'] = tbl.filter(r => r.Item_ID !== editing.itemId);
        document.dispatchEvent(new CustomEvent('pl-item-saved'));
        WidgetManager.close(widgetId);
        return;
      }
      if (action === 'plei-prev') { _navigate('prev'); return; }
      if (action === 'plei-next') { _navigate('next'); return; }
    });

    _rebuildForm(editing);
  }

  async function openPriceList() {
    await AppData.ready;
    _plSeedData();
    const id = 'price-list';
    if (WidgetManager.open(id, 'Price List', _priceListHTML(), {
      width: 830, height: 480, minWidth: 600, minHeight: 360, category: 'estimating',
    }) !== false) _bindPriceList(id);
  }

  /* ── Open-estimate registry (multi-instance support) ─────── */
  const _openEstimates = new Map(); // widgetId → est object

  function _getOpenEstimates() {
    for (const [id] of _openEstimates)
      if (!WidgetManager.isOpen(id)) _openEstimates.delete(id);
    return [..._openEstimates.entries()].map(([id, est]) => ({ id, est }));
  }

  function _notifyCostbookTagState() {
    (window._cbTagListeners || []).forEach(fn => fn());
  }

  /* ── Estimate List Mock Data ─────────────────────────────── */

  const _EST_LIST_MOCK = [
    { estimateId: 'E001', clientName: 'John & Mary Smith',   estimateName: 'Kitchen & Bath Remodel 2026', address: '1824 Millbrook Dr, Nashville',  status: 'Active',   totalPrice: 9918.68, dateStarted: '2026-01-15', dateModified: '2026-04-18', costbook: 'Contractor Advantage 2026', notes: 'Client wants to stay under $50K. Phase 2 pending bid from plumber.' },
    { estimateId: 'E002', clientName: 'Robert Johnson',       estimateName: 'Master Bath Addition',        address: '456 Elm Ave, Franklin',          status: 'Draft',    totalPrice: 24500,   dateStarted: '2026-03-01', dateModified: '2026-04-10', costbook: 'My Costbook 2026',           notes: 'Waiting on structural engineer report before finalizing scope.' },
    { estimateId: 'E003', clientName: 'Patricia & Tom Ward',  estimateName: 'Deck & Screened Porch',       address: '892 Crestview Ln, Brentwood',    status: 'Active',   totalPrice: 31200,   dateStarted: '2026-02-20', dateModified: '2026-03-28', costbook: 'Contractor Advantage 2026', notes: '' },
    { estimateId: 'E004', clientName: 'David Chen',           estimateName: 'Basement Finishing',          address: '3301 Highland Ave, Nashville',   status: 'Draft',    totalPrice: 0,       dateStarted: '2026-04-05', dateModified: '2026-04-19', costbook: 'My Costbook 2026',           notes: 'Initial consultation done. Need to discuss egress window options.' },
    { estimateId: 'E005', clientName: 'Susan & Mark Torres',  estimateName: 'Full Kitchen Remodel',        address: '711 Maple St, Hendersonville',   status: 'Archived', totalPrice: 67400,   dateStarted: '2025-08-10', dateModified: '2025-11-22', costbook: 'Contractor Advantage 2025', notes: 'Client decided not to proceed. Keep for reference.' },
  ];

  /* ── Estimate Widget ─────────────────────────────────────── */

  const _EST_MOCK = {
    estimateId:   'E001',
    clientName:   'John & Mary Smith',
    estimateName: 'Kitchen & Bath Remodel 2026',
    status:       'Draft',
    phases: [
      { phaseId: 'P1',    type: 'Phase',        name: 'Kitchen Renovation',   parentId: null, isSelected: true,  sortOrder: 10, markupOverride: false, markupLabor: null, markupMaterial: null, markupSub: null, markupEquipment: null, markupOther: null },
      { phaseId: 'P1-OA', type: 'Sub-Phase',    name: 'Standard Cabinets',    parentId: 'P1', isSelected: true,  sortOrder: 15, markupOverride: false, markupLabor: null, markupMaterial: null, markupSub: null, markupEquipment: null, markupOther: null },
      { phaseId: 'P1-OB', type: 'Sub-Phase',    name: 'Custom Cabinets',      parentId: 'P1', isSelected: false, sortOrder: 20, markupOverride: false, markupLabor: null, markupMaterial: null, markupSub: null, markupEquipment: null, markupOther: null },
      { phaseId: 'P2',    type: 'Phase',        name: 'Bathroom Renovation',  parentId: null, isSelected: true,  sortOrder: 30, markupOverride: false, markupLabor: null, markupMaterial: null, markupSub: null, markupEquipment: null, markupOther: null },
      { phaseId: 'CO1',   type: 'Change Order', name: 'Additional Tile Work', parentId: null, isSelected: true,  sortOrder: 40, markupOverride: false, markupLabor: null, markupMaterial: null, markupSub: null, markupEquipment: null, markupOther: null },
    ],
    items: [
      { itemId:'EI001', phaseId:'P1',    divNum:'04', divName:'Demolition & Cleanup',    subNum:'020', subName:'Demolition',      description:'Selective Demolition',             qty:8,   uom:'HR', labor:65,   material:0,    sub:0, equipment:0, other:0,    laborMkp:35, materialMkp:20, subMkp:15, equipMkp:20, otherMkp:20, clientView:true,  sortWeight:10 },
      { itemId:'EI002', phaseId:'P1',    divNum:'30', divName:'Drywall & Plaster',       subNum:'010', subName:'Drywall',          description:'1/2" Drywall Hung & Finished',     qty:220, uom:'SF', labor:1.85, material:0.65, sub:0, equipment:0, other:0,    laborMkp:35, materialMkp:20, subMkp:15, equipMkp:20, otherMkp:20, clientView:true,  sortWeight:10 },
      { itemId:'EI003', phaseId:'P1-OA', divNum:'34', divName:'Cabinets & Countertops',  subNum:'010', subName:'Cabinets',         description:'Semi-Custom Cabinet Installation', qty:1,   uom:'LS', labor:850,  material:2200, sub:0, equipment:0, other:0,    laborMkp:35, materialMkp:20, subMkp:15, equipMkp:20, otherMkp:20, clientView:true,  sortWeight:10 },
      { itemId:'EI004', phaseId:'P1-OA', divNum:'34', divName:'Cabinets & Countertops',  subNum:'020', subName:'Countertops',      description:'Quartz Countertop Installation',   qty:28,  uom:'SF', labor:12,   material:68,   sub:0, equipment:0, other:0,    laborMkp:35, materialMkp:20, subMkp:15, equipMkp:20, otherMkp:20, clientView:true,  sortWeight:10 },
      { itemId:'EI005', phaseId:'P1-OB', divNum:'34', divName:'Cabinets & Countertops',  subNum:'010', subName:'Cabinets',         description:'Custom Cabinet Installation',       qty:1,   uom:'LS', labor:1400, material:4800, sub:0, equipment:0, other:0,    laborMkp:35, materialMkp:20, subMkp:15, equipMkp:20, otherMkp:20, clientView:true,  sortWeight:10 },
      { itemId:'EI006', phaseId:'P1-OB', divNum:'34', divName:'Cabinets & Countertops',  subNum:'020', subName:'Countertops',      description:'Granite Countertop Installation',  qty:28,  uom:'SF', labor:14,   material:95,   sub:0, equipment:0, other:0,    laborMkp:35, materialMkp:20, subMkp:15, equipMkp:20, otherMkp:20, clientView:true,  sortWeight:10 },
      { itemId:'EI007', phaseId:'P2',    divNum:'32', divName:'Plumbing',                subNum:'010', subName:'Rough Plumbing',   description:'Install Shower Drain',             qty:1,   uom:'EA', labor:95,   material:45,   sub:0, equipment:0, other:0,    laborMkp:35, materialMkp:20, subMkp:15, equipMkp:20, otherMkp:20, clientView:true,  sortWeight:10 },
      { itemId:'EI008', phaseId:'P2',    divNum:'32', divName:'Plumbing',                subNum:'010', subName:'Rough Plumbing',   description:'Install Supply Lines (Hot & Cold)',qty:2,   uom:'EA', labor:65,   material:28,   sub:0, equipment:0, other:0,    laborMkp:35, materialMkp:20, subMkp:15, equipMkp:20, otherMkp:20, clientView:true,  sortWeight:20 },
      { itemId:'EI009', phaseId:'P2',    divNum:'42', divName:'Tile Work',               subNum:'010', subName:'Floor Tile',       description:'12×24 Porcelain Floor Tile',       qty:65,  uom:'SF', labor:5.5,  material:3.8,  sub:0, equipment:0, other:0,    laborMkp:35, materialMkp:20, subMkp:15, equipMkp:20, otherMkp:20, clientView:true,  sortWeight:10 },
      { itemId:'EI010', phaseId:'P2',    divNum:'42', divName:'Tile Work',               subNum:'010', subName:'Floor Tile',       description:'Tile Setting Materials',           qty:65,  uom:'SF', labor:0,    material:1.25, sub:0, equipment:0, other:0,    laborMkp:35, materialMkp:20, subMkp:15, equipMkp:20, otherMkp:20, clientView:false, sortWeight:20 },
      { itemId:'EI011', phaseId:'CO1',   divNum:'42', divName:'Tile Work',               subNum:'020', subName:'Wall Tile',        description:'4×12 Subway Tile — Shower Surround',qty:45,uom:'SF', labor:7,    material:4.5,  sub:0, equipment:0, other:0,    laborMkp:35, materialMkp:20, subMkp:15, equipMkp:20, otherMkp:20, clientView:true,  sortWeight:10 },
    ],
  };

  /* ── Estimate math helpers ────────────────────────────── */
  function _estUnitCost(item) {
    return item.labor + item.material + item.sub + item.equipment + item.other;
  }
  function _estUnitPrice(item) {
    return item.labor     * (1 + (item.laborMkp    || 0) / 100)
         + item.material  * (1 + (item.materialMkp || 0) / 100)
         + item.sub       * (1 + (item.subMkp      || 0) / 100)
         + item.equipment * (1 + (item.equipMkp    || 0) / 100)
         + item.other     * (1 + (item.otherMkp    || 0) / 100);
  }
  function _estItemTotal(item) { return _estUnitCost(item)  * (item.qty || 0); }
  function _estItemPrice(item) { return _estUnitPrice(item) * (item.qty || 0); }

  function _efmt(n, alwaysShow) {
    if (!alwaysShow && n === 0) return '—';
    return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  /* ── Estimate grid column definitions ────────────────── */
  const EST_GRID_COLS = [
    { key: 'desc',     label: 'Description', width: 220, minWidth: 80,  align: 'left',   sticky: true  },
    { key: 'qty',      label: 'Qty',          width:  54, minWidth: 30,  align: 'right'  },
    { key: 'uom',      label: 'U/M',          width:  44, minWidth: 30,  align: 'center' },
    { key: 'labor',    label: 'Labor',        width:  68, minWidth: 40,  align: 'right'  },
    { key: 'mat',      label: 'Material',     width:  68, minWidth: 40,  align: 'right'  },
    { key: 'sub',      label: 'Sub',          width:  68, minWidth: 40,  align: 'right'  },
    { key: 'equip',    label: 'Equip.',        width:  68, minWidth: 40,  align: 'right'  },
    { key: 'other',    label: 'Other',        width:  68, minWidth: 40,  align: 'right'  },
    { key: 'ucost',    label: 'Unit Cost',    width:  76, minWidth: 40,  align: 'right'  },
    { key: 'utotal',   label: 'Unit Total',   width:  76, minWidth: 40,  align: 'right'  },
    { key: 'subtotal', label: 'Sub Total',    width:  82, minWidth: 40,  align: 'right'  },
    { key: 'cv',       label: 'Client View',  width:  52, minWidth: 30,  align: 'center', hideable: true },
    { key: 'lmkp',    label: 'Labor Mkp%',   width:  62, minWidth: 40,  align: 'right',  hideable: true },
    { key: 'mmkp',    label: 'Mat Mkp%',     width:  62, minWidth: 40,  align: 'right',  hideable: true },
    { key: 'smkp',    label: 'Sub Mkp%',     width:  62, minWidth: 40,  align: 'right',  hideable: true },
    { key: 'emkp',    label: 'Equip Mkp%',   width:  62, minWidth: 40,  align: 'right',  hideable: true },
    { key: 'omkp',    label: 'Other Mkp%',   width:  62, minWidth: 40,  align: 'right',  hideable: true, resize: false },
  ];

  /* ── Estimate HTML builder ────────────────────────────── */
  function _estHTML(est) {
    /* Group items: phaseId → divNum → { divName, subs: subNum → { subName, items[] } } */
    const grouped = new Map();
    est.items.forEach(item => {
      if (!grouped.has(item.phaseId)) grouped.set(item.phaseId, new Map());
      const byDiv = grouped.get(item.phaseId);
      if (!byDiv.has(item.divNum)) byDiv.set(item.divNum, { divName: item.divName, subs: new Map() });
      const divEntry = byDiv.get(item.divNum);
      if (!divEntry.subs.has(item.subNum)) divEntry.subs.set(item.subNum, { subName: item.subName, items: [] });
      divEntry.subs.get(item.subNum).items.push(item);
    });

    /* 9 empty cells for non-desc rollup columns */
    function _emptyCols() {
      return `<span class="cgrid-cell est-col-qty"></span><span class="cgrid-cell est-col-uom"></span>
              <span class="cgrid-cell est-col-labor"></span><span class="cgrid-cell est-col-mat"></span>
              <span class="cgrid-cell est-col-sub"></span><span class="cgrid-cell est-col-equip"></span>
              <span class="cgrid-cell est-col-other"></span><span class="cgrid-cell est-col-ucost"></span>
              <span class="cgrid-cell est-col-utotal"></span>`;
    }

    /* Build tab panel */
    let tabsHTML = '';
    est.phases.forEach(phase => {
      const offCls  = phase.isSelected ? '' : ' is-off';
      const typeCls = phase.type === 'Sub-Phase' ? ' est-subtab' : phase.type === 'Change Order' ? ' est-co-tab' : '';
      const chk     = phase.isSelected ? '' : ' checked';
      tabsHTML += `<div class="est-tab${typeCls}${offCls}" data-phase-id="${phase.phaseId}">` +
                  `<input type="checkbox" class="est-tab-chk"${chk} title="Check to deactivate">` +
                  `<span class="est-tab-name">${phase.name}</span></div>`;
    });
    tabsHTML += '<div class="est-tab-hint">Check to activate · Dbl-click to rename</div>';

    /* Build grid rows */
    let rowsHTML = '';
    est.phases.forEach(phase => {
      const phaseItems = est.items.filter(i => i.phaseId === phase.phaseId);
      const pCost  = phaseItems.reduce((s, i) => s + _estItemTotal(i), 0);
      const pPrice = phaseItems.reduce((s, i) => s + _estItemPrice(i), 0);
      const offCls = phase.isSelected ? '' : ' is-off';
      const typeKey = phase.type === 'Change Order' ? 'co' : phase.type === 'Option' ? 'option' : 'phase';
      const badge = `<span class="est-phase-badge est-badge-${typeKey}">${phase.type}</span>`;

      rowsHTML += `
        <div class="cgrid-row est-phase-hdr${offCls}" id="est-sec-${phase.phaseId}" data-phase-id="${phase.phaseId}" data-expanded="true">
          <span class="cgrid-cell est-col-desc cgrid-col-name"><span class="cgrid-expand is-open">&#9654;</span><span class="cgrid-cell-text">${badge}${phase.name}</span></span>
          ${_emptyCols()}
          <span class="cgrid-cell est-col-subtotal est-subtotal-cell" data-cost="${pCost}" data-price="${pPrice}">${_efmt(pCost,true)}</span>
          <span class="cgrid-cell est-col-cv"></span>
          <span class="cgrid-cell est-col-lmkp"></span><span class="cgrid-cell est-col-mmkp"></span><span class="cgrid-cell est-col-smkp"></span>
          <span class="cgrid-cell est-col-emkp"></span><span class="cgrid-cell est-col-omkp"></span>
        </div>`;

      const phaseGrouped = grouped.get(phase.phaseId) || new Map();
      phaseGrouped.forEach((divEntry, divNum) => {
        let dCost = 0, dPrice = 0;
        divEntry.subs.forEach(s => s.items.forEach(i => { dCost += _estItemTotal(i); dPrice += _estItemPrice(i); }));

        rowsHTML += `
          <div class="cgrid-row cgrid-t1 est-div-hdr" data-phase-id="${phase.phaseId}" data-div="${divNum}" data-expanded="true">
            <span class="cgrid-cell est-col-desc cgrid-col-name"><span class="cgrid-expand is-open">&#9654;</span><span class="cgrid-cell-text">${divEntry.divName}</span></span>
            ${_emptyCols()}
            <span class="cgrid-cell est-col-subtotal est-subtotal-cell" data-cost="${dCost}" data-price="${dPrice}">${_efmt(dCost,true)}</span>
            <span class="cgrid-cell est-col-cv"></span>
            <span class="cgrid-cell est-col-lmkp"></span><span class="cgrid-cell est-col-mmkp"></span><span class="cgrid-cell est-col-smkp"></span>
            <span class="cgrid-cell est-col-emkp"></span><span class="cgrid-cell est-col-omkp"></span>
          </div>`;

        divEntry.subs.forEach((subEntry, subNum) => {
          let sCost = 0, sPrice = 0;
          subEntry.items.forEach(i => { sCost += _estItemTotal(i); sPrice += _estItemPrice(i); });

          rowsHTML += `
            <div class="cgrid-row cgrid-t2 est-sub-hdr" data-phase-id="${phase.phaseId}" data-div="${divNum}" data-sub="${subNum}" data-expanded="true">
              <span class="cgrid-cell est-col-desc cgrid-col-name"><span class="cgrid-expand is-open">&#9654;</span><span class="cgrid-cell-text">${subEntry.subName}</span></span>
              ${_emptyCols()}
              <span class="cgrid-cell est-col-subtotal est-subtotal-cell" data-cost="${sCost}" data-price="${sPrice}">${_efmt(sCost,true)}</span>
              <span class="cgrid-cell est-col-cv"></span>
              <span class="cgrid-cell est-col-lmkp"></span><span class="cgrid-cell est-col-mmkp"></span><span class="cgrid-cell est-col-smkp"></span>
              <span class="cgrid-cell est-col-emkp"></span><span class="cgrid-cell est-col-omkp"></span>
            </div>`;

          subEntry.items.forEach(item => {
            const uc = _estUnitCost(item);
            const up = _estUnitPrice(item);
            const ut = uc * (item.qty || 0);
            const utp = up * (item.qty || 0);
            const lp  = item.labor     * (1 + (item.laborMkp    || 0) / 100);
            const mp  = item.material  * (1 + (item.materialMkp || 0) / 100);
            const sp  = item.sub       * (1 + (item.subMkp      || 0) / 100);
            const ep  = item.equipment * (1 + (item.equipMkp    || 0) / 100);
            const op  = item.other     * (1 + (item.otherMkp    || 0) / 100);
            const cvHide = item.clientView ? '' : ' est-cv-hidden';

            rowsHTML += `
              <div class="cgrid-row cgrid-t3 est-item-row${cvHide}" data-phase-id="${phase.phaseId}" data-div="${divNum}" data-sub="${subNum}" data-item="${item.itemId}" data-cv="${item.clientView?'1':'0'}">
                <span class="cgrid-cell est-col-desc cgrid-col-name"><span class="cgrid-cell-text">${item.description}</span></span>
                <span class="cgrid-cell est-col-qty"><input type="number" class="est-inp" value="${item.qty}" min="0" step="0.01"></span>
                <span class="cgrid-cell est-col-uom">${item.uom}</span>
                <span class="cgrid-cell est-col-labor  est-cost-cell" data-cost="${item.labor}"     data-price="${lp}">${_efmt(item.labor,false)}</span>
                <span class="cgrid-cell est-col-mat    est-cost-cell" data-cost="${item.material}"  data-price="${mp}">${_efmt(item.material,false)}</span>
                <span class="cgrid-cell est-col-sub    est-cost-cell" data-cost="${item.sub}"       data-price="${sp}">${_efmt(item.sub,false)}</span>
                <span class="cgrid-cell est-col-equip  est-cost-cell" data-cost="${item.equipment}" data-price="${ep}">${_efmt(item.equipment,false)}</span>
                <span class="cgrid-cell est-col-other  est-cost-cell" data-cost="${item.other}"     data-price="${op}">${_efmt(item.other,false)}</span>
                <span class="cgrid-cell est-col-ucost  est-cost-cell" data-cost="${uc}"             data-price="${up}">${_efmt(uc,true)}</span>
                <span class="cgrid-cell est-col-utotal est-cost-cell est-subtotal-cell" data-cost="${ut}" data-price="${utp}">${_efmt(ut,true)}</span>
                <span class="cgrid-cell est-col-subtotal"></span>
                <span class="cgrid-cell est-col-cv"><input type="checkbox" class="est-cv-cb"${item.clientView?' checked':''}></span>
                <span class="cgrid-cell est-col-lmkp"><input type="number" class="est-inp" value="${item.laborMkp}"    min="0" step="0.1"></span>
                <span class="cgrid-cell est-col-mmkp"><input type="number" class="est-inp" value="${item.materialMkp}" min="0" step="0.1"></span>
                <span class="cgrid-cell est-col-smkp"><input type="number" class="est-inp" value="${item.subMkp}"      min="0" step="0.1"></span>
                <span class="cgrid-cell est-col-emkp"><input type="number" class="est-inp" value="${item.equipMkp}"    min="0" step="0.1"></span>
                <span class="cgrid-cell est-col-omkp"><input type="number" class="est-inp" value="${item.otherMkp}"    min="0" step="0.1"></span>
              </div>`;
          });
        });
      });
    });

    /* Grand totals (selected phases only) */
    const selIds = new Set(est.phases
      .filter(p => {
        if (!p.isSelected) return false;
        if (p.type === 'Option' && p.parentId) {
          const parent = est.phases.find(x => x.phaseId === p.parentId);
          if (parent && !parent.isSelected) return false;
        }
        return true;
      }).map(p => p.phaseId));
    const activeItems = est.items.filter(i => selIds.has(i.phaseId));
    const gCost  = activeItems.reduce((s, i) => s + _estItemTotal(i), 0);
    const gPrice = activeItems.reduce((s, i) => s + _estItemPrice(i), 0);

    return `<div class="sp-widget est-widget">
      <div class="sp-toolbar est-toolbar">
        <button class="btn-secondary sp-btn" data-action="est-setup">Estimate Settings</button>
        <button class="btn-secondary sp-btn" data-action="est-costbook">Costbook</button>
        <button class="btn-secondary sp-btn est-collapse-btn">Collapse All</button>
        <label class="est-show-sub-lbl" title="Show Sub-Divisions in estimate grid">
          <input type="checkbox" data-action="est-show-sub"> Hide Sub-Divs
        </label>
        <button class="btn-secondary sp-btn sp-btn-icon est-undo-btn" data-action="est-undo" disabled title="Undo">&#8617;</button>
        <button class="btn-secondary sp-btn sp-btn-icon est-redo-btn" data-action="est-redo" disabled title="Redo">&#8618;</button>
        <button class="btn-secondary sp-btn sp-btn-icon" data-action="est-print" title="Print">&#9113;</button>
        <button class="btn-secondary sp-btn sp-btn-icon" data-action="est-refresh" title="Refresh">&#8635;</button>
        <div class="est-toolbar-spacer"></div>
        <div class="est-overflow-wrap">
          <button class="btn-secondary sp-btn sp-btn-icon est-overflow-btn" title="More actions">&#8943;</button>
          <div class="est-overflow-menu" style="display:none">
            <button class="est-overflow-item" data-action="est-duplicate">Duplicate Estimate</button>
            <button class="est-overflow-item" data-action="est-save-template">Save Estimate as Template</button>
          </div>
        </div>
        <div class="est-total-box est-total-cost-box">
          <span class="est-total-label">Total Cost</span>
          <span class="est-total-value est-grand-cost">${_efmt(gCost,true)}</span>
        </div>
        <div class="est-total-box">
          <span class="est-total-label">Total Price</span>
          <span class="est-total-value est-grand-price">${_efmt(gPrice,true)}</span>
        </div>
        <label class="est-cm-wrap">
          <input type="checkbox" class="est-cm-toggle"> Client View
        </label>
      </div>
      <div class="sp-body est-body">
        <div class="sp-nav est-tab-panel">
          <div class="est-tab-hdr">Estimate Phases</div>
          <div class="est-tab-scroll">${tabsHTML}</div>
        </div>
        <div class="sp-divider est-panel-divider"></div>
        <div class="sp-main est-grid-wrap">
          <div class="est-grid">
            ${CostGrid.headerHTML(CostGrid.config('est', EST_GRID_COLS))}
            <div class="est-rows">${rowsHTML}</div>
          </div>
        </div>
      </div>
    </div>`;
  }

  /* ── Tab context menu ────────────────────────────────── */
  function _showTabContextMenu(x, y, phaseId, phase, isOff) {
    document.querySelector('.est-tab-ctx')?.remove();
    const menu = document.createElement('div');
    menu.className = 'est-tab-ctx sp-ctx-menu';
    const items = [
      { label: 'Add Phase',                               action: 'add-phase'    },
      { label: 'Add Sub-Phase',                           action: 'add-subphase' },
      { label: 'Add Change Order',                        action: 'add-co'       },
      { sep: true },
      { label: isOff ? 'Set Active'    : 'Set Inactive', action: 'toggle'  },
      { label: 'Rename',                                  action: 'rename'  },
      { sep: true },
      { label: 'Delete',                                  action: 'delete', cls: 'danger' },
    ];
    items.forEach(it => {
      if (it.sep) { const s = document.createElement('hr'); s.className = 'sp-ctx-sep'; menu.append(s); return; }
      const btn = document.createElement('button');
      btn.className = 'sp-ctx-item' + (it.cls ? ' ' + it.cls : '');
      btn.textContent = it.label;
      btn.dataset.action = it.action;
      btn.dataset.phaseId = phaseId;
      menu.append(btn);
    });
    menu.style.cssText = `position:fixed;left:${x}px;top:${y}px;z-index:9999`;
    document.body.append(menu);
    function _close() { menu.remove(); document.removeEventListener('mousedown', _close, true); }
    document.addEventListener('mousedown', _close, true);
    menu.addEventListener('mousedown', ev => ev.stopPropagation());
    menu.addEventListener('click', ev => {
      const btn = ev.target.closest('[data-action]');
      if (!btn) return;
      _close();
      const action = btn.dataset.action;
      const tab    = document.querySelector(`.est-tab[data-phase-id="${phaseId}"]`);
      if (action === 'toggle' && tab) {
        const chk = tab.querySelector('.est-tab-chk');
        if (chk) { chk.checked = !chk.checked; chk.dispatchEvent(new Event('change', { bubbles: true })); }
      } else if (action === 'rename' && tab) {
        tab.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      } else if (action === 'delete') {
        if (confirm(`Delete "${phase?.name || phaseId}"?`)) {
          const idx = _EST_MOCK.phases.findIndex(p => p.phaseId === phaseId);
          if (idx >= 0) _EST_MOCK.phases.splice(idx, 1);
          tab?.remove();
        }
      } else if (action === 'add-phase' || action === 'add-subphase' || action === 'add-co') {
        alert('Add phase: wired in full-stack build.');
      }
    });
  }

  /* ── Estimate bind ────────────────────────────────────── */
  function _bindEstimate(wid, est) {
    const el     = document.getElementById('widget-' + wid);
    if (!el) return;
    const widget = el.querySelector('.est-widget');
    const tabs   = el.querySelector('.est-tab-panel');
    const rowsEl = el.querySelector('.est-rows');
    const gridEl = el.querySelector('.est-grid');

    /* Inject client + estimate names into the widget title bar */
    const widgetHeader = el.querySelector('.widget-header');
    if (widgetHeader) {
      const namesSpan = document.createElement('span');
      namesSpan.className = 'est-wh-names';
      namesSpan.textContent = `${est.clientName}  —  ${est.estimateName}`;
      widgetHeader.insertBefore(namesSpan, widgetHeader.querySelector('.widget-controls'));
    }

    /* Mutable on/off state per phaseId */
    const selState = new Map(est.phases.map(p => [p.phaseId, p.isSelected]));

    /* Expand state keys: 'p:P1', 'd:P1:04', 's:P1:04:010' */
    const expState = new Map();
    est.phases.forEach(p => expState.set(`p:${p.phaseId}`, true));
    est.items.forEach(item => {
      expState.set(`d:${item.phaseId}:${item.divNum}`, true);
      expState.set(`s:${item.phaseId}:${item.divNum}:${item.subNum}`, true);
    });

    function _phaseOn(phaseId) {
      if (!selState.get(phaseId)) return false;
      const phase = est.phases.find(p => p.phaseId === phaseId);
      if (phase && phase.type === 'Option' && phase.parentId) {
        if (!selState.get(phase.parentId)) return false;
      }
      return true;
    }

    function _applyVis() {
      rowsEl.querySelectorAll('.cgrid-row').forEach(row => {
        const pid = row.dataset.phaseId;
        const div = row.dataset.div;
        const sub = row.dataset.sub;

        if (row.classList.contains('est-phase-hdr')) {
          row.classList.toggle('is-off', !selState.get(pid));
          return;
        }
        /* Phase off or collapsed → hide everything below */
        if (!_phaseOn(pid) || !expState.get(`p:${pid}`)) {
          row.classList.add('est-row-hidden'); return;
        }
        if (row.classList.contains('est-div-hdr')) {
          row.classList.remove('est-row-hidden'); return;
        }
        /* Division collapsed → hide sub-divisions and items */
        if (!expState.get(`d:${pid}:${div}`)) {
          row.classList.add('est-row-hidden'); return;
        }
        if (row.classList.contains('est-sub-hdr')) {
          row.classList.remove('est-row-hidden'); return;
        }
        /* Sub-division collapsed → hide items */
        if (!expState.get(`s:${pid}:${div}:${sub}`)) {
          row.classList.add('est-row-hidden'); return;
        }
        row.classList.remove('est-row-hidden');
      });
    }

    function _togglePhase(phaseId) {
      const phase = est.phases.find(p => p.phaseId === phaseId);
      if (!phase) return;
      const newVal = !selState.get(phaseId);
      selState.set(phaseId, newVal);
      const tab = tabs.querySelector(`[data-phase-id="${phaseId}"]`);
      tab?.classList.toggle('is-off', !newVal);
      const chk = tab?.querySelector('.est-tab-chk');
      if (chk) chk.checked = !newVal;
      /* Turning a Phase off cascades to its Sub-Phases */
      if (!newVal && phase.type === 'Phase') {
        est.phases.filter(p => p.type === 'Sub-Phase' && p.parentId === phaseId)
          .forEach(sub => {
            selState.set(sub.phaseId, false);
            const subTab = tabs.querySelector(`[data-phase-id="${sub.phaseId}"]`);
            subTab?.classList.add('is-off');
            const subChk = subTab?.querySelector('.est-tab-chk');
            if (subChk) subChk.checked = true;
          });
      }
      _applyVis();
      _updateGrandTotals();
    }

    function _setIcon(row, expanded) {
      const icon = row.querySelector('.cgrid-expand');
      if (icon) icon.classList.toggle('is-open', expanded);
    }

    /* Tab: checkbox click → toggle active/inactive */
    tabs.addEventListener('change', e => {
      const chk = e.target.closest('.est-tab-chk');
      if (!chk) return;
      const tab = chk.closest('.est-tab');
      if (tab) _togglePhase(tab.dataset.phaseId);
    });

    /* Tab: single click on name → scroll to section */
    tabs.addEventListener('click', e => {
      if (e.target.closest('.est-tab-chk')) return;
      const tab = e.target.closest('.est-tab');
      if (!tab) return;
      const target = el.querySelector(`#est-sec-${tab.dataset.phaseId}`);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    /* Tab: double-click on name → rename inline */
    tabs.addEventListener('dblclick', e => {
      if (e.target.closest('.est-tab-chk')) return;
      const tab = e.target.closest('.est-tab');
      if (!tab) return;
      const nameEl  = tab.querySelector('.est-tab-name');
      const current = nameEl.textContent;
      const inp = document.createElement('input');
      inp.className = 'est-tab-rename-inp';
      inp.value = current;
      nameEl.replaceWith(inp);
      inp.focus(); inp.select();
      function _commit() {
        const val  = inp.value.trim() || current;
        const span = document.createElement('span');
        span.className = 'est-tab-name';
        span.textContent = val;
        inp.replaceWith(span);
        const phase = _EST_MOCK.phases.find(p => p.phaseId === tab.dataset.phaseId);
        if (phase) phase.name = val;
      }
      inp.addEventListener('blur',  _commit);
      inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') inp.blur(); if (ev.key === 'Escape') { inp.value = current; inp.blur(); } });
    });

    /* Tab: right-click → context menu */
    tabs.addEventListener('contextmenu', e => {
      const tab = e.target.closest('.est-tab');
      if (!tab) return;
      e.preventDefault();
      const phaseId = tab.dataset.phaseId;
      const phase   = _EST_MOCK.phases.find(p => p.phaseId === phaseId);
      const isOff   = tab.classList.contains('is-off');
      _showTabContextMenu(e.clientX, e.clientY, phaseId, phase, isOff);
    });

    /* Grid click → expand / collapse */
    rowsEl.addEventListener('click', e => {
      const phaseHdr = e.target.closest('.est-phase-hdr');
      const divHdr   = e.target.closest('.est-div-hdr');

      if (phaseHdr) {
        const pid = phaseHdr.dataset.phaseId;
        const exp = phaseHdr.dataset.expanded !== 'false';
        phaseHdr.dataset.expanded = exp ? 'false' : 'true';
        expState.set(`p:${pid}`, !exp);
        _setIcon(phaseHdr, !exp);
        _applyVis();
      } else if (divHdr) {
        const pid = divHdr.dataset.phaseId;
        const div = divHdr.dataset.div;
        const exp = divHdr.dataset.expanded !== 'false';
        divHdr.dataset.expanded = exp ? 'false' : 'true';
        expState.set(`d:${pid}:${div}`, !exp);
        _setIcon(divHdr, !exp);
        _applyVis();
      } else {
        const subHdr = e.target.closest('.est-sub-hdr');
        if (subHdr) {
          const pid = subHdr.dataset.phaseId;
          const div = subHdr.dataset.div;
          const sub = subHdr.dataset.sub;
          const exp = subHdr.dataset.expanded !== 'false';
          subHdr.dataset.expanded = exp ? 'false' : 'true';
          expState.set(`s:${pid}:${div}:${sub}`, !exp);
          _setIcon(subHdr, !exp);
          _applyVis();
        }
      }
    });

    /* Toolbar actions */
    el.querySelector('[data-action="est-undo"]').addEventListener('click', () => {
      // TODO: undo stack — wired in full-stack build
    });
    el.querySelector('[data-action="est-redo"]').addEventListener('click', () => {
      // TODO: redo stack — wired in full-stack build
    });
    el.querySelector('[data-action="est-setup"]').addEventListener('click', () => {
      openEstimateSettings(est.estimateId || null, wid);
    });
    el.querySelector('[data-action="est-costbook"]').addEventListener('click', () => {
      openCostbook();
    });
    /* Overflow menu */
    const overflowBtn  = el.querySelector('.est-overflow-btn');
    const overflowMenu = el.querySelector('.est-overflow-menu');
    overflowBtn.addEventListener('click', e => {
      e.stopPropagation();
      overflowMenu.style.display = overflowMenu.style.display !== 'none' ? 'none' : '';
    });
    document.addEventListener('click', e => {
      if (!e.target.closest('.est-overflow-wrap')) overflowMenu.style.display = 'none';
    });
    el.querySelector('[data-action="est-duplicate"]').addEventListener('click', () => {
      overflowMenu.style.display = 'none';
      alert('Duplicate Estimate: wired in full-stack build.');
    });
    el.querySelector('[data-action="est-save-template"]').addEventListener('click', () => {
      overflowMenu.style.display = 'none';
      alert('Save as Template: wired in full-stack build.');
    });
    el.querySelector('[data-action="est-refresh"]').addEventListener('click', () => {
      // TODO: re-fetch DB_Estimates data when live DB is wired
      alert('Refresh: wired in full-stack build.');
    });

    /* Collapse All / Expand All button */
    el.querySelector('.est-collapse-btn').addEventListener('click', function () {
      const collapsing = this.textContent === 'Collapse All';
      rowsEl.querySelectorAll('.est-phase-hdr').forEach(row => {
        row.dataset.expanded = collapsing ? 'false' : 'true';
        expState.set(`p:${row.dataset.phaseId}`, !collapsing);
        _setIcon(row, !collapsing);
      });
      rowsEl.querySelectorAll('.est-div-hdr').forEach(row => {
        row.dataset.expanded = collapsing ? 'false' : 'true';
        expState.set(`d:${row.dataset.phaseId}:${row.dataset.div}`, !collapsing);
        _setIcon(row, !collapsing);
      });
      rowsEl.querySelectorAll('.est-sub-hdr').forEach(row => {
        row.dataset.expanded = collapsing ? 'false' : 'true';
        expState.set(`s:${row.dataset.phaseId}:${row.dataset.div}:${row.dataset.sub}`, !collapsing);
        _setIcon(row, !collapsing);
      });
      this.textContent = collapsing ? 'Expand All' : 'Collapse All';
      _applyVis();
    });

    /* Client Mode toggle */
    el.querySelector('.est-cm-toggle').addEventListener('change', function () {
      widget.classList.toggle('est-client-mode', this.checked);
      _applyClientMode(this.checked);
    });

    function _applyClientMode(on) {
      el.querySelectorAll('.est-cost-cell').forEach(cell => {
        const val = parseFloat(on ? cell.dataset.price : cell.dataset.cost) || 0;
        const always = cell.classList.contains('est-col-ucost') || cell.classList.contains('est-col-utotal');
        cell.textContent = _efmt(val, always || on);
      });
      el.querySelectorAll('.est-subtotal-cell[data-cost]').forEach(cell => {
        const val = parseFloat(on ? cell.dataset.price : cell.dataset.cost) || 0;
        cell.textContent = _efmt(val, true);
      });
      ['cv','lmkp','mmkp','smkp','emkp','omkp'].forEach(k =>
        CostGrid.setColVisible(gridEl, estCfg, k, !on));
      _updateGrandTotals(on);
    }

    function _updateGrandTotals(clientMode) {
      const on = clientMode ?? widget.classList.contains('est-client-mode');
      const activeIds = new Set(est.phases.filter(p => _phaseOn(p.phaseId)).map(p => p.phaseId));
      const ai = est.items.filter(i => activeIds.has(i.phaseId));
      el.querySelector('.est-grand-cost').textContent  = _efmt(ai.reduce((s,i)=>s+_estItemTotal(i),0), true);
      el.querySelector('.est-grand-price').textContent = _efmt(ai.reduce((s,i)=>s+_estItemPrice(i),0), true);
    }

    _applyVis();

    /* Column resize — CostGrid module handles all resize logic */
    const estCfg = CostGrid.config('est', EST_GRID_COLS);
    CostGrid.init(gridEl, estCfg);
    CostGrid.bindResize(gridEl, estCfg);

    /* Draggable panel divider */
    SplitPanel.bindDivider(el.querySelector('.est-panel-divider'), {
      navEl: el.querySelector('.est-tab-panel'),
      min: 100, max: 400,
      onMove: w => { el.querySelector('.est-tab-panel').style.minWidth = w + 'px'; },
    });

  }

  /* ── Transfer Widget ─────────────────────────────────────── */

  function _transferHTML(tagged, openEsts) {
    const n = tagged.length;
    const typeLabel = t => t === 'Sub-Phase' ? 'SUB' : t === 'Change Order' ? 'C/O' : 'PH';
    const typeCls   = t => t === 'Sub-Phase' ? 'tr-phase--sub' : t === 'Change Order' ? 'tr-phase--co' : 'tr-phase--phase';

    const estsHTML = openEsts.map(({ id, est }) => {
      const topPhases = est.phases.filter(p => !p.parentId);
      const phasesHTML = topPhases.map(ph => {
        const subs = est.phases.filter(s => s.parentId === ph.phaseId);
        const hasSubs = subs.length > 0;
        const subsHTML = hasSubs ? `<div class="tr-sub-wrap" data-sub-of="${ph.phaseId}">` +
          subs.map(s => `
            <div class="tr-phase-row tr-phase-row--sub">
              <input type="checkbox" class="tr-phase-chk" data-est-id="${id}" data-phase-id="${s.phaseId}" data-parent-id="${ph.phaseId}" checked>
              <span class="tr-phase-lbl ${typeCls(s.type)}">${typeLabel(s.type)}</span>
              <span class="tr-phase-name">${s.name}</span>
            </div>`).join('') + '</div>' : '';
        return `<div class="tr-phase-group">
          <div class="tr-phase-row">
            <input type="checkbox" class="tr-phase-chk" data-est-id="${id}" data-phase-id="${ph.phaseId}" checked>
            <span class="tr-phase-lbl ${typeCls(ph.type)}">${typeLabel(ph.type)}</span>
            <span class="tr-phase-name${hasSubs ? ' tr-phase-toggle' : ''}"${hasSubs ? ` data-toggle-subs="${ph.phaseId}"` : ''}>${ph.name}</span>
          </div>
          ${subsHTML}
        </div>`;
      }).join('');

      return `
        <div class="tr-est-section" data-est-id="${id}">
          <div class="tr-est-hdr">
            <input type="checkbox" class="tr-est-chk" data-est-id="${id}" checked>
            <span class="tr-est-name tr-est-toggle" data-toggle-est="${id}">${est.estimateName || est.clientName || id}</span>
          </div>
          <div class="tr-phases-wrap" data-est-phases="${id}">${phasesHTML}</div>
        </div>`;
    }).join('');

    return `<div class="sp-widget transfer-widget">
      <div class="transfer-header">
        <span class="transfer-count">${n} item${n === 1 ? '' : 's'} to transfer</span>
        <span class="transfer-sub">Select destination phases:</span>
      </div>
      <div class="transfer-body">${estsHTML}</div>
      <div class="transfer-footer sp-footer">
        <button class="btn-secondary sp-btn" data-action="tr-cancel">Cancel</button>
        <button class="btn-primary sp-btn"   data-action="tr-transfer">Transfer</button>
      </div>
    </div>`;
  }

  function openTransfer(tagged, parentWidgetId) {
    const openEsts = _getOpenEstimates();
    if (!openEsts.length) { alert('No estimates are open.'); return; }
    const id = 'transfer';
    if (WidgetManager.open(id, 'Transfer to Estimate', _transferHTML(tagged, openEsts), {
      width: 300, autoHeight: true, minWidth: 260, category: 'estimating',
      centeredOn: parentWidgetId,
    }) !== false) {
      _bindTransfer(id, tagged);
      WidgetManager.resizeToContent(id);
    }
  }

  function _bindTransfer(widgetId, tagged) {
    const el = document.getElementById('widget-' + widgetId);
    if (!el) return;

    function _updateEstHeader(estId) {
      const all     = [...el.querySelectorAll(`.tr-phase-chk[data-est-id="${estId}"]`)];
      const n       = all.filter(c => c.checked).length;
      const estChk  = el.querySelector(`.tr-est-chk[data-est-id="${estId}"]`);
      if (estChk) {
        estChk.checked       = n > 0;
        estChk.indeterminate = n > 0 && n < all.length;
      }
    }

    /* Est checkbox → check/uncheck all its phases and sub-phases */
    el.addEventListener('change', e => {
      const estChk = e.target.closest('.tr-est-chk');
      if (!estChk) return;
      const estId = estChk.dataset.estId;
      el.querySelectorAll(`.tr-phase-chk[data-est-id="${estId}"]`).forEach(cb => { cb.checked = estChk.checked; });
    });

    /* Phase checkbox → cascade to sub-phases + update est header */
    el.addEventListener('change', e => {
      const phChk = e.target.closest('.tr-phase-chk');
      if (!phChk) return;
      const phaseId = phChk.dataset.phaseId;
      const estId   = phChk.dataset.estId;
      /* Unchecking a top-level phase unchecks its sub-phases */
      if (!phChk.checked) {
        el.querySelectorAll(`.tr-phase-chk[data-parent-id="${phaseId}"]`).forEach(cb => { cb.checked = false; });
      }
      _updateEstHeader(estId);
    });

    /* Collapse / expand clicks */
    el.addEventListener('click', e => {
      /* Estimate name → collapse all phases for that estimate */
      const estToggle = e.target.closest('.tr-est-toggle');
      if (estToggle && !e.target.closest('.tr-est-chk')) {
        const estId = estToggle.dataset.toggleEst;
        const wrap  = el.querySelector(`.tr-phases-wrap[data-est-phases="${estId}"]`);
        if (wrap) {
          const collapsed = wrap.style.display === 'none';
          wrap.style.display = collapsed ? '' : 'none';
          estToggle.classList.toggle('tr-collapsed', !collapsed);
          WidgetManager.resizeToContent(widgetId);
        }
        return;
      }

      /* Phase name with subs → collapse its sub-phases */
      const phToggle = e.target.closest('.tr-phase-toggle');
      if (phToggle && !e.target.closest('.tr-phase-chk')) {
        const phaseId = phToggle.dataset.toggleSubs;
        const wrap    = el.querySelector(`.tr-sub-wrap[data-sub-of="${phaseId}"]`);
        if (wrap) {
          const collapsed = wrap.style.display === 'none';
          wrap.style.display = collapsed ? '' : 'none';
          phToggle.classList.toggle('tr-collapsed', !collapsed);
          WidgetManager.resizeToContent(widgetId);
        }
        return;
      }

      const action = e.target.closest('[data-action]')?.dataset.action;
      if (!action) return;
      if (action === 'tr-cancel') { WidgetManager.close(widgetId); return; }
      if (action === 'tr-transfer') {
        const destinations = [];
        el.querySelectorAll('.tr-phase-chk:checked').forEach(cb => {
          destinations.push({ estId: cb.dataset.estId, phaseId: cb.dataset.phaseId });
        });
        if (!destinations.length) return;
        console.log('Transfer', tagged.length, 'items to', destinations);
        alert(`Transferred ${tagged.length} item${tagged.length === 1 ? '' : 's'} to ${destinations.length} phase${destinations.length === 1 ? '' : 's'}.`);
        WidgetManager.close(widgetId);
      }
    });
  }

  /* ── Estimate Settings Widget ────────────────────────────── */

  function _esPhaseListHTML(phases) {
    if (!phases.length) return '<div class="est-phase-empty">No phases defined.</div>';
    let html = '';
    phases.forEach(ph => {
      const typeCls = ph.type === 'Sub-Phase' ? ' est-phase-pill--sub' : ph.type === 'Change Order' ? ' est-phase-pill--co' : ' est-phase-pill--phase';
      const offCls  = ph.isSelected ? '' : ' is-off';
      const indent  = ph.parentId ? ' est-phase-pill--indented' : '';
      const typeLabel = ph.type === 'Sub-Phase' ? 'Sub' : ph.type === 'Change Order' ? 'C/O' : 'Ph';
      html += `<div class="est-phase-pill${typeCls}${offCls}${indent}" data-phase-id="${ph.phaseId}" data-expanded="false">` +
              `<span class="est-phase-pill-lbl">${typeLabel}</span>` +
              `<span class="est-phase-pill-name">${ph.name}</span>` +
              `${ph.markupOverride ? '<span class="est-phase-pill-mkp">mkp</span>' : ''}` +
              `</div>`;
    });
    return html;
  }

  function _esPhaseFormHTML(phases, editPhase) {
    const ph = editPhase || {};
    const parentOpts = phases.filter(p => p.type === 'Phase').map(p =>
      `<option value="${p.phaseId}"${ph.parentId === p.phaseId ? ' selected' : ''}>${p.name}</option>`
    ).join('');
    const sel = (v, match) => v === match ? ' selected' : '';
    const mkpVal = key => ph[key] != null ? ph[key] : '';
    const showParent  = ph.type === 'Sub-Phase' ? '' : 'display:none';
    const showMkpRow  = ph.markupOverride ? '' : 'display:none';
    return `
      <div class="form-row">
        <div class="form-group f-grow">
          <label class="form-label">Phase Name</label>
          <input class="form-input" type="text" data-ep="name" value="${ph.name || ''}" placeholder="Phase name">
        </div>
        <div class="form-group" style="width:110px">
          <label class="form-label">Type</label>
          <select class="form-select" data-ep="type">
            <option value="Phase"${sel(ph.type,'Phase')}>Phase</option>
            <option value="Sub-Phase"${sel(ph.type,'Sub-Phase')}>Sub-Phase</option>
            <option value="Change Order"${sel(ph.type,'Change Order')}>Change Order</option>
          </select>
        </div>
      </div>
      <div class="form-row est-phase-parent-row" style="${showParent}">
        <div class="form-group f-grow">
          <label class="form-label">Parent Phase</label>
          <select class="form-select" data-ep="parent-id">
            <option value="">— Select Parent —</option>
            ${parentOpts}
          </select>
        </div>
      </div>
      <div class="form-row">
        <label class="est-phase-override-lbl">
          <input type="checkbox" data-ep="markup-override"${ph.markupOverride ? ' checked' : ''}> Override markup defaults for this phase
        </label>
      </div>
      <div class="est-phase-mkp-row" style="${showMkpRow}">
        <div class="est-mkp-field"><span class="form-label">Labor</span><input class="est-mkp-inp" type="number" min="0" step="0.1" data-ep="markupLabor" value="${mkpVal('markupLabor')}" placeholder="0"></div>
        <div class="est-mkp-field"><span class="form-label">Mat</span><input class="est-mkp-inp" type="number" min="0" step="0.1" data-ep="markupMaterial" value="${mkpVal('markupMaterial')}" placeholder="0"></div>
        <div class="est-mkp-field"><span class="form-label">Sub</span><input class="est-mkp-inp" type="number" min="0" step="0.1" data-ep="markupSub" value="${mkpVal('markupSub')}" placeholder="0"></div>
        <div class="est-mkp-field"><span class="form-label">Equip</span><input class="est-mkp-inp" type="number" min="0" step="0.1" data-ep="markupEquipment" value="${mkpVal('markupEquipment')}" placeholder="0"></div>
        <div class="est-mkp-field"><span class="form-label">Other</span><input class="est-mkp-inp" type="number" min="0" step="0.1" data-ep="markupOther" value="${mkpVal('markupOther')}" placeholder="0"></div>
      </div>
      <div class="form-row est-phase-form-btns">
        <button class="btn-secondary sp-btn" data-action="ep-cancel">Done</button>
        <button class="btn-primary sp-btn"   data-action="ep-save-add">Save + Add Phase</button>
      </div>`;
  }

  function _estSettingsHTML(est) {
    const v = est || {};

    const allProps = AppData.tables.DB_Property || [];
    const links    = AppData.tables.Link_Property_People || [];

    const clientName = v.peopleId
      ? ((AppData.tables.DB_People || []).find(p => p.People_ID === v.peopleId) || {}).Display_Name || ''
      : '';

    const clientLinks = v.peopleId
      ? links.filter(l => l.People_ID === v.peopleId && !l.Date_To).map(l => l.Property_ID)
      : allProps.map(p => p.Property_ID);
    const propPool = allProps.filter(p => clientLinks.includes(p.Property_ID));
    const propOpts = propPool.map(p =>
      `<option value="${p.Property_ID}"${p.Property_ID === v.propertyId ? ' selected' : ''}>${p.Address_Street_1}${p.Address_City ? ', ' + p.Address_City : ''}</option>`
    ).join('');

    const estTypeOpts = (AppData.tables.DB_Lookup_Lists || [])
      .filter(r => r.List_Type === 'Estimate_Type')
      .sort((a, b) => (a.Sort_Order || 0) - (b.Sort_Order || 0))
      .map(r => `<option value="${r.List_Value}"${r.List_Value === v.estimateType ? ' selected' : ''}>${r.List_Value}</option>`)
      .join('');

    const taxRates  = AppData.tables.DB_Tax_Rates || [];
    const selTax    = taxRates.find(r => r.Tax_ID === v.taxId) || taxRates.find(r => r.Is_Default === 'TRUE');
    const taxOpts   = taxRates.map(r =>
      `<option value="${r.Tax_ID}"${r === selTax ? ' selected' : ''}>${r.Tax_Name}</option>`
    ).join('');
    const taxDisplay = selTax ? selTax.Tax_Rate : '';

    const mm  = v.markupMode || 'markup';
    const nv  = f => v[f] != null ? v[f] : '';
    const sel = (a, b) => a === b ? ' checked' : '';

    function mkpField(lbl, field) {
      return `<div class="est-mkp-field">
        <span class="form-label">${lbl}</span>
        <input class="est-mkp-inp" type="number" min="0" step="0.1" data-es="${field}" value="${nv(field)}" placeholder="0">
      </div>`;
    }

    return `
      <div class="est-settings-widget">
        <div class="est-settings-body">

          <div class="form-section est-settings-hdr">Client &amp; Property</div>
          <div class="est-settings-section">
            <div class="form-row">
              <div class="form-group f-grow">
                <label class="form-label">Client</label>
                <div class="est-client-wrap">
                  <input class="form-input est-client-inp" placeholder="Search by name…" value="${clientName}" autocomplete="off">
                  <input type="hidden" data-es="people-id" value="${v.peopleId || ''}">
                  <div class="est-client-results" style="display:none"></div>
                </div>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group f-grow">
                <label class="form-label">Property</label>
                <select class="form-select" data-es="property-id">
                  <option value="">— Select Property —</option>
                  ${propOpts}
                </select>
              </div>
              <button class="btn-secondary sp-btn est-add-prop-btn" style="align-self:flex-end;margin-bottom:2px">+ Property</button>
            </div>
            <div class="est-address-display" data-es="address-display">${_esAddressText(v.propertyId, allProps)}</div>
          </div>

          <hr class="est-settings-divider">

          <div class="form-section est-settings-hdr">Estimate Details</div>
          <div class="est-settings-section">
            <div class="form-row">
              <div class="form-group f-grow">
                <label class="form-label">Estimate Name</label>
                <input class="form-input" data-es="name" value="${v.estimateName || ''}" placeholder="e.g. Kitchen Remodel">
              </div>
              <div class="form-group" style="flex:0 0 180px">
                <label class="form-label">Estimate Type</label>
                <select class="form-select" data-es="type">
                  <option value="">— Select Type —</option>
                  ${estTypeOpts}
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group f-grow">
                <label class="form-label">Notes</label>
                <textarea class="form-textarea" data-es="notes" rows="3">${v.estimateNotes || ''}</textarea>
              </div>
            </div>
          </div>

          <hr class="est-settings-divider">

          <div class="form-section est-settings-hdr">Markups &amp; Settings</div>
          <div class="est-settings-section">
            <div class="est-mm-row">
              <div class="est-mm-toggle">
                <label><input type="radio" name="es-mm" value="markup"${sel(mm,'markup')}> Markup %</label>
                <label><input type="radio" name="es-mm" value="margin"${sel(mm,'margin')}> Margin %</label>
              </div>
              <div class="est-tax-group">
                <span class="form-label">Tax Rate</span>
                <div class="est-tax-row">
                  <select class="form-select est-tax-sel" data-es="tax-id">
                    <option value="">—</option>
                    ${taxOpts}
                  </select>
                  <input type="number" class="est-tax-display" data-es="tax-display" min="0" step="0.001" placeholder="0" value="${taxDisplay}">
                </div>
              </div>
            </div>
            <div class="est-mkp-row">
              ${mkpField('Labor',  'markupLabor')}
              ${mkpField('Mat',    'markupMaterial')}
              ${mkpField('Sub',    'markupSub')}
              ${mkpField('Equip',  'markupEquipment')}
              ${mkpField('Other',  'markupOther')}
              <div class="est-mkp-field est-mkp-sep-field">
                <span class="form-label">OH</span>
                <input class="est-mkp-inp" type="number" min="0" step="0.1" data-es="overheadPct" value="${nv('overheadPct')}" placeholder="0">
              </div>
              ${mkpField('Profit', 'profitPct')}
            </div>
          </div>

          <hr class="est-settings-divider">

          <div class="form-section est-settings-hdr">Phases</div>
          <div class="est-phase-add-row">
            <button class="btn-secondary sp-btn est-phase-add-btn" data-action="ep-new">+ Phase</button>
          </div>
          <div class="est-phase-list" id="es-phase-list">
            ${_esPhaseListHTML(_EST_MOCK.phases)}
          </div>

        </div><!-- /.est-settings-body -->
        <div class="est-settings-footer">
          <button class="btn-secondary sp-btn" data-action="es-cancel">Cancel</button>
          <button class="btn-primary sp-btn"   data-action="es-done">Done</button>
        </div>
      </div>`;
  }

  function _esAddressText(propertyId, allProps) {
    if (!propertyId) return '';
    const p = (allProps || AppData.tables.DB_Property || []).find(r => r.Property_ID === propertyId);
    if (!p) return '';
    return [p.Address_Street_1, p.Address_Street_2, p.Address_City, p.Address_State, p.Address_Zip]
      .filter(Boolean).join(', ');
  }

  function openEstimateSettings(estimateId, parentWidgetId) {
    const raw = AppData.tables.DB_Estimates || [];
    const row = estimateId ? raw.find(r => r.Estimate_ID === estimateId) : null;
    const est = row ? {
      estimateId:    row.Estimate_ID,
      peopleId:      row.People_ID       || '',
      propertyId:    row.Property_ID     || '',
      estimateName:  row.Estimate_Name   || '',
      estimateType:  row.Estimate_Type   || '',
      estimateNotes: row.Notes           || '',
      markupMode:    row.Markup_Mode     || 'markup',
      markupLabor:   row.Default_Markup_Labor     || '',
      markupMaterial:row.Default_Markup_Materials || '',
      markupSub:     row.Default_Markup_Subs      || '',
      markupEquipment:row.Default_Markup_Equipment|| '',
      markupOther:   row.Default_Markup_Other     || '',
      overheadPct:   row.Default_Overhead_Margin  || '',
      profitPct:     row.Default_Profit_Margin    || '',
      taxId:         row.Default_Tax_ID           || '',
      showSubdivisions: row.Show_Subdivisions === 'TRUE',
    } : null;
    const title = 'Estimate Settings';
    const id    = 'estimate-settings';
    if (WidgetManager.open(id, title, _estSettingsHTML(est), {
      width: 420, height: 680, minWidth: 400, minHeight: 520, category: 'estimating',
      centeredOn: parentWidgetId,
    }) !== false) {
      _bindEstimateSettings(id, est);
    }
  }

  function _bindEstimateSettings(widgetId, initialEst) {
    const el = document.getElementById('widget-' + widgetId);
    if (!el) return;

    const allProps     = AppData.tables.DB_Property || [];
    const links        = AppData.tables.Link_Property_People || [];
    const allPeople    = (AppData.tables.DB_People || []).filter(r => r.Display_Name);
    const clientInp    = el.querySelector('.est-client-inp');
    const clientIdEl   = el.querySelector('[data-es="people-id"]');
    const clientResults= el.querySelector('.est-client-results');
    const propEl       = el.querySelector('[data-es="property-id"]');
    const addrEl       = el.querySelector('[data-es="address-display"]');

    function _rebuildProps(peopleId) {
      const ids  = peopleId
        ? links.filter(l => l.People_ID === peopleId && !l.Date_To).map(l => l.Property_ID)
        : allProps.map(p => p.Property_ID);
      const pool = allProps.filter(p => ids.includes(p.Property_ID));
      propEl.innerHTML = '<option value="">— Select Property —</option>' +
        pool.map(p =>
          `<option value="${p.Property_ID}">${p.Address_Street_1}${p.Address_City ? ', ' + p.Address_City : ''}</option>`
        ).join('');
      addrEl.textContent = '';
      if (pool.length === 1) {
        propEl.value = pool[0].Property_ID;
        addrEl.textContent = _esAddressText(pool[0].Property_ID, allProps);
      }
    }

    clientInp.addEventListener('input', function () {
      const q = this.value.trim().toLowerCase();
      if (!q) { clientResults.style.display = 'none'; return; }
      const hits = allPeople.filter(p => p.Display_Name.toLowerCase().includes(q)).slice(0, 10);
      if (!hits.length) { clientResults.style.display = 'none'; return; }
      clientResults.innerHTML = hits.map(p =>
        `<div class="est-client-result-row" data-id="${p.People_ID}" data-name="${p.Display_Name.replace(/"/g,'&quot;')}">${p.Display_Name}</div>`
      ).join('');
      clientResults.style.display = '';
    });

    clientResults.addEventListener('click', function (e) {
      const row = e.target.closest('.est-client-result-row');
      if (!row) return;
      clientInp.value    = row.dataset.name;
      clientIdEl.value   = row.dataset.id;
      clientResults.style.display = 'none';
      _rebuildProps(row.dataset.id);
    });

    el.addEventListener('click', function (e) {
      if (!e.target.closest('.est-client-wrap')) clientResults.style.display = 'none';
    }, true);

    propEl.addEventListener('change', function () {
      addrEl.textContent = _esAddressText(this.value, allProps);
    });

    el.querySelector('.est-add-prop-btn').addEventListener('click', () => {
      alert('Add New Property: wired in full-stack build.');
    });

    const taxRates = AppData.tables.DB_Tax_Rates || [];
    el.querySelector('[data-es="tax-id"]').addEventListener('change', function () {
      const r = taxRates.find(t => t.Tax_ID === this.value);
      el.querySelector('[data-es="tax-display"]').value = r ? r.Tax_Rate : '';
    });

    function _readForm() {
      const f  = key => el.querySelector(`[data-es="${key}"]`);
      const mm = el.querySelector('[name="es-mm"]:checked');
      return {
        estimateId:      initialEst?.estimateId || null,
        peopleId:        f('people-id').value,
        propertyId:      f('property-id').value,
        estimateName:    f('name').value.trim(),
        estimateType:    f('type').value,
        estimateNotes:   f('notes').value.trim(),
        markupMode:      mm ? mm.value : 'markup',
        markupLabor:     parseFloat(f('markupLabor').value)     || 0,
        markupMaterial:  parseFloat(f('markupMaterial').value)  || 0,
        markupSub:       parseFloat(f('markupSub').value)       || 0,
        markupEquipment: parseFloat(f('markupEquipment').value) || 0,
        markupOther:     parseFloat(f('markupOther').value)     || 0,
        overheadPct:     parseFloat(f('overheadPct').value)     || 0,
        profitPct:       parseFloat(f('profitPct').value)       || 0,
        taxId:           f('tax-id').value,
        taxRatePct:      parseFloat(f('tax-display').value) || 0,
      };
    }

    function _persist(data) {
      const stored = JSON.parse(localStorage.getItem('est_settings') || '[]');
      const id     = data.estimateId || ('EST-' + Date.now());
      const idx    = stored.findIndex(s => s.estimateId === id);
      const record = { ...data, estimateId: id };
      if (idx >= 0) stored[idx] = record;
      else          stored.push(record);
      localStorage.setItem('est_settings', JSON.stringify(stored));
      document.dispatchEvent(new CustomEvent('est-settings-saved', { detail: record }));
    }

    /* ── Phase section ── */
    const phaseList = el.querySelector('#es-phase-list');
    let _editingPhaseId = null;

    /* Single reusable form element — moved in the DOM to sit after the active pill */
    const phaseForm = document.createElement('div');
    phaseForm.className = 'est-phase-form';
    phaseForm.style.display = 'none';

    function _phaseFormF(key) { return phaseForm.querySelector(`[data-ep="${key}"]`); }

    function _attachFormListeners() {
      _phaseFormF('type').addEventListener('change', function () {
        phaseForm.querySelector('.est-phase-parent-row').style.display =
          this.value === 'Sub-Phase' ? '' : 'none';
      });
      _phaseFormF('markup-override').addEventListener('change', function () {
        phaseForm.querySelector('.est-phase-mkp-row').style.display = this.checked ? '' : 'none';
      });
    }

    function _closePhaseForm() {
      phaseForm.style.display = 'none';
      _editingPhaseId = null;
    }

    function _refreshPhaseList() {
      /* Re-render pills; re-insert form after its pill if it was open */
      const openId = phaseForm.style.display !== 'none' ? _editingPhaseId : null;
      phaseList.innerHTML = _esPhaseListHTML(_EST_MOCK.phases);
      if (openId) {
        const pill = phaseList.querySelector(`[data-phase-id="${openId}"]`);
        if (pill) pill.after(phaseForm);
      }
    }

    function _openPhaseForm(phase, afterEl) {
      const phaseId = phase?.phaseId || null;
      /* Toggle: clicking the same pill while open closes the form */
      if (_editingPhaseId === phaseId && phaseForm.style.display !== 'none') {
        _closePhaseForm();
        return;
      }
      _editingPhaseId = phaseId;
      phaseForm.innerHTML = _esPhaseFormHTML(_EST_MOCK.phases, phase || null);
      _attachFormListeners();
      /* Move form to the right position in the DOM */
      phaseForm.remove();
      if (afterEl) {
        afterEl.after(phaseForm);
      } else {
        phaseList.prepend(phaseForm);
      }
      phaseForm.style.display = '';
      _phaseFormF('name').focus();
    }

    function _savePhaseForm(keepOpen) {
      const name    = _phaseFormF('name').value.trim();
      if (!name) { _phaseFormF('name').focus(); return; }
      const type    = _phaseFormF('type').value;
      const parentId = type === 'Sub-Phase' ? (_phaseFormF('parent-id')?.value || null) : null;
      const overrideEl = _phaseFormF('markup-override');
      const override   = overrideEl ? overrideEl.checked : false;
      const mkpVal = key => { const inp = _phaseFormF(key); return (override && inp) ? (parseFloat(inp.value) || null) : null; };
      if (_editingPhaseId) {
        const ph = _EST_MOCK.phases.find(p => p.phaseId === _editingPhaseId);
        if (ph) {
          ph.name = name; ph.type = type; ph.parentId = parentId;
          ph.markupOverride = override;
          ph.markupLabor = mkpVal('markupLabor'); ph.markupMaterial = mkpVal('markupMaterial');
          ph.markupSub = mkpVal('markupSub'); ph.markupEquipment = mkpVal('markupEquipment');
          ph.markupOther = mkpVal('markupOther');
        }
      } else {
        const maxOrder = _EST_MOCK.phases.reduce((m, p) => Math.max(m, p.sortOrder), 0);
        _EST_MOCK.phases.push({
          phaseId: 'P' + Date.now(), type, name, parentId, isSelected: true,
          sortOrder: maxOrder + 10, markupOverride: override,
          markupLabor: mkpVal('markupLabor'), markupMaterial: mkpVal('markupMaterial'),
          markupSub: mkpVal('markupSub'), markupEquipment: mkpVal('markupEquipment'),
          markupOther: mkpVal('markupOther'),
        });
      }
      if (keepOpen) {
        /* Save + Add Phase: refresh list then open blank form at top */
        _editingPhaseId = null;
        _refreshPhaseList();
        _openPhaseForm(null, null);
      } else {
        _closePhaseForm();
        _refreshPhaseList();
      }
    }

    /* Phase list: click pill to toggle form open/closed in-place */
    phaseList.addEventListener('click', function (e) {
      const pill = e.target.closest('.est-phase-pill');
      if (!pill) return;
      const ph = _EST_MOCK.phases.find(p => p.phaseId === pill.dataset.phaseId);
      if (ph) _openPhaseForm(ph, pill);
    });

    el.addEventListener('click', function (e) {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (!action) return;
      if (action === 'es-cancel') { WidgetManager.close(widgetId); return; }
      if (action === 'ep-new')    { _openPhaseForm(null, null); return; }
      if (action === 'ep-cancel') { _closePhaseForm(); return; }
      if (action === 'ep-save-add') { _savePhaseForm(true);  return; }
      if (action === 'es-done') {
        if (phaseForm.style.display !== 'none') _savePhaseForm(false);
        const data = _readForm();
        if (!data.estimateName) {
          el.querySelector('[data-es="name"]').focus();
          return;
        }
        _persist(data);
        WidgetManager.close(widgetId);
        openEstimate(data.estimateId);
      }
    });
  }

  function openEstimate(estimateId) {
    const est = _EST_MOCK;
    const id  = 'estimate-' + (estimateId || est.estimateId || 'draft');
    _openEstimates.set(id, est);
    if (WidgetManager.open(id, 'Estimate', _estHTML(est), {
      width: 813, height: 680, minWidth: 600, minHeight: 500, category: 'estimate',
    }) !== false) {
      _bindEstimate(id, est);
    }
    _notifyCostbookTagState();
  }

  /* ── Estimate List Widget ────────────────────────────────── */

  function _elFmt(n) {
    if (!n) return '—';
    return '$' + Number(n).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function _elStatusCls(s) {
    return s === 'Active' ? 'el-badge--active' : s === 'Archived' ? 'el-badge--archived' : 'el-badge--draft';
  }

  function _elBuildRows(pool, sortCol, sortDir, showArchived, search, groupSelect) {
    let rows = pool.filter(e => showArchived || e.status !== 'Archived');
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(e =>
        e.clientName.toLowerCase().includes(q) ||
        e.estimateName.toLowerCase().includes(q) ||
        e.address.toLowerCase().includes(q)
      );
    }
    rows.sort((a, b) => {
      const va = sortCol === 'dateStarted' || sortCol === 'dateModified' ? a[sortCol] : (a[sortCol] || '').toLowerCase();
      const vb = sortCol === 'dateStarted' || sortCol === 'dateModified' ? b[sortCol] : (b[sortCol] || '').toLowerCase();
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    if (!rows.length) return '<div class="el-empty">No estimates found.</div>';
    return rows.map(e => `
      <div class="el-row${e.status === 'Archived' ? ' is-archived' : ''}" data-id="${e.estimateId}">
        ${groupSelect ? `<input type="checkbox" class="el-row-chk" data-id="${e.estimateId}">` : ''}
        <div class="el-cell el-col-client">${e.clientName}</div>
        <div class="el-cell el-col-name">${e.estimateName}</div>
        <div class="el-cell el-col-addr">${e.address}</div>
        <div class="el-cell el-col-status"><span class="el-badge ${_elStatusCls(e.status)}">${e.status}</span></div>
        <div class="el-cell el-col-price">${_elFmt(e.totalPrice)}</div>
        <div class="el-cell el-col-date">${e.dateModified}</div>
      </div>`).join('');
  }

  function _estListHTML() {
    const arr = 'v';
    return `<div class="sp-widget el-widget">
      <div class="sp-toolbar el-toolbar">
        <button class="btn-primary sp-btn" data-action="el-new">+ New Estimate</button>
        <input class="sp-search el-search" type="search" placeholder="Search…">
        <button class="btn-secondary sp-btn el-filter-btn" data-action="el-filter">Filter ▾</button>
        <div class="el-toolbar-spacer"></div>
        <label class="el-archived-lbl sp-normal-ctrl">
          <input type="checkbox" data-action="el-show-archived"> Show Archived
        </label>
        <button class="btn-secondary sp-btn sp-btn-icon el-group-btn" data-action="el-group-select" title="Group select">&#9776;</button>
      </div>
      <div class="el-col-hdrs">
        <div class="el-hdr el-col-client"  data-sort="clientName"   data-col-var="--el-w-client">CLIENT NAME <span class="el-sort-arrow">↑</span><div class="el-col-resize"></div></div>
        <div class="el-hdr el-col-name"    data-sort="estimateName" data-col-var="--el-w-name">ESTIMATE <span class="el-sort-arrow"></span><div class="el-col-resize"></div></div>
        <div class="el-hdr el-col-addr"    data-sort="address"      data-col-var="--el-w-addr">ADDRESS <span class="el-sort-arrow"></span><div class="el-col-resize"></div></div>
        <div class="el-hdr el-col-status"  data-sort="status"       data-col-var="--el-w-status">STATUS <span class="el-sort-arrow"></span><div class="el-col-resize"></div></div>
        <div class="el-hdr el-col-price"   data-sort="totalPrice"   data-col-var="--el-w-price">TOTAL <span class="el-sort-arrow"></span><div class="el-col-resize"></div></div>
        <div class="el-hdr el-col-date"    data-sort="dateModified">MODIFIED <span class="el-sort-arrow"></span></div>
      </div>
      <div class="el-list-wrap">
        <div class="el-list">${_elBuildRows(_EST_LIST_MOCK, 'clientName', 'asc', false, '', false)}</div>
      </div>
      <div class="el-action-bar" style="display:none">
        <span class="el-sel-count">0 selected</span>
        <button class="btn-secondary sp-btn" data-action="el-archive-sel">Archive Selected</button>
        <button class="btn-secondary sp-btn el-danger-btn" data-action="el-delete-sel">Delete Selected</button>
        <button class="btn-secondary sp-btn" data-action="el-group-cancel">Cancel</button>
      </div>
    </div>`;
  }

  function openEstimateList() {
    const id = 'estimate-list';
    if (WidgetManager.open(id, 'Estimate List', _estListHTML(), {
      width: 760, height: 500, minWidth: 600, minHeight: 360, category: 'estimating',
    }) !== false) {
      _bindEstimateList(id);
    }
  }

  function _bindEstimateList(widgetId) {
    const el        = document.getElementById('widget-' + widgetId);
    if (!el) return;
    const listEl    = el.querySelector('.el-list');
    const colHdrs   = el.querySelector('.el-col-hdrs');
    const actionBar = el.querySelector('.el-action-bar');
    const selCount  = el.querySelector('.el-sel-count');

    let sortCol     = 'clientName';
    let sortDir     = 'asc';
    let showArchived= false;
    let search      = '';
    let groupSelect = false;

    /* ── Column resize ── */
    const EL_COL_KEY    = 'el-col-widths';
    const EL_COL_VARS   = ['--el-w-client','--el-w-name','--el-w-addr','--el-w-status','--el-w-price','--el-w-date'];
    const elContent     = el.querySelector('.el-widget');  // CSS vars must be set here, not on the outer container
    try {
      const saved = JSON.parse(localStorage.getItem(EL_COL_KEY) || '{}');
      EL_COL_VARS.forEach(v => { if (saved[v]) elContent.style.setProperty(v, saved[v]); });
    } catch (_) {}

    colHdrs.addEventListener('mousedown', e => {
      const handle = e.target.closest('.el-col-resize');
      if (!handle) return;
      e.preventDefault();
      const hdr      = handle.closest('.el-hdr');
      const varName  = hdr.dataset.colVar;
      const startX   = e.clientX;
      const startW   = hdr.offsetWidth;
      function onMove(e) {
        elContent.style.setProperty(varName, Math.max(50, startW + e.clientX - startX) + 'px');
      }
      function onUp() {
        const widths = {};
        EL_COL_VARS.forEach(v => { const val = elContent.style.getPropertyValue(v); if (val) widths[v] = val; });
        localStorage.setItem(EL_COL_KEY, JSON.stringify(widths));
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });

    function _render() {
      listEl.innerHTML = _elBuildRows(_EST_LIST_MOCK, sortCol, sortDir, showArchived, search, groupSelect);
      el.querySelectorAll('.el-hdr[data-sort]').forEach(h => {
        const arrow = h.querySelector('.el-sort-arrow');
        if (arrow) arrow.textContent = h.dataset.sort === sortCol ? (sortDir === 'asc' ? '↑' : '↓') : '';
      });
    }

    function _updateSelCount() {
      const n = el.querySelectorAll('.el-row-chk:checked').length;
      selCount.textContent = `${n} selected`;
    }

    /* Sort headers — don't trigger on resize handle drag */
    colHdrs.addEventListener('click', e => {
      if (e.target.closest('.el-col-resize')) return;
      const hdr = e.target.closest('.el-hdr[data-sort]');
      if (!hdr) return;
      const col = hdr.dataset.sort;
      sortDir = col === sortCol ? (sortDir === 'asc' ? 'desc' : 'asc') : 'asc';
      sortCol = col;
      _render();
    });

    /* Search */
    let _searchTimer;
    el.querySelector('.el-search').addEventListener('input', function () {
      clearTimeout(_searchTimer);
      _searchTimer = setTimeout(() => { search = this.value.trim(); _render(); }, 200);
    });

    /* Row clicks — timer separates single-click (card toggle) from double-click (open estimate) */
    let _elClickTimer = null;
    listEl.addEventListener('click', e => {
      if (e.target.closest('.el-row-chk')) { _updateSelCount(); return; }
      const row = e.target.closest('.el-row');
      if (!row) return;
      const rowId = row.dataset.id;
      clearTimeout(_elClickTimer);
      _elClickTimer = setTimeout(() => {
        _elClickTimer = null;
        const cardId = 'estimate-summary-' + rowId;
        if (WidgetManager.isOpen(cardId)) {
          WidgetManager.close(cardId);
          return;
        }
        const est = _EST_LIST_MOCK.find(x => x.estimateId === rowId);
        if (!est) return;
        const workspace = document.querySelector('.workspace');
        const wsRect    = workspace.getBoundingClientRect();
        const wRect     = el.getBoundingClientRect();
        openEstimateSummary(est, {
          left: Math.round(wRect.right - wsRect.left + 8),
          top:  parseInt(el.style.top) || 0,
        });
      }, 220);
    });
    listEl.addEventListener('dblclick', e => {
      clearTimeout(_elClickTimer);
      _elClickTimer = null;
      const row = e.target.closest('.el-row');
      if (!row) return;
      openEstimate(row.dataset.id);
    });

    el.addEventListener('click', e => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (!action) return;
      if (action === 'el-new') { openEstimateSettings(null, widgetId); return; }
      if (action === 'el-show-archived') { showArchived = e.target.checked; _render(); return; }
      if (action === 'el-group-select') {
        groupSelect = !groupSelect;
        el.classList.toggle('is-group-select', groupSelect);
        actionBar.style.display = groupSelect ? '' : 'none';
        _render();
        return;
      }
      if (action === 'el-group-cancel') {
        groupSelect = false;
        el.classList.remove('is-group-select');
        actionBar.style.display = 'none';
        _render();
        return;
      }
      if (action === 'el-archive-sel') {
        el.querySelectorAll('.el-row-chk:checked').forEach(cb => {
          const est = _EST_LIST_MOCK.find(x => x.estimateId === cb.dataset.id);
          if (est) est.status = 'Archived';
        });
        groupSelect = false; el.classList.remove('is-group-select'); actionBar.style.display = 'none'; _render();
        return;
      }
      if (action === 'el-delete-sel') {
        const ids = [...el.querySelectorAll('.el-row-chk:checked')].map(cb => cb.dataset.id);
        if (ids.length && confirm(`Delete ${ids.length} estimate${ids.length === 1 ? '' : 's'}?`)) {
          ids.forEach(id => { const i = _EST_LIST_MOCK.findIndex(x => x.estimateId === id); if (i >= 0) _EST_LIST_MOCK.splice(i, 1); });
          groupSelect = false; el.classList.remove('is-group-select'); actionBar.style.display = 'none'; _render();
        }
        return;
      }
      if (action === 'el-filter') { alert('Filter: wired in full-stack build.'); return; }
    });
  }

  /* ── Estimate Summary Card ───────────────────────────────── */

  function _estSummaryHTML(est) {
    const statusCls = _elStatusCls(est.status);
    const price     = est.totalPrice ? ('$' + Number(est.totalPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })) : '—';
    return `<div class="sp-widget el-summary-card">
      <div class="el-summary-body">
        <div class="el-summary-client">${est.clientName}</div>
        <div class="el-summary-name">${est.estimateName}</div>
        <div class="el-summary-addr">${est.address}</div>
        <div class="el-summary-row">
          <span class="el-summary-lbl">Status</span>
          <span class="el-badge ${statusCls}">${est.status}</span>
        </div>
        <div class="el-summary-row">
          <span class="el-summary-lbl">Total Price</span>
          <span class="el-summary-val">${price}</span>
        </div>
        <div class="el-summary-row">
          <span class="el-summary-lbl">Started</span>
          <span class="el-summary-val">${est.dateStarted}</span>
        </div>
        <div class="el-summary-row">
          <span class="el-summary-lbl">Modified</span>
          <span class="el-summary-val">${est.dateModified}</span>
        </div>
        <div class="el-summary-row">
          <span class="el-summary-lbl">Costbook</span>
          <span class="el-summary-val">${est.costbook || '—'}</span>
        </div>
        ${est.notes ? `<div class="el-summary-notes">${est.notes}</div>` : ''}
        <div class="el-summary-btns">
          <button class="btn-primary sp-btn"    data-action="esc-open">Open Estimate</button>
          <button class="btn-secondary sp-btn"  data-action="esc-settings">Estimate Settings</button>
          <button class="btn-secondary sp-btn"  data-action="esc-archive">Archive</button>
          <button class="btn-secondary sp-btn el-danger-btn" data-action="esc-delete">Delete</button>
        </div>
      </div>
    </div>`;
  }

  function openEstimateSummary(est, posOpts) {
    const id    = 'estimate-summary-' + est.estimateId;
    const cardW = 300;
    const opts  = { width: cardW, autoHeight: true, minWidth: 260, category: 'estimating', noDock: true };
    if (posOpts) {
      const ws   = document.querySelector('.workspace');
      opts.left  = Math.max(0, Math.min(posOpts.left, (ws ? ws.clientWidth : 9999) - cardW - 8));
      opts.top   = posOpts.top;
    }
    if (WidgetManager.open(id, 'Estimate Summary', _estSummaryHTML(est), opts) !== false) {
      _bindEstimateSummary(id, est);
      WidgetManager.resizeToContent(id);
    }
  }

  function _bindEstimateSummary(widgetId, est) {
    const el = document.getElementById('widget-' + widgetId);
    if (!el) return;
    el.addEventListener('click', e => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (!action) return;
      if (action === 'esc-open')     { openEstimate(est.estimateId); WidgetManager.close(widgetId); return; }
      if (action === 'esc-settings') { openEstimateSettings(est.estimateId, widgetId); return; }
      if (action === 'esc-archive')  { est.status = 'Archived'; WidgetManager.close(widgetId); return; }
      if (action === 'esc-delete')   {
        if (confirm(`Delete "${est.estimateName}"?`)) {
          const i = _EST_LIST_MOCK.findIndex(x => x.estimateId === est.estimateId);
          if (i >= 0) _EST_LIST_MOCK.splice(i, 1);
          WidgetManager.close(widgetId);
        }
      }
    });
  }

  /* ── Public API ───────────────────────────────────────────── */
  return { openCostbook, openEditCostItem, openPriceList, openEditPriceItem, openEstimate, openEstimateSettings, openEstimateList, openTransfer };

}());
