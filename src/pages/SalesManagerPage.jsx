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

function compactCurrency(amount) {
  const value = Number(amount) || 0;
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}K`;
  }
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
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

function shortDateLabel(date) {
  if (!date) return '';
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function buildChartGeometry(items, valueKey) {
  const width = 680;
  const height = 320;
  const margin = { top: 26, right: 26, bottom: 58, left: 74 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const maxValue = Math.max(...items.map((item) => Number(item[valueKey]) || 0), 1);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const value = maxValue * ratio;
    return {
      value,
      y: margin.top + plotHeight - (ratio * plotHeight),
    };
  });
  const points = items.map((item, index) => {
    const rawValue = Number(item[valueKey]) || 0;
    const x = items.length === 1
      ? margin.left + plotWidth / 2
      : margin.left + (index / (items.length - 1)) * plotWidth;
    const y = margin.top + plotHeight - (rawValue / maxValue) * plotHeight;
    return { ...item, rawValue, x, y };
  });

  return {
    width,
    height,
    margin,
    plotWidth,
    plotHeight,
    ticks,
    points,
    path: points.map((point) => `${point.x},${point.y}`).join(' '),
  };
}

function DailyMetricChart({ title, subtitle, items, valueKey, yAxisLabel }) {
  const chart = useMemo(() => buildChartGeometry(items, valueKey), [items, valueKey]);
  const labelEvery = Math.max(1, Math.ceil(items.length / 6));

  return (
    <section className="manager-chart-card">
      <div className="manager-chart-header">
        <div>
          <h3>{title}</h3>
          <span>{subtitle}</span>
        </div>
      </div>
      <div className="manager-chart">
        {items.length === 0 ? (
          <div className="manager-empty">No data in selected range.</div>
        ) : (
          <svg viewBox={`0 0 ${chart.width} ${chart.height}`} role="img" aria-label={title}>
            {chart.ticks.map((tick) => (
              <g key={tick.value}>
                <line
                  className="manager-chart-grid"
                  x1={chart.margin.left}
                  y1={tick.y}
                  x2={chart.width - chart.margin.right}
                  y2={tick.y}
                />
                <text className="manager-chart-y-label" x={chart.margin.left - 12} y={tick.y + 4}>
                  {compactCurrency(tick.value)}
                </text>
              </g>
            ))}
            <line
              className="manager-chart-axis"
              x1={chart.margin.left}
              y1={chart.margin.top}
              x2={chart.margin.left}
              y2={chart.height - chart.margin.bottom}
            />
            <line
              className="manager-chart-axis"
              x1={chart.margin.left}
              y1={chart.height - chart.margin.bottom}
              x2={chart.width - chart.margin.right}
              y2={chart.height - chart.margin.bottom}
            />
            <text
              className="manager-chart-axis-title manager-chart-axis-title-y"
              x={18}
              y={chart.margin.top + chart.plotHeight / 2}
              transform={`rotate(-90 18 ${chart.margin.top + chart.plotHeight / 2})`}
            >
              {yAxisLabel}
            </text>
            <text
              className="manager-chart-axis-title"
              x={chart.margin.left + chart.plotWidth / 2}
              y={chart.height - 14}
            >
              Date
            </text>
            <polyline className="manager-chart-line" points={chart.path} />
            {chart.points.map((point, index) => {
              const shouldLabel = index === 0 || index === chart.points.length - 1 || index % labelEvery === 0;
              return (
                <g key={`${point.date}-${valueKey}`}>
                  <circle className="manager-chart-dot" cx={point.x} cy={point.y} r="4" />
                  {shouldLabel && (
                    <>
                      <text className="manager-chart-point-label" x={point.x} y={Math.max(14, point.y - 10)}>
                        {compactCurrency(point.rawValue)}
                      </text>
                      <text className="manager-chart-x-label" x={point.x} y={chart.height - chart.margin.bottom + 24}>
                        {shortDateLabel(point.date)}
                      </text>
                    </>
                  )}
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </section>
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

  const profitData = useMemo(() => revenue.map((item) => {
    const revenueValue = Number(item.revenue) || 0;
    const cost = revenueValue * 0.5;
    return {
      ...item,
      cost,
      profit: revenueValue - cost,
    };
  }), [revenue]);

  const totals = useMemo(() => profitData.reduce((acc, item) => ({
    revenue: acc.revenue + (Number(item.revenue) || 0),
    cost: acc.cost + (Number(item.cost) || 0),
    profit: acc.profit + (Number(item.profit) || 0),
  }), { revenue: 0, cost: 0, profit: 0 }), [profitData]);

  return (
    <>
      <DateFilters fromDate={fromDate} toDate={toDate} setFromDate={setFromDate} setToDate={setToDate} onApply={loadRevenue} />
      <div className="manager-chart-summary manager-chart-summary-grid">
        <div>
          <span>Total revenue</span>
          <strong>{currency(totals.revenue)}</strong>
        </div>
        <div>
          <span>Mock cost</span>
          <strong>{currency(totals.cost)}</strong>
        </div>
        <div>
          <span>Mock profit</span>
          <strong>{currency(totals.profit)}</strong>
        </div>
      </div>
      <div className="manager-charts">
        <DailyMetricChart
          title="Revenue chart"
          subtitle="Daily revenue with x and y values"
          items={profitData}
          valueKey="revenue"
          yAxisLabel="Revenue"
        />
        <DailyMetricChart
          title="Profit chart"
          subtitle="Mock profit, cost is 50% of revenue"
          items={profitData}
          valueKey="profit"
          yAxisLabel="Profit"
        />
      </div>
      <div className="manager-revenue-list">
        {profitData.map((item) => (
          <div key={item.date}>
            <span>{item.date}</span>
            <strong>{currency(item.revenue)} revenue / {currency(item.profit)} profit</strong>
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
