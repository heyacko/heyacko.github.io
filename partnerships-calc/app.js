// app.js — schema-driven inputs + rendering. Imports pure compute().
import { DEFAULTS, compute } from './calc.js';

/* ---------------- Utilities ---------------- */
const $  = (s)=>document.querySelector(s);
const $$ = (s)=>Array.from(document.querySelectorAll(s));

const fmtUSD = new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2});
const fmt0   = new Intl.NumberFormat('en-US',{maximumFractionDigits:0});

const clamp  = v => (isFinite(v) ? Math.max(0, v) : 0);
const parseNumEl = el => clamp(parseFloat(el?.value));
const parseOptIntEl = el => {
  if (!el) return null;
  const v = el.value.trim();
  if (v === '') return null;
  const n = Math.floor(Number(v));
  return isFinite(n) ? Math.max(0, n) : null;
};
const debounce=(fn,ms=120)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms)}};

/* ---------------- App State ---------------- */
let state = { ...DEFAULTS };

/* ---------------- Declarative Input Schema ---------------- */
const INPUT_SCHEMA = [
  {
    key:'mode', emoji:'🎛️', title:'Mode', class:'group-mode',
    kind:'seg',
    options: [
      { value:'A', label:'Mode A: Given budget & months, compute max retailers' },
      { value:'B', label:'Mode B: Given budget & retailers, compute runway (months)' }
    ]
  },
  {
    key:'budget', emoji:'💸', title:'Budget & Horizon', class:'group-budget',
    fields: [
      { id:'budget', label:'Total campaign budget (USD)', type:'number', step:'0.01', min:'0',
        help:'Funds both retailers commissions and broker fees.' },
      { id:'targetMonths', label:'Target duration (months)', type:'number', step:'1', min:'1',
        help:'Visible in Mode A only.', mode:'A' },
      { id:'numRetailers', label:'Number of participating retailers', type:'number', step:'1', min:'0',
        help:'Visible in Mode B only.', mode:'B' }
    ]
  },
  {
    key:'broker', emoji:'🤝', title:'Broker Economics', class:'group-broker',
    fields: [
      { id:'brokerFee', label:'Broker fee per activation (USD)', type:'number', step:'0.01', min:'0',
        help:'Assume one broker handling all retailers.' }
    ]
  },
  {
    key:'comm', emoji:'🧾', title:'Retailer Commissions', class:'group-comm',
    fields: [
      { id:'actPct', label:'Commission on new activation (%)', type:'number', step:'0.01', min:'0',
        help:'Percent of initial load amount.' },
      { id:'reloadPct', label:'Commission on reload (%)', type:'number', step:'0.01', min:'0',
        help:'Percent of reload amount.' },
      { id:'flatFee', label:'Flat fee per transaction (USD)', type:'number', step:'0.01', min:'0',
        help:'Applies to both activations and reloads.' },
      { id:'activationBonus', label:'Promotional bonus per new activation (USD)', type:'number', step:'0.01', min:'0',
        help:'Extra bonus paid to retailer for each new activation.' }
    ]
  },
  {
    key:'traffic', emoji:'🚶', title:'Traffic & Conversion', class:'group-traffic',
    fields: [
      { id:'newVisitors', label:'Estimated monthly new visitors per retailer', type:'number', step:'1', min:'0' },
      { id:'recurringVisitors', label:'Estimated monthly recurring visitors per retailer', type:'number', step:'1', min:'0' },
      { id:'transitPct', label:'% of visitors who use public transit', type:'number', step:'0.01', min:'0', max:'100' },
      { id:'activationConv', label:'% of transit-using new visitors who activate', type:'number', step:'0.01', min:'0', max:'100' },
      { id:'reloadConv', label:'% of transit-using recurring visitors who reload (monthly)', type:'number', step:'0.01', min:'0', max:'100' }
    ]
  },
  {
    key:'amounts', emoji:'💵', title:'Amounts', class:'group-amounts',
    fields: [
      { id:'avgInitial', label:'Average initial load per activation (USD)', type:'number', step:'0.01', min:'0' },
      { id:'avgReload',  label:'Average reload amount (USD)', type:'number', step:'0.01', min:'0' }
    ]
  },
  {
    key:'revenue', emoji:'💰', title:'Revenue & Profit', class:'group-revenue',
    fields: [
      { id:'interchangeRate', label:'Interchange rate (%)', type:'number', step:'0.01', min:'0', max:'100',
        help:'Percentage of transit spend that becomes revenue.' },
      { id:'avgTransitTransactions', label:'Avg transit transactions per visitor per month', type:'number', step:'0.1', min:'0',
        help:'Average number of transit transactions per transit-using visitor per month.' },
      { id:'costPerTransaction', label:'Cost per transit transaction (USD)', type:'number', step:'0.01', min:'0',
        help:'Average cost of each transit transaction.' }
    ]
  },
  {
    key:'constraints', emoji:'🧱', title:'Constraints', class:'group-constraints',
    fields: [
      { id:'maxRetailers', label:'Max retailers available to onboard', type:'number', step:'1', min:'0',
        help:'Leave blank for no cap.' }
    ]
  }
];

