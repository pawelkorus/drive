import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useCallback, useRef } from 'react';
import { stripUserPrefix } from '../types';
import { s3Service } from '../services/s3Service';
import { formatFileSize } from '../utils/formatters';
import { debounce, preventRapidClicks } from '../utils/rateLimit';
export const FileList = ({ refreshTrigger }) => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [errorType, setErrorType] = useState(null);
    const [failedOperation, setFailedOperation] = useState(null);
    // Track if initial load has been triggered to prevent double-loading in StrictMode
    const hasLoadedRef = useRef(false);
    // Debounced file list refresh to prevent excessive API calls
    const debouncedLoadFiles = useRef(debounce(() => {
        console.log('debouncedLoadFiles called');
        loadFiles();
    }, 300)).current;
    // Initial load on mount
    useEffect(() => {
        console.log('Initial mount effect, hasLoadedRef:', hasLoadedRef.current);
        if (!hasLoadedRef.current) {
            hasLoadedRef.current = true;
            console.log('Calling loadFiles from initial mount');
            loadFiles();
        }
    }, []);
    // Refresh when refreshTrigger changes (after uploads)
    useEffect(() => {
        console.log('refreshTrigger effect, value:', refreshTrigger);
        if (refreshTrigger > 0) {
            debouncedLoadFiles();
        }
    }, [refreshTrigger, debouncedLoadFiles]);
    const loadFiles = async () => {
        console.log('loadFiles called');
        setLoading(true);
        setError(null);
        setErrorType(null);
        setFailedOperation(null);
        try {
            const fileList = await s3Service.listFiles();
            setFiles(fileList);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load files');
            setErrorType('list');
        }
        finally {
            setLoading(false);
        }
    };
    // Prevent rapid button clicks with rate limiting
    const handleDownload = useCallback(preventRapidClicks(async (key) => {
        setError(null);
        setErrorType(null);
        setFailedOperation(null);
        try {
            await s3Service.downloadFile(key);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Download failed');
            setErrorType('download');
            setFailedOperation({ type: 'download', key });
        }
    }, 1000), []);
    const handleDelete = useCallback(preventRapidClicks(async (key) => {
        const displayName = stripUserPrefix(key);
        if (!confirm(`Are you sure you want to delete "${displayName}"?\n\nThis action cannot be undone.`))
            return;
        setError(null);
        setErrorType(null);
        setFailedOperation(null);
        try {
            await s3Service.deleteFile(key);
            await loadFiles();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Delete failed');
            setErrorType('delete');
            setFailedOperation({ type: 'delete', key });
        }
    }, 1000), []);
    const handleRetry = () => {
        if (errorType === 'list') {
            loadFiles();
        }
        else if (failedOperation) {
            if (failedOperation.type === 'download') {
                handleDownload(failedOperation.key);
            }
            else if (failedOperation.type === 'delete') {
                handleDelete(failedOperation.key);
            }
        }
    };
    if (loading)
        return (_jsx("p", { role: "status", "aria-live": "polite", "aria-busy": "true", children: "Loading files..." }));
    if (error) {
        return (_jsxs("div", { className: "error-container", role: "alert", "aria-live": "assertive", children: [_jsx("p", { className: "error", children: error }), _jsx("button", { onClick: handleRetry, className: "retry-button", "aria-label": `Retry ${errorType === 'list' ? 'loading files' : errorType === 'download' ? 'downloading file' : 'deleting file'}`, children: "Retry" })] }));
    }
    return (_jsxs("div", { className: "file-list-section", role: "region", "aria-labelledby": "file-list-heading", children: [_jsxs("h2", { id: "file-list-heading", children: ["Files (", files.length, ")"] }), files.length === 0 ? (_jsx("p", { role: "status", children: "No files uploaded yet" })) : (_jsxs("table", { role: "table", "aria-label": "List of uploaded files", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { scope: "col", children: "Name" }), _jsx("th", { scope: "col", children: "Size" }), _jsx("th", { scope: "col", children: "Modified" }), _jsx("th", { scope: "col", children: "Actions" })] }) }), _jsx("tbody", { children: files.map(file => {
                            const displayName = stripUserPrefix(file.key);
                            return (_jsxs("tr", { children: [_jsx("td", { children: displayName }), _jsx("td", { children: formatFileSize(file.size) }), _jsx("td", { children: file.lastModified.toLocaleDateString() }), _jsxs("td", { children: [_jsx("button", { onClick: () => handleDownload(file.key), "aria-label": `Download ${displayName}`, children: "Download" }), _jsx("button", { onClick: () => handleDelete(file.key), "aria-label": `Delete ${displayName}`, children: "Delete" })] })] }, file.key));
                        }) })] }))] }));
};
