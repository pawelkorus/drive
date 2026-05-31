import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from "react";
import { FileUpload } from "./FileUpload";
import { FileList } from "./FileList";
import { Login } from "./Login";
import { loadConfig } from "../config/awsConfig";
import { authService } from "../services/authService";
export const App = () => {
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [configError, setConfigError] = useState(null);
    const [isReady, setIsReady] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const modalRef = useRef(null);
    useEffect(() => {
        loadConfig()
            .then(() => setIsReady(true))
            .catch((err) => setConfigError(err.message));
    }, []);
    // Focus management for modal
    useEffect(() => {
        if (showLogoutConfirm && modalRef.current) {
            const focusableElements = modalRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            const handleTabKey = (e) => {
                if (e.key === 'Tab') {
                    if (e.shiftKey) {
                        if (document.activeElement === firstElement) {
                            e.preventDefault();
                            lastElement?.focus();
                        }
                    }
                    else {
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
        return (_jsxs("div", { className: "app", children: [_jsx("header", { role: "banner", children: _jsx("h1", { children: "drive" }) }), _jsx("main", { role: "main", children: _jsxs("div", { className: "error", role: "alert", "aria-live": "assertive", children: [_jsx("h2", { children: "Configuration Error" }), _jsx("p", { children: configError })] }) })] }));
    }
    if (!isReady) {
        return (_jsxs("div", { className: "app", children: [_jsx("header", { role: "banner", children: _jsx("h1", { children: "drive" }) }), _jsx("main", { role: "main", children: _jsxs("div", { className: "loading-container", role: "status", "aria-live": "polite", "aria-busy": "true", children: [_jsx("div", { className: "spinner", "aria-hidden": "true" }), _jsx("p", { className: "loading-message", children: "Loading configuration..." })] }) })] }));
    }
    if (!isAuthenticated) {
        return _jsx(Login, { onLoginSuccess: () => setIsAuthenticated(true) });
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
    return (_jsxs("div", { className: "app", children: [_jsxs("header", { role: "banner", children: [_jsx("h1", { children: "drive" }), _jsx("button", { onClick: handleLogoutClick, "aria-label": "Logout from application", children: "Logout" })] }), _jsxs("main", { role: "main", children: [_jsx(FileUpload, { onUploadSuccess: handleUploadSuccess }), _jsx(FileList, { refreshTrigger: refreshTrigger })] }), showLogoutConfirm && (_jsx("div", { className: "modal-overlay", onClick: handleCancelLogout, role: "dialog", "aria-modal": "true", "aria-labelledby": "logout-dialog-title", "aria-describedby": "logout-dialog-description", children: _jsx("div", { className: "modal-dialog", onClick: (e) => e.stopPropagation(), ref: modalRef, children: _jsxs("div", { className: "modal-content", children: [_jsx("h2", { id: "logout-dialog-title", children: "Confirm Logout" }), _jsx("p", { id: "logout-dialog-description", children: "Are you sure you want to log out?" }), _jsxs("div", { className: "modal-actions", children: [_jsx("button", { className: "btn-cancel", onClick: handleCancelLogout, "aria-label": "Cancel logout and return to application", children: "Cancel" }), _jsx("button", { className: "btn-logout", onClick: handleConfirmLogout, "aria-label": "Confirm logout and end session", autoFocus: true, children: "Logout" })] })] }) }) }))] }));
};
