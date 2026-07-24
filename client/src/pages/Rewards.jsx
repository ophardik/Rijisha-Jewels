import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import Stars from '../components/Stars';
import { usePageTitle } from '../usePageTitle';
import { STRINGS } from '../strings';
import { toast } from '../toast';
import { REWARD_STATUS, REWARD_STATUS_LABEL, REVIEW_REWARD_PERCENT } from '../enums';

const S = STRINGS.rewards;

export default function Rewards() {
  usePageTitle(STRINGS.titles.rewards);
  const { user, loading: authLoading } = useAuth();
  const [rewards, setRewards] = useState(null);
  const [error, setError] = useState('');
  const [retryNo, setRetryNo] = useState({}); // rewardId -> corrected order number
  const [retryingId, setRetryingId] = useState('');

  useEffect(() => {
    if (!user) return;
    api('/rewards/mine').then(setRewards).catch((err) => setError(err.message));
  }, [user]);

  const retry = async (r) => {
    const orderNo = (retryNo[r._id] || '').trim();
    if (!orderNo) {
      toast(S.enterOrder, 'info');
      return;
    }
    setRetryingId(r._id);
    try {
      await api('/rewards', { method: 'POST', body: { reviewId: r.review?._id, etsyOrderNo: orderNo } });
      toast(S.retried);
      setRetryNo((m) => ({ ...m, [r._id]: '' }));
      const fresh = await api('/rewards/mine');
      setRewards(fresh);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setRetryingId('');
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

  if (authLoading) return <section className="section"><Loader /></section>;

  if (!user) {
    return (
      <section className="section">
        <div className="container center empty-state">
          <h2 className="serif">{S.loginTitle}</h2>
          <p className="muted">{S.loginText}</p>
          <Link to="/login?next=/rewards" className="btn btn-dark">{STRINGS.common.logIn}</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <span className="section-eyebrow">{S.eyebrow}</span>
          <h2>{S.title}</h2>
          <p>{S.intro(REVIEW_REWARD_PERCENT)}</p>
        </div>

        {error && <p className="form-error center">{error}</p>}

        {rewards === null ? (
          <Loader label={S.loader} />
        ) : rewards.length === 0 ? (
          <div className="center empty-state">
            <p className="muted">{S.empty}</p>
            <Link to="/shop" className="btn btn-dark">{S.browse}</Link>
          </div>
        ) : (
          <div className="reward-list">
            {rewards.map((r) => {
              const piece = r.review?.product?.name;
              const slug = r.review?.product?.slug;
              return (
                <article className={`reward-card reward-${r.status}`} key={r._id}>
                  <div className="reward-card-head">
                    <div>
                      {piece && (
                        slug
                          ? <Link to={`/product/${slug}`} className="reward-piece">{S.forPiece(piece)}</Link>
                          : <span className="reward-piece">{S.forPiece(piece)}</span>
                      )}
                      <span className="reward-order muted">{S.orderNo(r.etsyOrderNo)}</span>
                    </div>
                    {r.review?.rating != null && <Stars value={r.review.rating} />}
                  </div>

                  <span className={`reward-badge badge-${r.status}`}>{REWARD_STATUS_LABEL[r.status]}</span>

                  {r.status === REWARD_STATUS.APPROVED && r.code && (
                    <div className="reward-code-box">
                      <span className="muted">{S.codeLabel}</span>
                      <div className="reward-code-row">
                        <code className="reward-code">{r.code}</code>
                        <button type="button" className="mini-btn" onClick={() => copyCode(r.code)}>{S.copyCode}</button>
                      </div>
                      <small className="muted">{S.useOnEtsy}</small>
                    </div>
                  )}

                  {r.status === REWARD_STATUS.PENDING && (
                    <p className="muted reward-pending-note">{S.pendingNote}</p>
                  )}

                  {r.status === REWARD_STATUS.REJECTED && (
                    <div className="reward-retry">
                      <p className="muted">{S.rejectedNote}</p>
                      <div className="reward-retry-row">
                        <input
                          value={retryNo[r._id] || ''}
                          onChange={(e) => setRetryNo((m) => ({ ...m, [r._id]: e.target.value }))}
                          placeholder={S.retryPlaceholder}
                          aria-label={S.retryPlaceholder}
                        />
                        <button type="button" className="btn btn-dark" disabled={retryingId === r._id} onClick={() => retry(r)}>
                          {retryingId === r._id ? S.retrying : S.retry}
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
