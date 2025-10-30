import { Injectable } from '@angular/core';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { Event, EventImage, SAMPLE_EVENTS } from '../../models/event.model';
 
 
import { FirebaseService } from '../firebase/firebase.service';
import { Observable, from, map, switchMap, forkJoin } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private collectionName = 'events';
  constructor(private firebaseService: FirebaseService) { }
 
  // 🔥 CREAR un nuevo evento
  createEvent(eventData: Omit<Event, 'id'>): Observable<string> {
    const eventWithTimestamp = {
      ...eventData,
      date: Timestamp.fromDate(new Date(eventData.date)),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    return from(
      addDoc(collection(this.firebaseService.db, this.collectionName), eventWithTimestamp)
    ).pipe(
      map(docRef => docRef.id)
    );
  }

  // 📖 OBTENER todos los eventos
  getEvents(): Observable<Event[]> {
    const eventsRef = collection(this.firebaseService.db, this.collectionName);
    const q = query(eventsRef, orderBy('date', 'desc'));

    return from(getDocs(q)).pipe(
      map(snapshot => 
        snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data['name'],
            location: data['location'],
            description: data['description'],
            isActive: data['isActive'] !== undefined ? data['isActive'] : true,
            images: data['images'] || [],
            date: data['date']?.toDate?.() || new Date(data['date'])
          } as Event;
        })
      )
    );
  }

  // 📖 OBTENER eventos activos
  getActiveEvents(): Observable<Event[]> {
    return this.getEvents().pipe(
      map(events => events.filter(event => event.isActive))
    );
  }

  // 📖 OBTENER evento por ID
  getEventById(eventId: string): Observable<Event | null> {
    const eventRef = doc(this.firebaseService.db, this.collectionName, eventId);
    
    return from(getDoc(eventRef)).pipe(
      map(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            name: data['name'],
            img: data['img'],
            location: data['location'],
            description: data['description'],
            isActive: data['isActive'] !== undefined ? data['isActive'] : true,
            images: data['images'] || [],
            date: data['date']?.toDate?.() || new Date(data['date'])
          } as Event;
        } else {
          return null;
        }
      })
    );
  }

  // ✏️ ACTUALIZAR evento
  updateEvent(eventId: string, eventData: Partial<Event>): Observable<void> {
    const eventRef = doc(this.firebaseService.db, this.collectionName, eventId);
    
    const updateData: any = {
      ...eventData,
      updatedAt: Timestamp.now()
    };

    // No actualizar el ID si está presente
    delete updateData.id;

    return from(updateDoc(eventRef, updateData));
  }

  // 🗑️ ELIMINAR evento (soft delete)
  deleteEvent(eventId: string): Observable<void> {
    return this.updateEvent(eventId, { isActive: false });
  }

  // 🎯 INICIALIZAR datos de ejemplo - VERSIÓN MEJORADA
  initializeSampleEvents(): Observable<string[]> {
    // Crear un array de observables
    const eventCreationObservables = SAMPLE_EVENTS.map(event => 
      this.createEvent(event)
    );

    // Usar forkJoin para esperar a que todos se completen
    return forkJoin(eventCreationObservables);
  }

  // ➕ AÑADIR imagen a un evento - VERSIÓN MEJORADA
  addImageToEvent(eventId: string, image: Omit<EventImage, 'id'>): Observable<void> {
    return this.getEventById(eventId).pipe(
      switchMap(event => {
        if (!event) {
          throw new Error('Evento no encontrado');
        }

        const newImage = {
          ...image,
          id: this.generateId()
        };

        const updatedImages = [...event.images, newImage];
        
        return this.updateEvent(eventId, { images: updatedImages });
      })
    );
  }

  // 🗑️ REMOVER imagen de un evento - VERSIÓN MEJORADA
  removeImageFromEvent(eventId: string, imageId: string): Observable<void> {
    return this.getEventById(eventId).pipe(
      switchMap(event => {
        if (!event) {
          throw new Error('Evento no encontrado');
        }

        const updatedImages = event.images.filter(img => img.id !== imageId);
        return this.updateEvent(eventId, { images: updatedImages });
      })
    );
  }

  // 🔧 GENERAR ID simple
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

}
