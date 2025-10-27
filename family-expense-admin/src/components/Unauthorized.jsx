import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import './Unauthorized.css';

export default function Unauthorized() {
  const { currentUser } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="unauthorized-container">
      <div className="unauthorized-card">
        <div className="unauthorized-icon">⛔</div>
        <h1>Access Denied</h1>
        <p className="unauthorized-message">
          Your account <strong>{currentUser?.email}</strong> is not authorized to access this application.
        </p>
        <p className="unauthorized-hint">
          Please contact your family administrator to grant you access, or sign in with an authorized account.
        </p>
        <button onClick={handleLogout} className="btn-logout">
          Sign out
        </button>
      </div>
    </div>
  );
}
