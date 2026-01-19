import React, { useState, useCallback } from 'react';

const DocumentUpload = ({ onFileUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('application/pdf') || 
        droppedFile.type.startsWith('application/msword') ||
        droppedFile.type.startsWith('application/vnd.openxmlformats-officedocument') ||
        droppedFile.type.startsWith('text/')) {
      setFile(droppedFile);
      onFileUpload(droppedFile);
    } else {
      alert('Please upload a valid document (PDF, Word, or text file)');
    }
  }, [onFileUpload]);

  const handleFileSelect = useCallback((e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      onFileUpload(selectedFile);
    }
  }, [onFileUpload]);

  return (
    <div className="w-full">
      <div
        className={`relative rounded-2xl p-8 text-center transition-all duration-200 border bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 ${
          isDragging
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
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileSelect}
          accept=".pdf,.doc,.docx,.txt"
        />
        
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/30">
            <svg className="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          
          <div>
            <p className="text-lg font-medium text-slate-50">
              {file ? file.name : 'Drop your document here or click to browse'}
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
    </div>
  );
};

export default DocumentUpload;
