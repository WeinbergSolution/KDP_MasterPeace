import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

/**
 * Root shell of the Studio app: a responsive rail + main layout that renders the
 * design-system demo route. Feature routing plugs into the router-outlet.
 */
@Component({
  imports: [RouterModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly navItems = [
    { label: 'Design System', active: true },
    { label: 'Intake', active: false },
    { label: 'Editor', active: false },
    { label: 'Preview', active: false },
  ];

  protected readonly swatches = [
    { name: 'Primary', token: '--color-primary' },
    { name: 'Rail', token: '--color-rail-bg' },
    { name: 'Success', token: '--color-success' },
    { name: 'Danger', token: '--color-danger' },
    { name: 'Surface', token: '--color-surface' },
  ];
}
