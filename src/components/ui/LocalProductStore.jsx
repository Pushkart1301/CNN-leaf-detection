import React, { useEffect, useState } from 'react';
import { Plus, ShoppingCart, Trash2 } from 'lucide-react';

const CART_STORAGE_KEY = 'agriverse-local-product-cart';

const loadCart = () => {
  try {
    const savedCart = window.localStorage.getItem(CART_STORAGE_KEY);
    const parsedCart = savedCart ? JSON.parse(savedCart) : [];
    return Array.isArray(parsedCart)
      ? parsedCart.filter(item => (
        item &&
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        Number.isFinite(item.price) &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0
      ))
      : [];
  } catch (error) {
    console.warn('Could not load the local store cart:', error);
    return [];
  }
};

const getProductDetails = (product, kind) => {
  const price = Number(kind === 'fertilizer' ? product.price_per_bag_inr : product.price_inr);
  const detail = kind === 'fertilizer'
    ? `NPK ${product.npk_ratio || '—'}`
    : product.category || 'Irrigation equipment';

  return {
    id: `${kind}:${product.id}`,
    name: product.name,
    brand: product.brand || '',
    detail,
    price: Number.isFinite(price) ? price : 0,
  };
};

const ProductIllustration = ({ product, kind }) => {
  const isFertilizer = kind === 'fertilizer';
  const category = (product.category || '').toLowerCase();
  const isPump = category.includes('pump');
  const isValve = category.includes('valve') || category.includes('controller');
  const label = isFertilizer ? `NPK ${product.npk_ratio || ''}` : isPump ? 'WATER PUMP' : isValve ? 'CONTROL VALVE' : 'DRIP KIT';
  const gradientId = `store-product-${kind}-${String(product.id).replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <svg viewBox="0 0 640 320" role="img" aria-label={`${product.name} product illustration`} className="h-full w-full">
      <defs>
        <linearGradient id={`${gradientId}-bg`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#102b36" />
          <stop offset="100%" stopColor="#07121e" />
        </linearGradient>
        <linearGradient id={`${gradientId}-product`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={isFertilizer ? '#34d399' : '#22d3ee'} />
          <stop offset="100%" stopColor={isFertilizer ? '#047857' : '#0e7490'} />
        </linearGradient>
      </defs>
      <rect width="640" height="320" fill={`url(#${gradientId}-bg)`} />
      <circle cx="520" cy="55" r="110" fill="#10b981" opacity=".08" />
      <path d="M0 265 Q150 235 320 268 T640 252 V320 H0Z" fill="#064e3b" opacity=".48" />
      {isFertilizer ? (
        <g>
          <path d="M240 58 L400 58 L424 90 L412 266 Q320 290 228 266 L216 90Z" fill={`url(#${gradientId}-product)`} stroke="#a7f3d0" strokeWidth="4" />
          <path d="M240 58 Q320 78 400 58 L388 92 Q320 108 252 92Z" fill="#d1fae5" />
          <path d="M252 132 H388 V224 H252Z" fill="#07121e" opacity=".86" rx="8" />
          <text x="320" y="167" textAnchor="middle" fill="#6ee7b7" fontSize="23" fontWeight="700">FERTILIZER</text>
          <text x="320" y="200" textAnchor="middle" fill="white" fontSize="29" fontWeight="800">{product.npk_ratio || 'NPK'}</text>
        </g>
      ) : isPump ? (
        <g stroke="#67e8f9" strokeWidth="8" strokeLinejoin="round">
          <path d="M270 115 H374 Q403 115 403 145 V218 H255 V145 Q255 115 270 115Z" fill="#0e7490" />
          <circle cx="329" cy="168" r="35" fill="#082f49" />
          <path d="M290 218 V250 H370 V218 M329 203 V280 M370 155 H455 V126" fill="none" />
          <path d="M230 278 H420" stroke="#a7f3d0" strokeWidth="10" />
          <path d="M270 91 L320 58 L370 91Z" fill="#064e3b" />
          <text x="329" y="178" textAnchor="middle" fill="white" stroke="none" fontSize="15" fontWeight="800">PUMP</text>
        </g>
      ) : isValve ? (
        <g stroke="#67e8f9" strokeWidth="9" strokeLinejoin="round" strokeLinecap="round">
          <path d="M130 174 H510 M250 174 V118 H390 V174" fill="none" />
          <rect x="260" y="126" width="120" height="90" rx="18" fill="#0e7490" />
          <path d="M320 126 V84 M292 84 H348" />
          <rect x="280" y="142" width="80" height="48" rx="8" fill="#082f49" />
          <circle cx="320" cy="166" r="12" fill="#34d399" stroke="none" />
        </g>
      ) : (
        <g fill="none" stroke="#67e8f9" strokeWidth="10" strokeLinecap="round">
          <path d="M80 142 H560 M80 200 H560" />
          <path d="M150 142 V200 M260 142 V200 M370 142 V200 M480 142 V200" strokeWidth="5" />
          <path d="M150 212 Q138 232 150 242 Q162 232 150 212 M260 212 Q248 232 260 242 Q272 232 260 212 M370 212 Q358 232 370 242 Q382 232 370 212 M480 212 Q468 232 480 242 Q492 232 480 212" fill="#22d3ee" stroke="none" />
        </g>
      )}
      <rect x="18" y="18" width="206" height="38" rx="19" fill="#020617" opacity=".75" />
      <text x="121" y="43" textAnchor="middle" fill="#a7f3d0" fontSize="16" fontWeight="700">{label}</text>
    </svg>
  );
};

