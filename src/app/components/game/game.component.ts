import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Event } from '../../models/event.model';
import { Player, GameState, GameCard, PlayerScore } from '../../models/player.model';
import { EventService } from '../../services/event/event.service';
import { PlayerService } from '../../services/player/player.service';
import { Subscription, interval } from 'rxjs';
import * as bootstrap from 'bootstrap';
import { Carousel } from 'bootstrap'; 
@Component({
  selector: 'app-game',
  imports: [CommonModule, FormsModule, RouterModule ] ,
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss'
})
export class GameComponent {
   @ViewChild('videoCarouselLeft', { static: false }) carouselElement!: ElementRef;
   eventId!: string;
  event: any;
  loading = false;
  error: string | null = null;

  playerName = '';
  playerCedula = '';
  playerRegistered = false;
  playerId: string | null | undefined = null;
  playerModal?: bootstrap.Modal;

  // Estado del juego
  gameState = {
    isGameStarted: false,
    isGameCompleted: false,
    cards: [] as GameCard[],
    moves: 0,
  };

  selectedImages: any[] = [];
  firstCard: GameCard | null = null;
  secondCard: GameCard | null = null;
  matchedPairs = 0;
  totalPairs = 8;

  // Temporizador
  timer = 0;
  timerSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private eventService: EventService,
    private playerService: PlayerService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.eventId = params['eventId'];
      this.loadEvent();
    });
  }

 
 
  /** 🔹 Cargar evento desde Firebase */
  loadEvent(): void {
    this.loading = true;
    this.eventService.getEventById(this.eventId).subscribe({
      next: (event) => {
        if (event) {
          this.event = event;    
                
          this.loading = false;
           // 🚀 inicia el juego directamente
          this.startCarousel();
        } else {
          this.error = 'Evento no encontrado';
          this.loading = false;
        }
      },
      error: (err) => {
        console.error(err);
        this.error = 'Error al cargar el evento';
        this.loading = false;
      }
    });
  }
  /** 🧍 Mostrar modal de jugador */
  openPlayerModal(): void {
    const modalEl = document.getElementById('playerModal');
    if (modalEl) {
      this.playerModal = new bootstrap.Modal(modalEl);
      this.playerModal.show();
    }
  }

  /** 🧍 Registrar jugador y comenzar */
  registerPlayer(): void {
    if (!this.playerName || !this.playerCedula) return;

    this.playerService.getOrCreatePlayer(this.playerName, this.playerCedula).subscribe({
      next: ({ player }) => {
        this.playerRegistered = true;
        this.playerId = player.id;
        this.playerModal?.hide();
        this.initGame();
      },
      error: (err) => {
        console.error(err);
        alert('Error al registrar jugador.');
      }
    });
  }

  /** 🔹 Inicializa el juego (mezcla y crea las cartas) */
  initGame(): void {
    if (!this.event) return;

    // Si no hay imágenes en el evento, usa un set de prueba
    const imagesSource =   this.event.images 
 
    this.selectedImages = this.selectRandomImages(imagesSource, 8);

    const cards: GameCard[] = []; 
    this.selectedImages.forEach((img, index) => {
      cards.push({
        id: `card-${index}-1`,
        image: img.img,
        nameempresa: img.nameempresa,
        isFlipped: false,
        isMatched: false,
      });
      cards.push({
        id: `card-${index}-2`,
        image: img.img,
        nameempresa: img.nameempresa,
        isFlipped: false,
        isMatched: false,
      });
    });
 
    this.gameState.cards = this.shuffleArray(cards);
    this.gameState.isGameStarted = true;
    this.gameState.isGameCompleted = false;
    this.gameState.moves = 0;
    this.matchedPairs = 0;
    this.timer = 0;
    this.startTimer();
  }

  /** 🔹 Inicia el temporizador */
  startTimer(): void {
    if (this.timerSub) this.timerSub.unsubscribe();
    this.timerSub = interval(1000).subscribe(() => this.timer++);
  }

  /** 🔹 Clic en una carta */
  onCardClick(card: GameCard): void {
    if (card.isFlipped || card.isMatched) return;
    if (this.secondCard) return;

    card.isFlipped = true;

    if (!this.firstCard) {
      this.firstCard = card;
    } else {
      this.secondCard = card;
      this.gameState.moves++;

      if (this.firstCard.image === this.secondCard.image) {
        this.firstCard.isMatched = true;
        this.secondCard.isMatched = true;
        this.matchedPairs++;
        this.resetSelection();

        if (this.matchedPairs === this.totalPairs) {
          this.completeGame();
        }
      } else {
        setTimeout(() => {
          this.firstCard!.isFlipped = false;
          this.secondCard!.isFlipped = false;
          this.resetSelection();
        }, 800);
      }
    }
  }

  /** 🔹 Reinicia selección de cartas */
  resetSelection(): void {
    this.firstCard = null;
    this.secondCard = null;
  }

  /** 🔹 Completa el juego */
  completeGame(): void {
    this.gameState.isGameCompleted = true;
    if (this.timerSub) this.timerSub.unsubscribe();
  }

  /** 🔹 Volver a jugar */
  playAgain(): void {
    this.initGame();
  }

  /** 🔹 Ver ranking (solo placeholder) */
  viewRanking(): void {
    alert('Ranking próximamente disponible 🎯');
  }

  /** 🔹 Formatea tiempo en mm:ss */
  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  /** 🔹 Selecciona imágenes aleatorias */
  selectRandomImages(images: any[], count: number): any[] {
    const shuffled = this.shuffleArray(images);
    return shuffled.slice(0, count);
  }

  /** 🔹 Mezcla un array (Fisher-Yates) */
  shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

 carouselIndex = 0;
