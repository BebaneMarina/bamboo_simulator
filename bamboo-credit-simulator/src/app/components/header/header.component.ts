// Exemple: src/app/shared/components/header/header.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="header">
      <nav class="nav-container">
        <div class="nav-brand">
          <a routerLink="/simulator-home" class="brand-link">
            <span class="brand-text">SimBot Gab</span>
          </a>
        </div>

        <div class="nav-menu">
          <a routerLink="/simulator-home" routerLinkActive="active" class="nav-link">Accueil</a>
          <a routerLink="/multi-bank-comparator" routerLinkActive="active" class="nav-link">Comparateur</a>
          <a routerLink="/tracking" routerLinkActive="active" class="nav-link">Se connecter</a>
        </div>
      </nav>
    </header>
  `,
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent { }