import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  applySalesManagerDiscount,
  decideRefundRequest,
  fetchRefundRequests,
  fetchSalesManagerOrders,
  fetchSalesManagerProducts,
  fetchSalesManagerRevenue,
  getInvoiceDownloadUrl,
  updateSalesManagerPrice,
} from '../services/api';

const TABS = [
  { id: 'products', label: 'Products', icon: 'fa-tags' },
  { id: 'orders', label: 'Orders', icon: 'fa-receipt' },
  { id: 'revenue', label: 'Revenue', icon: 'fa-chart-line' },
  { id: 'refunds', label: 'Refunds', icon: 'fa-rotate-left' },
];

function currency(amount) {
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

function ProductsTab() {
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const result = await fetchSalesManagerProducts();
    setLoading(false);
    if (!result.success) {
      showToast(result.error || 'Products could not be loaded.', 'error');
      return;
    }
    setProducts(result.products);
  }, [showToast]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const setDraft = (productId, key, value) => {
    setDrafts((prev) => ({
      ...prev,
      [productId]: { ...(prev[productId] || {}), [key]: value },
    }));
  };

  const updatePrice = async (productId) => {
    const price = Number(drafts[productId]?.price);
    const result = await updateSalesManagerPrice(productId, price);
    if (!result.success) {
      showToast(result.error || 'Price could not be updated.', 'error');
      return;
    }
    showToast('Price updated.', 'success');
    loadProducts();
  };

  const applyDiscount = async (productId) => {
    const discount = Number(drafts[productId]?.discount);
    const result = await applySalesManagerDiscount(productId, discount);
    if (!result.success) {
      showToast(result.error || 'Discount could not be applied.', 'error');
      return;
    }
    showToast('Discount applied and wishlist users were notified.', 'success');
    loadProducts();
  };

  if (loading) return <div className="manager-empty">Loading products...</div>;

  return (
    <div className="manager-table-wrap">
      <table className="manager-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Stock</th>
            <th>Current price</th>
            <th>Set price</th>
            <th>Discount</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const productId = String(product.id);
            return (
              <tr key={productId}>
                <td>
                  <strong>{product.name}</strong>
                  <span>{product.brand}</span>
                </td>
                <td>{product.stock ?? 0}</td>
                <td>
                  <strong>{currency(product.price)}</strong>
                  {product.oldPrice ? <span className="manager-old-price">{currency(product.oldPrice)}</span> : null}
                </td>
                <td>
                  <div className="manager-inline-form">
                    <input
                      type="number"
                      min="1"
                      value={drafts[productId]?.price ?? ''}
                      onChange={(event) => setDraft(productId, 'price', event.target.value)}
                      placeholder="Price"
                    />
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => updatePrice(productId)}>
                      <i className="fas fa-floppy-disk" />
                    </button>
                  </div>
                </td>
                <td>
                  <div className="manager-inline-form">
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={drafts[productId]?.discount ?? ''}
                      onChange={(event) => setDraft(productId, 'discount', event.target.value)}
                      placeholder="%"
                    />
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => applyDiscount(productId)}>
                      <i className="fas fa-percent" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
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
    const result = await fetchSalesManagerOrders(from, to);
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
                  <td>
                    <strong>{order.fullName || '-'}</strong>
                    <span>{order.userEmail}</span>
                  </td>
                  <td>{dateTime(order.createdAt)}</td>
                  <td>{order.status}</td>
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

function RevenueTab() {
  const { showToast } = useToast();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [revenue, setRevenue] = useState([]);

  const loadRevenue = useCallback(async () => {
    const { from, to } = rangeToMillis(fromDate, toDate);
    const result = await fetchSalesManagerRevenue(from, to);
    if (!result.success) {
      showToast(result.error || 'Revenue could not be loaded.', 'error');
      return;
    }
    setRevenue(result.revenue);
  }, [fromDate, showToast, toDate]);

  useEffect(() => {
    loadRevenue();
  }, [loadRevenue]);

  const maxRevenue = Math.max(...revenue.map((item) => Number(item.revenue) || 0), 1);
  const points = revenue.map((item, index) => {
    const x = revenue.length === 1 ? 50 : (index / (revenue.length - 1)) * 100;
    const y = 100 - ((Number(item.revenue) || 0) / maxRevenue) * 80 - 10;
    return `${x},${y}`;
  }).join(' ');
  const total = useMemo(() => revenue.reduce((sum, item) => sum + (Number(item.revenue) || 0), 0), [revenue]);

  return (
    <>
      <DateFilters fromDate={fromDate} toDate={toDate} setFromDate={setFromDate} setToDate={setToDate} onApply={loadRevenue} />
      <div className="manager-chart-summary">
        <span>Total revenue</span>
        <strong>{currency(total)}</strong>
      </div>
      <div className="manager-chart">
        {revenue.length === 0 ? (
          <div className="manager-empty">No revenue in selected range.</div>
        ) : (
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Daily revenue chart">
            <polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" vectorEffect="non-scaling-stroke" />
            {revenue.map((item, index) => {
              const x = revenue.length === 1 ? 50 : (index / (revenue.length - 1)) * 100;
              const y = 100 - ((Number(item.revenue) || 0) / maxRevenue) * 80 - 10;
              return <circle key={item.date} cx={x} cy={y} r="1.6" />;
            })}
          </svg>
        )}
      </div>
      <div className="manager-revenue-list">
        {revenue.map((item) => (
          <div key={item.date}>
            <span>{item.date}</span>
            <strong>{currency(item.revenue)}</strong>
          </div>
        ))}
      </div>
    </>
  );
}

function RefundsTab() {
  const { showToast } = useToast();
  const [refunds, setRefunds] = useState([]);
  const [note, setNote] = useState('');

  const loadRefunds = useCallback(async () => {
    const result = await fetchRefundRequests();
    if (!result.success) {
      showToast(result.error || 'Refund requests could not be loaded.', 'error');
      return;
    }
    setRefunds(result.refunds);
  }, [showToast]);

  useEffect(() => {
    loadRefunds();
  }, [loadRefunds]);

  const decide = async (refundId, decision) => {
    const result = await decideRefundRequest(refundId, decision, note);
    if (!result.success) {
      showToast(result.error || 'Refund request could not be updated.', 'error');
      return;
    }
    showToast(`Refund ${decision.toLowerCase()}.`, 'success');
    setNote('');
    loadRefunds();
  };

  return (
    <div className="manager-refunds">
      <label className="field-group">
        <span className="field-label">Decision note</span>
        <input className="field-input" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional message for customer" />
      </label>
      {refunds.length === 0 && <div className="manager-empty">No refund requests.</div>}
      {refunds.map((refund) => (
        <article key={refund.refundId} className="manager-refund-card">
          <div>
            <p className="checkout-kicker">Order #{String(refund.orderId).slice(0, 8).toUpperCase()}</p>
            <h3>{refund.fullName || refund.userEmail}</h3>
            <span>{refund.userEmail}</span>
            {refund.reason ? <p>{refund.reason}</p> : null}
          </div>
          <div className="manager-refund-actions">
            <span className={`order-status ${refund.status === 'PENDING' ? 'order-status-processing' : 'order-status-refund'}`}>
              {refund.status}
            </span>
            {refund.status === 'PENDING' && (
              <>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => decide(refund.refundId, 'ACCEPTED')}>
                  <i className="fas fa-check" />
                  <span>Accept</span>
                </button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => decide(refund.refundId, 'REJECTED')}>
                  <i className="fas fa-xmark" />
                  <span>Reject</span>
                </button>
              </>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

export default function SalesManagerPage() {
  const { user, isLoggedIn } = useAuth();
  const [activeTab, setActiveTab] = useState('products');
  const isSalesManager = user?.role === 'sales_manager';

  if (!isLoggedIn) return <Navigate to="/" replace />;
  if (!isSalesManager) {
    return (
      <section className="account-page section">
        <div className="container">
          <div className="empty-state">
            <i className="fas fa-user-lock" />
            <h3>Sales manager access required</h3>
            <p>This panel is available to manually assigned sales manager users.</p>
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
          <p className="checkout-kicker">Sales Manager</p>
          <h1 className="section-title">Operations panel</h1>
          <p className="section-sub">Manage prices, orders, daily revenue, and refund requests.</p>
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
          {activeTab === 'products' && <ProductsTab />}
          {activeTab === 'orders' && <OrdersTab />}
          {activeTab === 'revenue' && <RevenueTab />}
          {activeTab === 'refunds' && <RefundsTab />}
        </div>
      </div>
    </section>
  );
}
