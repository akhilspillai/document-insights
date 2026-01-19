import React from 'react';

const DocumentInsights = ({ insights, loading }) => {
  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!insights) {
    return null;
  }

  const InsightSection = ({ title, icon, accent, children, className = "" }) => (
    <div
      className={`relative overflow-hidden rounded-2xl border p-6 bg-gradient-to-br ${
        accent === 'blue'
          ? 'from-slate-900 via-slate-950 to-slate-900 border-sky-700/60'
          : accent === 'green'
          ? 'from-slate-900 via-emerald-950/40 to-slate-900 border-emerald-700/60'
          : accent === 'purple'
          ? 'from-slate-900 via-violet-950/40 to-slate-900 border-violet-700/60'
          : accent === 'red'
          ? 'from-slate-900 via-rose-950/40 to-slate-900 border-rose-700/60'
          : accent === 'orange'
          ? 'from-slate-900 via-amber-950/40 to-slate-900 border-amber-700/60'
          : 'from-slate-900 via-slate-950 to-slate-900 border-slate-800'
      } ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-12 -top-24 h-48 rounded-full bg-gradient-to-b from-white/10 to-transparent blur-3xl" />
      <div className="relative flex items-center space-x-3 mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-900/60 border border-white/10 text-sky-300">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-slate-50">{title}</h3>
      </div>
      <div className="relative text-sm text-slate-200 leading-relaxed">
        {children}
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-50 mb-1">Document analysis</h2>
          <p className="text-sm text-slate-400">Here’s your plain-English summary and what to do next.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs">
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-300 px-3 py-1 border border-emerald-500/30">
            Live AI summary
          </span>
          <span className="inline-flex items-center rounded-full bg-sky-500/10 text-sky-300 px-3 py-1 border border-sky-500/40">
            Not legal advice
          </span>
        </div>
      </div>

      <InsightSection 
        title="What this document is"
        accent="blue"
        icon={
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        }
      >
        <p>{insights.documentType}</p>
      </InsightSection>

      <InsightSection 
        title="Why you received it"
        accent="green"
        icon={
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      >
        <p>{insights.reason}</p>
      </InsightSection>

      <InsightSection 
        title="What you must do (step-by-step)"
        accent="purple"
        icon={
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        }
      >
        <ol className="space-y-3">
          {insights.actions.map((action, index) => (
            <li key={index} className="flex space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-violet-500/20 text-violet-200 rounded-full flex items-center justify-center text-sm font-medium border border-violet-400/40">
                {index + 1}
              </span>
              <span>{action}</span>
            </li>
          ))}
        </ol>
      </InsightSection>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InsightSection 
          title="Deadline"
          accent="red"
          icon={
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          className={insights.urgency === 'high' ? 'ring-1 ring-red-500/40 shadow-[0_0_40px_rgba(248,113,113,0.25)]' : ''}
        >
          <div className="space-y-2">
            <p className="font-medium text-slate-50">{insights.deadline}</p>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              insights.urgency === 'high' 
                ? 'bg-red-500/20 text-red-200 border border-red-400/60' 
                : insights.urgency === 'medium'
                ? 'bg-amber-500/15 text-amber-200 border border-amber-400/60'
                : 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/60'
            }`}>
              {insights.urgency === 'high' ? 'Urgent' : insights.urgency === 'medium' ? 'Moderate' : 'Low Priority'}
            </span>
          </div>
        </InsightSection>

        <InsightSection 
          title="Legal assistance needed"
          accent="indigo"
          icon={
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        >
          <div className="space-y-2">
            <p>{insights.legalAdvice}</p>
            {insights.lawyerNeeded && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-200 border border-indigo-400/60">
                Legal consultation recommended
              </span>
            )}
          </div>
        </InsightSection>
      </div>

      <InsightSection 
        title="What happens if you ignore it"
        accent="orange"
        icon={
          <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        }
        className={insights.consequences.severity === 'high' ? 'ring-1 ring-amber-500/40 shadow-[0_0_40px_rgba(251,191,36,0.25)]' : ''}
      >
        <div className="space-y-3">
          <p className="font-medium text-slate-50">Potential consequences:</p>
          <ul className="space-y-2">
            {insights.consequences.items.map((consequence, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-amber-400 mt-1">•</span>
                <span>{consequence}</span>
              </li>
            ))}
          </ul>
        </div>
      </InsightSection>
    </div>
  );
};

export default DocumentInsights;
