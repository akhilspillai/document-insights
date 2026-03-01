import React, { useState, useCallback } from 'react';
import { useTranslation } from '../i18n/LanguageContext.jsx';

const DocumentUpload = ({ onFileSelect, onAnalyze, disabled = false, quota, requiresSignIn = false }) => {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const selectFile = useCallback((f) => {
    setFile(f);
    if (onFileSelect) onFileSelect(f);
  }, [onFileSelect]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type.startsWith('application/pdf') ||
        droppedFile.type.startsWith('application/msword') ||
        droppedFile.type.startsWith('application/vnd.openxmlformats-officedocument') ||
        droppedFile.type.startsWith('text/') ||
        droppedFile.type === 'image/jpeg' ||
        droppedFile.type === 'image/png')) {
      selectFile(droppedFile);
    } else {
      alert(t('upload.invalidFile'));
    }
  }, [selectFile, disabled, t]);

  const handleFileSelect = useCallback((e) => {
    if (disabled) return;
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      selectFile(selectedFile);
    }
  }, [selectFile, disabled]);

  const handleAnalyze = () => {
    if (file && onAnalyze) {
      onAnalyze(file);
    }
  };

  const handleClearFile = () => {
    setFile(null);
    if (onFileSelect) onFileSelect(null);
  };

  const quotaExceeded = quota && quota.remaining <= 0;

  return (
    <div className="w-full">
      {!file ? (
        <div
          className={[
            'relative rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200 cursor-pointer select-none',
            disabled
              ? 'border-border-base bg-bg-secondary opacity-50 cursor-not-allowed'
              : isDragging
              ? 'border-accent bg-accent-dim scale-[1.01] shadow-[0_0_0_4px_var(--accent-glow)]'
              : 'border-border-base bg-bg-secondary hover:border-border-strong hover:bg-bg-elevated',
          ].join(' ')}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={(e) => {
            if (e.target === e.currentTarget || e.target.closest('.drop-area-content')) {
              if (!disabled) document.getElementById('file-upload')?.click();
            }
          }}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
            disabled={disabled}
          />

          <div className="flex flex-col items-center gap-4 drop-area-content">
            {/* Icon container */}
            <div className={[
              'w-14 h-14 rounded-xl flex items-center justify-center border transition-colors duration-200',
              isDragging
                ? 'bg-accent/15 border-accent/40'
                : 'bg-bg-elevated border-border-base',
            ].join(' ')}>
              <svg
                className={['w-7 h-7 transition-colors', isDragging ? 'text-accent' : 'text-text-faint'].join(' ')}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>

            <div className="drop-area-content">
              <p className="text-sm font-semibold text-text-primary">
                {t('upload.dropHeading')}
              </p>
              <p className="text-xs text-text-faint mt-1">
                {t('upload.supportedFiles')}
              </p>
            </div>

            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); document.getElementById('file-upload')?.click(); }}
              disabled={disabled}
              className={[
                'px-5 py-2 rounded-lg text-xs font-semibold border transition-all duration-200 pointer-events-auto',
                disabled
                  ? 'opacity-40 cursor-not-allowed bg-bg-elevated border-border-base text-text-faint'
                  : 'bg-accent text-white border-transparent shadow-md shadow-accent/20 hover:opacity-90 active:opacity-80',
              ].join(' ')}
            >
              {t('upload.chooseFile')}
            </button>
          </div>
        </div>
      ) : (
        /* ── File selected state ─────────────────────────────── */
        <div className="rounded-xl border border-border-base bg-bg-secondary p-5 space-y-4">
          {/* File info row */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center border border-accent/20 flex-shrink-0">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text-primary truncate">{file.name}</p>
              <p className="text-xs text-text-faint">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button
              type="button"
              onClick={handleClearFile}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-text-faint hover:text-text-primary hover:bg-bg-elevated transition-all"
              title={t('upload.removeFile')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Status messages */}
          {quotaExceeded && (
            <div className="rounded-lg bg-red-500/8 border border-red-500/20 px-3.5 py-2.5 text-xs text-red-400">
              {t('upload.quotaExceeded', { limit: quota.limit })}
            </div>
          )}

          {requiresSignIn && (
            <div className="rounded-lg bg-accent/8 border border-accent/20 px-3.5 py-2.5 text-xs text-accent">
              {t('upload.signInPrompt')}
            </div>
          )}

          {quota && !quotaExceeded && !requiresSignIn && (
            <p className="text-xs text-text-faint">
              {t('upload.quotaRemaining', {
                remaining: quota.remaining,
                limit: quota.limit,
                analysisWord: quota.remaining === 1 ? t('analysis.one') : t('analysis.other'),
              })}
            </p>
          )}

          {/* CTA button */}
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={quotaExceeded}
            className={[
              'w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2',
              quotaExceeded
                ? 'bg-bg-elevated text-text-faint cursor-not-allowed border border-border-base'
                : 'bg-accent text-white shadow-lg shadow-accent/20 hover:opacity-90 active:opacity-80',
            ].join(' ')}
          >
            {requiresSignIn ? (
              <>
                {/* Google G icon */}
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {t('upload.signInAnalyze')}
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                {t('upload.analyzeDocument')}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
