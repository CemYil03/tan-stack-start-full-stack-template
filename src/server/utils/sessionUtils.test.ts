import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { createSetCookieString, sessionUtils } from './sessionUtils';

function requestWithCookie(cookie: string | null): Request {
    const headers = new Headers();
    if (cookie) headers.set('cookie', cookie);
    return new Request('http://localhost', { headers });
}

describe('getSessionIdFromRequest', () => {
    it('returns session ID from a valid cookie header', () => {
        const req = requestWithCookie('draw-schema-session-id=abc-123');
        expect(sessionUtils.getSessionIdFromRequest(req)).toBe('abc-123');
    });

    it('returns session ID when multiple cookies are present', () => {
        const req = requestWithCookie('other=x; draw-schema-session-id=abc-123; another=y');
        expect(sessionUtils.getSessionIdFromRequest(req)).toBe('abc-123');
    });

    it('returns null when cookie header is missing', () => {
        const req = requestWithCookie(null);
        expect(sessionUtils.getSessionIdFromRequest(req)).toBeNull();
    });

    it('returns null when session cookie is not present', () => {
        const req = requestWithCookie('other=value');
        expect(sessionUtils.getSessionIdFromRequest(req)).toBeNull();
    });

    it('returns null when cookie value is empty', () => {
        const req = requestWithCookie('draw-schema-session-id=');
        expect(sessionUtils.getSessionIdFromRequest(req)).toBe('');
    });

    it('does not match a cookie with a similar prefix', () => {
        const req = requestWithCookie('draw-schema-session-id-extra=abc');
        expect(sessionUtils.getSessionIdFromRequest(req)).toBeNull();
    });
});

describe('createSetCookieString', () => {
    it('builds a cookie with all defaults', () => {
        const result = createSetCookieString({ name: 'n', value: 'v' });

        expect(result).toContain('n=v');
        expect(result).toContain('HttpOnly');
        expect(result).toContain('Secure');
        expect(result).toContain('SameSite=Strict');
        expect(result).toContain('Path=/');
        expect(result).not.toContain('Expires');
        expect(result).not.toContain('Domain');
    });

    it('includes Expires when provided', () => {
        const date = new Date('2030-01-01T00:00:00Z');
        const result = createSetCookieString({ name: 'n', value: 'v', expires: date });

        expect(result).toContain(`Expires=${date.toUTCString()}`);
    });

    it('omits HttpOnly when set to false', () => {
        const result = createSetCookieString({ name: 'n', value: 'v', httpOnly: false });
        expect(result).not.toContain('HttpOnly');
    });

    it('omits Secure when set to false', () => {
        const result = createSetCookieString({ name: 'n', value: 'v', secure: false });
        expect(result).not.toContain('Secure');
    });

    it('respects custom SameSite', () => {
        const result = createSetCookieString({ name: 'n', value: 'v', sameSite: 'None' });
        expect(result).toContain('SameSite=None');
    });

    it('includes Domain when provided', () => {
        const result = createSetCookieString({ name: 'n', value: 'v', domain: '.example.com' });
        expect(result).toContain('Domain=.example.com');
    });

    it('encodes special characters in name and value', () => {
        const result = createSetCookieString({ name: 'a b', value: 'c=d' });
        expect(result).toContain('a%20b=c%3Dd');
    });
});

describe('createSetSessionCookie', () => {
    beforeEach(() => {
        vi.stubEnv('sessionCookieSecure', '');
        vi.stubEnv('sessionCookieDomainScope', '');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('creates a session cookie with Lax when not secure', () => {
        const session = { sessionId: 'session-1' };
        const result = sessionUtils.createSetSessionCookie(session);

        expect(result).toContain('draw-schema-session-id=session-1');
        expect(result).toContain('SameSite=Lax');
        expect(result).not.toContain('Secure');
        expect(result).toContain('HttpOnly');
        expect(result).toContain('Expires=');
    });

    it('uses Secure and SameSite=None when sessionCookieSecure is true', () => {
        vi.stubEnv('sessionCookieSecure', 'true');

        const session = { sessionId: 'session-1' };
        const result = sessionUtils.createSetSessionCookie(session);

        expect(result).toContain('Secure');
        expect(result).toContain('SameSite=None');
    });

    it('includes Domain when sessionCookieDomainScope is set', () => {
        vi.stubEnv('sessionCookieDomainScope', '.example.com');

        const session = { sessionId: 'session-1' };
        const result = sessionUtils.createSetSessionCookie(session);

        expect(result).toContain('Domain=.example.com');
    });

    it('sets expiry roughly 1 year in the future', () => {
        const before = Date.now();
        const session = { sessionId: 'session-1' };
        const result = sessionUtils.createSetSessionCookie(session);
        const after = Date.now();

        const match = result.match(/Expires=(.+?)(;|$)/);
        expect(match).not.toBeNull();

        const expiryMs = new Date(match![1]!).getTime();
        const oneYearMs = 365 * 24 * 60 * 60 * 1000;

        expect(expiryMs).toBeGreaterThanOrEqual(before + oneYearMs - 1000);
        expect(expiryMs).toBeLessThanOrEqual(after + oneYearMs + 1000);
    });
});

describe('clearSessionCookie', () => {
    it('returns a cookie string that expires the session', () => {
        const result = sessionUtils.clearSessionCookie();

        expect(result).toContain('draw-schema-session-id=');
        expect(result).toContain('Max-Age=0');
        expect(result).toContain('HttpOnly');
        expect(result).toContain('Path=/');
    });
});
