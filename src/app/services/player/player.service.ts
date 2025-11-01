// src/app/services/player.service.ts
import { Injectable } from '@angular/core';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  doc,
  updateDoc,
  Timestamp,
  collectionGroup,
  limit 
} from 'firebase/firestore';
import { Player, PlayerScore } from '../../models/player.model';
import { FirebaseService } from '../firebase/firebase.service';
import { Observable, from, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PlayerService {

  private playersCollection = 'players';
  private scoresCollection = 'scores'; 

  constructor(private firebaseService: FirebaseService) { }

  // 🔥 CREAR un nuevo jugador
  createPlayer(playerData: Omit<Player, 'id'>): Observable<string> {
    const playerWithTimestamp = {
      ...playerData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    return from(
      addDoc(collection(this.firebaseService.db, this.playersCollection), playerWithTimestamp)
    ).pipe(
      map(docRef => docRef.id)
    );
  }

  // 🔥 CREAR un nuevo score para un jugador
  createPlayerScore(scoreData: Omit<PlayerScore, 'id'>): Observable<string> {
    const scoreWithTimestamp = {
      ...scoreData,
      createdAt: Timestamp.now()
    };

    // Crear en la subcolección scores del jugador
    const playerScoresRef = collection(
      this.firebaseService.db, 
      this.playersCollection, 
      scoreData.playerId, 
      this.scoresCollection
    );

    return from(
      addDoc(playerScoresRef, scoreWithTimestamp)
    ).pipe(
      map(docRef => docRef.id)
    );
  }

  // 📖 OBTENER jugador por cédula
  getPlayerByCedula(cedula: string): Observable<Player[]> {
    const playersRef = collection(this.firebaseService.db, this.playersCollection);
    const q = query(playersRef, where('cedula', '==', cedula));

    return from(getDocs(q)).pipe(
      map(snapshot => 
        snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data['createdAt']?.toDate?.() || new Date(data['createdAt']),
            updatedAt: data['updatedAt']?.toDate?.() || new Date(data['updatedAt'])
          } as Player;
        })
      )
    );
  }

  // 📖 OBTENER scores de un jugador específico
  getPlayerScores(playerId: string): Observable<PlayerScore[]> {
    const playerScoresRef = collection(
      this.firebaseService.db, 
      this.playersCollection, 
      playerId, 
      this.scoresCollection
    );
    
    const q = query(playerScoresRef, orderBy('createdAt', 'desc'));

    return from(getDocs(q)).pipe(
      map(snapshot => 
        snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data['createdAt']?.toDate?.() || new Date(data['createdAt'])
          } as PlayerScore;
        })
      )
    );
  }

  // 📖 OBTENER todos los scores de un evento específico
  getScoresByEvent(eventId: string): Observable<PlayerScore[]> {
    // Usar collectionGroup para buscar en todas las subcolecciones scores
    const scoresGroupRef = collectionGroup(this.firebaseService.db, this.scoresCollection);
    const q = query(
      scoresGroupRef, 
      where('eventId', '==', eventId),
    orderBy('score', 'desc'),
    orderBy('time', 'asc'),
    orderBy('createdAt', 'desc')
    );

  return from(getDocs(q)).pipe(
    map(snapshot =>
      snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data['createdAt']?.toDate?.() || new Date(data['createdAt'])
        } as PlayerScore;
      })
    )
  );
  }

  // 📖 OBTENER ranking de un evento con información del jugador
getEventRanking(eventId: string): Observable<any[]> {
  return this.getScoresByEvent(eventId).pipe(
    map(scores => {
      // 🔹 Mapa para guardar solo el mejor score por jugador
      const bestScoresMap = new Map<string, any>();

      for (const score of scores) {
        const existing = bestScoresMap.get(score.playerName);
        if (!existing || score.score > existing.score) {
          bestScoresMap.set(score.playerName, score);
        }
      }

      // 🔹 Convertir a array
      const uniqueScores = Array.from(bestScoresMap.values());

      // 🔹 Ordenar: primero por score desc, luego por time asc
      uniqueScores.sort((a, b) => b.score - a.score || a.time - b.time);

      // 🔹 Tomar los 5 mejores
      const top5 = uniqueScores.slice(0, 5);

      // 🔹 Agregar posición (ranking)
      return top5.map((score, index) => ({
        position: index + 1,
        playerName: score.playerName,
        score: score.score,
        time: score.time,
        createdAt: score.createdAt,
      }));
    })
  );
}
  // 📖 VERIFICAR si un jugador ya existe por cédula
  checkPlayerExists(cedula: string): Observable<boolean> {
    return this.getPlayerByCedula(cedula).pipe(
      map(players => players.length > 0)
    );
  }

  // 📖 OBTENER o CREAR jugador
  getOrCreatePlayer(name: string, cedula: string,telefono:string): Observable<{player: Player, isNew: boolean}> {
    return new Observable(observer => {
      this.getPlayerByCedula(cedula).subscribe({
        next: (players) => {
          if (players.length > 0) {
            // Jugador existe
            observer.next({
              player: players[0],
              isNew: false
            });
            observer.complete();
          } else {
            // Crear nuevo jugador
            const playerData = {
              name: name.trim(),
              cedula: cedula.trim(),
              telefono:telefono.trim(),
              createdAt: new Date(),
              updatedAt: new Date()
            };

            this.createPlayer(playerData).subscribe({
              next: (playerId) => {
                observer.next({
                  player: {
                    id: playerId,
                    ...playerData
                  },
                  isNew: true
                });
                observer.complete();
              },
              error: (error) => observer.error(error)
            });
          }
        },
        error: (error) => observer.error(error)
      });
    });
  }
}
