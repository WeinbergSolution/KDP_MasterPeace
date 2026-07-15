import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Root component: hosts the router outlet for landing, auth and studio routes. */
@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
