import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import Settings from './Settings';
import './UserProfile.css';

export default function UserProfile() {
  const { currentUser } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="user-profile">
      <button
        className="user-profile-btn"
        onClick={() => setShowMenu(!showMenu)}
      >
        {currentUser.photoURL ? (
          <img
            src={currentUser.photoURL}
            alt={currentUser.displayName || 'User'}
            className="user-avatar"
          />
        ) : (
          <div className="user-avatar-placeholder">
            {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
          </div>
        )}
        <span className="user-name">
          {currentUser.displayName || currentUser.email}
        </span>
      </button>

      {showMenu && (
        <>
          <div className="user-menu-overlay" onClick={() => setShowMenu(false)} />
          <div className="user-menu">
            <div className="user-menu-header">
              <p className="user-menu-name">{currentUser.displayName || 'User'}</p>
              <p className="user-menu-email">{currentUser.email}</p>
            </div>
            <button
              onClick={() => {
                setShowSettings(true);
                setShowMenu(false);
              }}
              className="menu-item-btn"
            >
              ⚙️ Settings
            </button>
            <button
              onClick={handleLogout}
              className="logout-btn"
            >
              Sign out
            </button>
          </div>
        </>
      )}

      {showSettings && (
        <Settings onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
