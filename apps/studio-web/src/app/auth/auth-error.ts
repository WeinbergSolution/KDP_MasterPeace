// Maps Firebase Auth error codes to friendly, action-oriented German messages
// (AGENTS.md §9.3: errors are understandable and tied to the action, never
// swallowed). Unknown codes fall back to a generic retry message.

const AUTH_MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'Diese E-Mail-Adresse ist ungültig.',
  'auth/user-not-found': 'Kein Konto mit dieser E-Mail-Adresse gefunden.',
  'auth/wrong-password': 'E-Mail-Adresse oder Passwort ist falsch.',
  'auth/invalid-credential': 'E-Mail-Adresse oder Passwort ist falsch.',
  'auth/email-already-in-use':
    'Für diese E-Mail-Adresse existiert bereits ein Konto.',
  'auth/weak-password': 'Das Passwort muss mindestens 6 Zeichen haben.',
  'auth/too-many-requests': 'Zu viele Versuche. Bitte später erneut versuchen.',
  'auth/network-request-failed':
    'Keine Verbindung. Bitte Internet prüfen und erneut versuchen.',
  'auth/configuration-not-found': 'Anmeldung ist derzeit nicht konfiguriert.',
  'auth/expired-action-code':
    'Der Bestätigungslink ist abgelaufen. Bitte fordere einen neuen an.',
  'auth/invalid-action-code':
    'Der Bestätigungslink ist ungültig oder wurde bereits verwendet.',
};

/**
 * Translates an unknown auth error into a user-facing German message.
 *
 * @param error The thrown error (typically a FirebaseError).
 * @returns A friendly message for display.
 */
export function toAuthMessage(error: unknown): string {
  const code = (error as { code?: string } | null)?.code ?? '';
  return (
    AUTH_MESSAGES[code] ??
    'Es ist ein Fehler aufgetreten. Bitte erneut versuchen.'
  );
}
