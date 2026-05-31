import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState, useCallback } from "react";
import { s3Service } from "../services/s3Service";
import { authService } from "../services/authService";
import { throttle } from "../utils/rateLimit";
export const FileUpload = ({ onUploadSuccess }) => {
    const fileInputRef = useRef(null);
    const dropZoneRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [failedFiles, setFailedFiles] = useState([]);
    const isAuthenticated = authService.isAuthenticated();
    // Throttled upload to limit concurrent operations (sequential upload is already implemented)
    const uploadFiles = useCallback(throttle(async (files) => {
        if (files.length === 0)
            return;
        setUploading(true);
        setError(null);
        setFailedFiles([]);
        try {
            // Sequential upload - one file at a time (concurrent upload limit = 1)
            for (let i = 0; i < files.length; i++) {
                await s3Service.uploadFile(files[i]);
            }
            onUploadSuccess();
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed");
            setFailedFiles(files);
        }
        finally {
            setUploading(false);
        }
    }, 500), [onUploadSuccess]);
    const handleRetry = () => {
        if (failedFiles.length > 0) {
            uploadFiles(failedFiles);
        }
    };
    const handleFileSelect = (event) => {
        const files = event.target.files;
        if (!files || files.length === 0)
            return;
        const fileArray = Array.from(files);
        uploadFiles(fileArray);
    };
    const filterFiles = (items) => {
        const files = [];
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.kind === "file") {
                const file = item.getAsFile();
                if (file) {
                    files.push(file);
                }
            }
        }
        return files;
    };
    const handleDragOver = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragOver(true);
    };
    const handleDragLeave = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragOver(false);
    };
    const handleDrop = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragOver(false);
        const files = filterFiles(event.dataTransfer.items);
        uploadFiles(files);
    };
    return (_jsxs("div", { className: "upload-section", role: "region", "aria-labelledby": "upload-heading", children: [_jsx("h2", { id: "upload-heading", children: "Upload Files" }), _jsx("label", { htmlFor: "file-input", className: "visually-hidden", children: "Select files to upload" }), _jsx("input", { id: "file-input", ref: fileInputRef, type: "file", multiple: true, onChange: handleFileSelect, disabled: uploading, "aria-label": "Select files to upload", "aria-describedby": uploading ? "upload-status" : undefined }), isAuthenticated && (_jsx("div", { ref: dropZoneRef, className: `drag-drop-zone ${isDragOver ? "drag-over" : ""} ${uploading ? "uploading" : ""}`, onDragOver: handleDragOver, onDragLeave: handleDragLeave, onDrop: handleDrop, role: "button", tabIndex: uploading ? -1 : 0, "aria-label": "Drag and drop zone for file upload", "aria-describedby": "drop-zone-instructions", onKeyDown: (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        fileInputRef.current?.click();
                    }
                }, children: _jsx("p", { id: "drop-zone-instructions", children: "Drag and drop files here or press Enter to select files" }) })), uploading && (_jsx("p", { id: "upload-status", role: "status", "aria-live": "polite", children: "Uploading..." })), error && (_jsxs("div", { className: "error-container", role: "alert", "aria-live": "assertive", children: [_jsx("p", { className: "error", children: error }), _jsx("button", { onClick: handleRetry, className: "retry-button", "aria-label": "Retry failed upload", children: "Retry" })] }))] }));
};
