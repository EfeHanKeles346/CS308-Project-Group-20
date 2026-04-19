function formatPrice(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

function formatReviews(value) {
  if (value == null) return '0';
  if (value >= 1000) {
    const rounded = Math.round((value / 1000) * 10) / 10;
    return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded}K`;
  }
  return String(value);
}

function buildStars(rating) {
  const stars = [];
  let remaining = Number(rating) || 0;

  for (let index = 0; index < 5; index += 1) {
    if (remaining >= 1) {
      stars.push(1);
    } else if (remaining >= 0.5) {
      stars.push(0.5);
    } else {
      stars.push(0);
    }
    remaining -= 1;
  }

  return stars;
}

export function normalizeProduct(rawProduct) {
  if (!rawProduct) return null;

  const id = Number(rawProduct.id ?? rawProduct.productId);
  const price = Number(rawProduct.price ?? 0);
  const oldPrice = rawProduct.oldPrice == null || rawProduct.oldPrice === ''
    ? null
    : Number(rawProduct.oldPrice);
  const rating = Number(rawProduct.rating ?? 0);
  const reviews = Number(rawProduct.reviews ?? 0);
  const stock = Number(rawProduct.stock ?? 0);
  const tags = Array.isArray(rawProduct.tags) ? rawProduct.tags : [];

  return {
    ...rawProduct,
    id,
    productId: String(rawProduct.productId ?? id),
    price,
    oldPrice,
    rating,
    reviews,
    reviewsDisplay: rawProduct.reviewsDisplay || formatReviews(reviews),
    priceDisplay: rawProduct.priceDisplay || formatPrice(price),
    oldPriceDisplay: oldPrice ? (rawProduct.oldPriceDisplay || formatPrice(oldPrice)) : '',
    stars: Array.isArray(rawProduct.stars) && rawProduct.stars.length === 5
      ? rawProduct.stars
      : buildStars(rating),
    stock,
    quantity: Number(rawProduct.quantity ?? 0),
    tags,
    badgeType: rawProduct.badgeType || '',
    badge: rawProduct.badge || '',
  };
}

export function normalizeProducts(products) {
  return Array.isArray(products) ? products.map(normalizeProduct).filter(Boolean) : [];
}