/* ---------------- DOM Build from Schema ---------------- */
function buildInputs(mount){
  mount.innerHTML = '';

  for (const group of INPUT_SCHEMA){
    const sec = document.createElement('section');
    sec.className = `input-group ${group.class||''}`;
    const titleId = `${group.key}-title`;

    // Group header
    sec.innerHTML = `
      <div class="group-title">
        <span class="badge">${group.emoji||''}</span>
        <span id="${titleId}">${group.title}</span>
      </div>
    `;

    if (group.kind === 'seg'){
      const seg = document.createElement('div');
      seg.className = 'seg';
      seg.setAttribute('role','radiogroup');
      seg.setAttribute('aria-labelledby', titleId);
      seg.innerHTML = group.options.map(opt => `
        <label><input type="radio" name="mode" value="${opt.value}"> ${opt.label}</label>
      `).join('');
      sec.appendChild(seg);
      mount.appendChild(sec);
      continue;
    }

    const controls = document.createElement('div');
    controls.className = 'controls';
    controls.id = `group-${group.key}`;

    for (const f of group.fields){
      const field = document.createElement('div');
      field.className = 'field third';
      if (f.mode) field.dataset.mode = f.mode; // for CSS-based show/hide

      const helpId = f.help ? `${f.id}-help` : null;
      const inputmode = f.type === 'number'
        ? (f.step && String(f.step).includes('.') ? 'decimal' : 'numeric')
        : 'text';

      field.innerHTML = `
        <label for="${f.id}">${f.label}</label>
        <input id="${f.id}" type="${f.type||'text'}"
               ${f.step?`step="${f.step}"`:''} ${f.min?`min="${f.min}"`:''} ${f.max?`max="${f.max}"`:''}
               inputmode="${inputmode}" ${helpId?`aria-describedby="${helpId}"`:''} />
        ${f.help ? `<div id="${helpId}" class="help help--onfocus">${f.help}</div>` : ``}
      `;
      controls.appendChild(field);
    }

    sec.appendChild(controls);
    mount.appendChild(sec);
  }

  // Wire mode radios now that they exist
  const radios = $$('input[name="mode"]');
  radios.forEach(r => {
    r.checked = (r.value === state.mode);
    r.addEventListener('change', () => {
      state.mode = r.value;
      document.body.classList.toggle('mode-A', state.mode==='A');
      document.body.classList.toggle('mode-B', state.mode==='B');
      render();
      scheduleHashUpdate();
    });
  });
}

/* ---------------- Refs (after build) ---------------- */
let refs = {};
function collectRefs(){
  refs = {
    // inputs by id
    budget: $('#budget'),
    targetMonths: $('#targetMonths'),
    numRetailers: $('#numRetailers'),
    brokerFee: $('#brokerFee'),
    actPct: $('#actPct'),
    reloadPct: $('#reloadPct'),
    flatFee: $('#flatFee'),
    activationBonus: $('#activationBonus'),
    newVisitors: $('#newVisitors'),
    recurringVisitors: $('#recurringVisitors'),
    transitPct: $('#transitPct'),
    activationConv: $('#activationConv'),
    reloadConv: $('#reloadConv'),
    avgInitial: $('#avgInitial'),
    avgReload: $('#avgReload'),
    maxRetailers: $('#maxRetailers'),
    interchangeRate: $('#interchangeRate'),
    avgTransitTransactions: $('#avgTransitTransactions'),
    costPerTransaction: $('#costPerTransaction'),
    // mode radios
    modeRadios: $$('input[name="mode"]'),
    // utility buttons/labels
    resetBtn: $('#resetBtn'),
    copyBtn: $('#copyBtn'),
    shareBtn: $('#shareBtn'),
    utilMsg: $('#utilMsg')
  };
}

/* ---------------- View toggles ---------------- */
// Inputs: handled by CSS with body.mode-A / mode-B and [data-mode]
// Outputs: still use the old .only-mode-A / .only-mode-B rows
function setVisByMode(mode){
  const showA = mode === 'A';
  $$('.only-mode-A').forEach(el => el.style.display = showA ? '' : 'none');
  $$('.only-mode-B').forEach(el => el.style.display = showA ? 'none' : '');
}

