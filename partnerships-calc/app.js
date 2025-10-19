// app.js — imports compute(), owns state, binds inputs, renders DOM.
import { DEFAULTS, compute } from './calc.js';

const $ = (s)=>document.querySelector(s);
const $$= (s)=>Array.from(document.querySelectorAll(s));

const fmtUSD = new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2});
const fmt0   = new Intl.NumberFormat('en-US',{maximumFractionDigits:0});
const clamp  = v => isFinite(v) ? Math.max(0,v) : 0;
const parseNum = el => clamp(parseFloat(el.value));
const parseOptInt = el => el.value.trim()===''? null : Math.max(0, Math.floor(+el.value||0));
const debounce=(fn,ms=120)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms)}};

let state = { ...DEFAULTS };

// DOM refs (match your existing IDs)
const refs = {
  modeRadios: $$('input[name="mode"]'),
  budget: $('#budget'),
  targetMonths: $('#targetMonths'),
  numBodegas: $('#numBodegas'),
  brokerFee: $('#brokerFee'),
  actPct: $('#actPct'),
  reloadPct: $('#reloadPct'),
  flatFee: $('#flatFee'),
  newVisitors: $('#newVisitors'),
  recurringVisitors: $('#recurringVisitors'),
  transitPct: $('#transitPct'),
  activationConv: $('#activationConv'),
  reloadConv: $('#reloadConv'),
  avgInitial: $('#avgInitial'),
  avgReload: $('#avgReload'),
  maxBodegas: $('#maxBodegas'),
  utilMsg: $('#utilMsg'),
  resetBtn: $('#resetBtn'),
  copyBtn: $('#copyBtn'),
  shareBtn: $('#shareBtn'),
};

function setVisByMode(mode){
  const showA = mode==='A';
  document.querySelectorAll('.only-mode-A').forEach(el=>el.style.display = showA?'':'none');
  document.querySelectorAll('.only-mode-B').forEach(el=>el.style.display = showA?'none':'');
}

function render(){
  setVisByMode(state.mode);
  const out = compute(state);

  // Activity
  $('#ob-activations').textContent = fmt0.format(out.perBodegaActivations);
  $('#ob-reloads').textContent     = fmt0.format(out.perBodegaReloads);

  // Payouts (per bodega)
  $('#ob-p-activation').textContent = fmtUSD.format(out.pAct);
  $('#ob-p-reload').textContent     = fmtUSD.format(out.pReload);
  $('#ob-p-flat').textContent       = fmtUSD.format(out.pFlat);
  $('#ob-p-total').textContent      = fmtUSD.format(out.perBodegaPayout);

  // KPIs
  $('#kpi-bodegaPayout').textContent = fmtUSD.format(out.perBodegaPayout);
  $('#kpi-brokerPayout').textContent = fmtUSD.format(out.brokerPayoutMonth ?? (out.perBodegaBroker * (out.bodegas||0)));
  $('#kpi-totalPayouts').textContent = fmtUSD.format(out.monthlyBurn);

  if(out.mode==='A'){
    $('#ob-max-bodegas').textContent = fmt0.format(out.bodegas);
    $('#ob-monthly-burn').textContent = fmtUSD.format(out.monthlyBurn);
    $('#ob-total-cost').textContent   = fmtUSD.format(out.totalCost);
    $('#ob-remaining').textContent    = fmtUSD.format(out.remaining);
    $('#ob-exceed').innerHTML         = out.exceed ? '<span class="state-bad">Yes</span>' : '<span class="state-ok">No</span>';
    $('#ob-runway').textContent = '—'; $('#ob-exhaust').textContent = '—';
    $('#mode-context').textContent = `Mode A: With ${fmt0.format(out.bodegas)} bodegas for ${fmt0.format(Math.max(1,Math.floor(state.targetMonths||0)))} months, total cost is ${fmtUSD.format(out.totalCost)} (monthly burn ${fmtUSD.format(out.monthlyBurn)}).`;
  }else{
    $('#ob-runway').textContent = isFinite(out.runwayExact) ? `${out.runwayExact.toFixed(2)} months (floor ${fmt0.format(out.runwayFloor)})` : '∞';
    $('#ob-monthly-burn').textContent = fmtUSD.format(out.monthlyBurn);
    $('#ob-total-cost').textContent = '—'; $('#ob-remaining').textContent='—'; $('#ob-exceed').textContent='—';
    $('#ob-max-bodegas').textContent = '—';
    $('#ob-exhaust').textContent = isFinite(out.runwayExact) ? `${out.runwayExact.toFixed(2)} months` : 'Never';
    $('#mode-context').textContent = `Mode B: With ${fmt0.format(out.bodegas)} bodegas, monthly burn is ${fmtUSD.format(out.monthlyBurn)} and runway is ~${out.runwayExact.toFixed(2)} months.`;
  }
}

