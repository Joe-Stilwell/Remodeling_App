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
      other:       parseFloat(row.Cost_Other)        || 0,
      specs:       String(row.Item_Specifications || '').trim(),
    };
  }

  /* ── Helpers ──────────────────────────────────────────────── */

  function _fmt(n) {
    if (!n) return '';
    return n.toFixed(2);
  }

  function _unitCost(item) {
    return (item.labor || 0) + (item.material || 0) + (item.sub || 0) + (item.other || 0);
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
    const CB_COL_VARS = ['--cb-w-desc','--cb-w-uom','--cb-w-labor','--cb-w-mat','--cb-w-subc','--cb-w-other','--cb-w-unit','--cb-w-specs'];

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
  return { openCostbook };

}());
