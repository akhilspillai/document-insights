import React from 'react';
import { useTranslation } from '../i18n/LanguageContext.jsx';

/* ─── Accent palette per section ─────────────────────────────────────
   Each accent drives: border color, background tint, icon color.
   Values are Tailwind-compatible inline CSS variables / class sets.
──────────────────────────────────────────────────────────────────── */
const ACCENT_MAP = {
  blue:   { border: 'border-sky-500/20',    bg: 'bg-sky-500/5',    icon: 'text-sky-400',    blob: 'bg-sky-500/10'    },
  green:  { border: 'border-emerald-500/20',bg: 'bg-emerald-500/5',icon: 'text-emerald-400',blob: 'bg-emerald-500/10'},
  purple: { border: 'border-violet-500/20', bg: 'bg-violet-500/5', icon: 'text-violet-400', blob: 'bg-violet-500/10' },
  red:    { border: 'border-red-500/20',    bg: 'bg-red-500/5',    icon: 'text-red-400',    blob: 'bg-red-500/10'    },
  orange: { border: 'border-amber-500/20',  bg: 'bg-amber-500/5',  icon: 'text-amber-400',  blob: 'bg-amber-500/10'  },
  cyan:   { border: 'border-cyan-500/20',   bg: 'bg-cyan-500/5',   icon: 'text-cyan-400',   blob: 'bg-cyan-500/10'   },
  indigo: { border: 'border-indigo-500/20', bg: 'bg-indigo-500/5', icon: 'text-indigo-400', blob: 'bg-indigo-500/10' },
  slate:  { border: 'border-border-base',   bg: 'bg-bg-secondary', icon: 'text-text-faint',  blob: 'bg-bg-elevated'  },
};

/* ─── InsightSection card ─────────────────────────────────────────── */
const InsightSection = ({ title, icon, accent = 'slate', children, className = '' }) => {
  const a = ACCENT_MAP[accent] ?? ACCENT_MAP.slate;

  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-bg-primary card-glow ${a.border} ${className}`}>
      {/* Decorative top-right glow blob */}
      <div className={`pointer-events-none absolute -top-16 -right-16 w-40 h-40 rounded-full ${a.blob} blur-3xl opacity-60`} />

      <div className="relative p-5 md:p-6">
        {/* Section header */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${a.border} bg-bg-secondary ${a.icon}`}>
            {icon}
          </div>
          <h3 className="text-sm font-semibold text-text-primary tracking-tight">{title}</h3>
        </div>

        <div className="text-sm text-text-secondary leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
};

