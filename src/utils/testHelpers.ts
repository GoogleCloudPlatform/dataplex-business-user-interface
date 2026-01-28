/**
 * @file testHelpers.ts
 * @description Helper functions for testing session management
 *
 * These functions are exposed on window object for easy testing from browser console
 */

/**
 * Expire the current session token by setting tokenExpiry to the past
 * Usage in console: window.expireToken()
 */
export const expireToken = () => {
  const sessionData = localStorage.getItem('sessionUserData');
  if (!sessionData) {
    console.error('No session data found');
    return;
  }

  const userData = JSON.parse(sessionData);
  const now = Math.floor(Date.now() / 1000);

  userData.tokenExpiry = now - 3600; // 1 hour in the past
  userData.tokenIssuedAt = now - 7200; // 2 hours in the past

  localStorage.setItem('sessionUserData', JSON.stringify(userData));
  console.log('Token expired! tokenExpiry set to:', new Date(userData.tokenExpiry * 1000).toLocaleString());
  console.log('Refresh the page or wait for the next session check (30s)');
};

/**
 * Set token to expire in X minutes
 * Usage in console: window.setTokenExpiry(5) // expires in 5 minutes
 */
export const setTokenExpiry = (minutes: number) => {
  const sessionData = localStorage.getItem('sessionUserData');
  if (!sessionData) {
    console.error('No session data found');
    return;
  }

  const userData = JSON.parse(sessionData);
  const now = Math.floor(Date.now() / 1000);

  userData.tokenExpiry = now + (minutes * 60);
  userData.tokenIssuedAt = now;

  localStorage.setItem('sessionUserData', JSON.stringify(userData));
  console.log(`Token set to expire in ${minutes} minutes`);
  console.log('Expiry time:', new Date(userData.tokenExpiry * 1000).toLocaleString());

  if (minutes <= 5) {
    console.log('Warning modal should appear within 30 seconds (next check interval)');
  }
};

/**
 * Trigger the warning modal by setting token to expire in 4 minutes
 * Usage in console: window.triggerWarning()
 */
export const triggerWarning = () => {
  setTokenExpiry(4);
  console.log('Warning modal will appear on next check (within 30 seconds)');
};

/**
 * Show current session status
 * Usage in console: window.showSessionStatus()
 */
export const showSessionStatus = () => {
  const sessionData = localStorage.getItem('sessionUserData');
  if (!sessionData) {
    console.error('No session data found');
    return;
  }

  const userData = JSON.parse(sessionData);
  const now = Math.floor(Date.now() / 1000);

  const timeUntilExpiry = userData.tokenExpiry - now;
  const minutesUntilExpiry = Math.floor(timeUntilExpiry / 60);
  const secondsUntilExpiry = timeUntilExpiry % 60;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SESSION STATUS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`User: ${userData.name} (${userData.email})`);
  console.log(`Token Issued: ${new Date(userData.tokenIssuedAt * 1000).toLocaleString()}`);
  console.log(`Token Expires: ${new Date(userData.tokenExpiry * 1000).toLocaleString()}`);
  console.log(`Time until expiry: ${minutesUntilExpiry}m ${secondsUntilExpiry}s`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (timeUntilExpiry < 0) {
    console.warn('TOKEN EXPIRED!');
  } else if (minutesUntilExpiry < 5) {
    console.warn(`Token expiring soon (${minutesUntilExpiry}m ${secondsUntilExpiry}s left) - Warning modal should be visible`);
  } else if (minutesUntilExpiry < 10) {
    console.log(`Token expiring in ${minutesUntilExpiry}m - Warning modal will appear at 5 min mark`);
  }
};

/**
 * Reset session to fresh state (as if just logged in)
 * Usage in console: window.resetSession()
 */
export const resetSession = () => {
  const sessionData = localStorage.getItem('sessionUserData');
  if (!sessionData) {
    console.error('No session data found');
    return;
  }

  const userData = JSON.parse(sessionData);
  const now = Math.floor(Date.now() / 1000);

  userData.tokenExpiry = now + 3600; // 1 hour from now
  userData.tokenIssuedAt = now;

  localStorage.setItem('sessionUserData', JSON.stringify(userData));

  console.log('Session reset to fresh state');
  console.log('Token expires:', new Date(userData.tokenExpiry * 1000).toLocaleString());
};

// Expose functions to window object for console access
if (typeof window !== 'undefined') {
  (window as any).expireToken = expireToken;
  (window as any).setTokenExpiry = setTokenExpiry;
  (window as any).triggerWarning = triggerWarning;
  (window as any).showSessionStatus = showSessionStatus;
  (window as any).resetSession = resetSession;

  // console.log('Session Testing Helpers Loaded!');
  // console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  // console.log('Available commands:');
  // console.log('  window.showSessionStatus()    - Show current session info');
  // console.log('  window.expireToken()          - Expire token immediately');
  // console.log('  window.setTokenExpiry(5)      - Set token to expire in 5 minutes');
  // console.log('  window.triggerWarning()       - Trigger warning modal (sets expiry to 4 min)');
  // console.log('  window.resetSession()         - Reset to fresh session (1 hour)');
  // console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}
