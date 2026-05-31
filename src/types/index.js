/**
 * Strips the user prefix from an S3 key for display purposes.
 * S3 keys are stored as "{userId}/{filename}", this function returns just the filename.
 *
 * @param key - The full S3 key including user prefix (e.g., "user-123/document.pdf")
 * @returns The filename without user prefix (e.g., "document.pdf")
 * @throws Error if key is empty or doesn't contain a slash
 */
export const stripUserPrefix = (key) => {
    if (!key) {
        throw new Error('Key cannot be empty');
    }
    const parts = key.split('/');
    if (parts.length < 2) {
        throw new Error('Invalid S3 key format: expected "{userId}/{filename}"');
    }
    // Return everything after the first slash (handles filenames with slashes)
    return parts.slice(1).join('/');
};