/* ─── Risk badge ──────────────────────────────────────────────────── */
const RiskBadge = ({ level, labels }) => {
  const style = {
    high:   'bg-red-500/10 text-red-400 border-red-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    low:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  }[level] ?? 'bg-bg-secondary text-text-faint border-border-base';

  return (
    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold border ${style}`}>
      {labels[level] ?? level}
    </span>
  );
};

/* ─── Main component ──────────────────────────────────────────────── */
const DocumentInsights = ({ insights, loading }) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-4 animate-pulse">
        <div className="h-16 bg-bg-secondary rounded-2xl" />
        <div className="h-32 bg-bg-secondary rounded-2xl" />
        <div className="h-24 bg-bg-secondary rounded-2xl" />
      </div>
    );
  }

  if (!insights) return null;

  const riskLevel       = insights.risk_level || 'low';
  const professionalHelp = insights.professional_help_needed || 'no';

  const riskLabels = {
    high:   t('insights.riskHigh'),
    medium: t('insights.riskMedium'),
    low:    t('insights.riskLow'),
  };

  const riskActionLabels = {
    high:   t('insights.riskHighAct'),
    medium: t('insights.riskMediumAct'),
    low:    t('insights.riskLowAct'),
  };

  const helpStyle = {
    yes:   'bg-red-500/10 text-red-400 border-red-500/20',
    maybe: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    no:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  }[professionalHelp] ?? 'bg-bg-secondary text-text-faint border-border-base';

  const helpLabel = {
    yes:   t('insights.professionalYes'),
    maybe: t('insights.professionalMaybe'),
    no:    t('insights.professionalNo'),
  }[professionalHelp] ?? professionalHelp;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5">

      {/* ── Results header bar ──────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-border-base bg-bg-primary card-glow p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Gradient blob */}
        <div className="pointer-events-none absolute -top-20 -left-12 w-48 h-48 rounded-full bg-accent/8 blur-3xl" />

        <div className="relative">
          <h2 className="text-xl font-bold text-text-primary tracking-tight">{t('insights.heading')}</h2>
          <p className="text-xs text-text-faint mt-0.5">{t('insights.subtitle')}</p>
        </div>

        <div className="relative flex items-center gap-2 flex-wrap">
          <RiskBadge level={riskLevel} labels={riskLabels} />
          <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold border bg-bg-secondary text-text-muted border-border-base">
            {t('insights.notLegalAdvice')}
          </span>
        </div>
      </div>

      {/* ── Document type & issuer ─────────────────────────────── */}
      <InsightSection
        title={t('insights.whatDocument')}
        accent="blue"
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        }
      >
        <div className="space-y-2">
          <p className="font-semibold text-text-primary text-base">{insights.document_type}</p>
          {insights.issuer && (
            <p className="text-text-muted text-xs">
              {t('insights.issuedBy')}{' '}
              <span className="text-text-secondary font-medium">{insights.issuer}</span>
            </p>
          )}
          {insights.summary_simple && (
            <p className="mt-3 text-text-muted leading-relaxed">{insights.summary_simple}</p>
          )}
        </div>
      </InsightSection>

      {/* ── Why received ──────────────────────────────────────── */}
      <InsightSection
        title={t('insights.whyReceived')}
        accent="green"
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      >
        <p className="text-text-muted">{insights.why_received}</p>
      </InsightSection>

      {/* ── Key details ───────────────────────────────────────── */}
      {insights.key_details &&
        (insights.key_details.amounts?.length > 0 ||
          insights.key_details.dates?.length > 0 ||
          insights.key_details.reference_numbers?.length > 0) && (
        <InsightSection
          title={t('insights.keyDetails')}
          accent="cyan"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {insights.key_details.amounts?.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-text-faint mb-2">{t('insights.amounts')}</p>
                <ul className="space-y-1.5">
                  {insights.key_details.amounts.map((amount, i) => (
                    <li key={i} className="text-cyan-400 font-semibold text-sm">{amount}</li>
                  ))}
                </ul>
              </div>
            )}
            {insights.key_details.dates?.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-text-faint mb-2">{t('insights.dates')}</p>
                <ul className="space-y-1.5">
                  {insights.key_details.dates.map((date, i) => (
                    <li key={i} className="text-amber-400 font-medium text-sm">{date}</li>
                  ))}
                </ul>
              </div>
            )}
            {insights.key_details.reference_numbers?.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-text-faint mb-2">{t('insights.referenceNumbers')}</p>
                <ul className="space-y-1.5">
                  {insights.key_details.reference_numbers.map((ref, i) => (
                    <li key={i} className="font-mono text-text-secondary text-xs bg-bg-secondary rounded px-2 py-0.5 inline-block">{ref}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </InsightSection>
      )}

      {/* ── Required actions ──────────────────────────────────── */}
      {insights.required_actions?.length > 0 && (
        <InsightSection
          title={t('insights.requiredActions')}
          accent="purple"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          }
        >
          <ol className="space-y-4">
            {insights.required_actions.map((item, index) => (
              <li key={index} className="flex gap-3.5">
                <span className="flex-shrink-0 w-6 h-6 bg-violet-500/15 text-violet-300 rounded-full flex items-center justify-center text-xs font-bold border border-violet-500/25 mt-0.5">
                  {index + 1}
                </span>
                <div className="flex-1 space-y-1.5">
                  <p className="font-semibold text-text-primary text-sm">{item.action}</p>
                  {item.deadline && (
                    <div className="inline-flex items-center gap-1.5 text-[11px] text-amber-400 font-medium">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {t('insights.deadline', { deadline: item.deadline })}
                    </div>
                  )}
                  {item.how_to_do_it && (
                    <p className="text-text-faint text-xs leading-relaxed">{item.how_to_do_it}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </InsightSection>
      )}

      {/* ── Risk + Professional help (2-col) ──────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <InsightSection
          title={t('insights.riskLevel')}
          accent="red"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          className={riskLevel === 'high' ? 'ring-1 ring-red-500/30 shadow-[0_0_48px_-8px_rgba(239,68,68,0.25)]' : ''}
        >
          <RiskBadge level={riskLevel} labels={riskActionLabels} />
        </InsightSection>

        <InsightSection
          title={t('insights.professionalHelp')}
          accent="indigo"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        >
          <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold border ${helpStyle}`}>
            {helpLabel}
          </span>
        </InsightSection>
      </div>

      {/* ── What happens if ignored ────────────────────────────── */}
      {insights.what_happens_if_ignored && (
        <InsightSection
          title={t('insights.whatIfIgnored')}
          accent="orange"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
          className={riskLevel === 'high' ? 'ring-1 ring-amber-500/25 shadow-[0_0_48px_-8px_rgba(245,158,11,0.20)]' : ''}
        >
          <p className="text-text-muted">{insights.what_happens_if_ignored}</p>
        </InsightSection>
      )}

      {/* ── Missing/unclear info ───────────────────────────────── */}
      {insights.missing_or_unclear_info?.length > 0 && (
        <InsightSection
          title={t('insights.missingInfo')}
          accent="slate"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        >
          <ul className="space-y-2">
            {insights.missing_or_unclear_info.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="mt-2 w-1 h-1 rounded-full bg-text-faint flex-shrink-0" />
                <span className="text-text-faint text-xs leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </InsightSection>
      )}

      {/* ── AI confidence note ─────────────────────────────────── */}
      {insights.confidence_notes && (
        <div className="rounded-xl border border-border-base bg-bg-secondary px-4 py-3 text-xs text-text-faint leading-relaxed">
          <span className="font-semibold text-text-muted">{t('insights.aiNote')}</span>{' '}
          {insights.confidence_notes}
        </div>
      )}
    </div>
  );
};

export default DocumentInsights;