function syncFromInputs(){
  const selected = refs.modeRadios.find(r=>r.checked);
  if(selected) state.mode = selected.value;

  state.budget = parseNum(refs.budget);
  state.targetMonths = Math.max(1, Math.floor(parseNum(refs.targetMonths)||0));
  state.numBodegas = Math.floor(parseNum(refs.numBodegas)||0);
  state.brokerFee = parseNum(refs.brokerFee);
  state.actPct = parseNum(refs.actPct);
  state.reloadPct = parseNum(refs.reloadPct);
  state.flatFee = parseNum(refs.flatFee);
  state.newVisitors = Math.floor(parseNum(refs.newVisitors)||0);
  state.recurringVisitors = Math.floor(parseNum(refs.recurringVisitors)||0);
  state.transitPct = Math.min(100, parseNum(refs.transitPct));
  state.activationConv = Math.min(100, parseNum(refs.activationConv));
  state.reloadConv = Math.min(100, parseNum(refs.reloadConv));
  state.avgInitial = parseNum(refs.avgInitial);
  state.avgReload = parseNum(refs.avgReload);
  state.maxBodegas = parseOptInt(refs.maxBodegas);
}

const onChange = debounce(()=>{ syncFromInputs(); render(); scheduleHashUpdate(); }, 120);

function syncInputs(){
  refs.modeRadios.forEach(r=>r.checked = (r.value===state.mode));
  refs.budget.value = state.budget;
  refs.targetMonths.value = state.targetMonths;
  refs.numBodegas.value = state.numBodegas;
  refs.brokerFee.value = state.brokerFee;
  refs.actPct.value = state.actPct;
  refs.reloadPct.value = state.reloadPct;
  refs.flatFee.value = state.flatFee;
  refs.newVisitors.value = state.newVisitors;
  refs.recurringVisitors.value = state.recurringVisitors;
  refs.transitPct.value = state.transitPct;
  refs.activationConv.value = state.activationConv;
  refs.reloadConv.value = state.reloadConv;
  refs.avgInitial.value = state.avgInitial;
  refs.avgReload.value = state.avgReload;
  refs.maxBodegas.value = state.maxBodegas ?? '';
}

function initBindings(){
  [
    refs.budget, refs.targetMonths, refs.numBodegas, refs.brokerFee,
    refs.actPct, refs.reloadPct, refs.flatFee, refs.newVisitors,
    refs.recurringVisitors, refs.transitPct, refs.activationConv, refs.reloadConv,
    refs.avgInitial, refs.avgReload, refs.maxBodegas
  ].forEach(el => { el.addEventListener('input', onChange); el.addEventListener('blur', onChange); });

  refs.modeRadios.forEach(r => r.addEventListener('change', onChange));

  refs.resetBtn.addEventListener('click', ()=>{
    state = { ...DEFAULTS };
    syncInputs(); render(); writeHash(); msg('Reset to defaults.');
  });
  refs.copyBtn.addEventListener('click', ()=>{
    navigator.clipboard.writeText(JSON.stringify(state,null,2)).then(()=>msg('Copied inputs to clipboard.'),()=>msg('Copy failed.'));
  });
  refs.shareBtn.addEventListener('click', ()=>{
    writeHash(); navigator.clipboard?.writeText(location.href).then(()=>msg('Shareable link copied.'),()=>msg('Link updated in address bar.'));
  });
}

function msg(t){ refs.utilMsg.textContent = t; setTimeout(()=>refs.utilMsg.textContent='', 2500); }

// URL hash (same format as before)
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
    return { ...DEFAULTS, ...JSON.parse(decodeURIComponent(escape(atob(s)))) };
  }catch(e){ return null; }
}

// Boot
(function init(){
  const restored = loadFromHash();
  if(restored) state = restored;
  syncInputs();
  setVisByMode(state.mode);
  initBindings();
  render();
})();
