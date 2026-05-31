import { useState, useEffect, useRef } from "react";
import { FileUpload } from "./FileUpload";
import { FileList } from "./FileList";
import { Login } from "./Login";
import { loadConfig } from "../config/awsConfig";
import { authService } from "../services/authService";

export const App = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [configError, setConfigError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConfig()
      .then(() => setIsReady(true))
      .catch((err) => setConfigError(err.message));
  }, []);

  // Focus management for modal
  useEffect(() => {
    if (showLogoutConfirm && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement?.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement?.focus();
            }
          }
        }
        if (e.key === 'Escape') {
          handleCancelLogout();
        }
      };

      document.addEventListener('keydown', handleTabKey);
      return () => {
        document.removeEventListener('keydown', handleTabKey);
      };
    }
  }, [showLogoutConfirm]);

  if (configError) {
    return (
      <div className="app">
        <header role="banner">
          <h1>drive</h1>
        </header>
        <main role="main">
          <div className="error" role="alert" aria-live="assertive">
            <h2>Configuration Error</h2>
            <p>{configError}</p>
          </div>
        </main>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="app">
        <header role="banner">
          <h1>drive</h1>
        </header>
        <main role="main">
          <div className="loading-container" role="status" aria-live="polite" aria-busy="true">
            <div className="spinner" aria-hidden="true"></div>
            <p className="loading-message">Loading configuration...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  const handleUploadSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    const startTime = performance.now();
    
    // Clear credentials
    authService.clearCredentials();
    
    // Update authentication state
    setIsAuthenticated(false);
    setShowLogoutConfirm(false);
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Ensure logout completes within 100ms
    if (duration > 100) {
      console.warn(`Logout took ${duration}ms, exceeding 100ms target`);
    }
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <div className="app">
      <header role="banner">
        <h1>drive</h1>
        <button 
          onClick={handleLogoutClick}
          aria-label="Logout from application"
        >
          Logout
        </button>
      </header>
      <main role="main">
        <FileUpload onUploadSuccess={handleUploadSuccess} />
        <FileList refreshTrigger={refreshTrigger} />
      </main>
      
      {showLogoutConfirm && (
        <div 
          className="modal-overlay" 
          onClick={handleCancelLogout}
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-dialog-title"
          aria-describedby="logout-dialog-description"
        >
          <div 
            className="modal-dialog" 
            onClick={(e) => e.stopPropagation()}
            ref={modalRef}
          >
            <div className="modal-content">
              <h2 id="logout-dialog-title">Confirm Logout</h2>
              <p id="logout-dialog-description">Are you sure you want to log out?</p>
              <div className="modal-actions">
                <button 
                  className="btn-cancel" 
                  onClick={handleCancelLogout}
                  aria-label="Cancel logout and return to application"
                >
                  Cancel
                </button>
                <button 
                  className="btn-logout" 
                  onClick={handleConfirmLogout}
                  aria-label="Confirm logout and end session"
                  autoFocus
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
