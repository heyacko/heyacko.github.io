// calc.js  — keep this DOM-free and side-effect free

export const DEFAULTS = {
  mode: 'B',
  budget: 10_000,
  targetMonths: 2,
  numBodegas: 10,
  brokerFee: 200,
  actPct: 1,
  reloadPct: 3.25,
  flatFee: 0.25,
  newVisitors: 50,
  recurringVisitors: 120,
  transitPct: 90,
  activationConv: 10,
  reloadConv: 50,
  avgInitial: 20,
  avgReload: 25,
  maxBodegas: null
};

// Export ONE thing: compute(state) returns all derived metrics.
export function compute(s){
  const transit    = (s.transitPct||0)/100;
  const actConv    = (s.activationConv||0)/100;
  const reloadConv = (s.reloadConv||0)/100;
  const actPct     = (s.actPct||0)/100;
  const reloadPct  = (s.reloadPct||0)/100;

  // --- Per-bodega monthly activity ---
  const perBodegaActivations = (s.newVisitors||0) * transit * actConv;
  const perBodegaReloads     = (s.recurringVisitors||0) * transit * reloadConv;

  // --- Per-bodega monthly payout (to bodega) ---
  // From activation %, reload %, and flat fees
  const pAct   = perBodegaActivations * (s.avgInitial||0) * actPct;    // activations × avg_initial × activation%
  const pReload= perBodegaReloads     * (s.avgReload||0)  * reloadPct; // reloads × avg_reload × reload%
  const pFlat  = (perBodegaActivations + perBodegaReloads) * (s.flatFee||0); // (activations+reloads) × flat_fee
  const perBodegaPayout = pAct + pReload + pFlat;

  // NOTE: Broker payout is now a ONE-TIME per-bodega fee, not monthly.

  // Common result bits
  const base = {
    perBodegaActivations, perBodegaReloads,
    pAct, pReload, pFlat, perBodegaPayout
  };

  if (s.mode === 'A'){
    // ---- Mode A: given budget + target months, solve max bodegas ----
    const T = Math.max(1, Math.floor(s.targetMonths||0));

    // Budget per bodega over the program = T * perBodegaPayout + brokerFee(one-time)
    const perBodegaProgramCost = T * perBodegaPayout + (s.brokerFee||0);
    let maxBodegas = perBodegaProgramCost > 0
      ? Math.floor((s.budget||0) / perBodegaProgramCost)
      : 0;

    // Optional external cap
    if (s.maxBodegas != null) {
      maxBodegas = Math.min(maxBodegas, Math.max(0, Math.floor(s.maxBodegas)));
    }

    // Derived economics at that scale
    const totalBodegaPayoutMonth = maxBodegas * perBodegaPayout;    // monthly burn excludes broker (one-time)
    const monthlyBurn            = totalBodegaPayoutMonth;
    const brokerPayoutTotal      = maxBodegas * (s.brokerFee||0);   // one-time at start
    const totalCost              = (monthlyBurn * T) + brokerPayoutTotal;
    const remaining              = (s.budget||0) - totalCost;

    return {
      ...base, mode:'A',
      bodegas: maxBodegas,
      totalBodegaPayoutMonth,
      monthlyBurn,
      brokerPayoutTotal,     // one-time
      totalCost,
      remaining,
      exceed: totalCost > (s.budget||0)
    };
  }

  // ---- Mode B: given budget + bodegas, solve runway ----
  const bodegas = Math.max(0, Math.floor(s.numBodegas||0));
  const totalBodegaPayoutMonth = bodegas * perBodegaPayout;
  const monthlyBurn            = totalBodegaPayoutMonth;
  const brokerPayoutTotal      = bodegas * (s.brokerFee||0); // one-time at start
  const budgetAfterBroker      = (s.budget||0) - brokerPayoutTotal;

  let runwayExact;
  if (monthlyBurn <= 0) {
    // If there's no ongoing burn:
    // - if budgetAfterBroker > 0 -> effectively infinite runway
    // - else -> zero
    runwayExact = budgetAfterBroker > 0 ? Infinity : 0;
  } else {
    runwayExact = Math.max(0, budgetAfterBroker / monthlyBurn);
  }

  return {
    ...base, mode:'B',
    bodegas,
    totalBodegaPayoutMonth,
    monthlyBurn,
    brokerPayoutTotal,          // one-time
    runwayExact,
    runwayFloor: Math.floor(runwayExact),
    exceed: false
  };
}
