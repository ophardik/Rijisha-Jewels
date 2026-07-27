import { useState } from 'react';
import { STRINGS } from '../strings';

// Password field with a show/hide eye toggle.
//
// Drop-in replacement for <input type="password" /> — every prop passed here
// lands on the input, so `required`, `minLength`, `value`, `onChange` and
// friends behave exactly as before. The wrapper only adds the button.
export default function PasswordInput(props) {
  const [shown, setShown] = useState(false);
  const label = shown ? STRINGS.common.hidePassword : STRINGS.common.showPassword;

  return (
    <span className="password-field">
      <input {...props} type={shown ? 'text' : 'password'} />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setShown((v) => !v)}
        aria-label={label}
        aria-pressed={shown}
        title={label}
        // The eye is a convenience, not a form control — keep it out of the
        // tab order so Tab still goes password → submit.
        tabIndex={-1}
      >
        {shown ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="19" height="19">
            <path d="M3 3l18 18" />
            <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
            <path d="M9.4 5.2A9.5 9.5 0 0 1 12 4.9c5 0 9 4.6 9 7.1a9.6 9.6 0 0 1-2.4 3.6M6.2 6.6C3.9 8.2 3 10.6 3 12c0 2.5 4 7.1 9 7.1a9.6 9.6 0 0 0 3.5-.7" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="19" height="19">
            <path d="M3 12s3.6-7.1 9-7.1S21 12 21 12s-3.6 7.1-9 7.1S3 12 3 12Z" />
            <circle cx="12" cy="12" r="2.6" />
          </svg>
        )}
      </button>
    </span>
  );
}
