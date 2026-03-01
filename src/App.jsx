import { useState, useEffect, useCallback } from 'react'
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import { auth, googleProvider } from './lib/firebase'
import { ensureGoogleSignIn } from './lib/authGate'
import DocumentUpload from './components/DocumentUpload'
import DocumentInsights from './components/DocumentInsights'
import ProcessingStatus from './components/ProcessingStatus'
import AuthMenu from './components/AuthMenu'
import { useTranslation } from './i18n/LanguageContext.jsx'
import { useTheme } from './lib/ThemeContext.jsx'
import logo from './assets/logo.png'
import logoDark from './assets/logo-dark.png'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border-base bg-bg-secondary text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-all duration-200"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1m-16 0H1m15.364 1.636l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  )
}

function LanguageToggle() {
  const { language, setLanguage, languages } = useTranslation()
  const langKeys = Object.keys(languages)

  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value)}
      className="text-xs font-medium rounded-lg bg-bg-secondary text-text-muted px-2.5 py-1.5 border border-border-base cursor-pointer hover:bg-bg-elevated hover:text-text-primary transition-all duration-200 appearance-none text-center"
    >
      {langKeys.map((key) => (
        <option key={key} value={key} className="bg-bg-primary text-text-primary">
          {languages[key].nativeLabel}
        </option>
      ))}
    </select>
  )
}

