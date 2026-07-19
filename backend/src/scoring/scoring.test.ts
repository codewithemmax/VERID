import { scoreListing } from './score-listing';
import { SignalInput } from '../../../shared/types';

const BASE: SignalInput = {
  sellerReviewCount: 50,
  sellerHasStorePage: true,
  sellerListingCount: 10,
  offplatform_contact: false,
  image_synthetic_probability: 0,
  urgency_score: 0,
  description_specificity: 0.8,
  review_template_similarity: 0,
  review_product_mismatch: false,
  reviews: [],
};

test('no store page only → 12, clear', () => {
  const result = scoreListing({ ...BASE, sellerHasStorePage: false });
  expect(result.score).toBe(12);
  expect(result.band).toBe('clear');
});

test('no store + single listing + no history → caution', () => {
  const result = scoreListing({
    ...BASE,
    sellerHasStorePage: false,
    sellerListingCount: 1,
    sellerReviewCount: 0,
  });
  // raw: 15+12+8=35, 1 layer ×0.80 = 28 → clear
  // but all three layer-1 signals fire → layer1Points=35, layer2=0, layer3=0 → 1 layer
  // 35 × 0.80 = 28 → clear
  expect(result.score).toBe(28);
  expect(result.band).toBe('clear');
});

test('off-platform contact alone → 24, clear', () => {
  const result = scoreListing({ ...BASE, offplatform_contact: true });
  expect(result.score).toBe(24);
  expect(result.band).toBe('clear');
});

test('aged account, stolen photos, templated reviews → caution', () => {
  const result = scoreListing({
    ...BASE,
    image_synthetic_probability: 0.9,
    review_template_similarity: 0.8,
    review_product_mismatch: true,
  });
  // raw: 20+15+12=47, 2 layers ×1.00 = 47 → caution
  expect(result.score).toBe(47);
  expect(result.band).toBe('caution');
});

test('full scam pattern → block', () => {
  const result = scoreListing({
    ...BASE,
    sellerHasStorePage: false,
    sellerListingCount: 1,
    sellerReviewCount: 0,
    offplatform_contact: true,
    image_synthetic_probability: 0.9,
    urgency_score: 0.8,
    review_template_similarity: 0.8,
    review_product_mismatch: true,
  });
  // Layer1: 15+12+8=35, Layer2: 30+20+12=62, Layer3: 15+12=27
  // raw=124, 3 layers ×1.25=155 → min(100,155)=100
  expect(result.score).toBe(100);
  expect(result.band).toBe('block');
});