/* ---------------- Render ---------------- */
function render(){
  setVisByMode(state.mode);
  const out = compute(state);

  // Activity
  $('#ob-activations').textContent = fmt0.format(out.perRetailerActivations);
  $('#ob-reloads').textContent     = fmt0.format(out.perRetailerReloads);

  // Per-retailer payouts
  $('#ob-p-activation').textContent = fmtUSD.format(out.pAct);
  $('#ob-p-reload').textContent     = fmtUSD.format(out.pReload);
  $('#ob-p-flat').textContent       = fmtUSD.format(out.pFlat);
  $('#ob-p-bonus').textContent      = fmtUSD.format(out.pBonus);
  $('#ob-p-total').textContent      = fmtUSD.format(out.perRetailerPayout);

  // KPIs
  $('#kpi-retailerPayout').textContent = fmtUSD.format(out.perRetailerPayout);
  $('#kpi-brokerPayout').textContent = fmtUSD.format(out.brokerPayoutTotal || 0);
  $('#kpi-totalPayouts').textContent = fmtUSD.format(out.monthlyBurn);

  // Revenue & Profit
  $('#ob-transit-visitors').textContent = fmt0.format(out.totalTransitVisitors);
  $('#ob-transit-spend').textContent = fmtUSD.format(out.totalTransitSpend);
  $('#ob-monthly-revenue').textContent = fmtUSD.format(out.monthlyRevenue);
  $('#ob-monthly-profit').textContent = fmtUSD.format(out.monthlyProfit);

  if(out.mode==='A'){
    $('#ob-max-retailers').textContent = fmt0.format(out.retailers);
    $('#ob-monthly-burn').textContent = fmtUSD.format(out.monthlyBurn);
    $('#ob-total-cost').textContent   = fmtUSD.format(out.totalCost);
    $('#ob-remaining').textContent    = fmtUSD.format(out.remaining);
    $('#ob-exceed').innerHTML         = out.exceed ? '<span class="state-bad">Yes</span>' : '<span class="state-ok">No</span>';
    $('#ob-runway').textContent = '—'; $('#ob-exhaust').textContent = '—';
    $('#mode-context').textContent = `Mode A: With ${fmt0.format(out.retailers)} retailers for ${fmt0.format(Math.max(1,Math.floor(state.targetMonths||0)))} months, total cost is ${fmtUSD.format(out.totalCost)} (monthly burn ${fmtUSD.format(out.monthlyBurn)}).`;
  }else{
    $('#ob-runway').textContent = isFinite(out.runwayExact) ? `${out.runwayExact.toFixed(2)} months (floor ${fmt0.format(out.runwayFloor)})` : '∞';
    $('#ob-monthly-burn').textContent = fmtUSD.format(out.monthlyBurn);
    $('#ob-total-cost').textContent = '—'; $('#ob-remaining').textContent='—'; $('#ob-exceed').textContent='—';
    $('#ob-max-retailers').textContent = '—';
    $('#ob-exhaust').textContent = isFinite(out.runwayExact) ? `${out.runwayExact.toFixed(2)} months` : 'Never';
    $('#mode-context').textContent = `Mode B: With ${fmt0.format(out.retailers)} retailers, monthly burn is ${fmtUSD.format(out.monthlyBurn)} and runway is ~${out.runwayExact.toFixed(2)} months.`;
  }
}

/* ---------------- State <-> Inputs ---------------- */
function syncFromInputs(){
  // Mode from radios
  const selected = refs.modeRadios.find(r => r.checked);
  if (selected) state.mode = selected.value;

  // Numeric values
  state.budget         = parseNumEl(refs.budget);
  state.targetMonths   = Math.max(1, Math.floor(parseNumEl(refs.targetMonths) || 0));
  state.numRetailers     = Math.floor(parseNumEl(refs.numRetailers) || 0);
  state.brokerFee      = parseNumEl(refs.brokerFee);
  state.actPct         = parseNumEl(refs.actPct);
  state.reloadPct      = parseNumEl(refs.reloadPct);
  state.flatFee        = parseNumEl(refs.flatFee);
  state.activationBonus = parseNumEl(refs.activationBonus);
  state.newVisitors    = Math.floor(parseNumEl(refs.newVisitors) || 0);
  state.recurringVisitors = Math.floor(parseNumEl(refs.recurringVisitors) || 0);
  state.transitPct     = Math.min(100, parseNumEl(refs.transitPct));
  state.activationConv = Math.min(100, parseNumEl(refs.activationConv));
  state.reloadConv     = Math.min(100, parseNumEl(refs.reloadConv));
  state.avgInitial     = parseNumEl(refs.avgInitial);
  state.avgReload      = parseNumEl(refs.avgReload);
  state.maxRetailers     = parseOptIntEl(refs.maxRetailers);
  state.interchangeRate = Math.min(100, parseNumEl(refs.interchangeRate));
  state.avgTransitTransactions = parseNumEl(refs.avgTransitTransactions);
  state.costPerTransaction = parseNumEl(refs.costPerTransaction);
}

