import React, { useState, useRef, useCallback } from 'react';
import './ReceiptScanner.css';

/**
 * Receipt Scanner Component
 * Uses Tesseract.js (lazy loaded) for OCR to extract expense data from receipt images
 *
 * Performance considerations:
 * - Tesseract.js (~2MB) is loaded only when scanning starts
 * - Uses web worker to avoid blocking UI
 * - Shows progress during processing
 * - Allows cancellation
 */
const ReceiptScanner = ({ onExtract, onClose }) => {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const [error, setError] = useState(null);
  const [extractedData, setExtractedData] = useState(null);

  const fileInputRef = useRef(null);
  const workerRef = useRef(null);

  // Handle image selection
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image is too large (max 10MB)');
        return;
      }

      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setError(null);
      setExtractedData(null);
    }
  };

  // Parse OCR text to extract expense data
  const parseReceiptText = (text) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    // Extract amount - look for currency patterns
    const amountPatterns = [
      /(?:total|amount|sum|due|balance)[:\s]*\$?(\d+[.,]\d{2})/i,
      /\$\s*(\d+[.,]\d{2})/,
      /(\d+[.,]\d{2})\s*(?:usd|cad|eur)?$/im,
    ];

    let amount = null;
    for (const pattern of amountPatterns) {
      for (const line of lines.reverse()) { // Check from bottom up for total
        const match = line.match(pattern);
        if (match) {
          amount = parseFloat(match[1].replace(',', '.'));
          break;
        }
      }
      if (amount) break;
    }
    lines.reverse(); // Restore order

    // Extract merchant name - usually first non-empty line
    let merchantName = '';
    for (const line of lines) {
      // Skip lines that look like addresses, dates, or amounts
      if (line.length > 3 &&
          !line.match(/^\d{1,2}[\/\-]\d{1,2}/) &&
          !line.match(/^\$/) &&
          !line.match(/^\d+\s*(st|nd|rd|th|ave|street|road|blvd)/i)) {
        merchantName = line.substring(0, 50); // Limit length
        break;
      }
    }

    // Extract date
    const datePatterns = [
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,
      /(\w{3,9})\s+(\d{1,2}),?\s*(\d{4})/i,
    ];

    let date = null;
    for (const line of lines) {
      for (const pattern of datePatterns) {
        const match = line.match(pattern);
        if (match) {
          try {
            const dateStr = match[0];
            const parsed = new Date(dateStr);
            if (!isNaN(parsed.getTime())) {
              date = parsed;
              break;
            }
          } catch (e) {
            // Continue trying other patterns
          }
        }
      }
      if (date) break;
    }

    // Guess category based on keywords
    let category = '';
    const textLower = text.toLowerCase();
    const categoryKeywords = {
      'Food & Dining': ['restaurant', 'cafe', 'coffee', 'pizza', 'burger', 'food', 'dining', 'eat'],
      'Groceries': ['grocery', 'supermarket', 'market', 'walmart', 'costco', 'trader', 'whole foods'],
      'Transportation': ['gas', 'fuel', 'uber', 'lyft', 'taxi', 'parking', 'transit', 'shell', 'chevron'],
      'Shopping': ['amazon', 'target', 'mall', 'store', 'shop', 'retail'],
      'Entertainment': ['cinema', 'movie', 'theater', 'netflix', 'spotify', 'game'],
      'Healthcare': ['pharmacy', 'cvs', 'walgreens', 'doctor', 'medical', 'health'],
      'Utilities': ['electric', 'water', 'gas bill', 'internet', 'phone', 'utility'],
    };

    for (const [cat, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(kw => textLower.includes(kw))) {
        category = cat;
        break;
      }
    }

    return {
      name: merchantName,
      amount,
      date,
      category,
      rawText: text
    };
  };

  // Process image with Tesseract OCR
  const processImage = async () => {
    if (!image) return;

    setIsProcessing(true);
    setProgress(0);
    setProgressStatus('Loading OCR engine...');
    setError(null);

    try {
      // Dynamically import Tesseract.js to avoid impacting initial bundle
      const { createWorker } = await import('tesseract.js');

      setProgressStatus('Initializing...');

      // Create worker
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
            setProgressStatus('Scanning receipt...');
          }
        }
      });

      workerRef.current = worker;

      // Recognize text
      const { data: { text } } = await worker.recognize(image);

      // Parse the extracted text
      const extracted = parseReceiptText(text);
      setExtractedData(extracted);

      // Cleanup
      await worker.terminate();
      workerRef.current = null;

      setProgressStatus('Complete!');
      setProgress(100);

    } catch (err) {
      console.error('OCR Error:', err);
      setError('Failed to scan receipt. Please try again or enter manually.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Cancel processing
  const cancelProcessing = async () => {
    if (workerRef.current) {
      await workerRef.current.terminate();
      workerRef.current = null;
    }
    setIsProcessing(false);
    setProgress(0);
    setProgressStatus('');
  };

  // Use extracted data
  const handleUseData = () => {
    if (extractedData) {
      onExtract({
        name: extractedData.name || '',
        amount: extractedData.amount || '',
        category: extractedData.category || '',
        date: extractedData.date || null
      });
      onClose();
    }
  };

  // Cleanup preview URL on unmount
  const handleClose = useCallback(() => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    cancelProcessing();
    onClose();
  }, [imagePreview, onClose]);

  return (
    <div className="receipt-scanner-overlay">
      <div className="receipt-scanner-modal">
        <div className="receipt-scanner-header">
          <h3>Scan Receipt</h3>
          <button onClick={handleClose} className="close-btn" aria-label="Close">
            &times;
          </button>
        </div>

        <div className="receipt-scanner-content">
          {!imagePreview ? (
            <div className="upload-section">
              <div
                className="upload-zone"
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="upload-icon">📸</span>
                <p>Take a photo or upload receipt image</p>
                <p className="upload-hint">Supports JPG, PNG, HEIC (max 10MB)</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            <div className="preview-section">
              <div className="image-preview">
                <img src={imagePreview} alt="Receipt preview" />
              </div>

              {isProcessing && (
                <div className="processing-overlay">
                  <div className="progress-container">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="progress-status">{progressStatus} {progress}%</p>
                    <button
                      onClick={cancelProcessing}
                      className="cancel-btn"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {extractedData && !isProcessing && (
                <div className="extracted-data">
                  <h4>Extracted Data</h4>
                  <div className="data-field">
                    <label>Merchant:</label>
                    <span>{extractedData.name || 'Not detected'}</span>
                  </div>
                  <div className="data-field">
                    <label>Amount:</label>
                    <span>{extractedData.amount ? `$${extractedData.amount.toFixed(2)}` : 'Not detected'}</span>
                  </div>
                  <div className="data-field">
                    <label>Category:</label>
                    <span>{extractedData.category || 'Not detected'}</span>
                  </div>
                  {extractedData.date && (
                    <div className="data-field">
                      <label>Date:</label>
                      <span>{extractedData.date.toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>

        <div className="receipt-scanner-actions">
          {imagePreview && !extractedData && !isProcessing && (
            <>
              <button
                onClick={() => {
                  URL.revokeObjectURL(imagePreview);
                  setImagePreview(null);
                  setImage(null);
                }}
                className="btn-secondary"
              >
                Choose Different
              </button>
              <button
                onClick={processImage}
                className="btn-primary"
              >
                Scan Receipt
              </button>
            </>
          )}

          {extractedData && !isProcessing && (
            <>
              <button
                onClick={() => {
                  setExtractedData(null);
                  setProgress(0);
                }}
                className="btn-secondary"
              >
                Scan Again
              </button>
              <button
                onClick={handleUseData}
                className="btn-primary"
              >
                Use This Data
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiptScanner;
