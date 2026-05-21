import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  addProductManagerCategory,
  addProductManagerProduct,
  archiveProductManagerProduct,
  decideProductManagerComment,
  fetchProductManagerCategories,
  fetchProductManagerComments,
  fetchProductManagerOrders,
  fetchProductManagerProducts,
  getInvoiceDownloadUrl,
  removeProductManagerCategory,
  updateProductManagerOrderStatus,
  updateProductManagerStock,
} from '../services/api';

const TABS = [
  { id: 'categories', label: 'Categories', icon: 'fa-layer-group' },
  { id: 'products', label: 'Products', icon: 'fa-boxes-stacked' },
  { id: 'orders', label: 'Orders', icon: 'fa-receipt' },
  { id: 'comments', label: 'Comments', icon: 'fa-comments' },
];

const ORDER_STATUSES = ['PROCESSING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'REFUND_REQUESTED', 'REFUNDED'];

function currency(amount) {
  if (amount == null || amount === '') return 'Not priced';
  const value = Number(amount) || 0;
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function dateTime(ms) {
  if (!ms) return '-';
  return new Date(ms).toLocaleString();
}

function rangeToMillis(fromDate, toDate) {
  return {
    from: fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : undefined,
    to: toDate ? new Date(`${toDate}T23:59:59`).getTime() : undefined,
  };
}

function DateFilters({ fromDate, toDate, setFromDate, setToDate, onApply }) {
  return (
    <div className="manager-filters">
      <label>
        <span>From</span>
        <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
      </label>
      <label>
        <span>To</span>
        <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
      </label>
      <button type="button" className="btn btn-primary" onClick={onApply}>
        <i className="fas fa-filter" />
        <span>Apply</span>
      </button>
    </div>
  );
}

function CategoriesTab() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [draft, setDraft] = useState({ name: '', icon: 'fa-box' });
  const [loading, setLoading] = useState(true);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    const result = await fetchProductManagerCategories();
    setLoading(false);
    if (!result.success) {
      showToast(result.error || 'Categories could not be loaded.', 'error');
      return;
    }
    setCategories(result.categories);
  }, [showToast]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const addCategory = async (event) => {
    event.preventDefault();
    const result = await addProductManagerCategory(draft);
    if (!result.success) {
      showToast(result.error || 'Category could not be added.', 'error');
      return;
    }
    setDraft({ name: '', icon: 'fa-box' });
    showToast('Category added.', 'success');
    loadCategories();
  };

  const removeCategory = async (categoryId) => {
    const result = await removeProductManagerCategory(categoryId);
    if (!result.success) {
      showToast(result.error || 'Category could not be removed.', 'error');
      return;
    }
    showToast('Category removed from storefront and its products were hidden.', 'success');
    loadCategories();
  };

  return (
    <>
      <form className="manager-form-grid" onSubmit={addCategory}>
        <label>
          <span>Name</span>
          <input value={draft.name} onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))} placeholder="Accessories" />
        </label>
        <label>
          <span>Icon</span>
          <input value={draft.icon} onChange={(event) => setDraft((prev) => ({ ...prev, icon: event.target.value }))} placeholder="fa-plug" />
        </label>
        <button type="submit" className="btn btn-primary">
          <i className="fas fa-plus" />
          <span>Add category</span>
        </button>
      </form>

      {loading ? <div className="manager-empty">Loading categories...</div> : (
        <div className="manager-table-wrap">
          <table className="manager-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Icon</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td><strong>{category.name}</strong><span>{category.id}</span></td>
                  <td><i className={`fas ${category.icon || 'fa-box'}`} /> {category.icon || 'fa-box'}</td>
                  <td>{category.active === false ? 'Hidden' : 'Active'}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => removeCategory(category.id)}
                      disabled={category.active === false}
                    >
                      <i className="fas fa-eye-slash" />
                      <span>Remove</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function ProductsTab() {
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stockDrafts, setStockDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({
    brand: '',
    name: '',
    description: '',
    category: '',
    img: '',
    stock: '',
    rating: 0,
    reviews: 0,
    badge: '',
    badgeType: '',
    tags: '',
  });

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const [productsResult, categoriesResult] = await Promise.all([
      fetchProductManagerProducts(),
      fetchProductManagerCategories(),
    ]);
    setLoading(false);
    if (!productsResult.success) {
      showToast(productsResult.error || 'Products could not be loaded.', 'error');
      return;
    }
    if (categoriesResult.success) {
      setCategories(categoriesResult.categories.filter((category) => category.active !== false));
    }
    setProducts(productsResult.products);
  }, [showToast]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const setField = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }));

  const addProduct = async (event) => {
    event.preventDefault();
    const result = await addProductManagerProduct(draft);
    if (!result.success) {
      showToast(result.error || 'Product could not be added.', 'error');
      return;
    }
    setDraft({
      brand: '',
      name: '',
      description: '',
      category: '',
      img: '',
      stock: '',
      rating: 0,
      reviews: 0,
      badge: '',
      badgeType: '',
      tags: '',
    });
    showToast('Product added as draft. It will appear after sales manager sets a price.', 'success');
    loadProducts();
  };

  const updateStock = async (productId) => {
    const stock = Number(stockDrafts[productId]);
    const result = await updateProductManagerStock(productId, stock);
    if (!result.success) {
      showToast(result.error || 'Stock could not be updated.', 'error');
      return;
    }
    showToast('Stock updated.', 'success');
    loadProducts();
  };

  const archiveProduct = async (productId) => {
    const result = await archiveProductManagerProduct(productId);
    if (!result.success) {
      showToast(result.error || 'Product could not be removed.', 'error');
      return;
    }
    showToast('Product hidden from storefront.', 'success');
    loadProducts();
  };

  return (
    <>
      <form className="manager-product-form" onSubmit={addProduct}>
        <label><span>Brand</span><input value={draft.brand} onChange={(e) => setField('brand', e.target.value)} /></label>
        <label><span>Name</span><input value={draft.name} onChange={(e) => setField('name', e.target.value)} /></label>
        <label>
          <span>Category</span>
          <select value={draft.category} onChange={(e) => setField('category', e.target.value)}>
            <option value="">Select category</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
        <label><span>Stock</span><input type="number" min="0" value={draft.stock} onChange={(e) => setField('stock', e.target.value)} /></label>
        <label className="manager-form-wide"><span>Image URL</span><input value={draft.img} onChange={(e) => setField('img', e.target.value)} /></label>
        <label className="manager-form-wide"><span>Description</span><textarea rows={3} value={draft.description} onChange={(e) => setField('description', e.target.value)} /></label>
        <label><span>Rating</span><input type="number" min="0" max="5" step="0.5" value={draft.rating} onChange={(e) => setField('rating', e.target.value)} /></label>
        <label><span>Reviews</span><input type="number" min="0" value={draft.reviews} onChange={(e) => setField('reviews', e.target.value)} /></label>
        <label><span>Badge</span><input value={draft.badge} onChange={(e) => setField('badge', e.target.value)} /></label>
        <label><span>Badge type</span><input value={draft.badgeType} onChange={(e) => setField('badgeType', e.target.value)} /></label>
        <label className="manager-form-wide"><span>Tags</span><input value={draft.tags} onChange={(e) => setField('tags', e.target.value)} placeholder="new, best-seller" /></label>
        <button type="submit" className="btn btn-primary manager-form-wide">
          <i className="fas fa-plus" />
          <span>Add draft product</span>
        </button>
      </form>

      {loading ? <div className="manager-empty">Loading products...</div> : (
        <div className="manager-table-wrap">
          <table className="manager-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Status</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Remove</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const productId = String(product.id);
                return (
                  <tr key={productId}>
                    <td><strong>{product.name}</strong><span>{product.brand}</span></td>
                    <td>{product.category}</td>
                    <td>{product.status || (product.active === false ? 'HIDDEN' : 'ACTIVE')}</td>
                    <td>{currency(product.price)}</td>
                    <td>
                      <div className="manager-inline-form">
                        <input
                          type="number"
                          min="0"
                          value={stockDrafts[productId] ?? product.stock ?? 0}
                          onChange={(event) => setStockDrafts((prev) => ({ ...prev, [productId]: event.target.value }))}
                        />
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => updateStock(productId)}>
                          <i className="fas fa-floppy-disk" />
                        </button>
                      </div>
                    </td>
                    <td>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => archiveProduct(productId)}>
                        <i className="fas fa-eye-slash" />
                        <span>Hide</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function OrdersTab() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const { from, to } = rangeToMillis(fromDate, toDate);
    const result = await fetchProductManagerOrders(from, to);
    setLoading(false);
    if (!result.success) {
      showToast(result.error || 'Orders could not be loaded.', 'error');
      return;
    }
    setOrders(result.orders);
  }, [fromDate, showToast, toDate]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const changeStatus = async (orderId, status) => {
    const result = await updateProductManagerOrderStatus(orderId, status);
    if (!result.success) {
      showToast(result.error || 'Order status could not be updated.', 'error');
      return;
    }
    showToast('Order status updated.', 'success');
    loadOrders();
  };

  return (
    <>
      <DateFilters fromDate={fromDate} toDate={toDate} setFromDate={setFromDate} setToDate={setToDate} onApply={loadOrders} />
      {loading ? <div className="manager-empty">Loading orders...</div> : (
        <div className="manager-table-wrap">
          <table className="manager-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Status</th>
                <th>Total</th>
                <th>Invoice</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.orderId}>
                  <td><strong>#{String(order.orderId).slice(0, 8).toUpperCase()}</strong></td>
                  <td><strong>{order.fullName || '-'}</strong><span>{order.userEmail}</span></td>
                  <td>{dateTime(order.createdAt)}</td>
                  <td>
                    <select value={order.status || 'PROCESSING'} onChange={(event) => changeStatus(order.orderId, event.target.value)}>
                      {ORDER_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </td>
                  <td>{currency(order.totalPrice)}</td>
                  <td>
                    <a className="btn btn-outline btn-sm" href={getInvoiceDownloadUrl(order.orderId)} target="_blank" rel="noreferrer">
                      <i className="fas fa-file-pdf" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function CommentsTab() {
  const { showToast } = useToast();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadComments = useCallback(async () => {
    setLoading(true);
    const result = await fetchProductManagerComments();
    setLoading(false);
    if (!result.success) {
      showToast(result.error || 'Comments could not be loaded.', 'error');
      return;
    }
    setComments(result.comments);
  }, [showToast]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const decide = async (comment, status) => {
    const result = await decideProductManagerComment(comment.productId, comment.commentId, status);
    if (!result.success) {
      showToast(result.error || 'Comment could not be updated.', 'error');
      return;
    }
    showToast(`Comment ${status.toLowerCase()}.`, 'success');
    loadComments();
  };

  if (loading) return <div className="manager-empty">Loading comments...</div>;

  return (
    <div className="manager-refunds">
      {comments.length === 0 && <div className="manager-empty">No comments.</div>}
      {comments.map((comment) => (
        <article key={`${comment.productId}-${comment.commentId}`} className="manager-refund-card">
          <div>
            <p className="checkout-kicker">Product #{comment.productId}</p>
            <h3>{comment.userName || comment.userEmail}</h3>
            <span>{comment.userEmail} · {dateTime(comment.createdAt)}</span>
            <p>{comment.text}</p>
          </div>
          <div className="manager-refund-actions">
            <span className={`order-status ${comment.status === 'ACCEPTED' ? 'order-status-refund' : 'order-status-processing'}`}>
              {comment.status || 'PENDING'}
            </span>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => decide(comment, 'ACCEPTED')}>
              <i className="fas fa-check" />
              <span>Approve</span>
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => decide(comment, 'REJECTED')}>
              <i className="fas fa-xmark" />
              <span>Disapprove</span>
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

export default function ProductManagerPage() {
  const { user, isLoggedIn } = useAuth();
  const [activeTab, setActiveTab] = useState('categories');
  const isProductManager = user?.role === 'product_manager';

  if (!isLoggedIn) return <Navigate to="/" replace />;
  if (!isProductManager) {
    return (
      <section className="account-page section">
        <div className="container">
          <div className="empty-state">
            <i className="fas fa-user-lock" />
            <h3>Product manager access required</h3>
            <p>This panel is available to manually assigned product manager users.</p>
            <Link to="/" className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-flex' }}>
              <i className="fas fa-arrow-left" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="manager-page section">
      <div className="container">
        <div className="cart-header">
          <p className="checkout-kicker">Product Manager</p>
          <h1 className="section-title">Catalog operations</h1>
          <p className="section-sub">Manage categories, product drafts, stock, order status, and comment moderation.</p>
        </div>
        <div className="manager-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`account-nav-item${activeTab === tab.id ? ' is-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <i className={`fas ${tab.icon}`} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        <div className="account-panel manager-panel">
          {activeTab === 'categories' && <CategoriesTab />}
          {activeTab === 'products' && <ProductsTab />}
          {activeTab === 'orders' && <OrdersTab />}
          {activeTab === 'comments' && <CommentsTab />}
        </div>
      </div>
    </section>
  );
}
