// calc.js  — keep this DOM-free and side-effect free

export const DEFAULTS = {
  mode: 'B',
  budget: 1_000_000,
  targetMonths: 12,
  numBodegas: 100,
  brokerFee: 200,
  actPct: 1,
  reloadPct: 3.25,
  flatFee: 0.25,
  newVisitors: 800,
  recurringVisitors: 2400,
  transitPct: 60,
  activationConv: 10,
  reloadConv: 50,
  avgInitial: 20,
  avgReload: 25,
  maxBodegas: null
};

// Export ONE thing: compute(state) returns all derived metrics.
export function compute(s){
  const transit = (s.transitPct||0)/100;
  const actConv = (s.activationConv||0)/100;
  const reloadConv = (s.reloadConv||0)/100;
  const actPct = (s.actPct||0)/100;
  const reloadPct = (s.reloadPct||0)/100;

  const perBodegaActivations = (s.newVisitors||0) * transit * actConv;
  const perBodegaReloads     = (s.recurringVisitors||0) * transit * reloadConv;

  const pAct   = perBodegaActivations * (s.avgInitial||0) * actPct;
  const pReload= perBodegaReloads     * (s.avgReload||0)  * reloadPct;
  const pFlat  = (perBodegaActivations + perBodegaReloads) * (s.flatFee||0);
  const perBodegaPayout = pAct + pReload + pFlat;

  const perBodegaBroker = perBodegaActivations * (s.brokerFee||0);
  const monthlyPerBodegaAllIn = perBodegaPayout + perBodegaBroker;

  let result = {
    perBodegaActivations, perBodegaReloads,
    pAct, pReload, pFlat, perBodegaPayout,
    perBodegaBroker, monthlyPerBodegaAllIn
  };

  if (s.mode === 'A'){
    const T = Math.max(1, Math.floor(s.targetMonths||0));
    const denom = T * monthlyPerBodegaAllIn;
    let maxBodegas = denom > 0 ? Math.floor((s.budget||0)/denom) : 0;
    if (s.maxBodegas != null) maxBodegas = Math.min(maxBodegas, Math.max(0, Math.floor(s.maxBodegas)));

    const totalActivationsAll = maxBodegas * perBodegaActivations;
    const brokerPayoutMonth = totalActivationsAll * (s.brokerFee||0);
    const totalBodegaPayoutMonth = maxBodegas * perBodegaPayout;
    const monthlyBurn = totalBodegaPayoutMonth + brokerPayoutMonth;
    const totalCost = maxBodegas * T * monthlyPerBodegaAllIn;
    const remaining = (s.budget||0) - totalCost;

    return {
      ...result, mode:'A', bodegas:maxBodegas,
      brokerPayoutMonth, totalBodegaPayoutMonth,
      monthlyBurn, totalCost, remaining,
      exceed: totalCost > (s.budget||0)
    };
  }

  const bodegas = Math.max(0, Math.floor(s.numBodegas||0));
  const totalActivationsAll = bodegas * perBodegaActivations;
  const brokerPayoutMonth = totalActivationsAll * (s.brokerFee||0);
  const totalBodegaPayoutMonth = bodegas * perBodegaPayout;
  const monthlyBurn = totalBodegaPayoutMonth + brokerPayoutMonth;
  const runwayExact = monthlyBurn > 0 ? (s.budget||0)/monthlyBurn : Infinity;

  return {
    ...result, mode:'B', bodegas,
    brokerPayoutMonth, totalBodegaPayoutMonth,
    monthlyBurn, runwayExact, runwayFloor: Math.floor(runwayExact),
    exceed:false
  };
}
