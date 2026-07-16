import { useEffect, useRef, useState } from 'react';

const ICONS = {
  success: <path d="M20 6 9 17l-5-5" />,
  error: <path d="M12 8v5M12 16.5v.5" />,
  wish: <path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3.4 1-4.5 2.5C10.9 4 9.3 3 7.5 3A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z" />,
  info: <path d="M12 11v5M12 7.5v.5" />,
};

export default function Toaster() {
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [show, setShow] = useState(false);
  const timer = useRef();

  useEffect(() => {
    const onToast = (e) => {
      // Older callers may still send a bare string
      const detail = typeof e.detail === 'string' ? { message: e.detail, type: 'info' } : e.detail;
      setToast(detail);
      setShow(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setShow(false), 2600);
    };
    window.addEventListener('rijisha:toast', onToast);
    return () => {
      window.removeEventListener('rijisha:toast', onToast);
      clearTimeout(timer.current);
    };
  }, []);

  return (
    <div className={`toast toast-${toast.type} ${show ? 'show' : ''}`}>
      <span className="toast-icon">
        <svg viewBox="0 0 24 24" fill={toast.type === 'wish' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          {ICONS[toast.type] || ICONS.info}
        </svg>
      </span>
      <span>{toast.message}</span>
    </div>
  );
}
