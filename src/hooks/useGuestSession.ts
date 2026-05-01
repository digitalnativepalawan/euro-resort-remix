const GUEST_SESSION_KEY = 'guest_session';

export interface GuestSession {
  room_id: string;
  room_name: string;
  guest_name: string;
  booking_id: string;
  check_out?: string;
  expires: number;
}

export function getGuestSession(): GuestSession | null {
  try {
    const stored = sessionStorage.getItem(GUEST_SESSION_KEY);
    if (!stored) return null;
    const session: GuestSession = JSON.parse(stored);
    if (session.expires < Date.now()) {
      sessionStorage.removeItem(GUEST_SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    sessionStorage.removeItem(GUEST_SESSION_KEY);
    return null;
  }
}

export function setGuestSession(
  session: Omit<GuestSession, 'expires'>,
  expiresAt?: number,
): void {
  const full: GuestSession = {
    ...session,
    expires: expiresAt ?? Date.now() + 4 * 60 * 60 * 1000,
  };
  sessionStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(full));
}

export function clearGuestSession(): void {
  sessionStorage.removeItem(GUEST_SESSION_KEY);
}
