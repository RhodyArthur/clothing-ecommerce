import { Component } from '@angular/core';
import { RouterOutlet } from "@angular/router";
import { Footer } from "../footer/footer";
import { Navbar } from "../navbar/navbar";
import { Toast } from "primeng/toast";
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, Footer, Navbar, Toast],
  providers: [MessageService],
  template: `
      <div class="flex flex-col min-h-screen">
      <p-toast position="top-right" /> 
      <app-navbar />
      <main class="flex-1">
        <router-outlet />
      </main>
      <app-footer />
    </div>
  `,
})
export class MainLayout {
}
