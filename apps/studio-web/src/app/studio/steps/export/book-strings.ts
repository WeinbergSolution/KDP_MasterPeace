// Language-dependent strings that land inside the exported book (title page,
// copyright, disclaimers, table-of-contents labels). Ported 1:1 from Legacy V3.

/** In-book localized strings for one language. */
export interface BookStrings {
  chapter: string;
  contents: string;
  intro: string;
  prolog: string;
  howto: string;
  closing: string;
  afterword: string;
  about: string;
  bonus: string;
  rights: (year: number, author: string) => string;
  copy: string;
  disclaimerSelfhelp: string;
  disclaimerFiction: string;
  publisher: string;
}

export const BOOK_STRINGS: Record<string, BookStrings> = {
  de: {
    chapter: 'Kapitel',
    contents: 'Inhalt',
    intro: 'Einleitung',
    prolog: 'Vorwort',
    howto: 'Wie du mit diesem Buch arbeitest',
    closing: 'Schlusswort',
    afterword: 'Nachwort',
    about: 'Über die Autorin / den Autor',
    bonus: 'Dein Bonus',
    rights: (y, a) => `© ${y} ${a}. Alle Rechte vorbehalten.`,
    copy: 'Dieses Werk einschließlich aller Inhalte ist urheberrechtlich geschützt. Nachdruck oder Reproduktion (auch auszugsweise) in irgendeiner Form sowie die Verbreitung ohne schriftliche Genehmigung sind untersagt.',
    disclaimerSelfhelp:
      'Wichtiger Hinweis: Dieses Buch dient der Selbstreflexion und Psychoedukation. Es ersetzt keine Psychotherapie, ärztliche Behandlung oder professionelle Beratung. Bei akuten Krisen wende dich bitte an eine Fachperson oder einen Krisendienst.',
    disclaimerFiction:
      'Dies ist ein Werk der Fiktion. Ähnlichkeiten mit lebenden oder verstorbenen Personen sowie realen Ereignissen sind rein zufällig.',
    publisher: 'Independently published.',
  },
  en: {
    chapter: 'Chapter',
    contents: 'Contents',
    intro: 'Introduction',
    prolog: 'Foreword',
    howto: 'How to Use This Book',
    closing: 'Final Words',
    afterword: 'Afterword',
    about: 'About the Author',
    bonus: 'Your Bonus',
    rights: (y, a) => `© ${y} ${a}. All rights reserved.`,
    copy: 'This work, including all of its contents, is protected by copyright. No part of this publication may be reproduced, distributed, or transmitted in any form without prior written permission.',
    disclaimerSelfhelp:
      'Important note: This book is intended for self-reflection and educational purposes only. It is not a substitute for psychotherapy, medical treatment, or professional advice. If you are in crisis, please reach out to a professional or a crisis service.',
    disclaimerFiction:
      'This is a work of fiction. Any resemblance to actual persons, living or dead, or actual events is purely coincidental.',
    publisher: 'Independently published.',
  },
  es: {
    chapter: 'Capítulo',
    contents: 'Índice',
    intro: 'Introducción',
    prolog: 'Prólogo',
    howto: 'Cómo trabajar con este libro',
    closing: 'Palabras finales',
    afterword: 'Epílogo',
    about: 'Sobre la autora / el autor',
    bonus: 'Tu bono',
    rights: (y, a) => `© ${y} ${a}. Todos los derechos reservados.`,
    copy: 'Esta obra, incluidos todos sus contenidos, está protegida por derechos de autor. Queda prohibida su reproducción o distribución, total o parcial, sin autorización previa por escrito.',
    disclaimerSelfhelp:
      'Nota importante: Este libro está pensado para la autorreflexión y la psicoeducación. No sustituye la psicoterapia, el tratamiento médico ni el asesoramiento profesional. En caso de crisis, acude a un profesional o a un servicio de emergencia.',
    disclaimerFiction:
      'Esta es una obra de ficción. Cualquier parecido con personas reales, vivas o fallecidas, o con hechos reales es pura coincidencia.',
    publisher: 'Independently published.',
  },
  fr: {
    chapter: 'Chapitre',
    contents: 'Table des matières',
    intro: 'Introduction',
    prolog: 'Avant-propos',
    howto: 'Comment utiliser ce livre',
    closing: 'Le mot de la fin',
    afterword: 'Postface',
    about: "À propos de l'auteure / l'auteur",
    bonus: 'Votre bonus',
    rights: (y, a) => `© ${y} ${a}. Tous droits réservés.`,
    copy: "Cette œuvre, y compris l'ensemble de son contenu, est protégée par le droit d'auteur. Toute reproduction ou diffusion, même partielle, sans autorisation écrite préalable est interdite.",
    disclaimerSelfhelp:
      "Note importante : ce livre est destiné à la réflexion personnelle et à la psychoéducation. Il ne remplace pas une psychothérapie, un traitement médical ou un accompagnement professionnel. En cas de crise, adressez-vous à un professionnel ou à un service d'urgence.",
    disclaimerFiction:
      'Ceci est une œuvre de fiction. Toute ressemblance avec des personnes réelles, vivantes ou décédées, ou avec des événements réels serait purement fortuite.',
    publisher: 'Independently published.',
  },
  it: {
    chapter: 'Capitolo',
    contents: 'Indice',
    intro: 'Introduzione',
    prolog: 'Prefazione',
    howto: 'Come lavorare con questo libro',
    closing: 'Parole conclusive',
    afterword: 'Postfazione',
    about: "Sull'autrice / sull'autore",
    bonus: 'Il tuo bonus',
    rights: (y, a) => `© ${y} ${a}. Tutti i diritti riservati.`,
    copy: "Quest'opera, compresi tutti i suoi contenuti, è protetta dal diritto d'autore. È vietata la riproduzione o la diffusione, anche parziale, senza previa autorizzazione scritta.",
    disclaimerSelfhelp:
      "Nota importante: questo libro è pensato per l'autoriflessione e la psicoeducazione. Non sostituisce la psicoterapia, le cure mediche o la consulenza professionale. In caso di crisi, rivolgiti a un professionista o a un servizio di emergenza.",
    disclaimerFiction:
      "Questa è un'opera di fantasia. Ogni riferimento a persone reali, vive o defunte, o a fatti realmente accaduti è puramente casuale.",
    publisher: 'Independently published.',
  },
};

/**
 * Returns the in-book strings for a language (falling back to German).
 *
 * @param language The book language code.
 * @returns The localized in-book strings.
 */
export function bookStrings(language: string): BookStrings {
  return BOOK_STRINGS[language] ?? BOOK_STRINGS['de'];
}
