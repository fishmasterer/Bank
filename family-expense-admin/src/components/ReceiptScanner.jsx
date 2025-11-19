import React, { useState, useRef, useCallback, useEffect } from 'react';
import './ReceiptScanner.css';

// Cache worker instance between scans (saves ~3s per scan)
let cachedWorker = null;
let workerInitPromise = null;

/**
 * Receipt Scanner Component
 * Uses Tesseract.js (lazy loaded) for OCR to extract expense data from receipt images
 *
 * Performance considerations:
 * - Tesseract.js (~2MB) is loaded only when scanning starts
 * - Images are compressed and preprocessed (grayscale + contrast)
 * - Worker is cached between scans for faster subsequent processing
 * - Receipt image only saved for expenses >= $1000
 */
const ReceiptScanner = ({ onExtract, onClose }) => {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const [error, setError] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [step, setStep] = useState(1); // 1: Upload, 2: Processing, 3: Review

  const fileInputRef = useRef(null);
  const currentWorkerRef = useRef(null);

  // Cleanup worker on unmount if not caching
  useEffect(() => {
    return () => {
      // Don't terminate cached worker on unmount
      currentWorkerRef.current = null;
    };
  }, []);

  // Preprocess image: resize, grayscale, and enhance contrast for better OCR
  const preprocessImage = (file, maxWidth = 1500) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;

        // Scale down if larger than maxWidth
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw original image
        ctx.drawImage(img, 0, 0, width, height);

        // Get image data for processing
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Convert to grayscale and enhance contrast
        for (let i = 0; i < data.length; i += 4) {
          // Grayscale using luminosity method
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;

          // Enhance contrast (increase difference from midpoint)
          const contrast = 1.3; // 30% more contrast
          const adjusted = ((gray - 128) * contrast) + 128;
          const final = Math.max(0, Math.min(255, adjusted));

          data[i] = final;     // R
          data[i + 1] = final; // G
          data[i + 2] = final; // B
          // Alpha stays the same
        }

        // Put processed image back
        ctx.putImageData(imageData, 0, 0);

        // Clean up object URL
        URL.revokeObjectURL(img.src);

        canvas.toBlob(
          (blob) => {
            resolve(blob);
          },
          'image/jpeg',
          0.9 // Higher quality for better OCR
        );
      };

      img.src = URL.createObjectURL(file);
    });
  };

  // Handle image selection
  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError('Image is too large (max 10MB)');
        return;
      }

      setError(null);
      setExtractedData(null);

      // Always preprocess for better OCR (grayscale + contrast)
      setProgressStatus('Optimizing image...');
      const processedImage = await preprocessImage(file);

      setImage(processedImage);
      setImagePreview(URL.createObjectURL(processedImage));
      setStep(2);
      setProgressStatus('');
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
    const reversedLines = [...lines].reverse();
    for (const pattern of amountPatterns) {
      for (const line of reversedLines) {
        const match = line.match(pattern);
        if (match) {
          amount = parseFloat(match[1].replace(',', '.'));
          break;
        }
      }
      if (amount) break;
    }

    // Extract merchant name
    let merchantName = '';
    for (const line of lines) {
      if (line.length > 3 &&
          !line.match(/^\d{1,2}[\/\-]\d{1,2}/) &&
          !line.match(/^\$/) &&
          !line.match(/^\d+\s*(st|nd|rd|th|ave|street|road|blvd)/i)) {
        merchantName = line.substring(0, 50);
        break;
      }
    }

    // Extract date
    let date = null;
    const datePatterns = [
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,
      /(\w{3,9})\s+(\d{1,2}),?\s*(\d{4})/i,
    ];

    for (const line of lines) {
      for (const pattern of datePatterns) {
        const match = line.match(pattern);
        if (match) {
          try {
            const parsed = new Date(match[0]);
            if (!isNaN(parsed.getTime())) {
              date = parsed;
              break;
            }
          } catch (e) {}
        }
      }
      if (date) break;
    }

    // Guess category
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

    return { name: merchantName, amount, date, category };
  };

  // Get or create cached worker
  const getWorker = async (setProgressFn) => {
    // Return cached worker if available
    if (cachedWorker) {
      return cachedWorker;
    }

    // If already initializing, wait for it
    if (workerInitPromise) {
      return workerInitPromise;
    }

    // Create new worker and cache it
    workerInitPromise = (async () => {
      const { createWorker } = await import('tesseract.js');

      setProgressFn('Initializing OCR engine...');

      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(15 + Math.round(m.progress * 80));
            setProgressStatus('Reading text...');
          }
        }
      });

      cachedWorker = worker;
      workerInitPromise = null;
      return worker;
    })();

    return workerInitPromise;
  };

  // Process image with Tesseract OCR
  const processImage = async () => {
    if (!image) return;

    setIsProcessing(true);
    setProgress(0);
    setProgressStatus('Loading OCR engine...');
    setError(null);

    try {
      // Use cached worker for faster subsequent scans
      const worker = await getWorker(setProgressStatus);
      currentWorkerRef.current = worker;

      setProgress(15);
      setProgressStatus('Scanning receipt...');

      const { data: { text } } = await worker.recognize(image);
      const extracted = parseReceiptText(text);
      setExtractedData(extracted);

      // Don't terminate - keep worker cached for next scan
      currentWorkerRef.current = null;

      setProgress(100);
      setProgressStatus('Done!');
      setStep(3);

    } catch (err) {
      console.error('OCR Error:', err);
      setError('Scan failed. Try a clearer image or enter manually.');

      // Clear cached worker on error
      if (cachedWorker) {
        try {
          await cachedWorker.terminate();
        } catch (e) {}
        cachedWorker = null;
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Cancel processing
  const cancelProcessing = async () => {
    // Just mark as not processing - don't terminate cached worker
    currentWorkerRef.current = null;
    setIsProcessing(false);
    setProgress(0);
    setStep(2);
  };

  // Update extracted field
  const updateField = (field, value) => {
    setExtractedData(prev => ({
      ...prev,
      [field]: field === 'amount' ? parseFloat(value) || null : value
    }));
  };

  // Use extracted data
  const handleUseData = () => {
    if (extractedData) {
      const amount = extractedData.amount || 0;

      // Only include image for expenses >= $1000
      const includeImage = amount >= 1000;

      onExtract({
        name: extractedData.name || '',
        amount: amount,
        category: extractedData.category || '',
        date: extractedData.date || null,
        // Pass image data if high-value expense
        receiptImage: includeImage ? {
          blob: image,
          preview: imagePreview
        } : null
      });

      // Clean up if not saving
      if (!includeImage && imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }

      onClose();
    }
  };

  // Cleanup and close
  const handleClose = useCallback(() => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    cancelProcessing();
    onClose();
  }, [imagePreview, onClose]);

  // Reset to upload
  const resetToUpload = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImage(null);
    setImagePreview(null);
    setExtractedData(null);
    setError(null);
    setProgress(0);
    setStep(1);
  };

  return (
    <div className="receipt-scanner-overlay">
      <div className="receipt-scanner-modal">
        <div className="receipt-scanner-header">
          <h3>Scan Receipt</h3>
          <div className="step-indicator">
            <span className={`step ${step >= 1 ? 'active' : ''}`}>1. Upload</span>
            <span className={`step ${step >= 2 ? 'active' : ''}`}>2. Scan</span>
            <span className={`step ${step >= 3 ? 'active' : ''}`}>3. Review</span>
          </div>
          <button onClick={handleClose} className="close-btn" aria-label="Close">
            &times;
          </button>
        </div>

        <div className="receipt-scanner-content">
          {/* Step 1: Upload */}
          {step === 1 && (
            <div className="upload-section">
              <div
                className="upload-zone"
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="upload-icon">📸</span>
                <p className="upload-title">Upload Receipt</p>
                <p className="upload-hint">Take photo or choose file</p>
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
          )}

          {/* Step 2: Preview & Scan */}
          {step === 2 && imagePreview && (
            <div className="preview-section">
              <div className="image-preview">
                <img src={imagePreview} alt="Receipt" />
                {isProcessing && (
                  <div className="processing-overlay">
                    <div className="progress-container">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progress}%` }} />
                      </div>
                      <p className="progress-status">{progressStatus}</p>
                      <button onClick={cancelProcessing} className="cancel-btn">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Review & Edit */}
          {step === 3 && extractedData && (
            <div className="review-section">
              <div className="extracted-data">
                <div className="data-field editable">
                  <label>Name</label>
                  <input
                    type="text"
                    value={extractedData.name || ''}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Merchant name"
                  />
                </div>
                <div className="data-field editable">
                  <label>Amount ($)</label>
                  <input
                    type="number"
                    value={extractedData.amount || ''}
                    onChange={(e) => updateField('amount', e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div className="data-field editable">
                  <label>Category</label>
                  <input
                    type="text"
                    value={extractedData.category || ''}
                    onChange={(e) => updateField('category', e.target.value)}
                    placeholder="e.g., Food & Dining"
                  />
                </div>
                {extractedData.amount >= 1000 && (
                  <div className="receipt-note">
                    Receipt will be saved (expense is $1,000+)
                  </div>
                )}
              </div>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}
        </div>

        <div className="receipt-scanner-actions">
          {step === 2 && !isProcessing && (
            <>
              <button onClick={resetToUpload} className="btn-secondary">
                Change Image
              </button>
              <button onClick={processImage} className="btn-primary">
                Scan Now
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <button onClick={resetToUpload} className="btn-secondary">
                Start Over
              </button>
              <button onClick={handleUseData} className="btn-primary">
                Use Data
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiptScanner;
