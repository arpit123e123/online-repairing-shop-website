import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './App.css';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

const emptyForm = {
  name: '',
  price: '',
  category: '',
  stock: 10,
  image: '',
  description: '',
  serviceItem: false,
};

const emptyAddress = {
  fullName: '',
  phone: '',
  line1: '',
  city: '',
  pincode: '',
};

const emptyAuthForm = {
  name: '',
  email: '',
  password: '',
};

const requiredAddressFields = ['fullName', 'phone', 'line1', 'city', 'pincode'];

const paymentOptions = [
  {
    value: 'cod',
    title: 'Cash on delivery',
    note: 'Collect cash when the order is delivered.',
  },
  {
    value: 'upi',
    title: 'UPI',
    note: 'Mark this order for UPI collection.',
  },
  {
    value: 'card',
    title: 'Card',
    note: 'Mark this order for card payment.',
  },
];

const formatCurrency = (value) => {
  return `Rs. ${Number(value || 0).toLocaleString('en-IN')}`;
};

const getProductPhoto = (product) => {
  if (product.image) return product.image;
  return getFallbackPhoto(product);
};

const getFallbackPhoto = (product) => {
  const productName = product.name || 'Product';
  const productCategory = product.category || 'General';
  const initials = productName
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();

  const icon = getProductIcon(product);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450">
      <rect width="600" height="450" fill="#f8fafc"/>
      <rect x="32" y="32" width="536" height="386" rx="34" fill="#ffffff"/>
      <rect x="32" y="32" width="536" height="386" rx="34" fill="#dbeafe" opacity="0.6"/>
      <circle cx="300" cy="162" r="112" fill="#0f766e" opacity="0.08"/>
      ${icon}
      <rect x="78" y="292" width="444" height="72" rx="18" fill="#ffffff" opacity="0.94"/>
      <text x="300" y="325" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="800" fill="#0f172a">${productName}</text>
      <text x="300" y="354" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#64748b">${productCategory} | ${initials}</text>
    </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const getProductIcon = (product) => {
  const name = (product.name || '').toLowerCase();
  const category = (product.category || '').toLowerCase();
  const stroke = '#0f766e';
  const fill = '#99f6e4';

  if (category.includes('footwear') || name.includes('shoe') || name.includes('sandal') || name.includes('slipper') || name.includes('heel')) {
    return `
      <path d="M142 205 C205 224 262 226 338 196 C374 182 406 196 430 229 C386 260 294 277 190 258 C154 251 132 233 142 205Z" fill="${fill}" stroke="${stroke}" stroke-width="12" stroke-linejoin="round"/>
      <path d="M200 222 C252 236 318 228 366 205" fill="none" stroke="${stroke}" stroke-width="10" stroke-linecap="round"/>
      <path d="M152 252 H446" stroke="${stroke}" stroke-width="14" stroke-linecap="round"/>
    `;
  }

  if (category.includes('bag')) {
    return `
      <rect x="190" y="145" width="220" height="142" rx="24" fill="${fill}" stroke="${stroke}" stroke-width="12"/>
      <path d="M244 148 C246 105 354 105 356 148" fill="none" stroke="${stroke}" stroke-width="12" stroke-linecap="round"/>
      <path d="M218 194 H382" stroke="${stroke}" stroke-width="10" stroke-linecap="round"/>
      <path d="M300 147 V286" stroke="${stroke}" stroke-width="8" stroke-dasharray="12 12"/>
    `;
  }

  if (category.includes('umbrella')) {
    return `
      <path d="M148 196 C190 108 410 108 452 196 C378 176 348 176 300 196 C252 176 222 176 148 196Z" fill="${fill}" stroke="${stroke}" stroke-width="12" stroke-linejoin="round"/>
      <path d="M300 196 V294" stroke="${stroke}" stroke-width="12" stroke-linecap="round"/>
      <path d="M300 294 C300 330 248 330 248 296" fill="none" stroke="${stroke}" stroke-width="12" stroke-linecap="round"/>
    `;
  }

  if (category.includes('lock')) {
    return `
      <rect x="205" y="185" width="190" height="118" rx="22" fill="${fill}" stroke="${stroke}" stroke-width="12"/>
      <path d="M242 185 V146 C242 78 358 78 358 146 V185" fill="none" stroke="${stroke}" stroke-width="12" stroke-linecap="round"/>
      <circle cx="300" cy="239" r="17" fill="${stroke}"/>
      <path d="M300 252 V278" stroke="${stroke}" stroke-width="10" stroke-linecap="round"/>
    `;
  }

  if (category.includes('sewing')) {
    return `
      <path d="M170 216 H370 C408 216 434 244 434 282 H158 C158 244 134 216 170 216Z" fill="${fill}" stroke="${stroke}" stroke-width="12" stroke-linejoin="round"/>
      <path d="M230 216 V146 H352 C386 146 408 168 408 202 V216" fill="none" stroke="${stroke}" stroke-width="12" stroke-linejoin="round"/>
      <circle cx="360" cy="181" r="18" fill="none" stroke="${stroke}" stroke-width="10"/>
      <path d="M196 282 H454" stroke="${stroke}" stroke-width="12" stroke-linecap="round"/>
    `;
  }

  if (category.includes('gas')) {
    return `
      <rect x="166" y="178" width="268" height="116" rx="22" fill="${fill}" stroke="${stroke}" stroke-width="12"/>
      <circle cx="250" cy="236" r="38" fill="none" stroke="${stroke}" stroke-width="12"/>
      <circle cx="350" cy="236" r="38" fill="none" stroke="${stroke}" stroke-width="12"/>
      <path d="M206 172 L226 136 H374 L394 172" fill="none" stroke="${stroke}" stroke-width="12" stroke-linejoin="round"/>
    `;
  }

  if (category.includes('cooker')) {
    return `
      <rect x="172" y="170" width="256" height="122" rx="42" fill="${fill}" stroke="${stroke}" stroke-width="12"/>
      <path d="M214 170 C226 128 374 128 386 170" fill="none" stroke="${stroke}" stroke-width="12"/>
      <path d="M250 132 H350" stroke="${stroke}" stroke-width="12" stroke-linecap="round"/>
      <path d="M150 220 H104 M450 220 H496" stroke="${stroke}" stroke-width="12" stroke-linecap="round"/>
    `;
  }

  return `
    <rect x="190" y="150" width="220" height="132" rx="24" fill="${fill}" stroke="${stroke}" stroke-width="12"/>
    <path d="M224 190 H376 M224 232 H342" stroke="${stroke}" stroke-width="12" stroke-linecap="round"/>
    <circle cx="392" cy="138" r="34" fill="#ffffff" stroke="${stroke}" stroke-width="12"/>
  `;
};

function App() {
  const [activeView, setActiveView] = useState('shop');
  const [products, setProducts] = useState([]);
  const [trash, setTrash] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('cart') || '[]'));
  const [address, setAddress] = useState(() => {
    return JSON.parse(localStorage.getItem('address') || JSON.stringify(emptyAddress));
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState(emptyAuthForm);
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [orders, setOrders] = useState([]);
  const [orderMessage, setOrderMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState('');

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Products load nahi ho paaye.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTrash = useCallback(async () => {
    try {
      const res = await api.get('/products/trash');
      setTrash(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Trash load nahi ho paaya.');
    }
  }, []);

  const loadOrders = useCallback(async (sessionToken = token) => {
    try {
      const res = await api.get('/orders/my', {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      setOrders(res.data);
    } catch {
      setOrders([]);
    }
  }, [token]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    const verifySavedSession = async () => {
      try {
        const res = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        await loadOrders(token);
      } catch {
        setUser(null);
        setToken('');
        setOrders([]);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    };

    if (token) verifySavedSession();
  }, [loadOrders, token]);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('address', JSON.stringify(address));
  }, [address]);

  useEffect(() => {
    if (activeView === 'trash') loadTrash();
  }, [activeView, loadTrash]);

  const categories = useMemo(() => {
    const names = products.map((product) => product.category).filter(Boolean);
    return [...new Set(names)].sort();
  }, [products]);

  const visibleProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !category || product.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [category, products, search]);

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  const serviceCount = useMemo(() => {
    return products.filter((product) => product.serviceItem).length;
  }, [products]);

  const inventoryValue = useMemo(() => {
    return products.reduce((total, product) => total + product.price * product.stock, 0);
  }, [products]);

  const addressComplete = useMemo(() => {
    return requiredAddressFields.every((field) => address[field]?.trim());
  }, [address]);

  const navItems = [
    { id: 'shop', label: 'Products', badge: products.length },
    { id: 'add', label: 'Add Product' },
    { id: 'account', label: user ? 'Account' : 'Login' },
    { id: 'cart', label: 'Cart', badge: cartCount },
    { id: 'address', label: 'Address' },
    { id: 'payment', label: 'Payment' },
    { id: 'orders', label: 'Orders', badge: orders.length },
    { id: 'trash', label: 'Trash', badge: trash.length },
  ];

  const checkoutSteps = [
    { id: 'account', label: 'Login', complete: Boolean(user) },
    { id: 'cart', label: 'Cart', complete: cart.length > 0 },
    { id: 'address', label: 'Address', complete: addressComplete },
    { id: 'payment', label: 'Payment', complete: Boolean(paymentMethod) },
  ];

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId('');
  };

  const openAddProduct = () => {
    resetForm();
    setActiveView('add');
  };

  const switchView = (view) => {
    if (view === 'add') resetForm();
    setError('');
    setActiveView(view);
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAddressChange = (event) => {
    const { name, value } = event.target;
    setAddress((current) => ({ ...current, [name]: value }));
  };

  const handleAuthChange = (event) => {
    const { name, value } = event.target;
    setAuthForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.category.trim() || form.price === '') {
      setError('Name, price aur category zaroori hai.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const payload = {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
      };

      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
      } else {
        await api.post('/products', payload);
      }

      setOrderMessage(editingId ? 'Product updated successfully.' : 'Product added successfully.');
      resetForm();
      await loadProducts();
      setActiveView('shop');
    } catch (err) {
      setError(err.response?.data?.error || 'Product save nahi ho paaya.');
    } finally {
      setSaving(false);
    }
  };

  const addToCart = (product) => {
    setOrderMessage(`${product.name} added to cart.`);
    setError('');
    setCart((current) => {
      const existing = current.find((item) => item._id === product._id);
      if (existing) {
        return current.map((item) =>
          item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [
        ...current,
        {
          _id: product._id,
          name: product.name,
          price: product.price,
          category: product.category,
          quantity: 1,
        },
      ];
    });
  };

  const updateCartQuantity = (id, change) => {
    setCart((current) =>
      current
        .map((item) => ({ ...item, quantity: item._id === id ? item.quantity + change : item.quantity }))
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (id) => {
    setCart((current) => current.filter((item) => item._id !== id));
  };

  const handleAddressSubmit = (event) => {
    event.preventDefault();

    if (!addressComplete) {
      setError('Delivery address complete karein.');
      return;
    }

    setError('');
    setOrderMessage('Address saved.');
    setActiveView('payment');
  };

  const placeOrder = async () => {
    if (!user) {
      setError('Order place karne se pehle login karein.');
      setActiveView('account');
      return;
    }

    if (cart.length === 0) {
      setError('Cart empty hai. Pehle products add karein.');
      setActiveView('shop');
      return;
    }

    if (!addressComplete) {
      setError('Delivery address complete karein.');
      setActiveView('address');
      return;
    }

    try {
      setError('');
      const payload = {
        items: cart.map((item) => ({
          productId: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        address,
        paymentMethod,
      };
      const res = await api.post('/orders', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setOrderMessage(`Order placed. Order ID: ${res.data._id}. Total: ${formatCurrency(res.data.total)}`);
      setCart([]);
      await loadOrders();
      setActiveView('orders');
    } catch (err) {
      setError(err.response?.data?.error || 'Order could not be placed.');
    }
  };

  const saveSession = (session) => {
    setUser(session.user);
    setToken(session.token);
    localStorage.setItem('user', JSON.stringify(session.user));
    localStorage.setItem('token', session.token);
  };

  const logout = () => {
    setUser(null);
    setToken('');
    setOrders([]);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setOrderMessage('Logged out.');
    setActiveView('account');
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();

    try {
      setAuthLoading(true);
      setError('');

      const endpoint = authMode === 'register' ? '/auth/register' : '/auth/login';
      const payload =
        authMode === 'register'
          ? authForm
          : { email: authForm.email, password: authForm.password };
      const res = await api.post(endpoint, payload);

      saveSession(res.data);
      await loadOrders(res.data.token);
      setAuthForm(emptyAuthForm);
      setOrderMessage(authMode === 'register' ? 'Account created successfully.' : 'Login successful.');
      setActiveView(cart.length > 0 ? 'address' : 'shop');
    } catch (err) {
      setError(err.response?.data?.error || 'Login/register failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const startEdit = (product) => {
    setEditingId(product._id);
    setForm({
      name: product.name,
      price: product.price,
      category: product.category,
      stock: product.stock,
      image: product.image || '',
      description: product.description || '',
      serviceItem: Boolean(product.serviceItem),
    });
    setActiveView('add');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteProduct = async (id) => {
    try {
      setError('');
      await api.delete(`/products/${id}`);
      await loadProducts();
      if (activeView === 'trash') await loadTrash();
      setOrderMessage('Product moved to trash.');
    } catch (err) {
      setError(err.response?.data?.error || 'Product could not be deleted.');
    }
  };

  const restoreProduct = async (id) => {
    try {
      setError('');
      await api.put(`/products/restore/${id}`);
      await loadProducts();
      await loadTrash();
      setOrderMessage('Product restored.');
    } catch (err) {
      setError(err.response?.data?.error || 'Product can not be restored.');
    }
  };

  const renderCheckoutSteps = () => (
    <div className="checkout-steps" aria-label="Checkout progress">
      {checkoutSteps.map((step) => (
        <button
          type="button"
          key={step.id}
          className={`step-pill ${step.complete ? 'complete' : ''} ${activeView === step.id ? 'active' : ''}`}
          onClick={() => switchView(step.id)}
        >
          <span>{step.complete ? 'Done' : 'Open'}</span>
          {step.label}
        </button>
      ))}
    </div>
  );

  const renderOrderSummary = () => (
    <aside className="panel summary-panel">
      <div className="panel-heading compact">
        <div>
          <p className="eyebrow">Summary</p>
          <h2>Order total</h2>
        </div>
      </div>

      <div className="summary-lines">
        <div>
          <span>Items</span>
          <strong>{cartCount}</strong>
        </div>
        <div>
          <span>Subtotal</span>
          <strong>{formatCurrency(cartTotal)}</strong>
        </div>
        <div>
          <span>Payment</span>
          <strong>{paymentOptions.find((item) => item.value === paymentMethod)?.title}</strong>
        </div>
      </div>

      {renderCheckoutSteps()}

      <button type="button" className="checkout-button" onClick={placeOrder}>
        Place order
      </button>
    </aside>
  );

  const renderCatalog = () => (
    <section className="content-stack">
      <div className="metric-strip">
        <article className="metric-card">
          <span>Total products</span>
          <strong>{products.length}</strong>
        </article>
        <article className="metric-card accent-blue">
          <span>Cart items</span>
          <strong>{cartCount}</strong>
        </article>
        <article className="metric-card accent-amber">
          <span>Service items</span>
          <strong>{serviceCount}</strong>
        </article>
        <article className="metric-card accent-green">
          <span>Inventory value</span>
          <strong>{formatCurrency(inventoryValue)}</strong>
        </article>
      </div>

      <section className="panel catalog-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Products</p>
            <h2>Product catalogue</h2>
          </div>
          <button type="button" onClick={openAddProduct}>
            Add product
          </button>
        </div>

        <div className="toolbar">
          <label className="search-field">
            <span>Search</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products"
            />
          </label>
          <label>
            <span>Category</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="filter-chips">
          <button
            type="button"
            className={!category ? 'selected' : ''}
            onClick={() => setCategory('')}
          >
            All
          </button>
          {categories.map((item) => (
            <button
              type="button"
              key={item}
              className={category === item ? 'selected' : ''}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>

        {loading && <p className="empty-state">Loading products...</p>}
        {!loading && visibleProducts.length === 0 && <p className="empty-state">Koi product match nahi hua.</p>}

        <div className="product-grid">
          {visibleProducts.map((product) => (
            <article className="product-card" key={product._id}>
              <img
                src={getProductPhoto(product)}
                alt={product.name}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = getFallbackPhoto(product);
                }}
              />
              <div className="product-info">
                <div className="product-meta">
                  <span>{product.category}</span>
                  {product.serviceItem && <span className="tag">Service</span>}
                </div>
                <h3>{product.name}</h3>
                <p className="product-description">{product.description || 'No description added yet.'}</p>
                <div className="product-footer">
                  <strong>{formatCurrency(product.price)}</strong>
                  <span className={product.stock > 0 ? 'stock-pill' : 'stock-pill out'}>
                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                  </span>
                </div>
              </div>
              <div className="card-actions">
                <button type="button" onClick={() => addToCart(product)} disabled={product.stock <= 0}>
                  Add
                </button>
                <button type="button" className="secondary-button" onClick={() => startEdit(product)}>
                  Edit
                </button>
                <button type="button" className="danger-button" onClick={() => deleteProduct(product._id)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );

  const renderProductEditor = () => (
    <section className="split-layout">
      <form className="panel form-panel" onSubmit={handleSubmit}>
        <div className="panel-heading compact">
          <div>
            <p className="eyebrow">Inventory</p>
            <h2>{editingId ? 'Edit product' : 'Add product'}</h2>
          </div>
        </div>

        <label>
          Product name
          <input name="name" value={form.name} onChange={handleChange} placeholder="Sports Shoes" />
        </label>

        <div className="form-row">
          <label>
            Price
            <input name="price" type="number" min="0" value={form.price} onChange={handleChange} />
          </label>
          <label>
            Stock
            <input name="stock" type="number" min="0" value={form.stock} onChange={handleChange} />
          </label>
        </div>

        <label>
          Category
          <input name="category" value={form.category} onChange={handleChange} placeholder="Footwear" />
        </label>

        <label>
          Image URL
          <input name="image" value={form.image} onChange={handleChange} placeholder="https://..." />
        </label>

        <label>
          Description
          <textarea name="description" value={form.description} onChange={handleChange} rows="4" />
        </label>

        <label className="checkbox-label">
          <input
            name="serviceItem"
            type="checkbox"
            checked={form.serviceItem}
            onChange={handleChange}
          />
          Service item
        </label>

        <div className="form-actions">
          <button type="submit" disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Update product' : 'Add product'}
          </button>
          {editingId && (
            <button type="button" className="secondary-button" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <aside className="panel preview-panel">
        <div className="panel-heading compact">
          <div>
            <p className="eyebrow">Preview</p>
            <h2>Product card</h2>
          </div>
        </div>
        <div className="preview-card">
          <img
            src={form.image || getFallbackPhoto({ name: form.name || 'New Product', category: form.category || 'Category' })}
            alt={form.name || 'Product preview'}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = getFallbackPhoto({ name: form.name || 'New Product', category: form.category || 'Category' });
            }}
          />
          <div>
            <span className="preview-category">{form.category || 'Category'}</span>
            <h3>{form.name || 'Product name'}</h3>
            <p>{form.description || 'Short product description will appear here.'}</p>
            <strong>{formatCurrency(form.price)}</strong>
          </div>
        </div>
      </aside>
    </section>
  );

  const renderAccount = () => (
    <section className="split-layout">
      <section className="panel account-panel">
        <div className="panel-heading compact">
          <div>
            <p className="eyebrow">Account</p>
            <h2>{user ? 'Customer profile' : 'Login / Register'}</h2>
          </div>
        </div>

        {user ? (
          <div className="profile-card">
            <div className="avatar">{user.name?.[0]?.toUpperCase() || 'U'}</div>
            <div>
              <h3>{user.name}</h3>
              <p>{user.email}</p>
              <span>Ready for checkout</span>
            </div>
            <button type="button" className="secondary-button" onClick={logout}>
              Logout
            </button>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleAuthSubmit}>
            <div className="auth-tabs">
              <button
                type="button"
                className={authMode === 'login' ? 'active' : ''}
                onClick={() => setAuthMode('login')}
              >
                Login
              </button>
              <button
                type="button"
                className={authMode === 'register' ? 'active' : ''}
                onClick={() => setAuthMode('register')}
              >
                Register
              </button>
            </div>
            {authMode === 'register' && (
              <label>
                Full name
                <input name="name" value={authForm.name} onChange={handleAuthChange} placeholder="Customer name" />
              </label>
            )}
            <label>
              Email
              <input name="email" value={authForm.email} onChange={handleAuthChange} placeholder="customer@email.com" />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                value={authForm.password}
                onChange={handleAuthChange}
                placeholder="Minimum 6 characters"
              />
            </label>
            <button type="submit" disabled={authLoading}>
              {authLoading ? 'Please wait...' : authMode === 'register' ? 'Create account' : 'Login'}
            </button>
          </form>
        )}
      </section>

      <aside className="panel summary-panel">
        <div className="panel-heading compact">
          <div>
            <p className="eyebrow">Checkout</p>
            <h2>Progress</h2>
          </div>
        </div>
        {renderCheckoutSteps()}
        <button type="button" className="secondary-button wide-button" onClick={() => switchView('cart')}>
          Go to cart
        </button>
      </aside>
    </section>
  );

  const renderCart = () => (
    <section className="split-layout cart-layout">
      <section className="panel cart-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Cart</p>
            <h2>Selected items</h2>
          </div>
          <button type="button" className="secondary-button" onClick={() => switchView('shop')}>
            Add more
          </button>
        </div>

        {cart.length === 0 && <p className="empty-state">Cart empty hai.</p>}

        <div className="cart-list">
          {cart.map((item) => (
            <div className="cart-item" key={item._id}>
              <div>
                <span>{item.category}</span>
                <strong>{item.name}</strong>
                <p>{formatCurrency(item.price)} each</p>
              </div>
              <div className="qty-controls">
                <button type="button" onClick={() => updateCartQuantity(item._id, -1)}>
                  -
                </button>
                <span>{item.quantity}</span>
                <button type="button" onClick={() => updateCartQuantity(item._id, 1)}>
                  +
                </button>
              </div>
              <strong>{formatCurrency(item.price * item.quantity)}</strong>
              <button type="button" className="text-danger" onClick={() => removeFromCart(item._id)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>

      <aside className="panel summary-panel">
        <div className="panel-heading compact">
          <div>
            <p className="eyebrow">Checkout</p>
            <h2>Next step</h2>
          </div>
        </div>
        <div className="summary-lines">
          <div>
            <span>Items</span>
            <strong>{cartCount}</strong>
          </div>
          <div>
            <span>Total</span>
            <strong>{formatCurrency(cartTotal)}</strong>
          </div>
        </div>
        {renderCheckoutSteps()}
        <button
          type="button"
          className="checkout-button"
          onClick={() => switchView(user ? 'address' : 'account')}
          disabled={cart.length === 0}
        >
          Continue
        </button>
      </aside>
    </section>
  );

  const renderAddress = () => (
    <section className="split-layout">
      <form className="panel form-panel" onSubmit={handleAddressSubmit}>
        <div className="panel-heading compact">
          <div>
            <p className="eyebrow">Delivery</p>
            <h2>Address details</h2>
          </div>
        </div>

        <label>
          Full name
          <input name="fullName" value={address.fullName} onChange={handleAddressChange} placeholder="Customer full name" />
        </label>
        <label>
          Phone number
          <input name="phone" type="tel" value={address.phone} onChange={handleAddressChange} placeholder="10 digit mobile number" />
        </label>
        <label>
          House / street
          <input name="line1" value={address.line1} onChange={handleAddressChange} placeholder="House, street, landmark" />
        </label>
        <div className="form-row">
          <label>
            City
            <input name="city" value={address.city} onChange={handleAddressChange} placeholder="City" />
          </label>
          <label>
            Pincode
            <input name="pincode" value={address.pincode} onChange={handleAddressChange} placeholder="Pincode" />
          </label>
        </div>

        <div className="form-actions">
          <button type="submit">Save address</button>
          <button type="button" className="secondary-button" onClick={() => switchView('cart')}>
            Back to cart
          </button>
        </div>
      </form>

      {renderOrderSummary()}
    </section>
  );

  const renderPayment = () => (
    <section className="split-layout">
      <section className="panel payment-panel">
        <div className="panel-heading compact">
          <div>
            <p className="eyebrow">Payment</p>
            <h2>Payment method</h2>
          </div>
        </div>

        <div className="payment-options">
          {paymentOptions.map((option) => (
            <label className={paymentMethod === option.value ? 'payment-card selected' : 'payment-card'} key={option.value}>
              <input
                type="radio"
                name="payment"
                value={option.value}
                checked={paymentMethod === option.value}
                onChange={(event) => setPaymentMethod(event.target.value)}
              />
              <span>
                <strong>{option.title}</strong>
                <small>{option.note}</small>
              </span>
            </label>
          ))}
        </div>

        <div className="address-review">
          <p className="eyebrow">Delivery to</p>
          {addressComplete ? (
            <p>
              {address.fullName}, {address.line1}, {address.city} - {address.pincode}
            </p>
          ) : (
            <p>Address pending.</p>
          )}
          <button type="button" className="secondary-button" onClick={() => switchView('address')}>
            Edit address
          </button>
        </div>
      </section>

      {renderOrderSummary()}
    </section>
  );

  const renderOrders = () => (
    <section className="panel orders-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Orders</p>
          <h2>Recent orders</h2>
        </div>
        {user && (
          <button type="button" className="secondary-button" onClick={() => loadOrders()}>
            Refresh
          </button>
        )}
      </div>

      {!user && (
        <div className="empty-state action-state">
          <p>Orders dekhne ke liye login karein.</p>
          <button type="button" onClick={() => switchView('account')}>
            Login
          </button>
        </div>
      )}

      {user && orders.length === 0 && <p className="empty-state">Abhi koi order nahi hai.</p>}

      {user && orders.length > 0 && (
        <div className="orders-list">
          {orders.map((order) => (
            <article className="order-row" key={order._id}>
              <div>
                <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                <h3>{order._id}</h3>
                <p>{order.items.length} item(s) | {order.status}</p>
              </div>
              <div>
                <strong>{formatCurrency(order.total)}</strong>
                <span>{order.paymentMethod?.toUpperCase()}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );

  const renderTrash = () => (
    <section className="panel trash-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Trash</p>
          <h2>Deleted products</h2>
        </div>
        <button type="button" className="secondary-button" onClick={loadTrash}>
          Refresh
        </button>
      </div>

      {trash.length === 0 && <p className="empty-state">Trash empty hai.</p>}

      {trash.length > 0 && (
        <div className="trash-list">
          {trash.map((product) => (
            <div className="trash-item" key={product._id}>
              <div>
                <strong>{product.name}</strong>
                <span>{product.category}</span>
              </div>
              <button type="button" onClick={() => restoreProduct(product._id)}>
                Restore
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  return (
    <main className="shop-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark">P</span>
          <div>
            <p className="eyebrow">Retail desk</p>
            <h1>Patwa Repair Shop</h1>
          </div>
        </div>

        <div className="topbar-actions">
          <button type="button" className="ghost-button" onClick={loadProducts}>
            Refresh
          </button>
          {user ? (
            <button type="button" className="secondary-button" onClick={() => switchView('account')}>
              {user.name}
            </button>
          ) : (
            <button type="button" onClick={() => switchView('account')}>
              Login
            </button>
          )}
        </div>
      </header>

      <nav className="section-nav" aria-label="App sections">
        {navItems.map((item) => (
          <button
            type="button"
            key={item.id}
            className={activeView === item.id ? 'nav-tab active' : 'nav-tab'}
            onClick={() => switchView(item.id)}
          >
            <span>{item.label}</span>
            {item.badge !== undefined && <small>{item.badge}</small>}
          </button>
        ))}
      </nav>

      {(error || orderMessage) && (
        <div className="notice-stack">
          {error && <p className="notice error">{error}</p>}
          {orderMessage && <p className="notice success">{orderMessage}</p>}
        </div>
      )}

      {activeView === 'shop' && renderCatalog()}
      {activeView === 'add' && renderProductEditor()}
      {activeView === 'account' && renderAccount()}
      {activeView === 'cart' && renderCart()}
      {activeView === 'address' && renderAddress()}
      {activeView === 'payment' && renderPayment()}
      {activeView === 'orders' && renderOrders()}
      {activeView === 'trash' && renderTrash()}
    </main>
  );
}

export default App;
