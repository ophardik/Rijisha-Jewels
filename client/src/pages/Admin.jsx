import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import JewelArt from '../components/JewelArt';
import Loader from '../components/Loader';
import { toast } from '../toast';

const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

const ART_OPTIONS = [
  { key: 'jhumka', label: 'Jhumka' },
  { key: 'hoops', label: 'Hoops' },
  { key: 'chandbali', label: 'Chandbali' },
  { key: 'drops', label: 'Drops' },
  { key: 'pendant', label: 'Pendant' },
  { key: 'layered', label: 'Layered' },
  { key: 'choker', label: 'Choker' },
  { key: 'moon', label: 'Moon' },
  { key: 'bangle', label: 'Bangle' },
  { key: 'charm', label: 'Charm Bracelet' },
  { key: 'anklet', label: 'Anklet' },
  { key: 'tikka', label: 'Maang Tikka' },
];

const BG_OPTIONS = ['bg-a', 'bg-b', 'bg-c', 'bg-d'];

const COLLECTIONS = [
  { key: 'earrings', label: 'Earrings', art: 'earringsPair' },
  { key: 'necklaces', label: 'Necklaces', art: 'necklaceCat' },
  { key: 'bracelets', label: 'Bracelets', art: 'bangle' },
  { key: 'antique', label: 'Antique Jewellery', art: 'tikka' },
];

const EMPTY = {
  name: '',
  category: 'earrings',
  subCategory: '',
  description: '',
  price: '',
  mrp: '',
  stock: '25',
  tag: '',
  art: 'pendant',
  bg: 'bg-a',
};

