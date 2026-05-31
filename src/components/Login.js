import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { authService } from '../services/authService';
export const Login = ({ onLoginSuccess }) => {
    const [error, setError] = useState(null);
    useEffect(() => {
        // Check if we're returning from Cognito with an authorization code
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');
        if (code) {
            try {
                // Validate state parameter first
                authService.validateStateParameter(state);
                authService
                    .exchangeCodeForToken(code)
                    .then(token => {
                    authService.setIdToken(token);
                    // Clean up URL
                    window.history.replaceState({}, document.title, window.location.pathname);
                    setError(null);
                    onLoginSuccess();
                })
                    .catch(err => {
                    console.error('Login failed:', err);
                    setError(err.message || 'Login failed');
                });
            }
            catch (err) {
                console.error('State validation failed:', err);
                setError(err instanceof Error ? err.message : 'Invalid authorization state');
            }
        }
    }, [onLoginSuccess]);
    const handleLogin = () => {
        setError(null);
        window.location.href = authService.getLoginUrl();
    };
    return (_jsx("div", { className: "login-container", children: _jsxs("div", { className: "login-box", role: "main", children: [_jsx("h1", { id: "login-title", children: "drive" }), _jsx("p", { id: "login-description", children: "Sign in with your AWS Cognito account" }), error && (_jsxs("div", { className: "error-message", role: "alert", "aria-live": "assertive", "aria-atomic": "true", children: [error, _jsx("button", { onClick: handleLogin, className: "retry-button", "aria-label": "Retry login after error", children: "Retry" })] })), _jsx("button", { onClick: handleLogin, "aria-label": "Login with AWS Cognito", "aria-describedby": "login-description", children: "Login with Cognito" })] }) }));
};
