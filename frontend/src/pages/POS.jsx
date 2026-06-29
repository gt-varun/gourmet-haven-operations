import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  Percent,
  CreditCard,
  Printer,
  X,
  AlertTriangle,
  Store
} from 'lucide-react';

const POS = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [discountRate, setDiscountRate] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [receiptOrder, setReceiptOrder] = useState(null);

  // Fetch branches for SUPER_ADMIN
  const fetchBranches = async () => {
    try {
      const res = await fetch('/api/branches');
      const data = await res.json();
      if (data.success && data.branches.length > 0) {
        setBranches(data.branches);
        setSelectedBranchId(data.branches[0]._id); // Auto-select first branch
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
    }
  };

  // Fetch products for the branch
  const fetchProducts = useCallback(async () => {
    try {
      const branchParam = user.role === 'SUPER_ADMIN' && selectedBranchId
        ? `?branchId=${selectedBranchId}`
        : '';
      const res = await fetch(`/api/products${branchParam}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  }, [user.role, selectedBranchId]);

  useEffect(() => {
    if (user.role === 'SUPER_ADMIN') {
      fetchBranches();
    }
  }, [user.role]);

  useEffect(() => {
    // For non-SUPER_ADMIN, fetch right away. For SUPER_ADMIN, wait for a branch to be selected.
    if (user.role !== 'SUPER_ADMIN' || selectedBranchId) {
      fetchProducts();
      setCart([]); // Clear cart on branch change
    }
  }, [fetchProducts, user.role, selectedBranchId]);

  // Extract unique categories
  const categories = useMemo(() => {
    const list = new Set(products.map((p) => p.category));
    return ['All', ...Array.from(list)];
  }, [products]);

  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  // Add item to cart
  const addToCart = (product) => {
    if (product.stock === 0) return;

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item._id === product._id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`Cannot add more. Only ${product.stock} items in stock.`);
          return prevCart;
        }
        return prevCart.map((item) =>
          item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  // Update item quantity
  const updateQuantity = (productId, delta, maxStock) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item._id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > maxStock) {
              alert(`Cannot exceed available stock of ${maxStock}`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  // Remove item from cart
  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item._id !== productId));
  };

  // Calculations
  const cartTotals = useMemo(() => {
    let subtotal = 0;
    let taxTotal = 0;

    cart.forEach((item) => {
      const itemSub = item.price * item.quantity;
      const itemTax = itemSub * (item.taxRate / 100);
      subtotal += itemSub;
      taxTotal += itemTax;
    });

    const discountAmount = subtotal * (discountRate / 100);
    const grandTotal = subtotal + taxTotal - discountAmount;

    return {
      subtotal: Number(subtotal.toFixed(2)),
      taxTotal: Number(taxTotal.toFixed(2)),
      discountAmount: Number(discountAmount.toFixed(2)),
      grandTotal: Number(grandTotal.toFixed(2)),
    };
  }, [cart, discountRate]);

  // Handle discount change with cashier level validation
  const handleDiscountChange = (val) => {
    const num = Math.max(0, Math.min(100, Number(val) || 0));
    if (user.role === 'CASHIER' && num > 10) {
      alert('Cashiers are capped at a maximum discount of 10%.');
      setDiscountRate(10);
    } else {
      setDiscountRate(num);
    }
  };

  // Handle checkout
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    setCheckoutError('');

    try {
      const payload = {
        items: cart.map((item) => ({ productId: item._id, quantity: item.quantity })),
        discountRate,
        payment: {
          method: paymentMethod,
          amount: cartTotals.grandTotal,
        },
        ...(user.role === 'SUPER_ADMIN' && selectedBranchId ? { branchId: selectedBranchId } : {}),
      };

      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setReceiptOrder(data.order);
        setCart([]); // Clear cart
        setDiscountRate(0); // Reset discount
        fetchProducts(); // Refresh products database (stock update)
      } else {
        setCheckoutError(data.message || 'Checkout failed');
      }
    } catch (err) {
      setCheckoutError('Network error checking out order');
    } finally {
      setLoading(false);
    }
  };

  // Handle printing
  const handlePrintReceipt = () => {
    const printContent = document.getElementById('receipt-print-area').innerHTML;
    const originalContent = document.body.innerHTML;

    // Temporarily replace page content to print cleanly
    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    
    // Reload or restore handlers (simplest is to force refresh react state or reload)
    window.location.reload();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="header-container" style={{ marginBottom: '16px' }}>
        <div>
          <h1 className="header-title">POS Billing</h1>
          <p className="header-subtitle">Select items to add to the order</p>
        </div>
      </div>

      {user.role === 'SUPER_ADMIN' && (
        <div className="branch-selector-bar">
          <Store size={16} style={{ color: 'var(--primary)' }} />
          <label>Operating Branch:</label>
          <select
            className="form-select"
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
          >
            {branches.map((b) => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>
        </div>
      )}

      {checkoutError && (
        <div className="alert-banner alert-banner-danger">
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <span>{checkoutError}</span>
        </div>
      )}

      <div className="pos-layout">
        {/* Left Side: Product Catalog */}
        <div className="catalog-panel">
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <div className="input-with-icon" style={{ flexGrow: 1 }}>
              <Search className="input-icon" size={16} />
              <input
                type="text"
                className="form-input"
                placeholder="Search products by SKU or Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Category tabs */}
          <div className="catalog-filters">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`filter-chip ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Products grid */}
          <div className="products-grid">
            {filteredProducts.map((p) => {
              const isOutOfStock = p.stock === 0;
              const isLowStock = p.stock > 0 && p.stock <= p.reorderLevel;

              return (
                <div
                  key={p._id}
                  className="glass-card product-card"
                  style={{
                    opacity: isOutOfStock ? 0.5 : 1,
                    pointerEvents: isOutOfStock ? 'none' : 'auto',
                    border: isLowStock ? '1px solid rgba(251, 191, 36, 0.4)' : '1px solid var(--border-glow)'
                  }}
                  onClick={() => addToCart(p)}
                >
                  <div>
                    <div className="product-name">{p.name}</div>
                    <div className="product-sku">{p.sku}</div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <span className="product-price">₹{p.price.toFixed(2)}</span>
                    <div>
                      {isOutOfStock ? (
                        <span className="product-stock-tag" style={{ background: 'rgba(248, 113, 113, 0.15)', color: '#f87171' }}>
                          Out of stock
                        </span>
                      ) : isLowStock ? (
                        <span className="product-stock-tag" style={{ background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24' }}>
                          Low stock ({p.stock})
                        </span>
                      ) : (
                        <span className="product-stock-tag" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#34d399' }}>
                          Stock: {p.stock}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Cart Summary */}
        <div className="cart-panel glass-panel" style={{ padding: '20px' }}>
          <div className="panel-header" style={{ marginBottom: '12px' }}>
            <h3 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingCart size={18} />
              Current Order
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {cart.reduce((sum, item) => sum + item.quantity, 0)} items
            </span>
          </div>

          {/* Cart items list */}
          <div className="cart-items-list">
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto' }}>
                Cart is empty.<br />Select products on the left.
              </div>
            ) : (
              cart.map((item) => (
                <div key={item._id} className="cart-item">
                  <div className="cart-item-details">
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{item.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      ₹{item.price.toFixed(2)} + {item.taxRate}% tax
                    </div>
                  </div>

                  <div className="cart-item-qty-controls">
                    <button
                      className="qty-btn"
                      onClick={() => updateQuantity(item._id, -1, item.stock)}
                    >
                      <Minus size={12} />
                    </button>
                    <span style={{ fontWeight: 'bold', fontSize: '14px', width: '20px', textAlign: 'center' }}>
                      {item.quantity}
                    </span>
                    <button
                      className="qty-btn"
                      onClick={() => updateQuantity(item._id, 1, item.stock)}
                    >
                      <Plus size={12} />
                    </button>
                    
                    <button
                      className="btn-icon danger"
                      style={{ marginLeft: '4px' }}
                      onClick={() => removeFromCart(item._id)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart checkout details */}
          <div className="cart-summary">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{cartTotals.subtotal.toFixed(2)}</span>
            </div>

            <div className="summary-row">
              <span>Estimated Tax</span>
              <span>+ ₹{cartTotals.taxTotal.toFixed(2)}</span>
            </div>

            {/* Discount application */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '4px 0' }}>
              <div className="summary-row" style={{ alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Percent size={14} /> Add Discount (%)
                </span>
                <input
                  type="number"
                  className="form-input"
                  style={{ width: '80px', padding: '4px 8px', textAlign: 'right' }}
                  placeholder="0"
                  min="0"
                  max="100"
                  value={discountRate || ''}
                  onChange={(e) => handleDiscountChange(e.target.value)}
                  disabled={cart.length === 0}
                />
              </div>
            </div>

            {discountRate > 0 && (
              <div className="summary-row" style={{ color: 'var(--success)' }}>
                <span>Discount Override ({discountRate}%)</span>
                <span>- ₹{cartTotals.discountAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="summary-row total">
              <span>Grand Total</span>
              <span>₹{cartTotals.grandTotal.toFixed(2)}</span>
            </div>

            {/* Payment Method Selector */}
            <div style={{ margin: '12px 0 6px 0' }}>
              <label className="form-label" style={{ marginBottom: '6px' }}>Payment Mode</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['CASH', 'CARD', 'UPI'].map((method) => (
                  <button
                    key={method}
                    type="button"
                    className="btn-secondary"
                    style={{
                      flexGrow: 1,
                      justifyContent: 'center',
                      background: paymentMethod === method ? 'rgba(93, 110, 255, 0.15)' : 'rgba(255,255,255,0.02)',
                      borderColor: paymentMethod === method ? 'var(--primary)' : 'var(--border-glow)',
                      color: paymentMethod === method ? 'white' : 'var(--text-muted)'
                    }}
                    onClick={() => setPaymentMethod(method)}
                    disabled={cart.length === 0}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '8px' }}
              disabled={cart.length === 0 || loading}
              onClick={handleCheckout}
            >
              {loading ? 'Processing Transaction...' : `Charge ₹${cartTotals.grandTotal.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      {receiptOrder && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '420px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
              <button
                className="btn-icon"
                onClick={() => setReceiptOrder(null)}
              >
                <X size={16} />
              </button>
            </div>

            {/* Print Area */}
            <div id="receipt-print-area">
              <div className="receipt-wrapper">
                <div className="receipt-header">
                  <div className="receipt-title">{receiptOrder.branchId?.name || 'Hotel Outlet'}</div>
                  <div style={{ fontSize: '11px', color: '#555' }}>
                    {receiptOrder.branchId?.location || 'Branch Location'}
                  </div>
                  <div style={{ fontSize: '11px', marginTop: '6px' }}>
                    Order ID: #{receiptOrder._id.toString().slice(-6).toUpperCase()}
                  </div>
                  <div style={{ fontSize: '11px' }}>
                    Date: {new Date(receiptOrder.createdAt).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '11px' }}>
                    Cashier: {receiptOrder.userId?.name || 'Staff'}
                  </div>
                </div>

                <table className="receipt-table">
                  <thead>
                    <tr>
                      <th style={{ width: '10%' }}>Qty</th>
                      <th style={{ width: '60%' }}>Item Name</th>
                      <th style={{ width: '30%', textAlign: 'right' }}>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiptOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.quantity}</td>
                        <td>{item.name}</td>
                        <td style={{ textAlign: 'right' }}>₹{item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="receipt-summary">
                  <div>Subtotal: ₹{receiptOrder.subtotal.toFixed(2)}</div>
                  <div>Tax: ₹{receiptOrder.taxTotal.toFixed(2)}</div>
                  {receiptOrder.discountTotal > 0 && (
                    <div>Discount: -₹{receiptOrder.discountTotal.toFixed(2)}</div>
                  )}
                  <div style={{ fontWeight: 'bold', fontSize: '14px', marginTop: '4px' }}>
                    GRAND TOTAL: ₹{receiptOrder.grandTotal.toFixed(2)}
                  </div>
                </div>

                <div className="receipt-footer">
                  <div>Payment Mode: {receiptOrder.payment?.method}</div>
                  <div style={{ marginTop: '10px', fontWeight: 'bold' }}>Thank you! Visit again.</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button
                className="btn-primary"
                style={{ flexGrow: 1, justifyContent: 'center' }}
                onClick={handlePrintReceipt}
              >
                <Printer size={16} />
                <span>Print Invoice</span>
              </button>
              <button
                className="btn-secondary"
                style={{ flexGrow: 1, justifyContent: 'center' }}
                onClick={() => setReceiptOrder(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
