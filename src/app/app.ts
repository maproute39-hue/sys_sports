import { Component, signal } from '@angular/core';
import { Router, RouterOutlet,NavigationEnd } from '@angular/router';
import { Header } from './components/header/header';
import { Sidebar } from './components/sidebar/sidebar';
import { Footer } from './components/footer/footer';
import { CommonModule } from '@angular/common';
import { ScriptLoaderService }  from './services/script-loader.service';

@Component({
  selector: 'app-root',
 standalone: true,
  imports: [RouterOutlet, Header, Sidebar, Footer, CommonModule],

  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
    constructor(
    public router: Router,
    private scriptLoader: ScriptLoaderService
  ) {}
  protected readonly title = signal('sys_aventurarte');
    shouldHideLayout(): boolean {
    const currentRoute = this.router.url;
    return ['/login', '/register', ''].includes(currentRoute);
  }

}

