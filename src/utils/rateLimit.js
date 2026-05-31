/**
 * Rate limiting utilities for debouncing and throttling function calls
 */
/**
 * Debounce function - delays execution until after wait milliseconds have elapsed
 * since the last time it was invoked
 *
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns Debounced function
 */
export function debounce(func, wait) {
    let timeoutId = null;
    return function debounced(...args) {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            func(...args);
            timeoutId = null;
        }, wait);
    };
}
/**
 * Throttle function - ensures function is called at most once per wait period
 *
 * @param func - The function to throttle
 * @param wait - The number of milliseconds to wait between calls
 * @returns Throttled function
 */
export function throttle(func, wait) {
    let lastCallTime = 0;
    let timeoutId = null;
    return function throttled(...args) {
        const now = Date.now();
        const timeSinceLastCall = now - lastCallTime;
        if (timeSinceLastCall >= wait) {
            // Enough time has passed, execute immediately
            lastCallTime = now;
            func(...args);
        }
        else {
            // Schedule execution for later if not already scheduled
            if (timeoutId === null) {
                timeoutId = setTimeout(() => {
                    lastCallTime = Date.now();
                    func(...args);
                    timeoutId = null;
                }, wait - timeSinceLastCall);
            }
        }
    };
}
/**
 * Prevents rapid button clicks by disabling the button temporarily
 *
 * @param callback - The function to execute on click
 * @param cooldown - The cooldown period in milliseconds (default: 1000ms)
 * @returns Function that handles the click with cooldown
 */
export function preventRapidClicks(callback, cooldown = 1000) {
    let isProcessing = false;
    return async function clickHandler(...args) {
        if (isProcessing) {
            return;
        }
        isProcessing = true;
        try {
            await callback(...args);
        }
        finally {
            setTimeout(() => {
                isProcessing = false;
            }, cooldown);
        }
    };
}
