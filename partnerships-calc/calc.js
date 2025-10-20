// calc.js  — keep this DOM-free and side-effect free

export const DEFAULTS = {
  mode: 'B',
  budget: 10_000,
  targetMonths: 2,
  numRetailers: 10,
  brokerFee: 200,
  actPct: 1,
  reloadPct: 3.25,
  flatFee: 0.25,
  activationBonus: 0.50,
  newVisitors: 50,
  recurringVisitors: 120,
  transitPct: 90,
  activationConv: 10,
  reloadConv: 50,
  avgInitial: 20,
  avgReload: 25,
  maxRetailers: null,
  interchangeRate: 3.0,
  avgTransitTransactions: 20,
  costPerTransaction: 2.90
};

// Export ONE thing: compute(state) returns all derived metrics.
export function compute(s){
  const transit    = (s.transitPct||0)/100;
  const actConv    = (s.activationConv||0)/100;
  const reloadConv = (s.reloadConv||0)/100;
  const actPct     = (s.actPct||0)/100;
  const reloadPct  = (s.reloadPct||0)/100;

  // --- Per-retailer monthly activity ---
  const perRetailerActivations = (s.newVisitors||0) * transit * actConv;
  const perRetailerReloads     = (s.recurringVisitors||0) * transit * reloadConv;
  
  // Additional per-retailer metrics
  const perRetailerVisitors = (s.newVisitors||0) + (s.recurringVisitors||0); // total visitors per retailer
  const perRetailerRiders = perRetailerVisitors * transit; // transit-using visitors (riders) per retailer
  const perRetailerTransitTransactions = perRetailerRiders * (s.avgTransitTransactions||0); // transit transactions per retailer

  // --- Per-retailer monthly payout (to retailer) ---
  // From activation %, reload %, flat fees, and promotional bonus
  const pAct   = perRetailerActivations * (s.avgInitial||0) * actPct;    // activations × avg_initial × activation%
  const pReload= perRetailerReloads     * (s.avgReload||0)  * reloadPct; // reloads × avg_reload × reload%
  const pFlat  = (perRetailerActivations + perRetailerReloads) * (s.flatFee||0); // (activations+reloads) × flat_fee
  const pBonus = perRetailerActivations * (s.activationBonus||0);        // activations × bonus_per_activation
  
  // Base payout without promotional bonus
  const perRetailerPayoutBase = pAct + pReload + pFlat;
  
  // Total payout including promotional bonus
  const perRetailerPayout = perRetailerPayoutBase + pBonus;

  // NOTE: Broker payout is now a ONE-TIME per-retailer fee, not monthly.

  // Common result bits
  const base = {
    perRetailerActivations, perRetailerReloads,
    perRetailerVisitors, perRetailerRiders, perRetailerTransitTransactions,
    pAct, pReload, pFlat, pBonus, perRetailerPayoutBase, perRetailerPayout
  };

  if (s.mode === 'A'){
    // ---- Retailer Optimization: given budget + target months, solve max retailers ----
    const T = Math.max(1, Math.floor(s.targetMonths||0));

    // Budget per retailer over the program = T * perRetailerPayout + brokerFee(one-time)
    const perRetailerProgramCost = T * perRetailerPayout + (s.brokerFee||0);
    let maxRetailers = perRetailerProgramCost > 0
      ? Math.floor((s.budget||0) / perRetailerProgramCost)
      : 0;

    // Optional external cap
    if (s.maxRetailers != null) {
      maxRetailers = Math.min(maxRetailers, Math.max(0, Math.floor(s.maxRetailers)));
    }

    // Derived economics at that scale
    const totalRetailerPayoutMonth = maxRetailers * perRetailerPayout;    // monthly burn excludes broker (one-time)
    const monthlyBurn            = totalRetailerPayoutMonth;
    const brokerPayoutTotal      = maxRetailers * (s.brokerFee||0);   // one-time at start
    const totalCost              = (monthlyBurn * T) + brokerPayoutTotal;
    const remaining              = (s.budget||0) - totalCost;

    // --- Revenue & Profit Calculations ---
    const interchangeRate = (s.interchangeRate||0)/100;
    const avgTransitTransactions = s.avgTransitTransactions||0;
    const costPerTransaction = s.costPerTransaction||0;
    
    // Total transit-using visitors per month across all retailers
    const totalTransitVisitors = maxRetailers * ((s.newVisitors||0) + (s.recurringVisitors||0)) * transit;
    
    // Total transit spend per month
    const totalTransitSpend = totalTransitVisitors * avgTransitTransactions * costPerTransaction;
    
    // Revenue per month
    const monthlyRevenue = totalTransitSpend * interchangeRate;
    
    // Profit per month (Revenue - Monthly Burn)
    const monthlyProfit = monthlyRevenue - monthlyBurn;

    return {
      ...base, mode:'A',
      retailers: maxRetailers,
      totalRetailerPayoutMonth,
      monthlyBurn,
      brokerPayoutTotal,     // one-time
      totalCost,
      remaining,
      exceed: totalCost > (s.budget||0),
      totalTransitVisitors,
      totalTransitSpend,
      monthlyRevenue,
      monthlyProfit
    };
  }

  // ---- Runway Optimization: given budget + retailers, solve runway ----
  const retailers = Math.max(0, Math.floor(s.numRetailers||0));
  const totalRetailerPayoutMonth = retailers * perRetailerPayout;
  const monthlyBurn            = totalRetailerPayoutMonth;
  const brokerPayoutTotal      = retailers * (s.brokerFee||0); // one-time at start
  const budgetAfterBroker      = (s.budget||0) - brokerPayoutTotal;

  // --- Revenue & Profit Calculations ---
  const interchangeRate = (s.interchangeRate||0)/100;
  const avgTransitTransactions = s.avgTransitTransactions||0;
  const costPerTransaction = s.costPerTransaction||0;
  
  // Total transit-using visitors per month across all retailers
  const totalTransitVisitors = retailers * ((s.newVisitors||0) + (s.recurringVisitors||0)) * transit;
  
  // Total transit spend per month
  const totalTransitSpend = totalTransitVisitors * avgTransitTransactions * costPerTransaction;
  
  // Revenue per month
  const monthlyRevenue = totalTransitSpend * interchangeRate;
  
  // Profit per month (Revenue - Monthly Burn)
  const monthlyProfit = monthlyRevenue - monthlyBurn;

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
    retailers,
    totalRetailerPayoutMonth,
    monthlyBurn,
    brokerPayoutTotal,          // one-time
    runwayExact,
    runwayFloor: Math.floor(runwayExact),
    exceed: false,
    totalTransitVisitors,
    totalTransitSpend,
    monthlyRevenue,
    monthlyProfit
  };
}
