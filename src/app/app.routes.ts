import { Routes } from '@angular/router';
import { WelcomeComponent } from './components/welcome/welcome.component';
import { EventSelectionComponent } from './components/event-selection/event-selection.component';
import { GameComponent } from './components/game/game.component';

export const routes: Routes = [
      // Ruta para WelcomeComponent
  { path: 'welcome', component: WelcomeComponent },
  { path: 'select-event', component: EventSelectionComponent },
  { path: 'game/:eventId', component: GameComponent },
  // Ruta por defecto - redirige a welcome
  { path: '', redirectTo: '/welcome', pathMatch: 'full' },
  
  // Ruta comodín para páginas no encontradas - redirige a welcome
  { path: '**', redirectTo: '/welcome' }
];
