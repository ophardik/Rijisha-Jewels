import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { toast } from '../toast';
import Reveal from './Reveal';
import Loader from './Loader';
import Stars from './Stars';
import { STRINGS } from '../strings';
import { REWARD_STATUS, REVIEW_REWARD_PERCENT } from '../enums';

const S = STRINGS.reviews;
const MAX_PHOTOS = 4;
const PCT = REVIEW_REWARD_PERCENT;

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const initials = (name) =>
  name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

export default function Reviews({ product, onChange }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState(null); // null = loading
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState([]); // { file, url }
  const [etsyOrderNo, setEtsyOrderNo] = useState('');
  const [busy, setBusy] = useState(false);
  const [lightbox, setLightbox] = useState(null); // photo url
  const [myReward, setMyReward] = useState(null); // reward tied to my review, if any
  const [claimOrderNo, setClaimOrderNo] = useState('');
  const [claiming, setClaiming] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    setReviews(null);
    api(`/reviews/${product._id}`).then(setReviews).catch(() => setReviews([]));
  }, [product._id]);

  // My reward for this piece (if I've already claimed one)
  useEffect(() => {
    if (!user) {
      setMyReward(null);
      return;
    }
    api('/rewards/mine')
      .then((rewards) => {
        const mine = rewards.find((r) => r.review?.product?._id === product._id || r.review?.product === product._id);
        setMyReward(mine || null);
      })
      .catch(() => setMyReward(null));
  }, [user, product._id]);

  // Release preview object URLs on unmount
  const photosRef = useRef(photos);
  photosRef.current = photos;
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  // Lightbox: close on Escape
  useEffect(() => {
    if (!lightbox) return undefined;
    const onKey = (e) => e.key === 'Escape' && setLightbox(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);

  const myReview = user && reviews?.find((r) => r.user === user.id);

  const addPhotos = (e) => {
    const files = Array.from(e.target.files || []);
    const room = MAX_PHOTOS - photos.length;
    if (files.length > room) toast(S.maxPhotos, 'info');
    const next = files.slice(0, room).map((file) => ({ file, url: URL.createObjectURL(file) }));
    setPhotos((p) => [...p, ...next]);
    e.target.value = '';
  };

  const removePhoto = (url) => {
    URL.revokeObjectURL(url);
    setPhotos((p) => p.filter((photo) => photo.url !== url));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) {
      toast(S.pickRating, 'info');
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      form.append('rating', rating);
      form.append('comment', comment);
      photos.forEach((p) => form.append('photos', p.file));
      const review = await api(`/reviews/${product._id}`, { method: 'POST', body: form });
      photos.forEach((p) => URL.revokeObjectURL(p.url));
      setReviews((r) => [review, ...(r || [])]);

      // If they added a photo and an Etsy order number, claim the reward too
      const orderNo = etsyOrderNo.trim();
      if (photos.length && orderNo) {
        try {
          const reward = await api('/rewards', { method: 'POST', body: { reviewId: review._id, etsyOrderNo: orderNo } });
          setMyReward(reward);
          toast(S.claimed);
        } catch (err) {
          toast(err.message, 'error'); // review still posted; only the claim failed
        }
      } else {
        toast(S.posted);
      }

      setRating(0);
      setComment('');
      setPhotos([]);
      setEtsyOrderNo('');
      onChange?.();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  // Claim a reward for a review that was already posted (with a photo) but not yet claimed
  const claimReward = async () => {
    const orderNo = claimOrderNo.trim();
    if (!orderNo) {
      toast(S.etsyOrderPlaceholder, 'info');
      return;
    }
    const wasRejected = myReward?.status === REWARD_STATUS.REJECTED;
    setClaiming(true);
    try {
      const reward = await api('/rewards', { method: 'POST', body: { reviewId: myReview._id, etsyOrderNo: orderNo } });
      setMyReward(reward);
      setClaimOrderNo('');
      toast(wasRejected ? S.retried : S.claimed);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setClaiming(false);
    }
  };

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      toast(S.copied);
    } catch {
      toast(code, 'info');
    }
  };

  const onDelete = async (id) => {
    try {
      await api(`/reviews/${id}`, { method: 'DELETE' });
      setReviews((r) => r.filter((review) => review._id !== id));
      toast(S.deleted, 'info');
      onChange?.();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const count = reviews?.length || 0;
  const average = count ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    n: reviews?.filter((r) => r.rating === star).length || 0,
  }));

  return (
    <section className="section reviews-section">
      <div className="container">
        <Reveal>
          <div className="section-head">
            <span className="section-eyebrow">{S.eyebrow}</span>
            <h2>{S.title}</h2>
          </div>
        </Reveal>

        {reviews === null ? (
          <Loader label={S.loader} />
        ) : (
          <Reveal delay={100}>
            <div className="reviews-top">
              {/* Summary */}
              <div className="review-summary">
                <div className="review-avg">
                  <b>{count ? average.toFixed(1) : '—'}</b>
                  <Stars value={average} className="lg" />
                  <span>{S.basedOn(count)}</span>
                </div>
                <div className="review-bars">
                  {distribution.map(({ star, n }) => (
                    <div className="review-bar" key={star}>
                      <span>{star}★</span>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: count ? `${(n / count) * 100}%` : 0 }} />
                      </div>
                      <em>{n}</em>
                    </div>
                  ))}
                </div>
              </div>

              {/* Write a review */}
              <div className="review-form-card">
                <h3>{S.writeTitle}</h3>
                {!user ? (
                  <Link to="/login" className="btn btn-dark">{S.loginPrompt}</Link>
                ) : myReview ? (
                  <>
                    <p className="muted">{S.alreadyReviewed}</p>
                    {myReward?.status === REWARD_STATUS.APPROVED ? (
                      <div className="reward-status reward-approved">
                        <span className="reward-status-title">{S.rewardCodeTitle(PCT)}</span>
                        <div className="reward-code-row">
                          <code className="reward-code">{myReward.code}</code>
                          <button type="button" className="mini-btn" onClick={() => copyCode(myReward.code)}>{S.copyCode}</button>
                        </div>
                        <small>{S.rewardCodeHint}</small>
                      </div>
                    ) : myReward?.status === REWARD_STATUS.PENDING ? (
                      <div className="reward-status reward-pending">
                        <p className="muted">{S.rewardPending}</p>
                      </div>
                    ) : !myReview.photos?.length ? (
                      <p className="muted reward-note">{S.claimNeedsPhoto}</p>
                    ) : (
                      // No reward yet, or a rejected one they can correct and resubmit
                      <div className="reward-claim">
                        {myReward?.status === REWARD_STATUS.REJECTED && (
                          <p className="muted reward-rejected-note">{S.rewardRejected}</p>
                        )}
                        <span className="reward-status-title">
                          {myReward?.status === REWARD_STATUS.REJECTED ? S.retryTitle : S.claimTitle(PCT)}
                        </span>
                        {myReward?.status !== REWARD_STATUS.REJECTED && <p className="muted">{S.claimText}</p>}
                        <input
                          value={claimOrderNo}
                          onChange={(e) => setClaimOrderNo(e.target.value)}
                          placeholder={S.etsyOrderPlaceholder}
                          aria-label={S.etsyOrderLabel}
                        />
                        <button type="button" className="btn btn-dark" disabled={claiming} onClick={claimReward}>
                          {claiming ? S.claiming : myReward?.status === REWARD_STATUS.REJECTED ? S.retry : S.claim}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <form className="review-form" onSubmit={submit}>
                    <label>
                      {S.yourRating}
                      <span className="star-picker" onMouseLeave={() => setHover(0)}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            className={star <= (hover || rating) ? 'lit' : ''}
                            onMouseEnter={() => setHover(star)}
                            onClick={() => setRating(star)}
                            aria-label={`${star} star${star > 1 ? 's' : ''}`}
                          >
                            ★
                          </button>
                        ))}
                        <em>{S.ratingWords[hover || rating]}</em>
                      </span>
                    </label>
                    <label>
                      {S.commentLabel}
                      <textarea
                        rows={4}
                        maxLength={1200}
                        placeholder={S.commentPlaceholder}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                      />
                    </label>
                    <div className="review-photos-field">
                      <span className="review-photos-label">{S.photosLabel}</span>
                      <div className="photo-previews">
                        {photos.map((p) => (
                          <span className="photo-preview" key={p.url}>
                            <img src={p.url} alt="" />
                            <button type="button" aria-label={S.removePhoto} onClick={() => removePhoto(p.url)}>×</button>
                          </span>
                        ))}
                        {photos.length < MAX_PHOTOS && (
                          <button type="button" className="photo-add" onClick={() => fileRef.current?.click()}>
                            <svg viewBox="0 0 24 24" width="20" fill="none" stroke="currentColor" strokeWidth="1.7">
                              <path d="M3 8c0-1 .8-2 2-2h2l2-3h6l2 3h2c1.2 0 2 1 2 2v10c0 1-.8 2-2 2H5c-1.2 0-2-1-2-2V8Z" />
                              <circle cx="12" cy="13" r="3.5" />
                            </svg>
                            {S.addPhotos}
                          </button>
                        )}
                      </div>
                      <small>{S.photosHint}</small>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                        multiple
                        hidden
                        onChange={addPhotos}
                      />
                    </div>
                    <div className="review-reward-offer">
                      <span className="reward-offer-title">🎁 {S.offerTitle(PCT)}</span>
                      <p>{S.offerText(PCT)}</p>
                      <label>
                        {S.etsyOrderLabel}
                        <input
                          value={etsyOrderNo}
                          onChange={(e) => setEtsyOrderNo(e.target.value)}
                          placeholder={S.etsyOrderPlaceholder}
                        />
                      </label>
                      <small>{S.etsyOrderHint}</small>
                    </div>
                    <button className="btn btn-dark" type="submit" disabled={busy}>
                      {busy ? S.submitting : S.submit}
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Review list */}
            {count === 0 ? (
              <p className="muted center reviews-empty">{S.empty}</p>
            ) : (
              <div className="review-list">
                {reviews.map((r) => (
                  <article className="review-card" key={r._id}>
                    <div className="review-head">
                      <span className="t-avatar">{initials(r.name)}</span>
                      <div className="review-who">
                        <b>
                          {r.name}
                          {user && r.user === user.id && <span className="you-badge">{S.youBadge}</span>}
                        </b>
                        <span>{fmtDate(r.createdAt)}</span>
                      </div>
                      <Stars value={r.rating} />
                    </div>
                    {r.comment && <p className="review-text">{r.comment}</p>}
                    {r.photos?.length > 0 && (
                      <div className="review-photo-row">
                        {r.photos.map((url) => (
                          <button key={url} type="button" onClick={() => setLightbox(url)}>
                            <img src={url} alt={S.photoAlt(r.name)} loading="lazy" />
                          </button>
                        ))}
                      </div>
                    )}
                    {user && (r.user === user.id || user.isAdmin) && (
                      <button className="review-delete" onClick={() => onDelete(r._id)}>{S.delete}</button>
                    )}
                  </article>
                ))}
              </div>
            )}
          </Reveal>
        )}
      </div>

      {/* Customer photo lightbox */}
      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)} role="dialog" aria-modal="true">
          <button className="lightbox-close" aria-label="Close" onClick={() => setLightbox(null)}>×</button>
          <img src={lightbox} alt="" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </section>
  );
}
