import { useEffect, useState } from 'react';
import { auth, googleProvider } from '../lib/firebase';
import { onAuthStateChanged, signOut, signInAnonymously } from 'firebase/auth';
import { ensureGoogleSignIn } from '../lib/authGate';

const AuthMenu = () => {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ?? null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const isAnonymous = user?.isAnonymous ?? false;

  const handleSignIn = async () => {
    try {
      await ensureGoogleSignIn(auth, googleProvider);
      setOpen(false);
    } catch (err) {
      console.error('Sign-in failed', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // Sign in anonymously again after sign out
      await signInAnonymously(auth);
      setOpen(false);
    } catch (err) {
      console.error('Sign-out failed', err);
    }
  };

  const displayInitial = user?.displayName?.[0]?.toUpperCase() ?? null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-white/10 text-white shadow-sm hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent focus-visible:ring-white/60"
      >
        <span className="sr-only">Open profile menu</span>
        {user && displayInitial ? (
          <span className="text-xs font-semibold">
            {displayInitial}
          </span>
        ) : (
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5.121 17.804A4 4 0 018 16h8a4 4 0 012.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 origin-top-right rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-xl p-4 z-30">
          {loading ? (
            <p className="text-xs text-slate-400">Checking your session…</p>
          ) : user && !isAnonymous ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-semibold text-slate-100">
                  {displayInitial ?? '?'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-50 truncate">{user.displayName ?? 'Signed in'}</p>
                  {user.email && (
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-50 text-xs font-medium py-2 mt-1"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-slate-50 mb-2">Sign in</p>
              <p className="text-xs text-slate-400 mb-3">
                Use your Google account to save documents and personalize your dashboard.
              </p>
              <button
                type="button"
                onClick={handleSignIn}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-white text-slate-900 text-xs font-medium py-2 hover:bg-slate-100"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fill="#EA4335"
                    d="M12 10.2v3.6h5.1c-.2 1.2-.9 2.3-2 3.1l3.3 2.6c1.9-1.8 3-4.4 3-7.4 0-.7-.1-1.3-.2-1.9H12z"
                  />
                  <path
                    fill="#34A853"
                    d="M6.6 14.3l-.8.7-2.6 2.1C4.9 19.9 8.2 22 12 22c2.7 0 5-.9 6.6-2.5l-3.3-2.6C14.4 17.7 13.3 18 12 18c-2.4 0-4.5-1.6-5.3-3.7z"
                  />
                  <path
                    fill="#4A90E2"
                    d="M3.2 7.9C2.4 9.3 2 10.9 2 12.5s.4 3.2 1.2 4.6l3.4-2.8C6.3 13.5 6 13 6 12.5c0-.5.3-1 .5-1.8z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M12 6c1.5 0 2.8.5 3.8 1.5l2.8-2.8C17 2.9 14.7 2 12 2 8.2 2 4.9 4.1 3.2 7.9l3.4 2.8C7.5 7.6 9.6 6 12 6z"
                  />
                  <path fill="none" d="M2 2h20v20H2z" />
                </svg>
                <span>Sign in with Google</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AuthMenu;
