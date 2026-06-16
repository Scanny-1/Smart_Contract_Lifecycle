const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

/**
 * Normalizes file paths and appends the server base URL for file access.
 * @param {string} path - The raw file path from backend
 * @returns {string} Fully qualified URL to access the resource
 */
export const getFileUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    const normalizedPath = path.replace(/\\/g, '/');
    return `${SERVER_URL}/${normalizedPath}`;
};

export { SERVER_URL };
