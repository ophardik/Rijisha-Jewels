import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import JewelArt from '../components/JewelArt';
import { StoryArtMain, StoryArtDetail } from '../components/StoryArt';
import AdminRewards from '../components/AdminRewards';
import Loader from '../components/Loader';
import { toast } from '../toast';
import {
  CATEGORY,
  CATEGORY_LABEL,
  HERO_SLOT,
  SORT,
  MEDIA_TYPE,
  PRODUCT_TAG,
  STORY_SLOT,
  STORY_DETAIL_SLOT,
} from '../enums';
import { STRINGS } from '../strings';
import { usePageTitle } from '../usePageTitle';

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

// The two "Our Story" frames. `Art` is the same component the live pages fall
// back to, so the preview shows exactly what visitors see before any upload.
const STORY_TILES = [
  {
    key: STORY_SLOT,
    shape: 'tall',
    Art: StoryArtMain,
    label: STRINGS.admin.storyMainTile,
    help: STRINGS.admin.storyMainHelp,
  },
  {
    key: STORY_DETAIL_SLOT,
    shape: 'square',
    Art: StoryArtDetail,
    label: STRINGS.admin.storyDetailTile,
    help: STRINGS.admin.storyDetailHelp,
  },
];

const PER_PAGE = 12; // products shown per page in the admin table

const TABS = [
  { key: 'products', label: STRINGS.admin.tabProducts },
  { key: 'homepage', label: STRINGS.admin.tabHomepage },
  { key: 'rewards', label: STRINGS.admin.tabRewards },
];

const COLLECTIONS = [
  { key: CATEGORY.EARRINGS, label: CATEGORY_LABEL[CATEGORY.EARRINGS], art: 'earringsPair' },
  { key: CATEGORY.NECKLACES, label: CATEGORY_LABEL[CATEGORY.NECKLACES], art: 'necklaceCat' },
  { key: CATEGORY.BRACELETS, label: CATEGORY_LABEL[CATEGORY.BRACELETS], art: 'bangle' },
  { key: CATEGORY.ANTIQUE, label: CATEGORY_LABEL[CATEGORY.ANTIQUE], art: 'tikka' },
];

const EMPTY = {
  name: '',
  category: CATEGORY.EARRINGS,
  subCategory: '',
  description: '',
  price: '',
  mrp: '',
  stock: '25',
  tag: '',
  metal: '',
  weight: '',
  plating: '',
  color: '',
  careInstructions: '',
  packageContains: '',
  soldBy: '',
  countryOfOrigin: '',
  art: 'pendant',
  bg: 'bg-a',
};

