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

  /* ── Map a raw DB_Costbook sheet row to the internal format ── */
  function _mapRow(row, index) {
    return {
      divNum:      String(row.Division_Number    || '').trim(),
      divName:     String(row.Division_Name      || '').trim(),
      subNum:      String(row.Subdivision_Number || '').trim(),
      subName:     String(row.Subdivision_Name   || '').trim(),
      sortWeight:  parseFloat(row.Sort_Weight)   || index,
      itemId:      String(row.Item_ID            || '').trim(),
      description: String(row.Item_Description  || '').trim(),
      uom:         String(row.Unit_Of_Measure    || '').trim(),
      labor:       parseFloat(row.Cost_Labor)        || 0,
      material:    parseFloat(row.Cost_Material)     || 0,
      sub:         parseFloat(row.Cost_Subcontractor)|| 0,
      equipment:   parseFloat(row.Cost_Equipment)    || 0,
      other:       parseFloat(row.Cost_Other)        || 0,
      laborHours:  parseFloat(row.Labor_Hours)       || 0,
      masterItemId: String(row.Master_Item_ID || '').trim(),
      specs:       String(row.Item_Specifications || '').trim(),
      // Waste factor % per cost type (columns pending in sheet)
      wasteMaterial:  parseFloat(row.Waste_Material)  || 0,
      wasteLabor:     parseFloat(row.Waste_Labor)     || 0,
      wasteSub:       parseFloat(row.Waste_Sub)       || 0,
      wasteEquipment: parseFloat(row.Waste_Equipment) || 0,
      wasteOther:     parseFloat(row.Waste_Other)     || 0,
      // Is_Allowance flags per cost type (columns pending in sheet)
      allowMaterial:  _truthy(row.Allow_Material),
      allowLabor:     _truthy(row.Allow_Labor),
      allowSub:       _truthy(row.Allow_Sub),
      allowEquipment: _truthy(row.Allow_Equipment),
      allowOther:     _truthy(row.Allow_Other),
      // Tax % — applies to Material only (columns pending in sheet)
      tax: parseFloat(row.Tax_Pct) || 0,
      // Vendor and archived state (columns pending in sheet)
      vendor:     String(row.Preferred_Vendor || '').trim(),
      isArchived: _truthy(row.Is_Archived),
      // Dates (columns pending in sheet)
      dateCreated:  String(row.Date_Created  || '').trim(),
      dateModified: String(row.Date_Modified || '').trim(),
    };
  }

  /* ── Helpers ──────────────────────────────────────────────── */

  function _truthy(v) {
    return v === true || v === 'TRUE' || v === 'true' || v === 1 || v === '1';
  }

  function _fmt(n) {
    if (!n) return '';
    return n.toFixed(2);
  }

  /* Base unit cost for costbook grid display — no adjustments applied */
  function _unitCost(item) {
    return (item.labor || 0) + (item.material || 0) + (item.sub || 0) + (item.equipment || 0) + (item.other || 0);
  }

  /* Full unit cost with per-row waste factor and Tax % on material — used in ECI */
  function _eciCalcTotal(item) {
    const mat = (item.material  || 0) * (1 + (item.wasteMaterial  || 0) / 100);
    const tax = mat * ((item.tax || 0) / 100);
    const lab = (item.labor     || 0) * (1 + (item.wasteLabor     || 0) / 100);
    const sub = (item.sub       || 0) * (1 + (item.wasteSub       || 0) / 100);
    const eqp = (item.equipment || 0) * (1 + (item.wasteEquipment || 0) / 100);
    const oth = (item.other     || 0) * (1 + (item.wasteOther     || 0) / 100);
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

  function _costbookHTML(tree) {
    // Nav: division names only, no number
    const navDivs = tree.map(div => `
      <div class="cb-nav-div" data-div="${div.divNum}">
        <span class="cb-nav-div-name">${div.divName}</span>
      </div>
    `).join('');

    const gridRows = tree.map(div => `
      <div class="cb-row cb-row-div" data-div="${div.divNum}" data-expanded="false">
        <span class="cb-drag-handle">&#8942;&#8942;</span>
        <span></span>
        <span class="cb-expand-icon">&#9654;</span>
        <span class="cb-row-div-name">${div.divName}</span>
        <span class="cb-col-uom"></span>
        <span class="cb-col-labor"></span>
        <span class="cb-col-mat"></span>
        <span class="cb-col-subc"></span>
        <span class="cb-col-equip"></span>
        <span class="cb-col-other"></span>
        <span class="cb-col-unit"></span>
        <span class="cb-col-specs"></span>
      </div>
      ${div.subs.map(sub => `
        <div class="cb-row cb-row-sub" data-div="${div.divNum}" data-sub="${sub.subNum}" data-expanded="false" style="display:none">
          <span class="cb-drag-handle">&#8942;&#8942;</span>
          <span></span>
          <span class="cb-expand-icon">&#9654;</span>
          <span class="cb-row-sub-name">${sub.subName}</span>
          <span class="cb-col-uom"></span>
          <span class="cb-col-labor"></span>
          <span class="cb-col-mat"></span>
          <span class="cb-col-subc"></span>
          <span class="cb-col-equip"></span>
          <span class="cb-col-other"></span>
          <span class="cb-col-unit"></span>
          <span class="cb-col-specs"></span>
        </div>
        ${sub.items.map(item => {
          const uc = _unitCost(item);
          return `
          <div class="cb-row cb-row-item" data-div="${div.divNum}" data-sub="${sub.subNum}" data-item="${item.itemId}" draggable="true" style="display:none">
            <span class="cb-drag-handle">&#8942;&#8942;</span>
            <input type="checkbox" class="cb-tag cb-tag-item" data-item="${item.itemId}" data-div="${div.divNum}" data-sub="${sub.subNum}">
            <span class="cb-expand-icon"></span>
            <span class="cb-col-desc">${item.description}</span>
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
      `).join('')}
    `).join('');

    return `
      <div class="cb-widget">

        <div class="cb-toolbar">
          <div class="cb-toolbar-nav"></div>
          <div class="cb-toolbar-main">
            <input class="cb-nav-search" type="text" placeholder="Search items..." autocomplete="off">
            <button class="btn-secondary cb-btn" data-action="expand-all">Expand All</button>
            <button class="btn-secondary cb-btn" data-action="collapse-all">Collapse All</button>
            <span class="cb-tag-count" data-count="0"></span>
            <button class="btn-primary cb-btn" data-action="transfer" disabled>Transfer Selected</button>
          </div>
        </div>

        <div class="cb-body">

          <!-- Left: Division navigator -->
          <div class="cb-nav">
            <div class="cb-nav-header">Divisions</div>
            <div class="cb-nav-list">${navDivs}</div>
          </div>

          <!-- Resizable divider -->
          <div class="cb-panel-resize"></div>

          <!-- Right: Grid -->
          <div class="cb-main">
            <div class="cb-header">
              <span class="cb-header-grip"></span>
              <span class="cb-header-tag">Tag</span>
              <span class="cb-header-expand"></span>
              <span class="cb-col-desc cb-rz-hd" data-col="--cb-w-desc">Description<span class="cb-col-resize"></span></span>
              <span class="cb-col-uom cb-rz-hd" data-col="--cb-w-uom">U/M<span class="cb-col-resize"></span></span>
              <span class="cb-col-labor cb-rz-hd" data-col="--cb-w-labor">Labor<span class="cb-col-resize"></span></span>
              <span class="cb-col-mat cb-rz-hd" data-col="--cb-w-mat">Material<span class="cb-col-resize"></span></span>
              <span class="cb-col-subc cb-rz-hd" data-col="--cb-w-subc">Sub<span class="cb-col-resize"></span></span>
              <span class="cb-col-equip cb-rz-hd" data-col="--cb-w-equip">Equip<span class="cb-col-resize"></span></span>
              <span class="cb-col-other cb-rz-hd" data-col="--cb-w-other">Other<span class="cb-col-resize"></span></span>
              <span class="cb-col-unit cb-rz-hd" data-col="--cb-w-unit">Unit Cost<span class="cb-col-resize"></span></span>
              <span class="cb-col-specs cb-rz-hd" data-col="--cb-w-specs">Specifications<span class="cb-col-resize"></span></span>
            </div>
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
    const navEl    = el.querySelector('.cb-nav');
    const resizeEl = el.querySelector('.cb-panel-resize');
    resizeEl.addEventListener('mousedown', function (e) {
      e.preventDefault();
      const startX = e.clientX;
      const startW = navEl.offsetWidth;
      document.body.classList.add('is-dragging');
      const toolbarNavEl = el.querySelector('.cb-toolbar-nav');
      function onMove(e) {
        const w = Math.max(80, Math.min(340, startW + (e.clientX - startX)));
        navEl.style.width = w + 'px';
        if (toolbarNavEl) toolbarNavEl.style.width = (w + 5) + 'px'; // nav + resize handle
      }
      function onUp() {
        document.body.classList.remove('is-dragging');
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });

    /* --- Tag count (items only, not div/sub header checkboxes) --- */
    function _updateTagCount() {
      const n = el.querySelectorAll('.cb-tag-item:checked').length;
      tagCountEl.textContent   = n > 0 ? `${n} item${n === 1 ? '' : 's'} selected` : '';
      tagCountEl.dataset.count = n;
      transferBtn.disabled     = n === 0;
    }

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
      divRow.querySelector('.cb-expand-icon').innerHTML = expanded ? '&#9654;' : '&#9660;';
      // Show/hide all sub rows for this div
      el.querySelectorAll(`.cb-row-sub[data-div="${divNum}"]`).forEach(sub => {
        sub.style.display = expanded ? 'none' : '';
        // Collapse sub when div collapses
        if (expanded) {
          sub.dataset.expanded = 'false';
          sub.querySelector('.cb-expand-icon').innerHTML = '&#9654;';
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
      subRow.querySelector('.cb-expand-icon').innerHTML = expanded ? '&#9654;' : '&#9660;';
      el.querySelectorAll(`.cb-row-item[data-div="${divNum}"][data-sub="${subNum}"], .cb-row-hdr[data-div="${divNum}"][data-sub="${subNum}"]`)
        .forEach(item => item.style.display = expanded ? 'none' : '');
    }

    /* --- Row clicks --- */
    rowsEl.addEventListener('click', function (e) {
      const divRow = e.target.closest('.cb-row-div');
      const subRow = e.target.closest('.cb-row-sub');
      if (divRow && !e.target.matches('.cb-tag, input')) _toggleDiv(divRow);
      if (subRow && !e.target.matches('.cb-tag, input')) _toggleSub(subRow);
    });

    /* --- Tag checkboxes (items and headers only) --- */
    rowsEl.addEventListener('change', function (e) {
      const cb = e.target;
      if (!cb.matches('.cb-tag-item')) return;
      _updateTagCount();
    });

    /* --- Expand All / Collapse All --- */
    el.querySelector('[data-action="expand-all"]').addEventListener('click', () => {
      el.querySelectorAll('.cb-row-div').forEach(row => {
        row.dataset.expanded = 'true';
        row.querySelector('.cb-expand-icon').innerHTML = '&#9660;';
      });
      el.querySelectorAll('.cb-row-sub').forEach(row => {
        row.style.display = '';
        row.dataset.expanded = 'true';
        row.querySelector('.cb-expand-icon').innerHTML = '&#9660;';
      });
      el.querySelectorAll('.cb-row-item, .cb-row-hdr').forEach(row => row.style.display = '');
    });

    el.querySelector('[data-action="collapse-all"]').addEventListener('click', () => {
      el.querySelectorAll('.cb-row-div').forEach(row => {
        row.dataset.expanded = 'false';
        row.querySelector('.cb-expand-icon').innerHTML = '&#9654;';
      });
      el.querySelectorAll('.cb-row-sub').forEach(row => {
        row.style.display = 'none';
        row.dataset.expanded = 'false';
        row.querySelector('.cb-expand-icon').innerHTML = '&#9654;';
      });
      el.querySelectorAll('.cb-row-item, .cb-row-hdr').forEach(row => row.style.display = 'none');
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
        <span class="cb-expand-icon"></span>
        <div class="cb-col-desc"><input class="cb-hdr-input" type="text" placeholder="Header label..."></div>
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
      const target = e.target.closest('.cb-row-sub, .cb-row-item, .cb-row-hdr');
      if (!target) return;
      e.preventDefault();
      _closeCtx();

      ctxMenu = document.createElement('div');
      ctxMenu.className = 'cb-ctx-menu';

      const addHdr = document.createElement('div');
      addHdr.className = 'cb-ctx-item';
      addHdr.textContent = '+ Add Header';
      addHdr.addEventListener('click', () => { _closeCtx(); _addHeaderAfter(target); });

      ctxMenu.appendChild(addHdr);
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
      openEditCostItem(itemRow.dataset.item);
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

    /* --- Search: filter grid rows directly --- */
    el.querySelector('.cb-nav-search') && el.querySelector('.cb-nav-search').addEventListener('input', function () {
      const q = this.value.trim().toLowerCase();
      if (!q) {
        // Restore fully collapsed state — reset all sub/div expanded flags and arrows
        el.querySelectorAll('.cb-row-sub').forEach(r => {
          r.style.display = 'none';
          r.dataset.expanded = 'false';
          r.querySelector('.cb-expand-icon').innerHTML = '&#9654;';
        });
        el.querySelectorAll('.cb-row-item, .cb-row-hdr').forEach(r => r.style.display = 'none');
        el.querySelectorAll('.cb-row-div').forEach(r => {
          r.style.display = '';
          r.dataset.expanded = 'false';
          r.querySelector('.cb-expand-icon').innerHTML = '&#9654;';
        });
        return;
      }
      // Show only items matching query, expand their parents
      el.querySelectorAll('.cb-row-div').forEach(divRow => {
        const divNum = divRow.dataset.div;
        let divMatch = false;
        el.querySelectorAll(`.cb-row-item[data-div="${divNum}"]`).forEach(itemRow => {
          const desc  = itemRow.querySelector('.cb-col-desc').textContent.toLowerCase();
          const code  = itemRow.querySelector(':last-child').textContent.toLowerCase();
          const match = desc.includes(q) || code.includes(q);
          itemRow.style.display = match ? '' : 'none';
          if (match) divMatch = true;
        });
        divRow.style.display = divMatch ? '' : 'none';
        if (divMatch) {
          divRow.dataset.expanded = 'true';
          divRow.querySelector('.cb-expand-icon').innerHTML = '&#9660;';
          el.querySelectorAll(`.cb-row-sub[data-div="${divNum}"]`).forEach(subRow => {
            subRow.style.display = '';
            subRow.dataset.expanded = 'true';
            subRow.querySelector('.cb-expand-icon').innerHTML = '&#9660;';
          });
          el.querySelectorAll(`.cb-row-hdr[data-div="${divNum}"]`).forEach(r => r.style.display = '');
        }
      });
    });
  }

  /* ── Edit Cost Item Widget ────────────────────────────────── */

  const _ECI_UOM = ['EA','SF','LF','SQ','CY','MO','DY','HR','LS','LOT','ALLOW','BF'];

  function _eciDivisions() {
    const raw = AppData.tables['DB_Costbook'] || [];
    const seen = new Map();
    raw.forEach(r => {
      const num  = String(r.Division_Number || '').trim();
      const name = String(r.Division_Name   || '').trim();
      if (num && name && !seen.has(num)) seen.set(num, name);
    });
    return [...seen.entries()].map(([num, name]) => ({ num, name }));
  }

  function _eciSubs(divNum) {
    const raw = AppData.tables['DB_Costbook'] || [];
    const seen = new Map();
    raw.filter(r => String(r.Division_Number || '').trim() === divNum)
       .forEach(r => {
         const num  = String(r.Subdivision_Number || '').trim();
         const name = String(r.Subdivision_Name   || '').trim();
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

    /* Helper: one cost row — cost input | waste input | allow checkbox | formula btn or spacer */
    function costRow(label, costField, wasteField, allowField, hasFormula) {
      return `
        <span class="eci-cost-label">${label}</span>
        <input class="eci-input eci-cost-input" type="number" min="0" step="0.01"
          data-field="${costField}" value="${nv(item[costField])}" placeholder="0.00">
        <input class="eci-waste-inp" type="number" min="-100" step="0.1"
          data-field="${wasteField}" value="${nv(item[wasteField])}" placeholder="">
        <input type="checkbox" class="eci-allow-cb" data-field="${allowField}"${cb(item[allowField])}>
        ${hasFormula
          ? `<button class="btn-secondary cb-btn eci-formula-btn" title="Formula builder (coming soon)">ƒ</button>`
          : '<span></span>'}`;
    }

    return `
      <div class="eci-widget">

        <!-- Toolbar: Add New | Copy | Save & New | Archive — Prev Item | Next Item (locked right) -->
        <div class="eci-toolbar">
          <button class="btn-secondary cb-btn eci-new-btn">Add New</button>
          <button class="btn-secondary cb-btn eci-copy-btn">Copy</button>
          <button class="btn-primary cb-btn eci-save-new-btn">Save &amp; New</button>
          <label class="eci-archive-label">
            Archive <input type="checkbox" class="eci-active-cb" data-field="isArchived"${cb(item.isArchived)}>
          </label>
          <div class="eci-tb-right">
            <button class="btn-secondary cb-btn eci-prev-btn">&#8249; Prev Item</button>
            <button class="btn-secondary cb-btn eci-next-btn">Next Item &#8250;</button>
          </div>
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
                <span class="eci-label">Pref. Vendor</span>
                <input class="eci-input eci-vendor-inp" type="text"
                  data-field="vendor" value="${(item.vendor || '').replace(/"/g, '&quot;')}" placeholder="Supplier...">
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
                <span class="eci-cost-col-hdr" style="text-align:center">Waste<br>Factor</span>
                <span class="eci-cost-col-hdr" style="text-align:center">Allow</span>
                <span></span>

                ${costRow('Material',     'material',  'wasteMaterial',  'allowMaterial',  true)}
                ${costRow('Labor',        'labor',     'wasteLabor',     'allowLabor',     true)}
                ${costRow('Subcontractor','sub',       'wasteSub',       'allowSub',       true)}
                ${costRow('Equipment',    'equipment', 'wasteEquipment', 'allowEquipment', false)}
                ${costRow('Other',        'other',     'wasteOther',     'allowOther',     false)}

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
              <button class="btn-secondary cb-btn eci-add-alias-btn">+ Add Alias</button>
              <button class="btn-primary cb-btn eci-confirm-alias-btn" style="display:none">Add</button>
              <button class="btn-secondary cb-btn eci-cancel-alias-btn" style="display:none">Cancel</button>
            </div>
          </div>

          <!-- Formula placeholder -->
          <div class="eci-formula-bar">
            <button class="btn-secondary cb-btn" disabled title="Formula builder — coming in a future update">ƒ Formula</button>
            <span class="eci-formula-placeholder">Formula builder — coming soon</span>
          </div>

        </div><!-- /.eci-body -->

        <!-- Footer: Delete (left) | Cancel | Save & Close (locked right) -->
        <div class="eci-footer">
          <button class="btn-secondary cb-btn eci-delete-btn">Delete</button>
          <div class="eci-footer-right">
            <button class="btn-secondary cb-btn eci-cancel-btn">Cancel</button>
            <button class="btn-primary cb-btn eci-save-close-btn">Save &amp; Close</button>
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
      const w = f => parseFloat(el.querySelector(`.eci-waste-inp[data-field="${f}"]`)?.value) || 0;
      const taxPct = parseFloat(el.querySelector('.eci-tax-pct')?.value) || 0;
      const mat = v('material') * (1 + w('wasteMaterial') / 100);
      const tax = mat * (taxPct / 100);
      const total = mat + tax
        + v('labor')     * (1 + w('wasteLabor')     / 100)
        + v('sub')       * (1 + w('wasteSub')       / 100)
        + v('equipment') * (1 + w('wasteEquipment') / 100)
        + v('other')     * (1 + w('wasteOther')     / 100);
      const tv = el.querySelector('.eci-total-value');
      if (tv) tv.textContent = _fmt(total) || '0.00';
    }

    el.querySelectorAll('.eci-cost-input, .eci-waste-inp, .eci-tax-pct')
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
      openEditCostItem(masterItems[idx].itemId);
    }

    el.querySelector('.eci-prev-btn')?.addEventListener('click', () => _navTo(curIdx - 1));
    el.querySelector('.eci-next-btn')?.addEventListener('click', () => _navTo(curIdx + 1));

    el.querySelector('.eci-new-btn')?.addEventListener('click', () => {
      WidgetManager.close(wid);
      openEditCostItem(null); /* null = new blank item */
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
      openEditCostItem(null);
    });

    el.querySelector('.eci-cancel-btn')?.addEventListener('click', () => {
      WidgetManager.close(wid);
    });
  }

  function openEditCostItem(itemId) {
    const raw      = AppData.tables['DB_Costbook'] || [];
    const allItems = raw.filter(r => r.Item_Description).map(_mapRow);

    /* null itemId = new blank item (TODO: full new-item form) */
    if (!itemId) return;

    let item = allItems.find(i => i.itemId === itemId);
    if (!item) return;

    /* Resolve alias → always edit the master */
    if (item.masterItemId) {
      item = allItems.find(i => i.itemId === item.masterItemId) || item;
    }

    const aliases = allItems.filter(i => i.masterItemId === item.itemId);

    const wid = 'edit-cost-item';
    if (WidgetManager.open(wid, 'Edit Cost Item', _eciHTML(item, aliases), {
      width: 550, height: 650, category: 'estimating',
    }) !== false) {
      _bindECI(wid, item, allItems);
    }
  }

  /* ── Public: open costbook widget ────────────────────────── */

  async function openCostbook() {
    await AppData.ready;
    const raw  = AppData.tables['DB_Costbook'];
    const data = (raw && raw.length)
      ? raw.filter(r => r.Item_Description).map(_mapRow)
      : COSTBOOK_FALLBACK;
    const id   = 'costbook';
    const tree = _buildTree(data);
    if (WidgetManager.open(id, 'Costbook', _costbookHTML(tree), {
      width: 1060, height: 620, category: 'estimating',
    }) !== false) {
      _bindCostbook(id);
    }
  }

  /* ── Public API ───────────────────────────────────────────── */
  return { openCostbook, openEditCostItem };

}());
