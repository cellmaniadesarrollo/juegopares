import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { initializeApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private app: any;
  public db: Firestore;

  constructor() {
    this.app = initializeApp(environment.firebaseConfig);
    this.db = getFirestore(this.app);
    console.log('Firebase Service inicializado');
  }
}
 