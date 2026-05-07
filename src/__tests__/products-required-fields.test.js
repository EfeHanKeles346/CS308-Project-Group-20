import { describe, it, expect } from 'vitest';
import products from '../data/products';

describe('products data', () => {
  it('has required fields for every product', () => {
    const requiredFields = ['id', 'brand', 'name', 'description', 'category', 'img', 'rating', 'reviews', 'price', 'priceDisplay', 'stars', 'stock', 'tags'];

    products.forEach((product) => {
      requiredFields.forEach((field) => {
        expect(product).toHaveProperty(field);
      });
    });
  });
});
