import { useState, useEffect, useRef, useCallback, type SyntheticEvent } from 'react';

export default function ContactModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [botcheck, setBotcheck] = useState('');

  const dialogRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const isClosingRef = useRef(false);

  const closeModal = useCallback(() => {
    if (isClosingRef.current || !isOpen) return;
    isClosingRef.current = true;
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      isClosingRef.current = false;
    }, 220);
  }, [isOpen]);

  // Listen for global custom events to open the modal from anywhere
  useEffect(() => {
    const handleOpen = () => {
      isClosingRef.current = false;
      setIsClosing(false);
      setIsOpen(true);
      setStatus('idle');
      setErrorMessage('');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isClosing) {
        closeModal();
      } else if (e.key === 'Tab' && isOpen && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length > 0) {
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('open-contact-modal', handleOpen);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('open-contact-modal', handleOpen);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isClosing, closeModal]);

  // Prevent background shift and lock scroll when modal opens
  useEffect(() => {
    if (isOpen) {
      document.documentElement.style.overflowY = 'scroll';
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        nameInputRef.current?.focus({ preventScroll: true });
      }, 100);
    } else {
      document.documentElement.style.overflowY = '';
      document.body.style.overflow = '';
    }

    return () => {
      document.documentElement.style.overflowY = '';
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Honeypot spam trap: if bot filled this, silently reject
    if (botcheck) {
      setStatus('success');
      return;
    }

    if (!name.trim() || !email.trim() || !message.trim()) {
      setErrorMessage('Please fill in your name, email address, and message.');
      setStatus('error');
      return;
    }

    setStatus('submitting');
    setErrorMessage('');

    const accessKey = import.meta.env.PUBLIC_WEB3FORMS_KEY;

    if (!accessKey) {
      setStatus('error');
      setErrorMessage(
        'Contact service access key is not configured. Please use the direct email link below.'
      );
      return;
    }

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          access_key: accessKey,
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim() || `Portfolio Inquiry from ${name.trim()}`,
          message: message.trim(),
          from_name: 'Portfolio Contact Form',
          replyto: email.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('success');
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
      } else {
        setStatus('error');
        setErrorMessage(
          'Unable to send message via the automated form right now. Please use the direct email link below.'
        );
      }
    } catch {
      setStatus('error');
      setErrorMessage('Network connection error. Please use direct email below.');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-modal-title"
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 ${
        isClosing ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop'
      }`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          closeModal();
        }
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeModal();
        }
      }}
    >
      <div
        ref={dialogRef}
        className={`relative w-full max-w-lg max-h-[calc(100svh-2rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-xl border border-border bg-surface p-5 sm:p-8 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] text-text shadow-2xl ${
          isClosing ? 'animate-modal-content-out' : 'animate-modal-content'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 mb-6 pb-3 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="size-1.5 rounded-full bg-accent animate-pulse"></span>
              <h2 id="contact-modal-title" className="text-sm font-bold font-mono tracking-wider text-text uppercase">
                // DIRECT INQUIRY DISPATCH
              </h2>
            </div>
            <p className="text-xs text-text-muted font-mono">
              DIRECT CHANNEL &rarr; <span className="text-accent font-semibold">johnfelixmarc@gmail.com</span>
            </p>
          </div>

          <button
            type="button"
            onClick={closeModal}
            aria-label="Close modal"
            className="size-10 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-text-muted hover:text-text hover:bg-surface-raised active:scale-[0.96] transition-all text-sm leading-none cursor-pointer touch-manipulation"
          >
            ✕
          </button>
        </div>

        {/* Modal Body / Form States */}
        {status === 'success' ? (
          <div className="py-6 text-center space-y-4">
            <div className="size-12 rounded-full bg-surface-raised border border-border text-accent mx-auto flex items-center justify-center text-xl font-bold font-mono">
              ✓
            </div>
            <div>
              <h3 className="text-base font-bold font-mono uppercase tracking-wider text-text">Transmission Received</h3>
              <p className="text-xs text-text-muted mt-1.5 max-w-sm mx-auto leading-relaxed">
                Direct dispatch delivered to primary inbox. Acknowledgment response will be transmitted shortly.
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setStatus('idle');
                  closeModal();
                }}
                className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-lg bg-accent text-accent-text hover:opacity-90 active:scale-[0.98] font-bold text-xs uppercase tracking-wider transition-all cursor-pointer touch-manipulation"
              >
                Done
              </button>
              <button
                type="button"
                onClick={() => setStatus('idle')}
                className="inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 rounded-lg border border-border hover:bg-surface-raised active:scale-[0.98] text-xs font-semibold uppercase tracking-wider text-text transition-all cursor-pointer touch-manipulation"
              >
                Send Another
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Honeypot hidden input */}
            <input
              type="checkbox"
              name="botcheck"
              className="hidden"
              style={{ display: 'none' }}
              checked={botcheck !== ''}
              onChange={(e) => setBotcheck(e.target.checked ? 'bot' : '')}
              tabIndex={-1}
              autoComplete="off"
            />

            {/* Error Notification */}
            {status === 'error' && (
              <div className="p-3 rounded-lg bg-surface-raised border border-red-500/40 text-xs text-red-400">
                <p className="font-medium">{errorMessage}</p>
                <a
                  href={`mailto:johnfelixmarc@gmail.com?subject=${encodeURIComponent(
                    subject || 'Portfolio Inquiry'
                  )}&body=${encodeURIComponent(message)}`}
                  className="underline text-text hover:text-accent mt-1 inline-block"
                >
                  Direct client fallback &rarr;
                </a>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Name field */}
              <div>
                <label htmlFor="contact-name" className="block text-[11px] font-mono uppercase tracking-wider text-text-muted mb-1.5">
                  Name <span className="text-accent">*</span>
                </label>
                <input
                  ref={nameInputRef}
                  id="contact-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Smith"
                  className="w-full px-3.5 py-2.5 text-base sm:text-xs rounded-lg border border-border bg-surface-raised text-text placeholder:text-text-muted/60 focus:border-accent outline-none transition-colors"
                  disabled={status === 'submitting'}
                />
              </div>

              {/* Email field */}
              <div>
                <label htmlFor="contact-email" className="block text-[11px] font-mono uppercase tracking-wider text-text-muted mb-1.5">
                  Email <span className="text-accent">*</span>
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@company.com"
                  className="w-full px-3.5 py-2.5 text-base sm:text-xs rounded-lg border border-border bg-surface-raised text-text placeholder:text-text-muted/60 focus:border-accent outline-none transition-colors"
                  disabled={status === 'submitting'}
                />
              </div>
            </div>

            {/* Subject field */}
            <div>
              <label htmlFor="contact-subject" className="block text-[11px] font-mono uppercase tracking-wider text-text-muted mb-1.5">
                Subject
              </label>
              <input
                id="contact-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Project inquiry / Full-stack opportunity"
                className="w-full px-3.5 py-2.5 text-base sm:text-xs rounded-lg border border-border bg-surface-raised text-text placeholder:text-text-muted/60 focus:border-accent outline-none transition-colors"
                disabled={status === 'submitting'}
              />
            </div>

            {/* Message field */}
            <div>
              <label htmlFor="contact-message" className="block text-[11px] font-mono uppercase tracking-wider text-text-muted mb-1.5">
                Message <span className="text-accent">*</span>
              </label>
              <textarea
                id="contact-message"
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hi Marc, I'd like to talk to you about..."
                className="w-full px-3.5 py-2.5 text-base sm:text-xs rounded-lg border border-border bg-surface-raised text-text placeholder:text-text-muted/60 focus:border-accent outline-none transition-colors resize-none"
                disabled={status === 'submitting'}
              />
            </div>

            {/* Submit & Fallback actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <a
                href="mailto:johnfelixmarc@gmail.com"
                className="text-[11px] font-mono uppercase tracking-wider text-text-muted hover:text-text transition-colors order-2 sm:order-1"
              >
                // mailto: client
              </a>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end order-1 sm:order-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 rounded-lg border border-border hover:bg-surface-raised active:scale-[0.98] text-xs font-semibold uppercase tracking-wider text-text transition-all cursor-pointer touch-manipulation"
                  disabled={status === 'submitting'}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-lg bg-accent text-accent-text hover:opacity-90 active:scale-[0.98] transition-all text-xs font-bold uppercase tracking-wider shadow-xs cursor-pointer gap-2 disabled:opacity-50 touch-manipulation"
                >
                  {status === 'submitting' ? (
                    <>
                      <span className="w-2.5 h-2.5 border-2 border-accent-text border-t-transparent rounded-full animate-spin"></span>
                      <span>Dispatching...</span>
                    </>
                  ) : (
                    <span>Dispatch Inquiry</span>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