function App() {
  const { t, language } = useTranslation()
  const { isDark } = useTheme()
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(false)
  const [processingStatus, setProcessingStatus] = useState(null)
  const [error, setError] = useState(null)
  const [currentFileName, setCurrentFileName] = useState(null)
  const [currentFile, setCurrentFile] = useState(null)
  const [uploads, setUploads] = useState([])
  const [totalAnalyzed, setTotalAnalyzed] = useState(0)
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [quota, setQuota] = useState(null)
  const [summary, setSummary] = useState({ informational: 0, actionRequired: 0, urgent: 0 })
  const [loadingDocId, setLoadingDocId] = useState(null)

  const isGoogleUser = user && !user.isAnonymous

  const getAuthHeaders = useCallback(async () => {
    const currentUser = auth.currentUser
    if (!currentUser) return {}
    const token = await currentUser.getIdToken()
    return { Authorization: `Bearer ${token}` }
  }, [])

  const fetchQuota = useCallback(async () => {
    try {
      const headers = await getAuthHeaders()
      if (!headers.Authorization) return
      const res = await fetch(`${API_BASE}/api/quota`, { headers })
      if (!res.ok) return
      const data = await res.json()
      setQuota(data)
    } catch (err) {
      console.error('Failed to fetch quota:', err)
    }
  }, [getAuthHeaders])

  const fetchDashboard = useCallback(async () => {
    try {
      const headers = await getAuthHeaders()
      if (!headers.Authorization) return
      const res = await fetch(`${API_BASE}/api/documents`, { headers })
      if (!res.ok) return
      const data = await res.json()
      setUploads(data.documents || [])
      setTotalAnalyzed(data.totalAnalyzed || 0)
      setSummary(data.summary || { informational: 0, actionRequired: 0, urgent: 0 })
    } catch (err) {
      console.error('Failed to fetch dashboard:', err)
    }
  }, [getAuthHeaders])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        setAuthReady(true)
      } else {
        try {
          await signInAnonymously(auth)
        } catch (err) {
          console.error('Anonymous sign-in failed:', err)
          setAuthReady(true)
        }
      }
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (isGoogleUser) {
      fetchQuota()
    } else {
      setQuota(null)
    }
  }, [isGoogleUser, fetchQuota])

  useEffect(() => {
    if (isGoogleUser) {
      fetchDashboard()
    }
  }, [isGoogleUser, fetchDashboard])

  const handleSignInAndAnalyze = async (file) => {
    if (isGoogleUser) {
      return handleAnalyze(file)
    }
    try {
      const signedInUser = await ensureGoogleSignIn(auth, googleProvider, true)
      setUser(signedInUser)
      handleAnalyze(file)
    } catch (err) {
      setError(t('error.signInRequired'))
      console.error('Sign-in error:', err)
    }
  }

  const handleAnalyze = async (file) => {
    if (!isGoogleUser) {
      setError(t('error.signInFirst'))
      return
    }

    setLoading(true)
    setError(null)
    setInsights(null)
    setCurrentFileName(file.name)
    setCurrentFile(file)
    setProcessingStatus('uploading')

    try {
      const authHeaders = await getAuthHeaders()
      if (!authHeaders.Authorization) {
        throw new Error(t('error.notAuthenticated'))
      }

      const quotaRes = await fetch(`${API_BASE}/api/quota`, { headers: authHeaders })
      if (quotaRes.ok) {
        const quotaData = await quotaRes.json()
        setQuota(quotaData)
        if (quotaData.remaining <= 0) {
          throw new Error(t('error.quotaExceeded', { limit: quotaData.limit }))
        }
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('language', language)

      const uploadRes = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        headers: authHeaders,
        body: formData,
      })

      if (!uploadRes.ok) {
        const uploadError = await uploadRes.json()
        throw new Error(uploadError.error || 'Failed to upload file')
      }

      setProcessingStatus('extracting')
      await new Promise((resolve) => setTimeout(resolve, 500))

      setProcessingStatus('analyzing')

      const uploadData = await uploadRes.json()
      console.log('File uploaded:', uploadData)

      const analysis = uploadData.analysis
      if (analysis) {
        setProcessingStatus('complete')
        await new Promise((resolve) => setTimeout(resolve, 800))
        setInsights(analysis)
      } else {
        throw new Error(t('error.cannotAnalyze'))
      }

      await fetchDashboard()
      await fetchQuota()
    } catch (err) {
      setError(err.message || t('error.analysisFailed'))
      console.error('Analysis error:', err)
    } finally {
      setLoading(false)
      setProcessingStatus(null)
    }
  }

  const handleRetry = () => {
    if (currentFile) {
      setError(null)
      handleAnalyze(currentFile)
    }
  }

  const handleCancelProcessing = () => {
    setLoading(false)
    setProcessingStatus(null)
    setError(null)
    setCurrentFileName(null)
    setCurrentFile(null)
  }

  const handleViewDocument = async (upload) => {
    setLoadingDocId(upload.id)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`${API_BASE}/api/documents/${upload.id}`, { headers })
      if (!res.ok) throw new Error('Failed to load document')
      const data = await res.json()
      setCurrentFileName(upload.name)
      setInsights(data.analysis)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingDocId(null)
    }
  }

  const informationalCount = summary.informational
  const actionRequiredCount = summary.actionRequired
  const urgentCount = summary.urgent

  const categoryLabel = (category) => {
    if (category === 'Urgent / penalty risk') return t('documents.category.urgent')
    if (category === 'Action required') return t('documents.category.actionRequired')
    return t('documents.category.informational')
  }

  return (
    <div className="min-h-screen bg-bg-base pt-16 pb-16 px-4">

      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-20 glass bg-bg-primary/80 dark:bg-bg-primary/70 border-b border-border-base">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-5 h-14 gap-4">
          <div className="flex items-center gap-2.5">
            <img src={isDark ? logoDark : logo} alt="Document Insights" className="h-7 w-7 object-contain" />
            <span className="text-sm font-semibold tracking-tight text-text-primary">
              {t('header.title')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageToggle />
            <span className="hidden sm:inline-flex text-[10px] font-semibold uppercase tracking-widest rounded-md bg-accent-dim text-accent dark:text-accent px-2 py-1 border border-accent/20">
              {t('header.beta')}
            </span>
            <AuthMenu />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto space-y-8">

        {/* ── Hero card ────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl border border-border-base bg-bg-primary card-glow p-8 md:p-10">
          {/* Subtle background glow blob */}
          <div className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 rounded-full bg-accent/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-violet-500/8 blur-3xl" />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 gradient-text leading-tight">
                {t('welcome.heading')}
              </h1>
              <p className="text-sm md:text-base text-text-muted max-w-xl leading-relaxed">
                {t('welcome.description')}
              </p>
            </div>

            {/* Stat pill */}
            <div className="flex-shrink-0">
              <div className="inline-flex flex-col items-center justify-center border border-border-base bg-bg-secondary rounded-xl px-6 py-4 min-w-[100px]">
                <span className="text-3xl font-bold text-text-primary tabular-nums">{totalAnalyzed}</span>
                <span className="text-xs text-text-faint uppercase tracking-wider mt-1 font-medium">{t('welcome.totalAnalyzed')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Processing / Insights / Main dashboard ───────────── */}
        {(loading || (error && currentFileName)) && !insights ? (
          <ProcessingStatus
            status={processingStatus}
            error={error}
            fileName={currentFileName}
            onRetry={handleRetry}
            onCancel={handleCancelProcessing}
          />
        ) : insights ? (
          <div className="space-y-6">
            <DocumentInsights insights={insights} loading={false} />

            <div className="text-center pt-2">
              <button
                onClick={() => {
                  setInsights(null)
                  setError(null)
                  setCurrentFileName(null)
                  setCurrentFile(null)
                }}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-accent text-white hover:opacity-90 active:opacity-80 transition-opacity shadow-lg shadow-accent/25"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t('upload.analyzeAnother')}
              </button>
            </div>
          </div>
        ) : (
          /* ── Dashboard grid ─────────────────────────────────── */
          <main className="grid grid-cols-1 md:grid-cols-[2fr,1.2fr] gap-6 items-start">

            {/* Left column: upload + history */}
            <div className="space-y-5">

              {/* Upload card */}
              <div className="rounded-2xl border border-border-base bg-bg-primary card-glow p-6">
                <div className="mb-5">
                  <h2 className="text-base font-semibold text-text-primary tracking-tight">{t('upload.heading')}</h2>
                  <p className="text-sm text-text-muted mt-1">{t('upload.description')}</p>
                </div>

                {quota && quota.remaining <= 0 ? (
                  <div className="rounded-xl p-6 text-center border border-red-500/20 bg-red-500/5">
                    <div className="w-12 h-12 mx-auto mb-3 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20">
                      <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-red-400">
                      {t('upload.quotaReached', { limit: quota.limit, analysisWord: quota.limit === 1 ? t('analysis.one') : t('analysis.other') })}
                    </p>
                    <p className="text-xs text-text-faint mt-1.5">{t('upload.upgradeCta')}</p>
                  </div>
                ) : (
                  <>
                    <DocumentUpload
                      onAnalyze={handleSignInAndAnalyze}
                      disabled={!authReady}
                      quota={quota}
                      requiresSignIn={!isGoogleUser}
                    />
                    {!authReady && (
                      <div className="mt-4 flex items-center gap-2 text-xs text-text-faint">
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-text-faint border-t-transparent" />
                        <span>{t('upload.initializing')}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Document history card */}
              <div className="rounded-2xl border border-border-base bg-bg-primary card-glow p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-semibold text-text-primary tracking-tight">{t('documents.heading')}</h2>
                  <span className="text-xs text-text-faint font-medium bg-bg-secondary border border-border-base rounded-md px-2 py-0.5">
                    {t('documents.count', { count: uploads.length || 0 })}
                  </span>
                </div>

                {uploads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-10 h-10 rounded-xl bg-bg-secondary border border-border-base flex items-center justify-center mb-3">
                      <svg className="w-5 h-5 text-text-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-sm text-text-faint">{t('documents.empty')}</p>
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {uploads.map((upload) => (
                      <li
                        key={upload.id}
                        onClick={() => !loadingDocId && handleViewDocument(upload)}
                        className={
                          'group flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 -mx-1 transition-all duration-150 ' +
                          (loadingDocId === upload.id
                            ? 'opacity-60 bg-bg-elevated'
                            : loadingDocId
                            ? 'opacity-40'
                            : 'cursor-pointer hover:bg-bg-elevated')
                        }
                      >
                        <div className="min-w-0 flex items-center gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-bg-secondary border border-border-base flex items-center justify-center">
                            {loadingDocId === upload.id ? (
                              <span className="h-3 w-3 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                            ) : (
                              <svg className="w-4 h-4 text-text-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate group-hover:text-text-primary">
                              {upload.name}
                            </p>
                            <p className="text-xs text-text-faint">
                              {new Date(upload.uploadedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <span className={
                          'flex-shrink-0 inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide border ' +
                          (upload.category === 'Urgent / penalty risk'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : upload.category === 'Action required'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20')
                        }>
                          {categoryLabel(upload.category)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Right column: stats sidebar */}
            <aside>
              <div className="rounded-2xl border border-border-base bg-bg-primary card-glow p-6">
                <h2 className="text-base font-semibold text-text-primary tracking-tight mb-5">{t('summary.heading')}</h2>

                <div className="space-y-2.5">
                  {/* Informational */}
                  <div className="flex items-center gap-3 rounded-xl bg-bg-secondary border border-border-base px-4 py-3.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text-secondary">{t('summary.informational')}</p>
                      <p className="text-xs text-text-faint">{t('summary.informationalSub')}</p>
                    </div>
                    <span className="text-xl font-bold text-emerald-400 tabular-nums">{informationalCount}</span>
                  </div>

                  {/* Action required */}
                  <div className="flex items-center gap-3 rounded-xl bg-bg-secondary border border-border-base px-4 py-3.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text-secondary">{t('summary.actionRequired')}</p>
                      <p className="text-xs text-text-faint">{t('summary.actionRequiredSub')}</p>
                    </div>
                    <span className="text-xl font-bold text-amber-400 tabular-nums">{actionRequiredCount}</span>
                  </div>

                  {/* Urgent */}
                  <div className="flex items-center gap-3 rounded-xl bg-bg-secondary border border-border-base px-4 py-3.5">
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text-secondary">{t('summary.urgent')}</p>
                      <p className="text-xs text-text-faint">{t('summary.urgentSub')}</p>
                    </div>
                    <span className="text-xl font-bold text-red-400 tabular-nums">{urgentCount}</span>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-border-base">
                  <p className="text-xs text-text-faint leading-relaxed">{t('summary.disclaimer')}</p>
                </div>
              </div>
            </aside>

          </main>
        )}
      </div>
    </div>
  )
}

export default App
