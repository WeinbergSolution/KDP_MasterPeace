import { ChangeDetectionStrategy, Component, input } from '@angular/core';

// Honest scaffolding for steps not yet implemented. It never fakes a function:
// it states plainly that the step follows in a later package (the underlying
// features are inventoried in the Legacy V3 audit).

/** Placeholder panel for a not-yet-implemented workflow step. */
@Component({
  selector: 'app-placeholder-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './placeholder-step.html',
  styleUrl: './placeholder-step.scss',
})
export class PlaceholderStepComponent {
  readonly label = input<string>('');
}