const onChange = debounce(()=>{ syncFromInputs(); render(); scheduleHashUpdate(); }, 120);

function syncInputs(){
  // Radios
  refs.modeRadios.forEach(r => r.checked = (r.value === state.mode));
  // Values
  const assign = (el, v) => { if (el) el.value = v ?? ''; };
  assign(refs.budget, state.budget);
  assign(refs.targetMonths, state.targetMonths);
  assign(refs.numRetailers, state.numRetailers);
  assign(refs.brokerFee, state.brokerFee);
  assign(refs.actPct, state.actPct);
  assign(refs.reloadPct, state.reloadPct);
  assign(refs.flatFee, state.flatFee);
  assign(refs.activationBonus, state.activationBonus);
  assign(refs.newVisitors, state.newVisitors);
  assign(refs.recurringVisitors, state.recurringVisitors);
  assign(refs.transitPct, state.transitPct);
  assign(refs.activationConv, state.activationConv);
  assign(refs.reloadConv, state.reloadConv);
  assign(refs.avgInitial, state.avgInitial);
  assign(refs.avgReload, state.avgReload);
  assign(refs.maxRetailers, state.maxRetailers);
  assign(refs.interchangeRate, state.interchangeRate);
  assign(refs.avgTransitTransactions, state.avgTransitTransactions);
  assign(refs.costPerTransaction, state.costPerTransaction);
}

/* ---------------- Bindings ---------------- */
function initBindings(){
  // Input events
  [
    refs.budget, refs.targetMonths, refs.numRetailers, refs.brokerFee,
    refs.actPct, refs.reloadPct, refs.flatFee, refs.activationBonus, refs.newVisitors,
    refs.recurringVisitors, refs.transitPct, refs.activationConv, refs.reloadConv,
    refs.avgInitial, refs.avgReload, refs.maxRetailers, refs.interchangeRate,
    refs.avgTransitTransactions, refs.costPerTransaction
  ].forEach(el => { if(el){ el.addEventListener('input', onChange); el.addEventListener('blur', onChange); }});

  // Radios (already have change in buildInputs, but keep safety)
  refs.modeRadios.forEach(r => r.addEventListener('change', onChange));

  // Utility buttons
  refs.resetBtn?.addEventListener('click', ()=>{
    state = { ...DEFAULTS };
    syncInputs();
    document.body.classList.toggle('mode-A', state.mode==='A');
    document.body.classList.toggle('mode-B', state.mode==='B');
    render(); writeHash(); msg('Reset to defaults.');
  });
  refs.copyBtn?.addEventListener('click', ()=>{
    navigator.clipboard.writeText(JSON.stringify(state,null,2))
      .then(()=>msg('Copied inputs to clipboard.'),()=>msg('Copy failed.'));
  });
  refs.shareBtn?.addEventListener('click', ()=>{
    writeHash();
    navigator.clipboard?.writeText(location.href)
      .then(()=>msg('Shareable link copied.'),()=>msg('Link updated in address bar.'));
  });
}

function msg(t){ if(refs.utilMsg){ refs.utilMsg.textContent = t; setTimeout(()=>refs.utilMsg.textContent='', 2500); } }

/* ---------------- URL Hash (shareable link) ---------------- */
let hashT=null;
function scheduleHashUpdate(){ clearTimeout(hashT); hashT=setTimeout(writeHash, 250); }
function writeHash(){
  try{
    const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(state))));
    location.hash = 's='+b64;
  }catch(e){}
}
function loadFromHash(){
  const p = new URLSearchParams(location.hash.slice(1));
  const s = p.get('s'); if(!s) return null;
  try{
    const parsed = JSON.parse(decodeURIComponent(escape(atob(s))));
    return { ...DEFAULTS, ...parsed };
  }catch(e){ return null; }
}

/* ---------------- Boot ---------------- */
(function init(){
  // Restore state from URL if present
  const restored = loadFromHash();
  if (restored) state = restored;

  // Build inputs from schema
  const mount = $('#inputs-mount');
  buildInputs(mount);

  // Collect refs now that inputs exist
  collectRefs();

  // Push state values into inputs
  syncInputs();

  // Set initial mode class for CSS-driven visibility
  document.body.classList.toggle('mode-A', state.mode==='A');
  document.body.classList.toggle('mode-B', state.mode==='B');

  // Bind events
  initBindings();

  // Initial render
  render();
})();
