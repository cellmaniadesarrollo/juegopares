import { Component, OnInit } from '@angular/core';
import { Event } from '../../models/event.model';
import { EventService } from '../../services/event/event.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common'; // ✅ Importar CommonModule
import { RouterModule } from '@angular/router'; // ✅ También RouterModule para routerLink

@Component({
  selector: 'app-event-selection',
   imports: [CommonModule, RouterModule] ,
  templateUrl: './event-selection.component.html',
  styleUrl: './event-selection.component.scss'
})
export class EventSelectionComponent {
 events: Event[] = [];
  selectedEvent: Event | null = null;
  loading = true;
  error: string | null = null;

  constructor(
    private eventService: EventService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.loading = true;
    this.error = null;
    
    this.eventService.getActiveEvents().subscribe({
      next: (events) => {
        this.events = events;
        this.loading = false;
        
        // Si no hay eventos, inicializar con datos de ejemplo
        if (this.events.length === 0) {
          this.initializeSampleEvents();
        }
      },
      error: (error) => {
        console.error('Error loading events:', error);
        this.error = 'Error al cargar los eventos';
        this.loading = false;
      }
    });
  }

initializeSampleEvents(): void {
  this.eventService.initializeSampleEvents().subscribe({
    next: (ids) => {
      console.log('Datos de ejemplo creados con IDs:', ids);
      this.loadEvents(); // Recargar después de crear datos de ejemplo
    },
    error: (error) => {
      console.error('Error creating sample events:', error);
      this.error = 'Error al inicializar datos de ejemplo';
    }
  });
}

  selectEvent(event: Event): void {
    this.selectedEvent = event;
  }

  startGame(): void {
    if (this.selectedEvent) {
      this.router.navigate(['/game', this.selectedEvent.id]);
    }
  }

  getEventDate(event: Event): string {
    const date = event.date instanceof Date ? event.date : new Date(event.date);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getImageCount(event: Event): number {
    return event.images ? event.images.length : 0;
  }
}
