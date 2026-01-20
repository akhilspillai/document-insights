import React from 'react';

const ProcessingStatus = ({ status, error, fileName, onRetry, onCancel }) => {
  const stages = [
    { key: 'uploading', label: 'Uploading document', icon: 'upload' },
    { key: 'extracting', label: 'Extracting text', icon: 'document' },
    { key: 'analyzing', label: 'Analyzing with AI', icon: 'brain' },
    { key: 'complete', label: 'Analysis complete', icon: 'check' },
  ];

  const currentStageIndex = stages.findIndex((s) => s.key === status);

  const getIcon = (iconType, isActive, isComplete) => {
    const baseClass = `w-6 h-6 ${isComplete ? 'text-emerald-400' : isActive ? 'text-blue-400' : 'text-slate-600'}`;

    switch (iconType) {
      case 'upload':
        return (
          <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        );
      case 'document':
        return (
          <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'brain':
        return (
          <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      case 'check':
        return (
          <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (error) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-slate-900 border border-red-700/60 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/30">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h3 className="text-xl font-semibold text-slate-50 mb-2">Something went wrong</h3>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">{error}</p>

          {fileName && (
            <p className="text-xs text-slate-500 mb-6">
              File: <span className="text-slate-400">{fileName}</span>
            </p>
          )}

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors border border-slate-700"
            >
              Go back
            </button>
            <button
              onClick={onRetry}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors"
            >
              Try again
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-xs text-slate-500">Common issues:</p>
            <ul className="mt-2 text-xs text-slate-400 space-y-1">
              <li>PDF may be scanned (image-based) without text</li>
              <li>File may be corrupted or password-protected</li>
              <li>Document may be in an unsupported language</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/30">
            <div className="relative">
              <svg className="w-8 h-8 text-blue-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-slate-50 mb-2">Processing your document</h3>
          {fileName && (
            <p className="text-sm text-slate-400">{fileName}</p>
          )}
        </div>

        {/* Progress stages */}
        <div className="space-y-4">
          {stages.map((stage, index) => {
            const isComplete = index < currentStageIndex;
            const isActive = index === currentStageIndex;
            const isPending = index > currentStageIndex;

            return (
              <div
                key={stage.key}
                className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-blue-500/10 border border-blue-500/30'
                    : isComplete
                    ? 'bg-emerald-500/5 border border-emerald-500/20'
                    : 'bg-slate-800/50 border border-slate-800'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isActive
                      ? 'bg-blue-500/20'
                      : isComplete
                      ? 'bg-emerald-500/20'
                      : 'bg-slate-800'
                  }`}
                >
                  {isActive ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-400 border-t-transparent" />
                  ) : isComplete ? (
                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    getIcon(stage.icon, isActive, isComplete)
                  )}
                </div>
                <div className="flex-1">
                  <p
                    className={`font-medium ${
                      isActive
                        ? 'text-blue-300'
                        : isComplete
                        ? 'text-emerald-300'
                        : 'text-slate-500'
                    }`}
                  >
                    {stage.label}
                  </p>
                  {isActive && (
                    <p className="text-xs text-slate-400 mt-0.5">Please wait...</p>
                  )}
                </div>
                {isComplete && (
                  <span className="text-xs text-emerald-400 font-medium">Done</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Cancel button */}
        <div className="mt-8 text-center">
          <button
            onClick={onCancel}
            className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Info */}
        <div className="mt-6 pt-6 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-500">
            This usually takes 10-30 seconds depending on document size
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProcessingStatus;
