import { useState, useEffect } from 'react'
import DocumentUpload from './components/DocumentUpload'
import DocumentInsights from './components/DocumentInsights'
import AuthMenu from './components/AuthMenu'
import { analyzeDocument } from './api/documentAnalysis'

function categorizeInsights(insights) {
  if (!insights) return 'Informational'

  if (insights.urgency === 'high' || insights.consequences?.severity === 'high') {
    return 'Urgent / penalty risk'
  }

  if (Array.isArray(insights.actions) && insights.actions.length > 0) {
    return 'Action required'
  }

  return 'Informational'
}

function App() {
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [uploads, setUploads] = useState([])
  const [totalAnalyzed, setTotalAnalyzed] = useState(0)

  // Fetch initial count of analyzed documents from backend
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/documents/count')
        if (!res.ok) return
        const data = await res.json()
        if (typeof data.count === 'number') {
          setTotalAnalyzed(data.count)
        }
      } catch (err) {
        console.error('Failed to fetch analyzed documents count:', err)
      }
    }

    fetchCount()
  }, [])

  const handleFileUpload = async (file) => {
    setLoading(true)
    setError(null)
    setInsights(null)

    try {
      const analysis = await analyzeDocument(file)
      setInsights(analysis)

      const category = categorizeInsights(analysis)
      const newEntry = {
        id: Date.now(),
        name: file.name,
        uploadedAt: new Date().toISOString(),
        category,
        urgency: analysis.urgency,
      }

      setUploads((prev) => [newEntry, ...prev].slice(0, 20))

      // Notify backend that a document has been analyzed and update total count
      try {
        const res = await fetch('http://localhost:4000/api/documents/analyzed', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        if (res.ok) {
          const data = await res.json()
          if (typeof data.count === 'number') {
            setTotalAnalyzed(data.count)
          }
        }
      } catch (err) {
        console.error('Failed to update analyzed documents count:', err)
      }
    } catch (err) {
      setError('Failed to analyze document. Please try again.')
      console.error('Analysis error:', err)
    } finally {
      setLoading(false)
    }
  }

  const informationalCount = uploads.filter((u) => u.category === 'Informational').length
  const actionRequiredCount = uploads.filter((u) => u.category === 'Action required').length
  const urgentCount = uploads.filter((u) => u.category === 'Urgent / penalty risk').length

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

        <main className="grid grid-cols-1 md:grid-cols-[2fr,1.2fr] gap-6 items-start">
          {/* Left column: upload + history */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-slate-50 mb-2">Upload a document</h2>
              <p className="text-sm text-slate-400 mb-4">
                Drag and drop or browse a file to see a plain-language breakdown of what it means.
              </p>
              <DocumentUpload onFileUpload={handleFileUpload} />
              {loading && (
                <div className="mt-4 flex items-center space-x-2 text-sm text-slate-300">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400" />
                  <span>Analyzing your document...</span>
                </div>
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

            {error && (
              <div className="bg-red-900/40 border border-red-700/60 rounded-2xl p-4 text-sm text-red-100">
                <div className="flex items-start gap-2">
                  <svg
                    className="w-4 h-4 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{error}</span>
                </div>
              </div>
            )}
          </aside>
        </main>

        {insights && (
          <div className="mt-6">
            <DocumentInsights insights={insights} loading={loading} />

            <div className="text-center mt-8">
              <button
                onClick={() => {
                  setInsights(null)
                  setError(null)
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Analyze Another Document
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
