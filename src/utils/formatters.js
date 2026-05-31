/**
 * Formats file size in bytes to human-readable format with appropriate units
 *
 * @param bytes - File size in bytes
 * @returns Formatted string with size and unit (KB, MB, or GB)
 *
 * Rules:
 * - Files < 1MB displayed in KB
 * - Files 1MB - 1GB displayed in MB
 * - Files > 1GB displayed in GB
 * - Sizes rounded to 2 decimal places
 */
export function formatFileSize(bytes) {
    const KB = 1024;
    const MB = KB * 1024;
    const GB = MB * 1024;
    if (bytes < MB) {
        // Files < 1MB displayed in KB
        return `${(bytes / KB).toFixed(2)} KB`;
    }
    else if (bytes < GB) {
        // Files 1MB - 1GB displayed in MB
        return `${(bytes / MB).toFixed(2)} MB`;
    }
    else {
        // Files > 1GB displayed in GB
        return `${(bytes / GB).toFixed(2)} GB`;
    }
}
