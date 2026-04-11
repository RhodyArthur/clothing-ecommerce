import { Component } from '@angular/core';
import { RouterOutlet } from "@angular/router";
import { Footer } from "../footer/footer";
import { Navbar } from "../navbar/navbar";

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, Footer, Navbar],
  template: `
    <div class="flex flex-col min-h-vh">
      <app-navbar />
      <main class="flex-1">
        <router-outlet />
      </main>
      <app-footer />
    </div>
  `,
})
export class MainLayout {}
