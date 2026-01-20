import React from 'react';

const DocumentInsights = ({ insights, loading }) => {
  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-700 rounded w-1/3"></div>
          <div className="space-y-4">
            <div className="h-4 bg-slate-700 rounded"></div>
            <div className="h-4 bg-slate-700 rounded w-5/6"></div>
            <div className="h-4 bg-slate-700 rounded w-4/6"></div>
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
          : accent === 'cyan'
          ? 'from-slate-900 via-cyan-950/40 to-slate-900 border-cyan-700/60'
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

  const riskLevel = insights.risk_level || 'low';
  const professionalHelp = insights.professional_help_needed || 'no';

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-50 mb-1">Document Analysis</h2>
          <p className="text-sm text-slate-400">Here's your plain-English summary and what to do next.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs">
          <span className={`inline-flex items-center rounded-full px-3 py-1 border ${
            riskLevel === 'high'
              ? 'bg-red-500/10 text-red-300 border-red-500/30'
              : riskLevel === 'medium'
              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
          }`}>
            {riskLevel === 'high' ? 'High Risk' : riskLevel === 'medium' ? 'Medium Risk' : 'Low Risk'}
          </span>
          <span className="inline-flex items-center rounded-full bg-sky-500/10 text-sky-300 px-3 py-1 border border-sky-500/40">
            Not legal advice
          </span>
        </div>
      </div>

      {/* Document Type & Issuer */}
      <InsightSection
        title="What this document is"
        accent="blue"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        }
      >
        <div className="space-y-2">
          <p className="font-medium text-slate-50">{insights.document_type}</p>
          {insights.issuer && (
            <p className="text-slate-400">Issued by: <span className="text-slate-200">{insights.issuer}</span></p>
          )}
          {insights.summary_simple && (
            <p className="mt-3 text-slate-300">{insights.summary_simple}</p>
          )}
        </div>
      </InsightSection>

      {/* Why Received */}
      <InsightSection
        title="Why you received it"
        accent="green"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      >
        <p>{insights.why_received}</p>
      </InsightSection>

      {/* Key Details */}
      {insights.key_details && (
        (insights.key_details.amounts?.length > 0 ||
         insights.key_details.dates?.length > 0 ||
         insights.key_details.reference_numbers?.length > 0) && (
        <InsightSection
          title="Key Details"
          accent="cyan"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {insights.key_details.amounts?.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">Amounts</p>
                <ul className="space-y-1">
                  {insights.key_details.amounts.map((amount, i) => (
                    <li key={i} className="text-cyan-300 font-medium">{amount}</li>
                  ))}
                </ul>
              </div>
            )}
            {insights.key_details.dates?.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">Important Dates</p>
                <ul className="space-y-1">
                  {insights.key_details.dates.map((date, i) => (
                    <li key={i} className="text-amber-300">{date}</li>
                  ))}
                </ul>
              </div>
            )}
            {insights.key_details.reference_numbers?.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">Reference Numbers</p>
                <ul className="space-y-1">
                  {insights.key_details.reference_numbers.map((ref, i) => (
                    <li key={i} className="font-mono text-slate-300">{ref}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </InsightSection>
      ))}

      {/* Required Actions */}
      {insights.required_actions?.length > 0 && (
        <InsightSection
          title="What you must do (step-by-step)"
          accent="purple"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          }
        >
          <ol className="space-y-4">
            {insights.required_actions.map((item, index) => (
              <li key={index} className="flex space-x-3">
                <span className="flex-shrink-0 w-7 h-7 bg-violet-500/20 text-violet-200 rounded-full flex items-center justify-center text-sm font-medium border border-violet-400/40">
                  {index + 1}
                </span>
                <div className="flex-1 space-y-1">
                  <p className="font-medium text-slate-50">{item.action}</p>
                  {item.deadline && (
                    <p className="text-xs text-amber-300">Deadline: {item.deadline}</p>
                  )}
                  {item.how_to_do_it && (
                    <p className="text-slate-400 text-xs">{item.how_to_do_it}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </InsightSection>
      )}

      {/* Risk & Professional Help */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InsightSection
          title="Risk Level"
          accent="red"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          className={riskLevel === 'high' ? 'ring-1 ring-red-500/40 shadow-[0_0_40px_rgba(248,113,113,0.25)]' : ''}
        >
          <div className="space-y-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              riskLevel === 'high'
                ? 'bg-red-500/20 text-red-200 border border-red-400/60'
                : riskLevel === 'medium'
                ? 'bg-amber-500/15 text-amber-200 border border-amber-400/60'
                : 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/60'
            }`}>
              {riskLevel === 'high' ? 'High Risk - Act Now' : riskLevel === 'medium' ? 'Medium Risk - Take Action Soon' : 'Low Risk - For Your Information'}
            </span>
          </div>
        </InsightSection>

        <InsightSection
          title="Professional Help Needed"
          accent="indigo"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        >
          <div className="space-y-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              professionalHelp === 'yes'
                ? 'bg-red-500/20 text-red-200 border border-red-400/60'
                : professionalHelp === 'maybe'
                ? 'bg-amber-500/15 text-amber-200 border border-amber-400/60'
                : 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/60'
            }`}>
              {professionalHelp === 'yes'
                ? 'Yes - Consult a CA/Lawyer'
                : professionalHelp === 'maybe'
                ? 'Maybe - Consider Professional Help'
                : 'No - You Can Handle This'}
            </span>
          </div>
        </InsightSection>
      </div>

      {/* What Happens if Ignored */}
      {insights.what_happens_if_ignored && (
        <InsightSection
          title="What happens if you ignore it"
          accent="orange"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
          className={riskLevel === 'high' ? 'ring-1 ring-amber-500/40 shadow-[0_0_40px_rgba(251,191,36,0.25)]' : ''}
        >
          <p>{insights.what_happens_if_ignored}</p>
        </InsightSection>
      )}

      {/* Missing/Unclear Info */}
      {insights.missing_or_unclear_info?.length > 0 && (
        <InsightSection
          title="Missing or Unclear Information"
          accent="slate"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        >
          <ul className="space-y-2">
            {insights.missing_or_unclear_info.map((item, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-slate-500 mt-1">•</span>
                <span className="text-slate-400">{item}</span>
              </li>
            ))}
          </ul>
        </InsightSection>
      )}

      {/* Confidence Notes */}
      {insights.confidence_notes && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-xs text-slate-500">
          <span className="font-medium text-slate-400">AI Note:</span> {insights.confidence_notes}
        </div>
      )}
    </div>
  );
};

export default DocumentInsights;