export const LocalProductStore = ({ products, kind }) => {
  const [cart, setCart] = useState(loadCart);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartError, setCartError] = useState('');

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      setCartError('');
    } catch (error) {
      console.error('Could not save the local store cart:', error);
      setCartError('Cart changes could not be saved in this browser.');
    }
  }, [cart]);

  const addToCart = (product) => {
    const item = getProductDetails(product, kind);
    if (!Number.isFinite(item.price) || item.price <= 0) {
      setCartError('This product does not have a valid price and could not be added.');
      return;
    }
    setCart(previous => {
      const existing = previous.find(cartItem => cartItem.id === item.id);
      return existing
        ? previous.map(cartItem => (
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        ))
        : [...previous, { ...item, quantity: 1 }];
    });
    setCartOpen(true);
    setCartError('');
  };

  const changeQuantity = (itemId, change) => {
    setCart(previous => previous
      .map(item => item.id === itemId ? { ...item, quantity: item.quantity + change } : item)
      .filter(item => item.quantity > 0));
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const formatPrice = price => `₹${price.toLocaleString('en-IN')}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2">
        <p className="text-xs text-slate-400">Browse products and manage your cart.</p>
        <button
          type="button"
          onClick={() => setCartOpen(open => !open)}
          className="shrink-0 px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-2"
        >
          <ShoppingCart className="w-4 h-4" />
          Cart · {cartCount}
        </button>
      </div>

      {cartError && (
        <p role="alert" className="text-xs text-amber-300">{cartError}</p>
      )}

      {cartOpen && (
        <section className="glass-panel rounded-xl border border-emerald-500/30 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-100">Your Cart</h4>
            <strong className="text-emerald-300">{formatPrice(cartTotal)}</strong>
          </div>
          {cart.length === 0 ? (
            <p className="text-slate-400">Your cart is empty.</p>
          ) : (
            <div className="space-y-2">
              {cart.map(item => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg bg-white/5 p-2.5">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-200">{item.name}</p>
                    <p className="text-slate-400">{formatPrice(item.price)} each</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button type="button" onClick={() => changeQuantity(item.id, -1)} aria-label={`Remove one ${item.name}`} className="w-7 h-7 rounded-lg bg-white/10 text-slate-200">−</button>
                    <span className="min-w-4 text-center">{item.quantity}</span>
                    <button type="button" onClick={() => changeQuantity(item.id, 1)} aria-label={`Add one ${item.name}`} className="w-7 h-7 rounded-lg bg-white/10 text-slate-200">+</button>
                    <button type="button" onClick={() => setCart(previous => previous.filter(cartItem => cartItem.id !== item.id))} aria-label={`Remove ${item.name} from cart`} className="p-1.5 text-rose-300 hover:text-rose-200">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <p className="text-[10px] text-slate-500">No checkout or payment is available.</p>
            </div>
          )}
        </section>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {products.map(product => {
          const details = getProductDetails(product, kind);
          return (
            <article key={product.id} className="glass-panel overflow-hidden rounded-xl border border-white/10 flex flex-col">
              <div className="h-32 bg-slate-900">
                <ProductIllustration product={product} kind={kind} />
              </div>
              <div className="flex flex-1 flex-col gap-1.5 p-3">
                <h4 className="font-bold text-slate-100">{details.name}</h4>
                <p className="text-[11px] text-slate-400">{details.brand}{details.brand ? ' · ' : ''}{details.detail}</p>
                <strong className="mt-auto pt-1 text-base text-emerald-300">{formatPrice(details.price)}</strong>
                <button
                  type="button"
                  onClick={() => addToCart(product)}
                  className="w-full rounded-xl bg-emerald-500 px-3 py-2.5 font-bold text-slate-950 hover:bg-emerald-400 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add to cart
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
