import { useEffect, useState } from 'react';
import { api } from '../api';
import { toast } from '../toast';
import Loader from './Loader';
import Stars from './Stars';
import { STRINGS } from '../strings';
import { REWARD_STATUS, REWARD_STATUS_LABEL, REVIEW_REWARD_PERCENT } from '../enums';

const A = STRINGS.admin;
const PCT = REVIEW_REWARD_PERCENT;

export default function AdminRewards() {
  const [rewards, setRewards] = useState(null);
  const [pool, setPool] = useState({ available: 0, used: 0, total: 0, codes: [] });
  const [codes, setCodes] = useState('');
  const [adding, setAdding] = useState(false);
  const [actingId, setActingId] = useState('');
  const [confirmId, setConfirmId] = useState(''); // reward awaiting inline reject confirmation
  const [showCodes, setShowCodes] = useState(false);
  const [editId, setEditId] = useState(''); // code being renamed inline
  const [editValue, setEditValue] = useState('');
  const [codeBusyId, setCodeBusyId] = useState('');
  const [deleteId, setDeleteId] = useState(''); // code awaiting inline delete confirmation

  const loadRewards = () => api('/rewards').then(setRewards).catch((e) => toast(e.message, 'error'));
  const loadPool = () =>
    api('/coupons')
      .then((p) => setPool({ codes: [], ...p }))
      .catch(() => {});

  useEffect(() => {
    loadRewards();
    loadPool();
  }, []);

  const addCodes = async (e) => {
    e.preventDefault();
    if (!codes.trim()) return;
    setAdding(true);
    try {
      const { added, skipped } = await api('/coupons', { method: 'POST', body: { codes } });
      toast(A.couponAdded(added, skipped), 'success');
      setCodes('');
      setShowCodes(true);
      loadPool();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (c) => {
    setDeleteId('');
    setEditId(c._id);
    setEditValue(c.code);
  };

  const saveCode = async (c) => {
    const next = editValue.trim().toUpperCase();
    if (!next || next === c.code) {
      setEditId('');
      return;
    }
    setCodeBusyId(c._id);
    try {
      const updated = await api(`/coupons/${c._id}`, { method: 'PATCH', body: { code: next } });
      toast(A.couponUpdated(updated.code), 'success');
      setEditId('');
      loadPool();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setCodeBusyId('');
    }
  };

  const deleteCode = async (c) => {
    setCodeBusyId(c._id);
    try {
      await api(`/coupons/${c._id}`, { method: 'DELETE' });
      toast(A.couponDeleted(c.code), 'info');
      setDeleteId('');
      loadPool();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setCodeBusyId('');
    }
  };

  const approve = async (r) => {
    if (pool.available < 1) {
      toast(A.rewardNoPool, 'info');
      return;
    }
    setActingId(r._id);
    try {
      const updated = await api(`/rewards/${r._id}/approve`, { method: 'POST' });
      toast(A.rewardApproved(updated.code), 'success');
      loadRewards();
      loadPool();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setActingId('');
    }
  };

  const reject = async (r) => {
    setActingId(r._id);
    try {
      await api(`/rewards/${r._id}/reject`, { method: 'POST' });
      toast(A.rewardRejected, 'info');
      setConfirmId('');
      loadRewards();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setActingId('');
    }
  };

  return (
    <div className="admin-form">
      <h3 className="serif">{A.rewardsTitle}</h3>
      <p className="muted collection-hint">{A.rewardsHint(PCT)}</p>

      {/* Coupon pool */}
      <div className="coupon-pool">
        <div className="coupon-pool-head">
          <span className="field-label">{A.couponPoolTitle}</span>
          <span className="coupon-pool-stats">{A.couponPoolStats(pool.available, pool.used)}</span>
        </div>
        <form className="coupon-add" onSubmit={addCodes}>
          <label>
            {A.couponPasteLabel}
            <textarea
              rows={3}
              value={codes}
              onChange={(e) => setCodes(e.target.value)}
              placeholder={A.couponPastePlaceholder}
            />
          </label>
          <small className="muted">{A.couponPasteHint}</small>
          <button className="btn btn-dark" disabled={adding}>{adding ? A.couponAdding : A.couponAdd}</button>
        </form>
        {pool.total === 0 ? (
          <p className="muted">{A.couponEmpty}</p>
        ) : (
          <div className="coupon-list-wrap">
            <button type="button" className="mini-btn" onClick={() => setShowCodes((v) => !v)}>
              {showCodes ? A.couponListHide : A.couponListShow} ({pool.codes.length})
            </button>

            {showCodes && (
              <>
                <ul className="coupon-list">
                  {pool.codes.map((c) => (
                    <li key={c._id} className={c.used ? 'coupon-row is-used' : 'coupon-row'}>
                      {editId === c._id ? (
                        <>
                          <input
                            className="coupon-edit-input"
                            value={editValue}
                            autoFocus
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveCode(c);
                              if (e.key === 'Escape') setEditId('');
                            }}
                          />
                          <div className="table-actions">
                            <button className="mini-btn" disabled={codeBusyId === c._id} onClick={() => saveCode(c)}>
                              {codeBusyId === c._id ? A.couponSaving : A.couponSave}
                            </button>
                            <button className="mini-btn" disabled={codeBusyId === c._id} onClick={() => setEditId('')}>
                              {A.couponCancel}
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <code className="reward-code">{c.code}</code>
                          <span className={`reward-badge ${c.used ? 'badge-approved' : 'badge-pending'}`}>
                            {c.used ? A.couponUsedTag : A.couponAvailableTag}
                          </span>
                          {c.used ? (
                            <span className="muted coupon-locked">{A.couponLockedHint}</span>
                          ) : deleteId === c._id ? (
                            <div className="table-actions confirm-inline">
                              <span className="confirm-q">{A.couponConfirmDelete}</span>
                              <button
                                className="mini-btn danger"
                                disabled={codeBusyId === c._id}
                                onClick={() => deleteCode(c)}
                              >
                                {codeBusyId === c._id ? A.couponDeleting : A.couponConfirmDeleteYes}
                              </button>
                              <button className="mini-btn" disabled={codeBusyId === c._id} onClick={() => setDeleteId('')}>
                                {A.couponCancel}
                              </button>
                            </div>
                          ) : (
                            <div className="table-actions">
                              <button className="mini-btn" onClick={() => startEdit(c)}>{A.couponEdit}</button>
                              <button className="mini-btn danger" onClick={() => { setEditId(''); setDeleteId(c._id); }}>
                                {A.couponDelete}
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </li>
                  ))}
                </ul>
                {pool.total > pool.codes.length && (
                  <small className="muted">{A.couponListCapped(pool.codes.length)}</small>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Claims table */}
      <div className="admin-table-wrap">
        {rewards === null ? (
          <Loader label={A.rewardsLoader} />
        ) : rewards.length === 0 ? (
          <p className="muted">{A.rewardsEmpty}</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{A.thCustomer}</th>
                <th>{A.thEtsyOrder}</th>
                <th>{A.thReview}</th>
                <th>{A.thPhotos}</th>
                <th>{A.thStatus}</th>
                <th>{A.rewardCodeCol}</th>
                <th>{A.thActions}</th>
              </tr>
            </thead>
            <tbody>
              {rewards.map((r) => (
                <tr key={r._id}>
                  <td>
                    <span className="table-name">{r.user?.name}</span>
                    <span className="muted table-sub">{r.user?.email}</span>
                  </td>
                  <td>{r.etsyOrderNo}</td>
                  <td>
                    <span className="table-sub">{r.review?.product?.name}</span>
                    {r.review?.rating != null && <Stars value={r.review.rating} />}
                  </td>
                  <td>
                    <div className="reward-photo-thumbs">
                      {(r.review?.photos || []).map((url) => (
                        <a key={url} href={url} target="_blank" rel="noreferrer">
                          <img src={url} alt="" loading="lazy" />
                        </a>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className={`reward-badge badge-${r.status}`}>{REWARD_STATUS_LABEL[r.status]}</span>
                  </td>
                  <td>{r.code ? <code className="reward-code">{r.code}</code> : '—'}</td>
                  <td>
                    {r.status !== REWARD_STATUS.PENDING ? (
                      <span className="muted">—</span>
                    ) : confirmId === r._id ? (
                      <div className="table-actions confirm-inline">
                        <span className="confirm-q">{A.confirmReject}</span>
                        <button className="mini-btn danger" disabled={actingId === r._id} onClick={() => reject(r)}>
                          {actingId === r._id ? A.rejecting : A.confirmRejectYes}
                        </button>
                        <button className="mini-btn" disabled={actingId === r._id} onClick={() => setConfirmId('')}>
                          {A.confirmRejectNo}
                        </button>
                      </div>
                    ) : (
                      <div className="table-actions">
                        <button className="mini-btn" disabled={actingId === r._id} onClick={() => approve(r)}>
                          {actingId === r._id ? A.approving : A.approve}
                        </button>
                        <button className="mini-btn danger" disabled={actingId === r._id} onClick={() => setConfirmId(r._id)}>
                          {A.reject}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
