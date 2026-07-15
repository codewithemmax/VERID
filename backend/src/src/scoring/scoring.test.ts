import { scoreListing } from './score-listing';
import { SignalInput } from '../../../shared/types';

const BASE: SignalInput = {
  sellerAccountAgeDays: 365,
  sellerReviewCount: 50,
  offplatform_contact: false,
  image_synthetic_probability: 0,
  price: 10000,
  categoryMedianPrice: 10000,
  urgency_score: 0,
  description_specificity: 0.8,
  review_template_similarity: 0,
  review_product_mismatch: false,
  reviews: [],
};

test('new account only → 12, clear', () => {
  const result = scoreListing({ ...BASE, sellerAccountAgeDays: 7 });
  expect(result.score).toBe(12);
  expect(result.band).toBe('clear');
});

test('honest seller, new account, priced to move → 33, caution', () => {
  const result = scoreListing({
    ...BASE,
    sellerAccountAgeDays: 7,
    price: 6000, // 40% below 10000
    categoryMedianPrice: 10000,
  });
  expect(result.score).toBe(33);
  expect(result.band).toBe('caution');
});

test('off-platform contact alone → 24, clear', () => {
  const result = scoreListing({ ...BASE, offplatform_contact: true });
  expect(result.score).toBe(24);
  expect(result.band).toBe('clear');
});

test('aged account, stolen photos, templated reviews → 47, caution', () => {
  const result = scoreListing({
    ...BASE,
    image_synthetic_probability: 0.9,
    review_template_similarity: 0.8,
    review_product_mismatch: true,
  });
  expect(result.score).toBe(47);
  expect(result.band).toBe('caution');
});

test('full scam pattern → 100, block', () => {
  const result = scoreListing({
    ...BASE,
    sellerAccountAgeDays: 7,
    offplatform_contact: true,
    image_synthetic_probability: 0.9,
    price: 6000,
    categoryMedianPrice: 10000,
    review_template_similarity: 0.8,
  });
  expect(result.score).toBe(100);
  expect(result.band).toBe('block');
});
