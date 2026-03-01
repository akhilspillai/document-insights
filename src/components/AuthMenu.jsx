import { useEffect, useRef, useState } from 'react';
import { auth, googleProvider } from '../lib/firebase';
import { onAuthStateChanged, signOut, signInAnonymously } from 'firebase/auth';
import { ensureGoogleSignIn } from '../lib/authGate';
import { useTranslation } from '../i18n/LanguageContext.jsx';

const AuthMenu = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const menuRef = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ?? null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const isAnonymous = user?.isAnonymous ?? false;

  const handleSignIn = async () => {
    try {
      await ensureGoogleSignIn(auth, googleProvider, true);
      setOpen(false);
    } catch (err) {
      console.error('Sign-in failed', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      window.location.reload();
    } catch (err) {
      console.error('Sign-out failed', err);
    }
  };

  const displayInitial = user?.displayName?.[0]?.toUpperCase() ?? null;

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-base bg-bg-secondary text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
      >
        <span className="sr-only">{t('auth.openMenu')}</span>
        {user && displayInitial ? (
          <span className="text-xs font-bold text-text-primary">{displayInitial}</span>
        ) : (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.121 17.804A4 4 0 018 16h8a4 4 0 012.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-2xl border border-border-strong bg-bg-primary/95 glass shadow-2xl shadow-black/25 p-4 z-30">
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-text-faint">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-text-faint border-t-transparent" />
              {t('auth.checkingSession')}
            </div>
          ) : user && !isAnonymous ? (
            /* ── Signed-in state ────────────────────────── */
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-sm font-bold text-accent flex-shrink-0">
                  {displayInitial ?? '?'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">{user.displayName ?? t('auth.signedIn')}</p>
                  {user.email && (
                    <p className="text-xs text-text-faint truncate">{user.email}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full rounded-xl bg-bg-secondary hover:bg-bg-elevated text-text-secondary text-xs font-medium py-2.5 border border-border-base transition-colors duration-150"
              >
                {t('auth.signOut')}
              </button>
            </>
          ) : (
            /* ── Signed-out state ───────────────────────── */
            <>
              <p className="text-sm font-semibold text-text-primary mb-1">{t('auth.signIn')}</p>
              <p className="text-xs text-text-faint mb-4 leading-relaxed">
                {t('auth.signInDescription')}
              </p>
              <button
                type="button"
                onClick={handleSignIn}
                className="w-full inline-flex items-center justify-center gap-2.5 rounded-xl bg-white text-slate-900 text-xs font-semibold py-2.5 hover:bg-slate-50 active:bg-slate-100 transition-colors border border-slate-200 shadow-sm"
              >
                {/* Google logo */}
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#EA4335" d="M12 10.2v3.6h5.1c-.2 1.2-.9 2.3-2 3.1l3.3 2.6c1.9-1.8 3-4.4 3-7.4 0-.7-.1-1.3-.2-1.9H12z" />
                  <path fill="#34A853" d="M6.6 14.3l-.8.7-2.6 2.1C4.9 19.9 8.2 22 12 22c2.7 0 5-.9 6.6-2.5l-3.3-2.6C14.4 17.7 13.3 18 12 18c-2.4 0-4.5-1.6-5.3-3.7z" />
                  <path fill="#4A90E2" d="M3.2 7.9C2.4 9.3 2 10.9 2 12.5s.4 3.2 1.2 4.6l3.4-2.8C6.3 13.5 6 13 6 12.5c0-.5.3-1 .5-1.8z" />
                  <path fill="#FBBC05" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.8-2.8C17 2.9 14.7 2 12 2 8.2 2 4.9 4.1 3.2 7.9l3.4 2.8C7.5 7.6 9.6 6 12 6z" />
                </svg>
                <span>{t('auth.signInGoogle')}</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AuthMenu;
