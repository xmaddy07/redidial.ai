const NO_OF_SECTIONS = 5;

export const niceAxisMax = (value, sections = NO_OF_SECTIONS) => {
  const safe = Math.max(0, Number(value) || 0);
  if (safe === 0) return sections;
  const rough = safe / sections;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const normalized = rough / magnitude;
  let niceStep;
  if (normalized <= 1) niceStep = 1;
  else if (normalized <= 2) niceStep = 2;
  else if (normalized <= 5) niceStep = 5;
  else niceStep = 10;
  return niceStep * magnitude * sections;
};

/** Left axis: peak padded to ~120% (matches web TotalLeadsGraph). */
export const computeAxisMax = (values, peakMultiplier = 1.2) => {
  const nums = (Array.isArray(values) ? values : []).map((v) => Number(v) || 0);
  const peak = Math.max(...nums, 0);
  return niceAxisMax(peak > 0 ? peak * peakMultiplier : 0);
};

/** Right axis: min/max with padding (matches web computeAxisRange). */
export const computeAxisRange = (values) => {
  const nums = (Array.isArray(values) ? values : []).map((v) => Number(v) || 0);
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const span = Math.max(max - min, 1);
  const padding = Math.max(span * 0.08, 1);
  const axisMin = Math.floor(min - padding);
  const axisMax = Math.ceil(max + padding);
  return {
    axisMin,
    axisMax,
    range: axisMax - axisMin,
  };
};

export const DEFAULT_LEADS_CHART = {
  categories: Array(7).fill('-'),
  newLeads: Array(7).fill(0),
  totalLeads: Array(7).fill(0),
};

export function normalizeLeadsChartData(leadsData) {
  const leads = leadsData || {};
  const categories = Array.isArray(leads.categories) ? leads.categories : [];
  const newLeads = Array.isArray(leads.newLeads) ? leads.newLeads : [];
  const totalLeads = Array.isArray(leads.totalLeads) ? leads.totalLeads : [];

  if (!categories.length) {
    return { ...DEFAULT_LEADS_CHART };
  }

  const len = categories.length;
  return {
    categories,
    newLeads: Array.from({ length: len }, (_, i) => Number(newLeads[i]) || 0),
    totalLeads: Array.from({ length: len }, (_, i) => Number(totalLeads[i]) || 0),
  };
}