export default function Admin() {
  usePageTitle(STRINGS.titles.admin);
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
  const [query, setQuery] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState('products');
  const [showForm, setShowForm] = useState(false);
  const fileRef = useRef();
  const formRef = useRef();

  const isAdmin = !!user?.isAdmin;
  const load = () => api(`/products?sort=${SORT.NEWEST}`).then(setProducts).catch((e) => setError(e.message));
  useEffect(() => {
    if (!isAdmin) return;
    load();
    api('/home-collections').then(setCollectionImages).catch(() => {});
  }, [isAdmin]);

  // Search + category filter for the product table (client-side so it stays snappy)
  useEffect(() => { setPage(1); }, [query, filterCat]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (filterCat !== 'all' && p.category !== filterCat) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || (p.subCategory || '').toLowerCase().includes(q);
    });
  }, [products, query, filterCat]);

  if (authLoading) return <section className="section"><Loader /></section>;

  // Anyone who is not an authenticated admin is sent straight to the admin
  // login — the panel never renders for them.
  if (!isAdmin) return <Navigate to="/admin/login" replace />;

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const onFile = (e) => {
    const picked = Array.from(e.target.files || []).map((file) => ({
      file,
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? MEDIA_TYPE.VIDEO : MEDIA_TYPE.IMAGE,
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

  const closeForm = () => { resetForm(); setShowForm(false); };
  const openAddForm = () => { resetForm(); setShowForm(true); };

  const startEdit = (p) => {
    setShowForm(true);
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
      metal: p.metal || '',
      weight: p.weight || '',
      plating: p.plating || '',
      color: p.color || '',
      careInstructions: p.careInstructions || '',
      packageContains: p.packageContains || '',
      soldBy: p.soldBy || '',
      countryOfOrigin: p.countryOfOrigin || '',
      art: p.art || 'pendant',
      bg: p.bg || 'bg-a',
    });
    setMediaFiles([]);
    setExistingMedia(
      p.media?.length
        ? p.media.map(({ url, type }) => ({ url, type }))
        : p.image ? [{ url: p.image, type: MEDIA_TYPE.IMAGE }] : []
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
        toast(STRINGS.admin.productUpdated, 'success');
      } else {
        await api('/products', { method: 'POST', body: data });
        toast(STRINGS.admin.productAdded, 'success');
      }
      closeForm();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (p) => {
    if (!window.confirm(STRINGS.admin.confirmDelete(p.name))) return;
    try {
      await api(`/products/${p._id}`, { method: 'DELETE' });
      toast(STRINGS.admin.productDeleted(p.name), 'success');
      if (editingId === p._id) resetForm();
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  // The story slots show on two pages, so their confirmations say so — an admin
  // who reads "live on the home page" would not know About Us had changed too.
  const uploadedMessage = (key) => {
    if (key === HERO_SLOT) return STRINGS.admin.heroUpdated;
    if (STORY_TILES.some((t) => t.key === key)) return STRINGS.admin.storyUpdated;
    return STRINGS.admin.photoUpdated;
  };
  const resetMessage = (key) => {
    if (key === HERO_SLOT) return STRINGS.admin.heroReset;
    if (STORY_TILES.some((t) => t.key === key)) return STRINGS.admin.storyReset;
    return STRINGS.admin.cardReset;
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
      toast(uploadedMessage(key), 'success');
    } catch (err) {
      toast(err.message, 'error');
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
      toast(resetMessage(key), 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setCollectionBusy('');
    }
  };

  const onLogout = () => {
    logout();
    toast(STRINGS.admin.loggedOut);
    navigate('/admin/login');
  };

  // Pagination over the filtered list (page is clamped so deletes can't strand it)
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PER_PAGE;
  const paged = filtered.slice(pageStart, pageStart + PER_PAGE);

  return (
    <section className="section">
      <div className="container">
        <div className="admin-topbar">
          <Link to="/" className="mini-btn">{STRINGS.admin.viewStore}</Link>
          <span className="muted">{STRINGS.admin.signedInAs(user.email)}</span>
          <button className="mini-btn danger" onClick={onLogout}>{STRINGS.admin.logOut}</button>
        </div>
        <div className="section-head">
          <span className="section-eyebrow">{STRINGS.admin.eyebrow}</span>
          <h2>{STRINGS.admin.title}</h2>
          <p>{STRINGS.admin.subtitle}</p>
        </div>

        <div className="admin-tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              className={`admin-tab ${tab === t.key ? 'active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Homepage media: hero video + collection card images */}
        {tab === 'homepage' && (
        <div className="admin-form collection-admin">
          <h3 className="serif">{STRINGS.admin.homepageMedia}</h3>
          <p className="muted collection-hint">{STRINGS.admin.homepageMediaHint}</p>

          <div className="hero-admin">
            <span className="field-label">{STRINGS.admin.heroLabel}</span>
            <div className="hero-admin-row">
              <div className="hero-admin-preview">
                <video
                  key={collectionImages[HERO_SLOT] || 'default-hero'}
                  src={collectionImages[HERO_SLOT] || '/videos/hero-jewellery.mp4'}
                  autoPlay
                  muted
                  loop
                  playsInline
                />
                {!collectionImages[HERO_SLOT] && <span className="hero-default-tag">{STRINGS.admin.defaultTag}</span>}
              </div>
              <div className="hero-admin-info">
                <p className="muted">{STRINGS.admin.heroHelp}</p>
                <div className="collection-actions">
                  <label className={`mini-btn ${collectionBusy === HERO_SLOT ? 'disabled' : ''}`}>
                    {collectionBusy === HERO_SLOT ? STRINGS.admin.uploading : collectionImages[HERO_SLOT] ? STRINGS.admin.changeVideo : STRINGS.admin.uploadVideo}
                    <input
                      type="file"
                      accept="video/*"
                      hidden
                      disabled={collectionBusy === HERO_SLOT}
                      onChange={(e) => onCollectionImage(HERO_SLOT, e)}
                    />
                  </label>
                  {collectionImages[HERO_SLOT] && (
                    <button
                      type="button"
                      className="mini-btn danger"
                      disabled={collectionBusy === HERO_SLOT}
                      onClick={() => resetCollectionImage(HERO_SLOT)}
                    >
                      {STRINGS.admin.resetToDefault}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <span className="field-label">{STRINGS.admin.collectionCardsLabel}</span>
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
                    {collectionBusy === c.key ? STRINGS.admin.uploading : collectionImages[c.key] ? STRINGS.admin.changePhoto : STRINGS.admin.uploadPhoto}
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
                      {STRINGS.admin.reset}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <span className="field-label">{STRINGS.admin.storyLabel}</span>
          <p className="muted collection-hint">{STRINGS.admin.storyHint}</p>
          <div className="story-admin-grid">
            {STORY_TILES.map(({ key, shape, Art, label, help }) => (
              <div className="collection-tile" key={key}>
                <span className="field-label">{label}</span>
                <div className={`story-admin-preview ${shape}`}>
                  {collectionImages[key]
                    ? <img src={collectionImages[key]} alt={label} />
                    : <Art className="story-photo" />}
                  {!collectionImages[key] && <span className="hero-default-tag">{STRINGS.admin.defaultTag}</span>}
                </div>
                <p className="muted story-admin-help">{help}</p>
                <div className="collection-actions">
                  <label className={`mini-btn ${collectionBusy === key ? 'disabled' : ''}`}>
                    {collectionBusy === key
                      ? STRINGS.admin.uploading
                      : collectionImages[key]
                        ? STRINGS.admin.changePhoto
                        : STRINGS.admin.uploadPhoto}
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      disabled={collectionBusy === key}
                      onChange={(e) => onCollectionImage(key, e)}
                    />
                  </label>
                  {collectionImages[key] && (
                    <button
                      type="button"
                      className="mini-btn danger"
                      disabled={collectionBusy === key}
                      onClick={() => resetCollectionImage(key)}
                    >
                      {STRINGS.admin.reset}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        {tab === 'products' && (
        <>
          <div className="admin-products-head">
            <button
              type="button"
              className={showForm || editingId ? 'mini-btn' : 'btn btn-dark'}
              onClick={() => (showForm || editingId ? closeForm() : openAddForm())}
            >
              {showForm || editingId ? STRINGS.admin.closeForm : STRINGS.admin.addProductBtn}
            </button>
          </div>

        {/* Add / edit form */}
        {(showForm || editingId) && (
        <form className="admin-form" onSubmit={submit} ref={formRef}>
          <h3 className="serif">{editingId ? STRINGS.admin.editProduct : STRINGS.admin.addNewProduct}</h3>
          <div className="field-grid admin-grid">
            <label>{STRINGS.admin.nameLabel}
              <input required value={form.name} onChange={set('name')} placeholder={STRINGS.admin.namePlaceholder} />
            </label>
            <label>{STRINGS.admin.categoryLabel}
              <select value={form.category} onChange={set('category')}>
                {Object.values(CATEGORY).map((category) => (
                  <option key={category} value={category}>{CATEGORY_LABEL[category]}</option>
                ))}
              </select>
            </label>
            <label>{STRINGS.admin.subCategoryLabel}
              <input value={form.subCategory} onChange={set('subCategory')} placeholder={STRINGS.admin.subCategoryPlaceholder} />
            </label>
            <label>{STRINGS.admin.priceLabel}
              <input required type="number" min="1" value={form.price} onChange={set('price')} placeholder={STRINGS.admin.pricePlaceholder} />
            </label>
            <label>{STRINGS.admin.mrpLabel}
              <input type="number" min="1" value={form.mrp} onChange={set('mrp')} placeholder={STRINGS.admin.mrpPlaceholder} />
            </label>
            <label>{STRINGS.admin.stockLabel}
              <input type="number" min="0" value={form.stock} onChange={set('stock')} />
            </label>
            <label>{STRINGS.admin.tagLabel}
              <select value={form.tag} onChange={set('tag')}>
                <option value="">{STRINGS.admin.tagNone}</option>
                {Object.values(PRODUCT_TAG).map((tag) => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </label>
            <label>{STRINGS.admin.mediaLabel}
              <input ref={fileRef} type="file" accept="image/*,video/*" multiple onChange={onFile} />
            </label>
            <label className="wide">{STRINGS.admin.descriptionLabel}
              <textarea rows="3" value={form.description} onChange={set('description')} placeholder={STRINGS.admin.descriptionPlaceholder} />
            </label>

            {/* Spec sheet — feeds the "Product Details" panel on the product page.
                Blank fields are simply left out there. */}
            <label>{STRINGS.admin.metalLabel}
              <input value={form.metal} onChange={set('metal')} placeholder={STRINGS.admin.metalPlaceholder} />
            </label>
            <label>{STRINGS.admin.weightLabel}
              <input value={form.weight} onChange={set('weight')} placeholder={STRINGS.admin.weightPlaceholder} />
            </label>
            <label>{STRINGS.admin.platingLabel}
              <input value={form.plating} onChange={set('plating')} placeholder={STRINGS.admin.platingPlaceholder} />
            </label>
            <label>{STRINGS.admin.colorLabel}
              <input value={form.color} onChange={set('color')} placeholder={STRINGS.admin.colorPlaceholder} />
            </label>
            <label>{STRINGS.admin.soldByLabel}
              <input value={form.soldBy} onChange={set('soldBy')} placeholder={STRINGS.admin.soldByPlaceholder} />
            </label>
            <label>{STRINGS.admin.countryLabel}
              <input value={form.countryOfOrigin} onChange={set('countryOfOrigin')} placeholder={STRINGS.admin.countryPlaceholder} />
            </label>
            <label className="wide">{STRINGS.admin.careLabel}
              <textarea rows="2" value={form.careInstructions} onChange={set('careInstructions')} placeholder={STRINGS.admin.carePlaceholder} />
            </label>
            <label className="wide">{STRINGS.admin.packageLabel}
              <textarea rows="2" value={form.packageContains} onChange={set('packageContains')} placeholder={STRINGS.admin.packagePlaceholder} />
            </label>
          </div>

          <div className="admin-visual-row">
            <div>
              <span className="field-label">{STRINGS.admin.artStyleLabel}</span>
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
              <span className="field-label">{STRINGS.admin.cardBackgroundLabel}</span>
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
              <span className="field-label">{STRINGS.admin.previewLabel}</span>
              <div className={`preview-card ${form.bg}`}>
                {(() => {
                  const first = existingMedia[0] || mediaFiles[0];
                  if (!first) return <JewelArt art={form.art} />;
                  return first.type === MEDIA_TYPE.VIDEO
                    ? <video src={first.url} className="product-photo" muted />
                    : <img src={first.url} alt="Preview" className="product-photo" />;
                })()}
              </div>
            </div>
          </div>

          {(existingMedia.length > 0 || mediaFiles.length > 0) && (
            <div className="media-list">
              <span className="field-label">
                {STRINGS.admin.mediaListLabel(existingMedia.length + mediaFiles.length)}
              </span>
              <div className="media-grid">
                {existingMedia.map((m, i) => (
                  <div className="media-item" key={`old-${m.url}`}>
                    {m.type === MEDIA_TYPE.VIDEO
                      ? <video src={m.url} muted />
                      : <img src={m.url} alt="" />}
                    {m.type === MEDIA_TYPE.VIDEO && <span className="media-badge">▶</span>}
                    <button type="button" className="media-remove" onClick={() => removeExisting(i)} aria-label="Remove">×</button>
                  </div>
                ))}
                {mediaFiles.map((m, i) => (
                  <div className="media-item is-new" key={`new-${i}-${m.file.name}`}>
                    {m.type === MEDIA_TYPE.VIDEO
                      ? <video src={m.url} muted />
                      : <img src={m.url} alt="" />}
                    {m.type === MEDIA_TYPE.VIDEO && <span className="media-badge">▶</span>}
                    <span className="media-new-tag">{STRINGS.admin.mediaNewTag}</span>
                    <button type="button" className="media-remove" onClick={() => removeNewFile(i)} aria-label="Remove">×</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <p className="form-error">{error}</p>}
          <div className="admin-actions">
            <button className="btn btn-dark" disabled={saving}>
              {saving ? STRINGS.admin.saving : editingId ? STRINGS.admin.saveChanges : STRINGS.admin.addProduct}
            </button>
            {editingId && (
              <button type="button" className="btn btn-ghost" onClick={resetForm}>{STRINGS.admin.cancelEdit}</button>
            )}
          </div>
        </form>
        )}

        {/* Product table */}
        <div className="admin-table-wrap">
          <div className="admin-table-head">
            <h3 className="serif">{STRINGS.admin.allProducts(products.length)}</h3>
            <div className="admin-table-tools">
              <div className="admin-search">
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={STRINGS.admin.productSearchPlaceholder}
                  aria-label={STRINGS.admin.productSearchPlaceholder}
                />
                {query && (
                  <button type="button" className="admin-search-clear" onClick={() => setQuery('')} aria-label={STRINGS.admin.clearSearch}>×</button>
                )}
              </div>
              <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} aria-label={STRINGS.admin.filterAllCategories}>
                <option value="all">{STRINGS.admin.filterAllCategories}</option>
                {Object.values(CATEGORY).map((category) => (
                  <option key={category} value={category}>{CATEGORY_LABEL[category]}</option>
                ))}
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="muted admin-empty">{STRINGS.admin.noProductsMatch}</p>
          ) : (
            <>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>{STRINGS.admin.thName}</th>
                    <th>{STRINGS.admin.thCategory}</th>
                    <th>{STRINGS.admin.thPrice}</th>
                    <th>{STRINGS.admin.thStock}</th>
                    <th>{STRINGS.admin.thTag}</th>
                    <th>{STRINGS.admin.thActions}</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((p) => (
                    <tr key={p._id}>
                      <td>
                        <div className={`table-thumb ${p.bg}`}>
                          {(() => {
                            const first = p.media?.[0] || (p.image ? { url: p.image, type: MEDIA_TYPE.IMAGE } : null);
                            if (!first) return <JewelArt art={p.art} />;
                            return first.type === MEDIA_TYPE.VIDEO
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
                      <td>{p.tag || STRINGS.admin.noTag}</td>
                      <td>
                        <div className="table-actions">
                          <button className="mini-btn" onClick={() => startEdit(p)}>{STRINGS.admin.edit}</button>
                          <button className="mini-btn danger" onClick={() => onDelete(p)}>{STRINGS.admin.delete}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="admin-pagination">
                <span className="muted">
                  {STRINGS.admin.showingCount(pageStart + 1, pageStart + paged.length, filtered.length)}
                </span>
                {totalPages > 1 && (
                  <div className="admin-pager">
                    <button className="mini-btn" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
                      {STRINGS.admin.prevPage}
                    </button>
                    <span className="admin-page-of">{STRINGS.admin.pageOf(currentPage, totalPages)}</span>
                    <button className="mini-btn" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>
                      {STRINGS.admin.nextPage}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        </>
        )}

        {/* Review rewards: verify Etsy orders and hand out discount codes */}
        {tab === 'rewards' && <AdminRewards />}
      </div>
    </section>
  );
}
