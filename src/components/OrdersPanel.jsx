import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchUserOrders, getInvoiceDownloadUrl } from '../services/api';

const STATUS_STYLES = {
  PAID: { label: 'Paid', className: 'order-status order-status-paid', icon: 'fa-circle-check' },
  PROCESSING: { label: 'Processing', className: 'order-status order-status-processing', icon: 'fa-gears' },
  SHIPPED: { label: 'Shipped', className: 'order-status order-status-shipped', icon: 'fa-truck-fast' },
  DELIVERED: { label: 'Delivered', className: 'order-status order-status-delivered', icon: 'fa-box-open' },
  CANCELLED: { label: 'Cancelled', className: 'order-status order-status-cancelled', icon: 'fa-ban' },
};

function formatDate(ms) {
  if (!ms) return '';
  const date = new Date(ms);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatShortId(orderId) {
  if (!orderId) return '—';
  return orderId.slice(0, 8).toUpperCase();
}

function currency(amount) {
  const value = Number(amount) || 0;
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function OrderCard({ order }) {
  const [expanded, setExpanded] = useState(false);

  const statusKey = (order.status || 'PAID').toUpperCase();
  const status = STATUS_STYLES[statusKey] || STATUS_STYLES.PAID;
  const items = Array.isArray(order.items) ? order.items : [];
  const visibleItems = expanded ? items : items.slice(0, 2);
  const hiddenCount = items.length - visibleItems.length;
  const itemTotal = items.reduce((sum, item) => sum + (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0), 0);
  const totalPrice = order.totalPrice ?? itemTotal;
  const address = order.deliveryAddress || {};

  return (
    <article className="order-card">
      <header className="order-card-head">
        <div className="order-card-id">
          <p className="checkout-kicker">Order</p>
          <h3>#{formatShortId(order.orderId)}</h3>
          <span className="order-card-date">
            <i className="far fa-clock" />
            {formatDate(order.createdAt)}
          </span>
        </div>
        <div className="order-card-meta">
          <span className={status.className}>
            <i className={`fas ${status.icon}`} />
            {status.label}
          </span>
          <span className="order-card-total">{currency(totalPrice)}</span>
        </div>
      </header>

      <div className="order-card-items">
        {visibleItems.map((item, idx) => (
          <div key={`${item.productId}-${idx}`} className="order-line">
            <div className="order-line-main">
              <strong>{item.productName || 'Product'}</strong>
              <span>
                Qty {item.quantity} · {currency(item.unitPrice)} each
              </span>
            </div>
            <span className="order-line-amount">
              {currency((Number(item.unitPrice) || 0) * (Number(item.quantity) || 0))}
            </span>
          </div>
        ))}
        {!expanded && hiddenCount > 0 && (
          <button type="button" className="order-line-more" onClick={() => setExpanded(true)}>
            <i className="fas fa-chevron-down" />
            Show {hiddenCount} more item{hiddenCount !== 1 ? 's' : ''}
          </button>
        )}
      </div>

      {expanded && (
        <div className="order-card-details">
          <div className="order-detail-block">
            <p className="checkout-success-label">Delivering to</p>
            <strong>{order.fullName || address.fullName || '—'}</strong>
            {address.line1 && <span>{address.line1}</span>}
            {address.line2 && <span>{address.line2}</span>}
            {(address.city || address.postalCode) && (
              <span>
                {[address.city, address.postalCode].filter(Boolean).join(', ')}
              </span>
            )}
            {address.country && <span>{address.country}</span>}
            {address.phone && (
              <span className="order-detail-phone">
                <i className="fas fa-phone" /> {address.phone}
              </span>
            )}
          </div>
          <div className="order-detail-block">
            <p className="checkout-success-label">Summary</p>
            <div className="order-detail-row">
              <span>Items ({items.reduce((s, it) => s + (Number(it.quantity) || 0), 0)})</span>
              <span>{currency(itemTotal)}</span>
            </div>
            <div className="order-detail-row">
              <span>Shipping</span>
              <span className="summary-free">Free</span>
            </div>
            <div className="order-detail-row order-detail-total">
              <span>Total</span>
              <span>{currency(totalPrice)}</span>
            </div>
          </div>
        </div>
      )}

      <footer className="order-card-foot">
        <a
          className="btn btn-outline order-toggle"
          href={getInvoiceDownloadUrl(order.orderId)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <i className="fas fa-file-pdf" />
          <span>Invoice (PDF)</span>
        </a>
        <button
          type="button"
          className="btn btn-primary order-toggle"
          onClick={() => setExpanded((prev) => !prev)}
        >
          <i className={`fas fa-chevron-${expanded ? 'up' : 'down'}`} />
          <span>{expanded ? 'Hide details' : 'View details'}</span>
        </button>
      </footer>
    </article>
  );
}

export default function OrdersPanel({ userEmail }) {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  const loadOrders = useCallback(async (signal) => {
    if (!userEmail) return;
    setStatus('loading');
    setError(null);

    const result = await fetchUserOrders(userEmail);
    if (signal?.aborted) return;

    if (!result.success) {
      setError(result.error || 'Could not load your orders.');
      setStatus('error');
      return;
    }

    setOrders(result.orders);
    setStatus('loaded');
  }, [userEmail]);

  useEffect(() => {
    if (!userEmail) return undefined;
    const controller = new AbortController();
    // Defer to next microtask so the effect body itself stays free of sync setState.
    queueMicrotask(() => {
      if (!controller.signal.aborted) loadOrders(controller.signal);
    });
    return () => controller.abort();
  }, [loadOrders, userEmail]);

  const sortedOrders = useMemo(
    () => [...orders].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
    [orders]
  );

  const stats = useMemo(() => {
    const totalSpent = orders.reduce((sum, order) => sum + (Number(order.totalPrice) || 0), 0);
    return {
      count: orders.length,
      totalSpent,
    };
  }, [orders]);

  return (
    <div className="account-panel orders-panel">
      <div className="checkout-panel-header">
        <div>
          <p className="checkout-kicker">Account</p>
          <h2>Order history</h2>
        </div>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={loadOrders}
          disabled={status === 'loading'}
        >
          <i className={`fas fa-arrows-rotate${status === 'loading' ? ' spinning' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {status === 'loaded' && orders.length > 0 && (
        <div className="order-stats">
          <div className="order-stat">
            <span className="checkout-success-label">Total orders</span>
            <strong>{stats.count}</strong>
          </div>
          <div className="order-stat">
            <span className="checkout-success-label">Lifetime spend</span>
            <strong>{currency(stats.totalSpent)}</strong>
          </div>
        </div>
      )}

      {status === 'loading' && (
        <div className="order-skeleton-list">
          {[0, 1].map((key) => (
            <div key={key} className="order-skeleton" />
          ))}
        </div>
      )}

      {status === 'error' && (
        <div className="empty-state orders-empty">
          <i className="fas fa-triangle-exclamation" />
          <h3>Couldn't load your orders</h3>
          <p>{error}</p>
          <button type="button" className="btn btn-primary" onClick={loadOrders}>
            <i className="fas fa-arrows-rotate" />
            <span>Try again</span>
          </button>
        </div>
      )}

      {status === 'loaded' && orders.length === 0 && (
        <div className="empty-state orders-empty">
          <i className="fas fa-box" />
          <h3>No orders yet</h3>
          <p>Orders you place will appear here with tracking and invoices.</p>
        </div>
      )}

      {status === 'loaded' && orders.length > 0 && (
        <div className="order-list">
          {sortedOrders.map((order) => (
            <OrderCard key={order.orderId} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
