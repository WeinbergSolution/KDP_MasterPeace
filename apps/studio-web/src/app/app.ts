import { Component } from '@angular/core';
import { MarkupWorkspaceComponent } from './markup-workspace/markup-workspace';

/**
 * Root shell of the Studio app: a responsive rail + main layout hosting the
 * WP-C1 markup workspace (editor, diagnostics and live book preview).
 */
@Component({
  imports: [MarkupWorkspaceComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly navItems = [
    { label: 'Editor & Preview', active: true },
    { label: 'Intake', active: false },
    { label: 'Qualität', active: false },
    { label: 'Export', active: false },
  ];
}
