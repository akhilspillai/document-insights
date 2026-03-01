import React from 'react';
import { useTranslation } from '../i18n/LanguageContext.jsx';

const ProcessingStatus = ({ status, error, fileName, onRetry, onCancel }) => {
  const { t } = useTranslation();

  const stages = [
    { key: 'uploading',  label: t('processing.uploading'),  icon: 'upload'   },
    { key: 'extracting', label: t('processing.extracting'), icon: 'document' },
    { key: 'analyzing',  label: t('processing.analyzing'),  icon: 'brain'    },
    { key: 'complete',   label: t('processing.complete'),   icon: 'check'    },
  ];

  const currentStageIndex = stages.findIndex((s) => s.key === status);

  /* ── Inline SVG icons ─────────────────────────────────────────── */
  const getIcon = (iconType, isActive, isComplete) => {
    const cls = `w-5 h-5 ${isComplete ? 'text-emerald-400' : isActive ? 'text-accent' : 'text-text-faint'}`;
    switch (iconType) {
      case 'upload':
        return (
          <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        );
      case 'document':
        return (
          <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'brain':
        return (
          <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      case 'check':
        return (
          <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  /* ── Error state ──────────────────────────────────────────────── */
  if (error) {
    return (
      <div className="w-full max-w-lg mx-auto">
        <div className="rounded-2xl border border-red-500/20 bg-bg-primary card-glow p-8 text-center">
          <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h3 className="text-lg font-semibold text-text-primary mb-2">{t('processing.errorHeading')}</h3>
          <p className="text-sm text-text-muted mb-5 max-w-sm mx-auto leading-relaxed">{error}</p>

          {fileName && (
            <p className="text-xs text-text-faint mb-5">
              {t('processing.errorFile')} <span className="text-text-muted font-medium">{fileName}</span>
            </p>
          )}

          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2 rounded-xl bg-bg-secondary text-text-secondary text-sm font-medium border border-border-base hover:bg-bg-elevated transition-colors"
            >
              {t('processing.goBack')}
            </button>
            <button
              type="button"
              onClick={onRetry}
              className="px-5 py-2 rounded-xl bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity shadow-lg shadow-accent/20"
            >
              {t('processing.tryAgain')}
            </button>
          </div>

          <div className="mt-7 pt-5 border-t border-border-base text-left">
            <p className="text-xs font-medium text-text-muted mb-2">{t('processing.commonIssues')}</p>
            <ul className="space-y-1">
              {[t('processing.issue1'), t('processing.issue2'), t('processing.issue3')].map((issue, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-text-faint">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-text-faint flex-shrink-0" />
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  /* ── Processing state ─────────────────────────────────────────── */
  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="rounded-2xl border border-border-base bg-bg-primary card-glow p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-accent/10 flex items-center justify-center border border-accent/20 relative">
            {/* Pulsing ring */}
            <div className="absolute inset-0 rounded-2xl border border-accent/20 animate-ping opacity-30" />
            <svg className="w-7 h-7 text-accent relative" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-text-primary">{t('processing.heading')}</h3>
          {fileName && (
            <p className="text-xs text-text-faint mt-1 truncate max-w-xs mx-auto">{fileName}</p>
          )}
        </div>

        {/* Stage list */}
        <div className="space-y-2.5">
          {stages.map((stage, index) => {
            const isComplete = index < currentStageIndex;
            const isActive   = index === currentStageIndex;
            const isPending  = index > currentStageIndex;

            return (
              <div
                key={stage.key}
                className={[
                  'flex items-center gap-3.5 px-4 py-3 rounded-xl border transition-all duration-300',
                  isActive
                    ? 'bg-accent/8 border-accent/25'
                    : isComplete
                    ? 'bg-emerald-500/5 border-emerald-500/15'
                    : 'bg-bg-secondary border-border-base opacity-50',
                ].join(' ')}
              >
                {/* Stage icon circle */}
                <div className={[
                  'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                  isActive   ? 'bg-accent/15'       : '',
                  isComplete ? 'bg-emerald-500/15'  : '',
                  isPending  ? 'bg-bg-elevated'      : '',
                ].join(' ')}>
                  {isActive ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                  ) : isComplete ? (
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    getIcon(stage.icon, isActive, isComplete)
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={[
                    'text-sm font-medium',
                    isActive   ? 'text-accent'        : '',
                    isComplete ? 'text-emerald-400'   : '',
                    isPending  ? 'text-text-faint'    : '',
                  ].join(' ')}>
                    {stage.label}
                  </p>
                  {isActive && (
                    <p className="text-xs text-text-faint mt-0.5">{t('processing.pleaseWait')}</p>
                  )}
                </div>

                {isComplete && (
                  <span className="text-[11px] font-semibold text-emerald-400 flex-shrink-0">
                    {t('processing.done')}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Cancel */}
        <div className="mt-7 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-text-faint hover:text-text-muted transition-colors"
          >
            {t('processing.cancel')}
          </button>
          <p className="text-xs text-text-faint">{t('processing.timeEstimate')}</p>
        </div>
      </div>
    </div>
  );
};

export default ProcessingStatus;
