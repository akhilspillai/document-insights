import { useState, useEffect, useCallback } from 'react'
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import { auth, googleProvider } from './lib/firebase'
import { ensureGoogleSignIn } from './lib/authGate'
import DocumentUpload from './components/DocumentUpload'
import DocumentInsights from './components/DocumentInsights'
import ProcessingStatus from './components/ProcessingStatus'
import AuthMenu from './components/AuthMenu'
import { useTranslation } from './i18n/LanguageContext.jsx'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

function LanguageToggle() {
  const { language, setLanguage, languages } = useTranslation()
  const langKeys = Object.keys(languages)

  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value)}
      className="text-xs font-medium rounded-full bg-white/10 text-blue-50 px-2.5 py-1 border border-white/20 cursor-pointer hover:bg-white/20 transition-colors appearance-none text-center"
    >
      {langKeys.map((key) => (
        <option key={key} value={key} className="bg-slate-900 text-slate-50">
          {languages[key].nativeLabel}
        </option>
      ))}
    </select>
  )
}

function App() {
  const { t, language } = useTranslation()
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

  const informationalCount = summary.informational
  const actionRequiredCount = summary.actionRequired
  const urgentCount = summary.urgent

  const categoryLabel = (category) => {
    if (category === 'Urgent / penalty risk') return t('documents.category.urgent')
    if (category === 'Action required') return t('documents.category.actionRequired')
    return t('documents.category.informational')
  }

  return (
    <div className="min-h-screen bg-slate-950 pt-16 pb-10 px-4">
      {/* App header bar */}
      <header className="fixed top-0 inset-x-0 z-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-md/80 border-b border-white/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3 gap-4">
          <span className="text-white font-semibold tracking-tight">
            {t('header.title')}
          </span>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <span className="hidden sm:inline-flex text-[10px] font-medium uppercase tracking-wide rounded-full bg-white/10 text-blue-50 px-2.5 py-1 border border-white/20">
              {t('header.beta')}
            </span>
            <AuthMenu />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Welcome card */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
                {t('welcome.heading')}
              </h1>
              <p className="text-sm md:text-base text-blue-100 max-w-2xl">
                {t('welcome.description')}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-white/10 rounded-xl px-4 py-3 text-sm">
                <div className="text-blue-100">{t('welcome.totalAnalyzed')}</div>
                <div className="text-2xl font-semibold">{totalAnalyzed}</div>
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
              <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-slate-50 mb-2">{t('upload.heading')}</h2>
                <p className="text-sm text-slate-400 mb-4">
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

              <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-50">{t('documents.heading')}</h2>
                  <span className="text-xs text-slate-400">{t('documents.count', { count: uploads.length || 0 })}</span>
                </div>
                {uploads.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    {t('documents.empty')}
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-800">
                    {uploads.map((upload) => (
                      <li key={upload.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-50 truncate">
                            {upload.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {new Date(upload.uploadedAt).toLocaleString()}
                          </p>
                        </div>
                        <span
                          className={
                            'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ' +
                            (upload.category === 'Urgent / penalty risk'
                              ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                              : upload.category === 'Action required'
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30')
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
              <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-slate-50 mb-4">{t('summary.heading')}</h2>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex items-center justify-between rounded-xl bg-slate-800/70 px-4 py-3">
                    <div>
                      <p className="text-slate-300">{t('summary.informational')}</p>
                      <p className="text-xs text-slate-500">{t('summary.informationalSub')}</p>
                    </div>
                    <span className="text-lg font-semibold text-emerald-300">{informationalCount}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-800/70 px-4 py-3">
                    <div>
                      <p className="text-slate-300">{t('summary.actionRequired')}</p>
                      <p className="text-xs text-slate-500">{t('summary.actionRequiredSub')}</p>
                    </div>
                    <span className="text-lg font-semibold text-amber-300">{actionRequiredCount}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-800/70 px-4 py-3">
                    <div>
                      <p className="text-slate-300">{t('summary.urgent')}</p>
                      <p className="text-xs text-slate-500">{t('summary.urgentSub')}</p>
                    </div>
                    <span className="text-lg font-semibold text-red-300">{urgentCount}</span>
                  </div>
                </div>
                <div className="mt-4 border-t border-slate-800 pt-3 text-xs text-slate-500">
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
