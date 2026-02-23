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
        droppedFile.type.startsWith('text/'))) {
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
          className={`relative rounded-2xl p-8 text-center transition-all duration-200 border bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 ${
            disabled
              ? 'border-slate-800 opacity-60 cursor-not-allowed'
              : isDragging
                ? 'border-blue-500/70 shadow-[0_0_0_1px_rgba(59,130,246,0.6)] ring-2 ring-blue-500/40 scale-[1.01]'
                : 'border-slate-800 hover:border-slate-600 hover:shadow-lg cursor-pointer'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={(e) => {
            // Only trigger file input if clicking the drop area itself, not buttons
            if (e.target === e.currentTarget || e.target.closest('.drop-area-content')) {
              if (!disabled) document.getElementById('file-upload')?.click();
            }
          }}
        >
          <input
            type="file"
            id="file-upload"
            ref={(input) => {
              // Store ref for programmatic access
              if (input) input._fileInput = true;
            }}
            className="hidden"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.txt"
            disabled={disabled}
          />

          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/30 drop-area-content">
              <svg className="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>

            <div className="drop-area-content">
              <p className="text-lg font-medium text-slate-50">
                {t('upload.dropHeading')}
              </p>
              <p className="text-sm text-slate-400 mt-1">
                {t('upload.supportedFiles')}
              </p>
            </div>

            <button
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={disabled}
              className={`px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white text-sm font-medium shadow-md hover:shadow-lg hover:from-blue-400 hover:via-indigo-400 hover:to-purple-400 transition-all pointer-events-auto ${
                disabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {t('upload.chooseFile')}
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl p-6 border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/30 shrink-0">
              <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-50 truncate">{file.name}</p>
              <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button
              onClick={handleClearFile}
              className="text-slate-400 hover:text-slate-200 transition-colors p-1"
              title={t('upload.removeFile')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {quotaExceeded && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
              {t('upload.quotaExceeded', { limit: quota.limit })}
            </div>
          )}

          {requiresSignIn && (
            <div className="mb-4 rounded-lg bg-blue-500/10 border border-blue-500/30 px-4 py-3 text-sm text-blue-300">
              {t('upload.signInPrompt')}
            </div>
          )}

          {quota && !quotaExceeded && !requiresSignIn && (
            <p className="text-xs text-slate-400 mb-4">
              {t('upload.quotaRemaining', { remaining: quota.remaining, limit: quota.limit, analysisWord: quota.remaining === 1 ? t('analysis.one') : t('analysis.other') })}
            </p>
          )}

          <button
            onClick={handleAnalyze}
            disabled={quotaExceeded}
            className={`w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              quotaExceeded
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white shadow-md hover:shadow-lg hover:from-blue-400 hover:via-indigo-400 hover:to-purple-400'
            }`}
          >
            {requiresSignIn ? (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {t('upload.signInAnalyze')}
              </>
            ) : (
              t('upload.analyzeDocument')
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
