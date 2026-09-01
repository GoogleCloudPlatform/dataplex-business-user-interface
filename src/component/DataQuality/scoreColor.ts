/**
 * @file scoreColor.ts
 * @summary Shared score → color mapping used across Data Quality views
 * (live scan results in `DataQualityStatus.tsx` and the aspect-derived
 * fallback in `DataQualityScorecardView.tsx`).
 */

export const getScoreColor = (score: number) => {
  if (score >= 80) return { color: '#128937', dotShadow: '0px 0px 0px 2px #E6F4EA' };
  if (score >= 40) return { color: '#E37400', dotShadow: '0px 0px 0px 2px #FEF7E0' };
  return { color: '#C5221F', dotShadow: '0px 0px 0px 2px #FCE8E6' };
};
