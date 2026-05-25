// Categories are now served from the backend (`GET /api/categories`) so the
// product manager can add/remove them at runtime. This file only keeps a
// presentational icon map so well-known categories still render a nice icon
// when the backend value is missing or generic.

export const CATEGORY_ICONS = {
  phones: 'fa-mobile-alt',
  computers: 'fa-laptop',
  laptops: 'fa-laptop',
  tv: 'fa-tv',
  headphones: 'fa-headphones',
  gaming: 'fa-gamepad',
  cameras: 'fa-camera',
  tablets: 'fa-tablet-alt',
  smartwatches: 'fa-clock',
  appliances: 'fa-blender',
  accessories: 'fa-plug',
  deals: 'fa-fire',
};

// Resolve an icon for a category. Prefer the explicit backend icon when it is a
// real value; fall back to the known map, then to a neutral box icon.
export function iconForCategory(id, backendIcon) {
  if (backendIcon && backendIcon !== 'fa-box') return backendIcon;
  return CATEGORY_ICONS[id] || backendIcon || 'fa-box';
}
