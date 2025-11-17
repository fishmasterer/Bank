import ThemePicker from './ThemePicker';
import './Settings.css';

export default function Settings({ onClose }) {
  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="settings-modal">
        <div className="settings-header">
          <h2>Settings</h2>
          <button
            onClick={onClose}
            className="close-btn"
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>
        <div className="settings-content">
          <ThemePicker />
        </div>
      </div>
    </>
  );
}
