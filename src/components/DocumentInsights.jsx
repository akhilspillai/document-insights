import React from 'react';
import { useTranslation } from '../i18n/LanguageContext.jsx';

const DocumentInsights = ({ insights, loading }) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-bg-secondary rounded w-1/3"></div>
          <div className="space-y-4">
            <div className="h-4 bg-bg-secondary rounded"></div>
            <div className="h-4 bg-bg-secondary rounded w-5/6"></div>
            <div className="h-4 bg-bg-secondary rounded w-4/6"></div>
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
      className={`relative overflow-hidden rounded-2xl border p-6 bg-bg-primary border-border-base ${
        accent === 'blue'
          ? 'dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 dark:border-sky-700/60'
          : accent === 'green'
          ? 'dark:bg-gradient-to-br dark:from-slate-900 dark:via-emerald-950/40 dark:to-slate-900 dark:border-emerald-700/60'
          : accent === 'purple'
          ? 'dark:bg-gradient-to-br dark:from-slate-900 dark:via-violet-950/40 dark:to-slate-900 dark:border-violet-700/60'
          : accent === 'red'
          ? 'dark:bg-gradient-to-br dark:from-slate-900 dark:via-rose-950/40 dark:to-slate-900 dark:border-rose-700/60'
          : accent === 'orange'
          ? 'dark:bg-gradient-to-br dark:from-slate-900 dark:via-amber-950/40 dark:to-slate-900 dark:border-amber-700/60'
          : accent === 'cyan'
          ? 'dark:bg-gradient-to-br dark:from-slate-900 dark:via-cyan-950/40 dark:to-slate-900 dark:border-cyan-700/60'
          : 'dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 dark:border-slate-800'
      } ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-12 -top-24 h-48 rounded-full dark:bg-gradient-to-b dark:from-white/10 dark:to-transparent blur-3xl" />
      <div className="relative flex items-center space-x-3 mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-bg-secondary dark:bg-slate-900/60 border border-border-base dark:border-white/10 text-sky-300">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      </div>
      <div className="relative text-sm text-text-secondary leading-relaxed">
        {children}
      </div>
    </div>
  );

  const riskLevel = insights.risk_level || 'low';
  const professionalHelp = insights.professional_help_needed || 'no';

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-bg-primary border border-border-base rounded-2xl p-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-1">{t('insights.heading')}</h2>
          <p className="text-sm text-text-muted">{t('insights.subtitle')}</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs">
          <span className={`inline-flex items-center rounded-full px-3 py-1 border ${
            riskLevel === 'high'
              ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30'
              : riskLevel === 'medium'
              ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30'
          }`}>
            {riskLevel === 'high' ? t('insights.riskHigh') : riskLevel === 'medium' ? t('insights.riskMedium') : t('insights.riskLow')}
          </span>
          <span className="inline-flex items-center rounded-full bg-indigo-50 text-indigo-800 px-3 py-1 border border-indigo-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/40">
            {t('insights.notLegalAdvice')}
          </span>
        </div>
      </div>

      {/* Document Type & Issuer */}
      <InsightSection
        title={t('insights.whatDocument')}
        accent="blue"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        }
      >
        <div className="space-y-2">
          <p className="font-medium text-text-primary">{insights.document_type}</p>
          {insights.issuer && (
            <p className="text-text-muted">{t('insights.issuedBy')} <span className="text-text-secondary">{insights.issuer}</span></p>
          )}
          {insights.summary_simple && (
            <p className="mt-3 text-text-secondary">{insights.summary_simple}</p>
          )}
        </div>
      </InsightSection>

      {/* Why Received */}
      <InsightSection
        title={t('insights.whyReceived')}
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
          title={t('insights.keyDetails')}
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
                <p className="text-xs uppercase tracking-wide text-text-muted mb-2">{t('insights.amounts')}</p>
                <ul className="space-y-1">
                  {insights.key_details.amounts.map((amount, i) => (
                    <li key={i} className="text-cyan-300 font-medium">{amount}</li>
                  ))}
                </ul>
              </div>
            )}
            {insights.key_details.dates?.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wide text-text-muted mb-2">{t('insights.dates')}</p>
                <ul className="space-y-1">
                  {insights.key_details.dates.map((date, i) => (
                    <li key={i} className="text-amber-300">{date}</li>
                  ))}
                </ul>
              </div>
            )}
            {insights.key_details.reference_numbers?.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wide text-text-muted mb-2">{t('insights.referenceNumbers')}</p>
                <ul className="space-y-1">
                  {insights.key_details.reference_numbers.map((ref, i) => (
                    <li key={i} className="font-mono text-text-secondary">{ref}</li>
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
          title={t('insights.requiredActions')}
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
                  <p className="font-medium text-text-primary">{item.action}</p>
                  {item.deadline && (
                    <p className="text-xs text-amber-300">{t('insights.deadline', { deadline: item.deadline })}</p>
                  )}
                  {item.how_to_do_it && (
                    <p className="text-text-muted text-xs">{item.how_to_do_it}</p>
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
          title={t('insights.riskLevel')}
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
                ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/20 dark:text-red-200 dark:border-red-400/60'
                : riskLevel === 'medium'
                ? 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-400/60'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-400/60'
            }`}>
              {riskLevel === 'high' ? t('insights.riskHighAct') : riskLevel === 'medium' ? t('insights.riskMediumAct') : t('insights.riskLowAct')}
            </span>
          </div>
        </InsightSection>

        <InsightSection
          title={t('insights.professionalHelp')}
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
                ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/20 dark:text-red-200 dark:border-red-400/60'
                : professionalHelp === 'maybe'
                ? 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-400/60'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-400/60'
            }`}>
              {professionalHelp === 'yes'
                ? t('insights.professionalYes')
                : professionalHelp === 'maybe'
                ? t('insights.professionalMaybe')
                : t('insights.professionalNo')}
            </span>
          </div>
        </InsightSection>
      </div>

      {/* What Happens if Ignored */}
      {insights.what_happens_if_ignored && (
        <InsightSection
          title={t('insights.whatIfIgnored')}
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
          title={t('insights.missingInfo')}
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
                <span className="text-text-faint mt-1">•</span>
                <span className="text-text-muted">{item}</span>
              </li>
            ))}
          </ul>
        </InsightSection>
      )}

      {/* Confidence Notes */}
      {insights.confidence_notes && (
        <div className="bg-bg-secondary border border-border-base rounded-xl p-4 text-xs text-text-faint">
          <span className="font-medium text-text-muted">{t('insights.aiNote')}</span> {insights.confidence_notes}
        </div>
      )}
    </div>
  );
};

export default DocumentInsights;