carouselInterval?: Subscription;

ngAfterViewInit(): void {
  // Inicia el carrusel automático
 // this.startCarousel();
    this.initVideoCarousel('videoCarouselLeft1');
    this.initVideoCarousel('videoCarouselLeft');

  

}
private initVideoCarousel(carouselId: string): void {
    const carouselEl = document.getElementById(carouselId);
    if (!carouselEl) return;

    const bsCarousel = new bootstrap.Carousel(carouselEl, {
      interval: false,
      ride: false,
      wrap: true,
      pause: false, // 👈 evita que se detenga al pasar el mouse
    });

    const videos = carouselEl.querySelectorAll('video');

    // 🔹 Asegura que los videos estén silenciados (necesario para autoplay)
    videos.forEach((video: HTMLVideoElement) => {
      video.muted = true;
      video.playsInline = true;

      // Si un video termina, avanza al siguiente
      video.addEventListener('ended', () => {
        bsCarousel.next();
      });

      // 🔹 Si falla el autoplay, intenta reproducir de nuevo (Safari / Chrome mobile)
      video.addEventListener('canplay', () => {
        if (video.paused) {
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {
              console.warn(`Autoplay bloqueado en ${carouselId}, reintentando...`);
              setTimeout(() => video.play(), 500);
            });
          }
        }
      });
    });

    // Cuando cambia de slide, reproduce el nuevo video
    carouselEl.addEventListener('slid.bs.carousel', () => {
      const activeVideo = carouselEl.querySelector('.carousel-item.active video') as HTMLVideoElement;
      if (activeVideo) {
        activeVideo.currentTime = 0;
        activeVideo.play().catch(() => {
          console.warn(`No se pudo reproducir el video activo en ${carouselId}`);
        });
      }
    });

    // Inicia el primer video manualmente
    const firstVideo = carouselEl.querySelector('.carousel-item.active video') as HTMLVideoElement;
    if (firstVideo) {
      setTimeout(() => firstVideo.play(), 300);
    }
  }
  currentSlide = 0;
  intervalId: any;
startCarousel(): void {
  if (!this.event?.images) return;
      this.intervalId = setInterval(() => {
      this.nextSlide();
    }, 4000);
  // this.carouselInterval = interval(2000).subscribe(() => {
  //   this.carouselIndex++;
  //   if (this.carouselIndex >= this.event.images.length) {
  //     this.carouselIndex = 0;
  //   }
  // });
}
 nextSlide(): void {
    this.currentSlide = (this.currentSlide + 1) % this.event.images.length;
  }

  prevSlide(): void {
    this.currentSlide =
      (this.currentSlide - 1 + this.event.images.length) % this.event.images.length;
  }
ngOnDestroy(): void {
  if (this.timerSub) this.timerSub.unsubscribe();
  if (this.carouselInterval) this.carouselInterval.unsubscribe();
  clearInterval(this.intervalId);
}
 
}
