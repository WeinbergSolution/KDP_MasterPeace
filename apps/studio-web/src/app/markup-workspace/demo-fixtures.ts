// Local, network-free demo markup for the WP-C1 workspace (DE/EN/ES). Each
// fixture exercises the main constructs so the live preview is meaningful.

/** A selectable demo fixture. */
export interface DemoFixture {
  readonly locale: 'de' | 'en' | 'es';
  readonly label: string;
  readonly markup: string;
}

const DE = `## Verstehen, was Selbstwert ist
Dein Selbstwert ist **keine feste Eigenschaft**, sondern eine Faehigkeit.
> Du musst dich nicht beweisen, um wertvoll zu sein.
### Eine kleine Uebung
:::uebung Deine innere Stimme
Notiere drei Saetze deines inneren Kritikers:
[linien:3]
- [ ] aufgeschrieben
- [x] laut ausgesprochen
:::
[skala] Wie stark ist deine innere Kritik gerade?
:::tipp
Beobachte deine Gedanken wie ein neugieriger Forscher.
:::`;

const EN = `## Understanding self-worth
Your self-worth is **not a fixed trait** but a skill you can train.
> You do not have to prove yourself to be worthy.
### A short exercise
:::uebung Your inner voice
Write down three things your inner critic says:
[linien:3]
- [ ] written down
- [x] said out loud
:::
[skala] How loud is your inner critic right now?
:::tipp
Watch your thoughts like a curious researcher.
:::`;

const ES = `## Entender la autoestima
Tu autoestima **no es un rasgo fijo**, sino una habilidad que puedes entrenar.
> No tienes que demostrar nada para tener valor.
### Un ejercicio breve
:::uebung Tu voz interior
Escribe tres frases que te dice tu critico interior:
[linien:3]
- [ ] escrito
- [x] dicho en voz alta
:::
[skala] Cuanto pesa hoy tu critica interior?
:::tipp
Observa tus pensamientos como una investigadora curiosa.
:::`;

/** The DE/EN/ES demo fixtures shown in the workspace selector. */
export const DEMO_FIXTURES: DemoFixture[] = [
  { locale: 'de', label: 'Deutsch', markup: DE },
  { locale: 'en', label: 'English', markup: EN },
  { locale: 'es', label: 'Español', markup: ES },
];
