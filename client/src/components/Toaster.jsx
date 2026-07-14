import { useEffect, useRef, useState } from 'react';

export default function Toaster() {
  const [message, setMessage] = useState('');
  const [show, setShow] = useState(false);
  const timer = useRef();

  useEffect(() => {
    const onToast = (e) => {
      setMessage(e.detail);
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

  return <div className={`toast ${show ? 'show' : ''}`}>{message}</div>;
}
