import { useState, useEffect, useCallback } from 'react'
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import { auth, googleProvider } from './lib/firebase'
import { ensureGoogleSignIn } from './lib/authGate'
import DocumentUpload from './components/DocumentUpload'
import DocumentInsights from './components/DocumentInsights'
import ProcessingStatus from './components/ProcessingStatus'
import AuthMenu from './components/AuthMenu'

const API_BASE = ''

function App() {
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

  const handleAnalyze = async (file) => {
    setLoading(true)
    setError(null)
    setInsights(null)
    setCurrentFileName(file.name)
    setCurrentFile(file)
    setProcessingStatus('uploading')

    try {
      // Step 1: Ensure user is signed in with Google
      let signedInUser = user
      if (!user || user.isAnonymous) {
        try {
          signedInUser = await ensureGoogleSignIn(auth, googleProvider)
          setUser(signedInUser)
        } catch (err) {
          throw new Error('Google sign-in is required to analyze documents.')
        }
      }

      // Step 2: Fetch fresh quota after sign-in
      const token = await signedInUser.getIdToken()
      const authHeaders = { Authorization: `Bearer ${token}` }

      const quotaRes = await fetch(`${API_BASE}/api/quota`, { headers: authHeaders })
      if (quotaRes.ok) {
        const quotaData = await quotaRes.json()
        setQuota(quotaData)
        if (quotaData.remaining <= 0) {
          throw new Error(`You have reached the limit of ${quotaData.limit} free document analyses.`)
        }
      }

      // Step 3: Upload and analyze
      const formData = new FormData()
      formData.append('file', file)

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
        throw new Error('Could not analyze this document. Please ensure it is a valid PDF with readable text.')
      }

      // Refresh dashboard and quota after successful analysis
      await fetchDashboard()
      // Refresh quota after successful analysis
      await fetchQuota()
    } catch (err) {
      setError(err.message || 'Failed to analyze document. Please try again.')
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

  return (
    <div className="min-h-screen bg-slate-950 pt-16 pb-10 px-4">
      {/* App header bar */}
      <header className="fixed top-0 inset-x-0 z-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-md/80 border-b border-white/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3 gap-4">
          <span className="text-white font-semibold tracking-tight">
            Document Insights
          </span>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex text-[10px] font-medium uppercase tracking-wide rounded-full bg-white/10 text-blue-50 px-2.5 py-1 border border-white/20">
              Beta
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
                Document Insights Hub
              </h1>
              <p className="text-sm md:text-base text-blue-100 max-w-2xl">
                Upload confusing documents and instantly see what they are, why you received them,
                what you must do, and the risks of ignoring them.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-white/10 rounded-xl px-4 py-3 text-sm">
                <div className="text-blue-100">Total documents analyzed</div>
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
                Analyze Another Document
              </button>
            </div>
          </div>
        ) : (
          /* Show main dashboard with upload area */
          <main className="grid grid-cols-1 md:grid-cols-[2fr,1.2fr] gap-6 items-start">
            {/* Left column: upload + history */}
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-slate-50 mb-2">Upload a document</h2>
                <p className="text-sm text-slate-400 mb-4">
                  Drag and drop or browse a file to see a plain-language breakdown of what it means.
                </p>
                {quota && quota.remaining <= 0 ? (
                  <div className="rounded-2xl p-8 text-center border border-red-500/30 bg-red-500/5">
                    <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/30">
                      <svg className="w-8 h-8 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-red-300">
                      You&apos;ve reached the limit of {quota.limit} free {quota.limit === 1 ? 'analysis' : 'analyses'}.
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      Upgrade your plan to continue analyzing documents.
                    </p>
                  </div>
                ) : (
                  <>
                    <DocumentUpload
                      onAnalyze={handleAnalyze}
                      disabled={!authReady}
                      quota={quota}
                    />
                    {!authReady && (
                      <div className="mt-4 flex items-center space-x-2 text-sm text-slate-400">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400" />
                        <span>Initializing...</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-50">Recent documents</h2>
                  <span className="text-xs text-slate-400">Last {uploads.length || 0} uploads</span>
                </div>
                {uploads.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    You haven&apos;t analyzed any documents yet. Upload your first file to see it here.
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
                          {upload.category}
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
                <h2 className="text-lg font-semibold text-slate-50 mb-4">Insights summary</h2>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex items-center justify-between rounded-xl bg-slate-800/70 px-4 py-3">
                    <div>
                      <p className="text-slate-300">Informational</p>
                      <p className="text-xs text-slate-500">FYI-only, low risk</p>
                    </div>
                    <span className="text-lg font-semibold text-emerald-300">{informationalCount}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-800/70 px-4 py-3">
                    <div>
                      <p className="text-slate-300">Action required</p>
                      <p className="text-xs text-slate-500">Needs follow-up steps</p>
                    </div>
                    <span className="text-lg font-semibold text-amber-300">{actionRequiredCount}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-800/70 px-4 py-3">
                    <div>
                      <p className="text-slate-300">Urgent / penalty risk</p>
                      <p className="text-xs text-slate-500">Time-sensitive or high stakes</p>
                    </div>
                    <span className="text-lg font-semibold text-red-300">{urgentCount}</span>
                  </div>
                </div>
                <div className="mt-4 border-t border-slate-800 pt-3 text-xs text-slate-500">
                  Categorization is an automated estimate. For serious legal or tax issues, consult a
                  professional.
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
