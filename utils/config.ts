/**
 * Clock skew to tolerate, in seconds.  Only needs to handle server-side skew
 * across global cluster, which means in-tolerance for roughly-competent NTP
 * setups.
 */
export const CLOCK_SKEW = 1;

/**
 * Length of time, in seconds, that an auth token will be valid.
 */
export const AUTH_DURATION = 3600; // 1h

/**
 * Length of time, in seconds, that a refresh token will be valid.
 */
export const REFRESH_DURATION = 3600 * 24 * 7; // It's been...

/**
 * Number of bytes to salt bcyrpt with for passwords.
 */
export const PASSWORD_SALT_LENGTH = 8;
