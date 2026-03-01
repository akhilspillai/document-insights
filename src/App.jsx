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
      className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-border-base bg-bg-secondary text-text-secondary hover:bg-bg-elevated transition-colors"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1m-16 0H1m15.364 1.636l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
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
      className="text-xs font-medium rounded-full bg-bg-secondary text-text-secondary px-2.5 py-1 border border-border-base cursor-pointer hover:bg-bg-elevated transition-colors appearance-none text-center"
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

  // Helper to get auth headers for API calls
  const getAuthHeaders = useCallback(async () => {
    const currentUser = auth.currentUser
    if (!currentUser) return {}
    const token = await currentUser.getIdToken()
    return { Authorization: `Bearer ${token}` }
  }, [])

  // Fetch quota from backend
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

  // Fetch dashboard data (recent docs, total count, summary) from Firestore-backed API
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

  // Track authenticated user and sign in anonymously if needed
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        setAuthReady(true)
      } else {
        // No user signed in, sign in anonymously
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

  // Fetch quota when user changes to a Google user
  useEffect(() => {
    if (isGoogleUser) {
      fetchQuota()
    } else {
      setQuota(null)
    }
  }, [isGoogleUser, fetchQuota])

  // Fetch dashboard when user becomes a Google user
  useEffect(() => {
    if (isGoogleUser) {
      fetchDashboard()
    }
  }, [isGoogleUser, fetchDashboard])

  // New handler to prompt Google sign-in before analysis
  const handleSignInAndAnalyze = async (file) => {
    // If user is already signed in with Google, proceed to analyze
    if (isGoogleUser) {
      return handleAnalyze(file)
    }

    // Otherwise, sign in first (with delay to avoid popup blocking)
    try {
      const signedInUser = await ensureGoogleSignIn(auth, googleProvider, true)
      setUser(signedInUser)
      // After successful sign-in, proceed to analyze
      handleAnalyze(file)
    } catch (err) {
      setError(t('error.signInRequired'))
      console.error('Sign-in error:', err)
    }
  }

  const handleAnalyze = async (file) => {
    // This function now assumes user is already signed in with Google
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
      // Step 1: Get auth headers
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

      // Step 3: Upload and analyze
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

      // Update status - server is now extracting text
      setProcessingStatus('extracting')
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Update status - server is now analyzing with AI
      setProcessingStatus('analyzing')

      const uploadData = await uploadRes.json()
      console.log('File uploaded:', uploadData)

      // Use the analysis from the server response (Grok API)
      const analysis = uploadData.analysis
      if (analysis) {
        setProcessingStatus('complete')
        await new Promise((resolve) => setTimeout(resolve, 800))
        setInsights(analysis)
      } else {
        throw new Error(t('error.cannotAnalyze'))
      }

      // Refresh dashboard and quota after successful analysis
      await fetchDashboard()
      // Refresh quota after successful analysis
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
    <div className="min-h-screen bg-bg-base pt-16 pb-10 px-4">
      {/* App header bar */}
      <header className="fixed top-0 inset-x-0 z-20 bg-bg-primary border-b border-border-base shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3 gap-4">
          <div className="flex items-center gap-2">
            <img src={isDark ? logoDark : logo} alt="Document Insights" className="h-8 w-8 object-contain" />
            <span className="text-text-primary font-semibold tracking-tight">
              {t('header.title')}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LanguageToggle />
            <span className="hidden sm:inline-flex text-[10px] font-medium uppercase tracking-wide rounded-full bg-bg-secondary text-text-faint px-2.5 py-1 border border-border-base">
              {t('header.beta')}
            </span>
            <AuthMenu />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Welcome card */}
        <div className="bg-bg-primary border border-border-base rounded-2xl shadow-sm p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-text-primary">
                {t('welcome.heading')}
              </h1>
              <p className="text-sm md:text-base text-text-muted max-w-2xl">
                {t('welcome.description')}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-bg-elevated border border-border-base rounded-xl px-4 py-3 text-sm">
                <div className="text-text-muted">{t('welcome.totalAnalyzed')}</div>
                <div className="text-2xl font-semibold text-text-primary">{totalAnalyzed}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Show processing status when loading or error after upload attempt */}
        {(loading || (error && currentFileName)) && !insights ? (
          <ProcessingStatus
            status={processingStatus}
            error={error}
            fileName={currentFileName}
            onRetry={handleRetry}
            onCancel={handleCancelProcessing}
          />
        ) : insights ? (
          /* Show insights when analysis is complete */
          <div className="mt-6">
            <DocumentInsights insights={insights} loading={false} />

            <div className="text-center mt-8">
              <button
                onClick={() => {
                  setInsights(null)
                  setError(null)
                  setCurrentFileName(null)
                  setCurrentFile(null)
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('upload.analyzeAnother')}
              </button>
            </div>
          </div>
        ) : (
          /* Show main dashboard with upload area */
          <main className="grid grid-cols-1 md:grid-cols-[2fr,1.2fr] gap-6 items-start">
            {/* Left column: upload + history */}
            <div className="space-y-6">
              <div className="bg-bg-primary border border-border-base rounded-2xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-2">{t('upload.heading')}</h2>
                <p className="text-sm text-text-muted mb-4">
                  {t('upload.description')}
                </p>
                {quota && quota.remaining <= 0 ? (
                  <div className="rounded-2xl p-8 text-center border border-red-500/30 bg-red-500/5">
                    <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/30">
                      <svg className="w-8 h-8 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-red-300">
                      {t('upload.quotaReached', { limit: quota.limit, analysisWord: quota.limit === 1 ? t('analysis.one') : t('analysis.other') })}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      {t('upload.upgradeCta')}
                    </p>
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
                      <div className="mt-4 flex items-center space-x-2 text-sm text-slate-400">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400" />
                        <span>{t('upload.initializing')}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="bg-bg-primary border border-border-base rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-text-primary">{t('documents.heading')}</h2>
                  <span className="text-xs text-text-muted">{t('documents.count', { count: uploads.length || 0 })}</span>
                </div>
                {uploads.length === 0 ? (
                  <p className="text-sm text-text-muted">
                    {t('documents.empty')}
                  </p>
                ) : (
                  <ul className="divide-y divide-border-base">
                    {uploads.map((upload) => (
                      <li
                          key={upload.id}
                          onClick={() => !loadingDocId && handleViewDocument(upload)}
                          className={
                            'py-3 flex items-center justify-between gap-3 rounded-lg px-2 -mx-2 transition-colors ' +
                            (loadingDocId === upload.id
                              ? 'opacity-70'
                              : loadingDocId
                              ? 'opacity-50'
                              : 'cursor-pointer hover:bg-bg-elevated')
                          }
                        >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate flex items-center gap-2">
                            {upload.name}
                            {loadingDocId === upload.id && (
                              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent opacity-60 flex-shrink-0" />
                            )}
                          </p>
                          <p className="text-xs text-text-muted">
                            {new Date(upload.uploadedAt).toLocaleString()}
                          </p>
                        </div>
                        <span
                          className={
                            'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ' +
                            (upload.category === 'Urgent / penalty risk'
                              ? 'bg-red-100 text-red-700 border border-red-300 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30'
                              : upload.category === 'Action required'
                              ? 'bg-amber-100 text-amber-700 border border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30'
                              : 'bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30')
                          }
                        >
                          {categoryLabel(upload.category)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Right column: stats */}
            <aside className="space-y-6">
              <div className="bg-bg-primary border border-border-base rounded-2xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-4">{t('summary.heading')}</h2>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex items-center justify-between rounded-xl bg-bg-elevated px-4 py-3">
                    <div>
                      <p className="text-text-secondary">{t('summary.informational')}</p>
                      <p className="text-xs text-text-faint">{t('summary.informationalSub')}</p>
                    </div>
                    <span className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">{informationalCount}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-bg-elevated px-4 py-3">
                    <div>
                      <p className="text-text-secondary">{t('summary.actionRequired')}</p>
                      <p className="text-xs text-text-faint">{t('summary.actionRequiredSub')}</p>
                    </div>
                    <span className="text-lg font-semibold text-amber-700 dark:text-amber-300">{actionRequiredCount}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-bg-elevated px-4 py-3">
                    <div>
                      <p className="text-text-secondary">{t('summary.urgent')}</p>
                      <p className="text-xs text-text-faint">{t('summary.urgentSub')}</p>
                    </div>
                    <span className="text-lg font-semibold text-red-700 dark:text-red-300">{urgentCount}</span>
                  </div>
                </div>
                <div className="mt-4 border-t border-border-base pt-3 text-xs text-text-faint">
                  {t('summary.disclaimer')}
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
