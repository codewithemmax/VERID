import type { Signal, Verdict } from '../../../shared/types';

export function buildExplanation(band: Verdict['band'], signals: Signal[]): string {
  if (signals.length === 0) {
    return 'No risk signals were detected on this listing.';
  }

  const top = signals[0]; // already sorted by weight desc from scoreListing

  if (band === 'block') {
    return `This listing shows a high-risk pattern: ${top.label.toLowerCase()}, combined with ${signals.length - 1} other warning signal${signals.length > 2 ? 's' : ''}.`;
  }

  if (band === 'caution') {
    if (signals.length === 1) {
      return `One unusual signal was detected: ${top.label.toLowerCase()}.`;
    }
    return `${signals.length} unusual signals were detected, including: ${top.label.toLowerCase()}.`;
  }

  // clear with signals (score low but something fired)
  return `A minor signal was noted (${top.label.toLowerCase()}), but the overall risk is low.`;
}
