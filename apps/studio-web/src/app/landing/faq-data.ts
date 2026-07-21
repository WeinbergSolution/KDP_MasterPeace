// FAQ content for the landing page. Only verifiable statements about the current
// product state — no processing-time guarantees, no „one click = finished book",
// no invented platforms/formats, no free-usage claim.

/** A single FAQ entry (question + answer). */
export interface Faq {
  readonly q: string;
  readonly a: string;
}

export const FAQS: readonly Faq[] = [
  {
    q: 'Was ist KDP MasterPeace?',
    a: 'KDP MasterPeace führt dich in acht aufeinander abgestimmten Schritten von der ersten Buchidee bis zu den vorbereiteten Export- und Veröffentlichungsunterlagen. Du arbeitest dabei in einem zentralen Buchprojekt und kannst die Inhalte jederzeit selbst bearbeiten.',
  },
  {
    q: 'Wie lange dauert die Erstellung eines Buches?',
    a: 'Das hängt vom Umfang, von der gewünschten inhaltlichen Tiefe und von deinen Überarbeitungen ab. KDP MasterPeace strukturiert den gesamten Prozess, gibt aber keine pauschale Minuten- oder Fertigstellungsgarantie.',
  },
  {
    q: 'Kann ich die Inhalte selbst bearbeiten?',
    a: 'Ja. Texte, Gliederung, Formatierung und weitere Projektinhalte können im Studio manuell weiterbearbeitet werden. Manuelle Änderungen bleiben unter deiner Kontrolle.',
  },
  {
    q: 'Welche Ausgaben kann ich erstellen?',
    a: 'Der aktuelle Workflow umfasst die vorhandenen Ausgaben für Print-PDF, EPUB, Digitalprodukt und das vorbereitete KDP-Paket. Welche Ausgabe zu deinem Projekt passt, legst du während des Workflows fest.',
  },
  {
    q: 'Was beinhaltet der Tester-Tarif?',
    a: 'Der Tester-Tarif umfasst eine Buchproduktion als einmaligen Kauf für 9,90 €. Er ist kein monatliches Abonnement.',
  },
  {
    q: 'Warum muss ich meine E-Mail-Adresse bestätigen?',
    a: 'Die Bestätigung zeigt, dass du Zugriff auf die angegebene E-Mail-Adresse hast. Erst nach erfolgreicher Bestätigung kann dein Konto für den Zugang verwendet werden.',
  },
  {
    q: 'Werden meine Buchprojekte gespeichert?',
    a: 'Ja. Deine Projekte werden mit deinem Konto gespeichert und können später erneut geöffnet und weiterbearbeitet werden.',
  },
  {
    q: 'Veröffentlicht KDP MasterPeace mein Buch automatisch bei Amazon KDP?',
    a: 'Nein. KDP MasterPeace bereitet Inhalte, Dateien, KDP-Paket und Veröffentlichungs-Checkliste vor. Die abschließende Prüfung und der Upload bei der gewünschten Veröffentlichungsplattform bleiben bei dir.',
  },
  {
    q: 'Was kann ich tun, wenn ich mein Passwort vergessen habe?',
    a: 'Über die Passwort-vergessen-Seite kannst du eine E-Mail zum Zurücksetzen deines Passworts anfordern.',
  },
  {
    q: 'Kann ich KDP MasterPeace kostenlos nutzen?',
    a: 'Nein. Der günstigste Einstieg ist der Tester-Tarif für einmalig 9,90 € und eine Buchproduktion. Die monatlichen Tarife enthalten größere Buchkontingente.',
  },
];
