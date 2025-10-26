import React, { useState, useRef } from 'react';
import Icon from './ui/Icon.jsx';

function FileUpload({ accept, maxSize, onUpload, currentFile, onRemove, fileName }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (file) => {
    if (!file) return;
    if (file.size > maxSize) {
      alert(`File size exceeds the maximum limit of ${maxSize / (1024 * 1024)}MB.`);
      return;
    }
    setUploading(true);
    try {
      await onUpload(file);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  return (
    <div style={{ marginTop: 8 }}>
      {!currentFile ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
          style={{
            border: `2px dashed ${dragOver ? '#2563eb' : '#d1d5db'}`,
            borderRadius: 8,
            padding: '20px',
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: dragOver ? '#f0f9ff' : '#fafafa',
            transition: 'all 0.2s'
          }}
        >
          {uploading ? (
            <div>
              <div style={{ marginBottom: 8 }}><Icon name="loader" className="icon-spin" size={24} /></div>
              <div>Uploading...</div>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: 8 }}><Icon name="folder" size={24} /></div>
              <div>Drag & drop a file here or click to select</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                Max size: {maxSize / (1024 * 1024)}MB
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />
        </div>
      ) : (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px',
          border: '1px solid #d1d5db',
          borderRadius: 8,
          backgroundColor: '#f9fafb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ marginRight: 8 }}><Icon name="file" size={20} /></div>
            <div>
              <div style={{ fontWeight: 600 }}>File uploaded</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                {fileName || (() => {
                  try {
                    const parts = String(currentFile || '').split('/');
                    return decodeURIComponent(parts[parts.length - 1] || '') || 'Unknown file';
                  } catch {
                    return 'Unknown file';
                  }
                })()}
              </div>
            </div>
          </div>
          <button
            onClick={onRemove}
            style={{
              background: 'none',
              border: 'none',
              color: '#ef4444',
              cursor: 'pointer',
              fontSize: 18
            }}
            title="Remove file"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
