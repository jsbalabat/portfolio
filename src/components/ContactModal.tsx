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

    const accessKey =
      import.meta.env.PUBLIC_WEB3FORMS_KEY ||
      'e2170536-6acd-4b20-9b41-5c53846340d2';

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
        if (data.message && data.message.toLowerCase().includes('key')) {
          setErrorMessage(
            'Web3Forms access key not set or invalid. Get a free key at https://web3forms.com using johnfelixmarc@gmail.com and add PUBLIC_WEB3FORMS_KEY to your .env file.'
          );
        } else {
          setErrorMessage(
            data.message || 'Unable to send message right now. Please use direct email below.'
          );
        }
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
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs ${
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
        className={`relative w-full max-w-lg rounded-2xl border border-border bg-surface p-6 sm:p-7 shadow-2xl text-text ${
          isClosing ? 'animate-modal-content-out' : 'animate-modal-content'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 mb-5 pb-3 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <h2 id="contact-modal-title" className="text-lg font-bold tracking-tight text-text">
                Get in Touch
              </h2>
            </div>
            <p className="text-xs font-mono text-text-muted">
              Sends directly to{' '}
              <span className="text-accent font-semibold">johnfelixmarc@gmail.com</span>
            </p>
          </div>

          <button
            type="button"
            onClick={closeModal}
            aria-label="Close contact modal"
            className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-surface-raised transition-colors text-lg leading-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body / Form States */}
        {status === 'success' ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 mx-auto flex items-center justify-center text-xl font-bold">
              ✓
            </div>
            <div>
              <h3 className="text-base font-bold text-text">Message Sent!</h3>
              <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
                Thank you. Your message has been sent to my Gmail. I will reply to you as soon as possible.
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setStatus('idle');
                  closeModal();
                }}
                className="px-4 py-2 rounded-lg bg-accent text-accent-text hover:opacity-90 font-medium text-xs font-mono transition-opacity cursor-pointer"
              >
                Done
              </button>
              <button
                type="button"
                onClick={() => setStatus('idle')}
                className="px-4 py-2 rounded-lg border border-border hover:bg-surface-raised text-xs font-mono text-text transition-colors cursor-pointer"
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
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-xs text-red-200">
                <p className="font-medium">{errorMessage}</p>
                <a
                  href={`mailto:johnfelixmarc@gmail.com?subject=${encodeURIComponent(
                    subject || 'Portfolio Inquiry'
                  )}&body=${encodeURIComponent(message)}`}
                  className="underline text-red-300 hover:text-red-100 mt-1 inline-block"
                >
                  Or click here to open your default email client directly →
                </a>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Name field */}
              <div>
                <label htmlFor="contact-name" className="block text-xs font-mono font-medium text-text-muted mb-1">
                  Your Name <span className="text-accent">*</span>
                </label>
                <input
                  ref={nameInputRef}
                  id="contact-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Smith"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface-raised text-text placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent"
                  disabled={status === 'submitting'}
                />
              </div>

              {/* Email field */}
              <div>
                <label htmlFor="contact-email" className="block text-xs font-mono font-medium text-text-muted mb-1">
                  Your Email <span className="text-accent">*</span>
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@company.com"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface-raised text-text placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent"
                  disabled={status === 'submitting'}
                />
              </div>
            </div>

            {/* Subject field */}
            <div>
              <label htmlFor="contact-subject" className="block text-xs font-mono font-medium text-text-muted mb-1">
                Subject
              </label>
              <input
                id="contact-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Project inquiry / Full-stack opportunity"
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface-raised text-text placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent"
                disabled={status === 'submitting'}
              />
            </div>

            {/* Message field */}
            <div>
              <label htmlFor="contact-message" className="block text-xs font-mono font-medium text-text-muted mb-1">
                Message <span className="text-accent">*</span>
              </label>
              <textarea
                id="contact-message"
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hi Marc, I'd like to talk to you about..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface-raised text-text placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                disabled={status === 'submitting'}
              />
            </div>

            {/* Submit & Fallback actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <a
                href="mailto:johnfelixmarc@gmail.com"
                className="text-xs font-mono text-text-muted hover:text-text transition-colors order-2 sm:order-1"
              >
                Or use mailto: client
              </a>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end order-1 sm:order-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-3.5 py-2 rounded-lg border border-border hover:bg-surface-raised text-xs font-mono text-text transition-colors cursor-pointer"
                  disabled={status === 'submitting'}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="px-4 py-2 rounded-lg bg-accent text-accent-text hover:opacity-90 font-medium text-xs font-mono transition-opacity shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {status === 'submitting' ? (
                    <>
                      <span className="w-2.5 h-2.5 border-2 border-accent-text border-t-transparent rounded-full animate-spin"></span>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>Send Message</span>
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
