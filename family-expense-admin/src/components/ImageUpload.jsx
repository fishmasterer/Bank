import React, { useState, useRef, useCallback } from 'react';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import './ImageUpload.css';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

const ImageUpload = ({
  attachments = [],
  onAttachmentsChange,
  maxFiles = 5,
  disabled = false
}) => {
  const { currentUser } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `${file.name}: Invalid file type. Allowed: JPG, PNG, GIF, WebP, PDF`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: File too large. Max size: 5MB`;
    }
    return null;
  };

  const uploadFile = async (file) => {
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `receipts/${currentUser.uid}/${timestamp}_${safeName}`;
    const storageRef = ref(storage, filePath);

    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: progress
          }));
        },
        (error) => {
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({
              name: file.name,
              url: downloadURL,
              path: filePath,
              type: file.type,
              size: file.size,
              uploadedAt: new Date().toISOString()
            });
          } catch (err) {
            reject(err);
          }
        }
      );
    });
  };

  const handleFiles = async (files) => {
    setError('');

    const fileArray = Array.from(files);

    // Check total file count
    if (attachments.length + fileArray.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate all files first
    const errors = [];
    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) errors.push(error);
    });

    if (errors.length > 0) {
      setError(errors.join('\n'));
      return;
    }

    // Upload files
    try {
      const uploadPromises = fileArray.map(file => uploadFile(file));
      const uploadedFiles = await Promise.all(uploadPromises);

      onAttachmentsChange([...attachments, ...uploadedFiles]);

      // Clear progress
      setUploadProgress({});
    } catch (err) {
      setError('Failed to upload one or more files');
      setUploadProgress({});
    }
  };

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [disabled, attachments, maxFiles]);

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleFileInput = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFiles(files);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleRemove = async (index) => {
    const attachment = attachments[index];

    try {
      // Delete from storage
      const storageRef = ref(storage, attachment.path);
      await deleteObject(storageRef);
    } catch (err) {
      // File might not exist in storage, continue anyway
      console.warn('Could not delete file from storage:', err);
    }

    // Remove from attachments
    const newAttachments = attachments.filter((_, i) => i !== index);
    onAttachmentsChange(newAttachments);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type) => {
    if (type === 'application/pdf') return '📄';
    if (type.startsWith('image/')) return '🖼️';
    return '📎';
  };

  const isUploading = Object.keys(uploadProgress).length > 0;

  return (
    <div className="image-upload-container">
      <label className="upload-label">
        Receipts / Attachments
        <span className="upload-count">({attachments.length}/{maxFiles})</span>
      </label>

      {/* Drop Zone */}
      <div
        className={`upload-dropzone ${isDragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''} ${isUploading ? 'uploading' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ALLOWED_TYPES.join(',')}
          onChange={handleFileInput}
          className="upload-input"
          disabled={disabled || isUploading}
        />

        {isUploading ? (
          <div className="upload-progress-container">
            <div className="upload-spinner"></div>
            <span>Uploading...</span>
            {Object.entries(uploadProgress).map(([name, progress]) => (
              <div key={name} className="upload-progress-item">
                <span className="progress-name">{name}</span>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="upload-icon">📸</div>
            <div className="upload-text">
              <span className="upload-primary">
                {isDragging ? 'Drop files here' : 'Drag & drop receipts here'}
              </span>
              <span className="upload-secondary">
                or click to browse
              </span>
            </div>
            <div className="upload-hints">
              <span>JPG, PNG, GIF, WebP, PDF</span>
              <span>Max 5MB per file</span>
            </div>
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="upload-error">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
        </div>
      )}

      {/* Attachment Previews */}
      {attachments.length > 0 && (
        <div className="attachments-list">
          {attachments.map((attachment, index) => (
            <div key={index} className="attachment-item">
              <div className="attachment-preview">
                {attachment.type.startsWith('image/') ? (
                  <img
                    src={attachment.url}
                    alt={attachment.name}
                    className="attachment-thumbnail"
                  />
                ) : (
                  <div className="attachment-icon">
                    {getFileIcon(attachment.type)}
                  </div>
                )}
              </div>
              <div className="attachment-info">
                <span className="attachment-name" title={attachment.name}>
                  {attachment.name}
                </span>
                <span className="attachment-size">
                  {formatFileSize(attachment.size)}
                </span>
              </div>
              <div className="attachment-actions">
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="attachment-btn view"
                  title="View"
                >
                  👁️
                </a>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="attachment-btn remove"
                  title="Remove"
                  disabled={disabled}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