export default function Admin() {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [mediaFiles, setMediaFiles] = useState([]); // new files: { file, url, type }
  const [existingMedia, setExistingMedia] = useState([]); // already-uploaded: { url, type }
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [collectionImages, setCollectionImages] = useState({});
  const [collectionBusy, setCollectionBusy] = useState('');
  const fileRef = useRef();
  const formRef = useRef();

  const isAdmin = !!user?.isAdmin;
  const load = () => api('/products?sort=newest').then(setProducts).catch((e) => setError(e.message));
  useEffect(() => {
    if (!isAdmin) return;
    load();
    api('/home-collections').then(setCollectionImages).catch(() => {});
  }, [isAdmin]);

  if (authLoading) return <section className="section"><Loader /></section>;

  // Anyone who is not an authenticated admin is sent straight to the admin
  // login — the panel never renders for them.
  if (!isAdmin) return <Navigate to="/admin/login" replace />;

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const onFile = (e) => {
    const picked = Array.from(e.target.files || []).map((file) => ({
      file,
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' : 'image',
    }));
    setMediaFiles((prev) => [...prev, ...picked]);
    if (fileRef.current) fileRef.current.value = ''; // allow re-picking the same file
  };

  const removeNewFile = (i) => setMediaFiles((prev) => prev.filter((_, idx) => idx !== i));
  const removeExisting = (i) => setExistingMedia((prev) => prev.filter((_, idx) => idx !== i));

  const resetForm = () => {
    setForm(EMPTY);
    setEditingId(null);
    setMediaFiles([]);
    setExistingMedia([]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const startEdit = (p) => {
    setEditingId(p._id);
    setForm({
      name: p.name,
      category: p.category,
      subCategory: p.subCategory || '',
      description: p.description || '',
      price: String(p.price),
      mrp: p.mrp ? String(p.mrp) : '',
      stock: String(p.stock),
      tag: p.tag || '',
      art: p.art || 'pendant',
      bg: p.bg || 'bg-a',
    });
    setMediaFiles([]);
    setExistingMedia(
      p.media?.length
        ? p.media.map(({ url, type }) => ({ url, type }))
        : p.image ? [{ url: p.image, type: 'image' }] : []
    );
    if (fileRef.current) fileRef.current.value = '';
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value));
      mediaFiles.forEach((m) => data.append('media', m.file));
      if (editingId) data.append('existingMedia', JSON.stringify(existingMedia));

      if (editingId) {
        await api(`/products/${editingId}`, { method: 'PUT', body: data });
        toast('✓ Product updated');
      } else {
        await api('/products', { method: 'POST', body: data });
        toast('✓ Product added — it is live on the shop now');
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try {
      await api(`/products/${p._id}`, { method: 'DELETE' });
      toast(`${p.name} deleted`);
      if (editingId === p._id) resetForm();
      load();
    } catch (err) {
      toast(err.message);
    }
  };

  const onCollectionImage = async (key, e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setCollectionBusy(key);
    try {
      const data = new FormData();
      data.append('image', file);
      const res = await api(`/home-collections/${key}`, { method: 'PUT', body: data });
      setCollectionImages((prev) => ({ ...prev, [key]: res.image }));
      toast(key === 'hero'
        ? '✓ Hero video updated — it is live on the home page'
        : '✓ Collection photo updated — it is live on the home page');
    } catch (err) {
      toast(err.message);
    } finally {
      setCollectionBusy('');
    }
  };

  const resetCollectionImage = async (key) => {
    setCollectionBusy(key);
    try {
      await api(`/home-collections/${key}`, { method: 'DELETE' });
      setCollectionImages((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      toast(key === 'hero'
        ? 'Hero is back to the default video'
        : 'Card is back to its default illustration');
    } catch (err) {
      toast(err.message);
    } finally {
      setCollectionBusy('');
    }
  };

  const onLogout = () => {
    logout();
    toast('Logged out of the admin panel');
    navigate('/admin/login');
  };

  return (
    <section className="section">
      <div className="container">
        <div className="admin-topbar">
          <Link to="/" className="mini-btn">← View Store</Link>
          <span className="muted">Signed in as {user.email}</span>
          <button className="mini-btn danger" onClick={onLogout}>Log Out</button>
        </div>
        <div className="section-head">
          <span className="section-eyebrow">Store Management</span>
          <h2>Admin Panel</h2>
          <p>Add, edit or remove pieces — changes appear on the shop instantly.</p>
        </div>

        {/* Homepage media: hero video + collection card images */}
        <div className="admin-form collection-admin">
          <h3 className="serif">Homepage Media</h3>
          <p className="muted collection-hint">
            Control what visitors see first — the hero video at the top of the home page and the photos
            on the four "Shop by Collection" cards. Reset anything to bring back its built-in default.
          </p>

          <div className="hero-admin">
            <span className="field-label">Hero Video — top of the home page</span>
            <div className="hero-admin-row">
              <div className="hero-admin-preview">
                <video
                  key={collectionImages.hero || 'default-hero'}
                  src={collectionImages.hero || '/videos/hero-jewellery.mp4'}
                  autoPlay
                  muted
                  loop
                  playsInline
                />
                {!collectionImages.hero && <span className="hero-default-tag">Default</span>}
              </div>
              <div className="hero-admin-info">
                <p className="muted">
                  This video plays inside the arched frame of the hero section. A vertical (portrait)
                  video looks best — mp4, webm or mov, up to 50&nbsp;MB. Keep it short and seamless;
                  it loops silently.
                </p>
                <div className="collection-actions">
                  <label className={`mini-btn ${collectionBusy === 'hero' ? 'disabled' : ''}`}>
                    {collectionBusy === 'hero' ? 'Uploading…' : collectionImages.hero ? 'Change Video' : 'Upload Video'}
                    <input
                      type="file"
                      accept="video/*"
                      hidden
                      disabled={collectionBusy === 'hero'}
                      onChange={(e) => onCollectionImage('hero', e)}
                    />
                  </label>
                  {collectionImages.hero && (
                    <button
                      type="button"
                      className="mini-btn danger"
                      disabled={collectionBusy === 'hero'}
                      onClick={() => resetCollectionImage('hero')}
                    >
                      Reset to Default
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <span className="field-label">Shop by Collection — card photos</span>
          <div className="collection-grid">
            {COLLECTIONS.map((c) => (
              <div className="collection-tile" key={c.key}>
                <span className="field-label">{c.label}</span>
                <div className={`collection-preview cat-${c.key} ${collectionImages[c.key] ? 'has-photo' : ''}`}>
                  {collectionImages[c.key]
                    ? <img src={collectionImages[c.key]} alt={`${c.label} collection`} />
                    : <JewelArt art={c.art} />}
                </div>
                <div className="collection-actions">
                  <label className={`mini-btn ${collectionBusy === c.key ? 'disabled' : ''}`}>
                    {collectionBusy === c.key ? 'Uploading…' : collectionImages[c.key] ? 'Change Photo' : 'Upload Photo'}
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      disabled={collectionBusy === c.key}
                      onChange={(e) => onCollectionImage(c.key, e)}
                    />
                  </label>
                  {collectionImages[c.key] && (
                    <button
                      type="button"
                      className="mini-btn danger"
                      disabled={collectionBusy === c.key}
                      onClick={() => resetCollectionImage(c.key)}
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add / edit form */}
        <form className="admin-form" onSubmit={submit} ref={formRef}>
          <h3 className="serif">{editingId ? 'Edit Product' : 'Add New Product'}</h3>
          <div className="field-grid admin-grid">
            <label>Name *
              <input required value={form.name} onChange={set('name')} placeholder="e.g. Riya Silver Studs" />
            </label>
            <label>Category *
              <select value={form.category} onChange={set('category')}>
                <option value="earrings">Earrings</option>
                <option value="necklaces">Necklaces</option>
                <option value="bracelets">Bracelets</option>
                <option value="antique">Antique Jewellery</option>
              </select>
            </label>
            <label>Sub-category
              <input value={form.subCategory} onChange={set('subCategory')} placeholder="e.g. Studs, Jhumka, Pendant" />
            </label>
            <label>Price (₹) *
              <input required type="number" min="1" value={form.price} onChange={set('price')} placeholder="2499" />
            </label>
            <label>MRP (₹, for showing a discount)
              <input type="number" min="1" value={form.mrp} onChange={set('mrp')} placeholder="3199 (optional)" />
            </label>
            <label>Stock
              <input type="number" min="0" value={form.stock} onChange={set('stock')} />
            </label>
            <label>Tag
              <select value={form.tag} onChange={set('tag')}>
                <option value="">None</option>
                <option value="Bestseller">Bestseller</option>
                <option value="New">New</option>
                <option value="Festive">Festive</option>
                <option value="Sale">Sale</option>
              </select>
            </label>
            <label>Photos & Videos (you can select multiple)
              <input ref={fileRef} type="file" accept="image/*,video/*" multiple onChange={onFile} />
            </label>
            <label className="wide">Description
              <textarea rows="3" value={form.description} onChange={set('description')} placeholder="Tell customers what makes this piece special..." />
            </label>
          </div>

          <div className="admin-visual-row">
            <div>
              <span className="field-label">If no photo: illustration style</span>
              <div className="art-picker">
                {ART_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option.key}
                    className={`art-option ${form.bg} ${form.art === option.key ? 'selected' : ''}`}
                    onClick={() => setForm({ ...form, art: option.key })}
                    title={option.label}
                  >
                    <JewelArt art={option.key} />
                  </button>
                ))}
              </div>
              <span className="field-label">Card background</span>
              <div className="art-picker">
                {BG_OPTIONS.map((bg) => (
                  <button
                    type="button"
                    key={bg}
                    className={`bg-option ${bg} ${form.bg === bg ? 'selected' : ''}`}
                    onClick={() => setForm({ ...form, bg })}
                    aria-label={bg}
                  />
                ))}
              </div>
            </div>
            <div className="admin-preview">
              <span className="field-label">Preview</span>
              <div className={`preview-card ${form.bg}`}>
                {(() => {
                  const first = existingMedia[0] || mediaFiles[0];
                  if (!first) return <JewelArt art={form.art} />;
                  return first.type === 'video'
                    ? <video src={first.url} className="product-photo" muted />
                    : <img src={first.url} alt="Preview" className="product-photo" />;
                })()}
              </div>
            </div>
          </div>

          {(existingMedia.length > 0 || mediaFiles.length > 0) && (
            <div className="media-list">
              <span className="field-label">
                Product media ({existingMedia.length + mediaFiles.length}) — the first photo is used as the thumbnail
              </span>
              <div className="media-grid">
                {existingMedia.map((m, i) => (
                  <div className="media-item" key={`old-${m.url}`}>
                    {m.type === 'video'
                      ? <video src={m.url} muted />
                      : <img src={m.url} alt="" />}
                    {m.type === 'video' && <span className="media-badge">▶</span>}
                    <button type="button" className="media-remove" onClick={() => removeExisting(i)} aria-label="Remove">×</button>
                  </div>
                ))}
                {mediaFiles.map((m, i) => (
                  <div className="media-item is-new" key={`new-${i}-${m.file.name}`}>
                    {m.type === 'video'
                      ? <video src={m.url} muted />
                      : <img src={m.url} alt="" />}
                    {m.type === 'video' && <span className="media-badge">▶</span>}
                    <span className="media-new-tag">new</span>
                    <button type="button" className="media-remove" onClick={() => removeNewFile(i)} aria-label="Remove">×</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <p className="form-error">{error}</p>}
          <div className="admin-actions">
            <button className="btn btn-dark" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Product'}
            </button>
            {editingId && (
              <button type="button" className="btn btn-ghost" onClick={resetForm}>Cancel Edit</button>
            )}
          </div>
        </form>

        {/* Product table */}
        <div className="admin-table-wrap">
          <h3 className="serif">All Products ({products.length})</h3>
          <table className="admin-table">
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Tag</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id}>
                  <td>
                    <div className={`table-thumb ${p.bg}`}>
                      {(() => {
                        const first = p.media?.[0] || (p.image ? { url: p.image, type: 'image' } : null);
                        if (!first) return <JewelArt art={p.art} />;
                        return first.type === 'video'
                          ? <video src={first.url} className="product-photo" muted />
                          : <img src={first.url} alt={p.name} className="product-photo" />;
                      })()}
                    </div>
                  </td>
                  <td>
                    <Link to={`/product/${p.slug}`} className="table-name">{p.name}</Link>
                    <span className="muted table-sub">{p.subCategory}</span>
                  </td>
                  <td className="cap">{p.category}</td>
                  <td>{inr(p.price)}{p.mrp ? <s className="muted"> {inr(p.mrp)}</s> : null}</td>
                  <td className={p.stock <= 5 ? 'low-stock' : ''}>{p.stock}</td>
                  <td>{p.tag || '—'}</td>
                  <td>
                    <div className="table-actions">
                      <button className="mini-btn" onClick={() => startEdit(p)}>Edit</button>
                      <button className="mini-btn danger" onClick={() => onDelete(p)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
