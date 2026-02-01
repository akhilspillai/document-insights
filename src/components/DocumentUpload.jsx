import React, { useState, useCallback } from 'react';

const DocumentUpload = ({ onFileSelect, onAnalyze, disabled = false, quota }) => {
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
      alert('Please upload a valid document (PDF, Word, or text file)');
    }
  }, [selectFile, disabled]);

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
                : 'border-slate-800 hover:border-slate-600 hover:shadow-lg'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-upload"
            className={`absolute inset-0 w-full h-full opacity-0 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.txt"
            disabled={disabled}
          />

          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/30">
              <svg className="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>

            <div>
              <p className="text-lg font-medium text-slate-50">
                Drop your document here or click to browse
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Supports <span className="text-blue-300">PDF</span>, <span className="text-indigo-300">Word</span>, and <span className="text-emerald-300">text</span> files
              </p>
            </div>

            <button className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white text-sm font-medium shadow-md hover:shadow-lg hover:from-blue-400 hover:via-indigo-400 hover:to-purple-400 transition-all">
              Choose a file
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
              title="Remove file"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {quotaExceeded && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
              You&apos;ve reached the limit of {quota.limit} free analyses.
            </div>
          )}

          {quota && !quotaExceeded && (
            <p className="text-xs text-slate-400 mb-4">
              {quota.remaining} of {quota.limit} free {quota.remaining === 1 ? 'analysis' : 'analyses'} remaining
            </p>
          )}

          <button
            onClick={handleAnalyze}
            disabled={quotaExceeded}
            className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
              quotaExceeded
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white shadow-md hover:shadow-lg hover:from-blue-400 hover:via-indigo-400 hover:to-purple-400'
            }`}
          >
            Analyze Document
          </button>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
