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
  playerTelefono='';
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
                console.log(this.event)
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

    this.playerService.getOrCreatePlayer(this.playerName, this.playerCedula,this.playerTelefono).subscribe({
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







  // 🎥 Lista de videos (lado izquierdo)
  videoUrlsLeft: string[] = [
    'https://teamcellmania-public.s3.us-east-1.amazonaws.com/eventosvideos/cellmania/WhatsApp+Video+2025-10-29+at+17.11.37.mp4',
    'https://teamcellmania-public.s3.us-east-1.amazonaws.com/eventosvideos/cellmania/WhatsApp+Video+2025-10-29+at+17.12.02.mp4',
    'https://teamcellmania-public.s3.us-east-1.amazonaws.com/eventosvideos/cellmania/WhatsApp+Video+2025-10-29+at+17.12.05+(1).mp4',
    'https://teamcellmania-public.s3.us-east-1.amazonaws.com/eventosvideos/cellmania/WhatsApp+Video+2025-10-29+at+17.12.05.mp4',
    'https://teamcellmania-public.s3.us-east-1.amazonaws.com/eventosvideos/cellmania/WhatsApp+Video+2025-10-29+at+17.12.28.mp4'
  ];
  currentVideoLeft = 0;
  @ViewChild('videoPlayerLeft') videoPlayerLeft!: ElementRef<HTMLVideoElement>;

  // 🎥 Lista de videos (lado derecho)
  videoUrlsRight: string[] = [
    'https://teamcellmania-public.s3.us-east-1.amazonaws.com/eventosvideos/WhatsApp+Video+2025-10-29+at+17.06.56.mp4',
    'https://teamcellmania-public.s3.us-east-1.amazonaws.com/eventosvideos/WhatsApp+Video+2025-10-29+at+17.06.28.mp4',
    'https://teamcellmania-public.s3.us-east-1.amazonaws.com/eventosvideos/WhatsApp+Video+2025-10-29+at+17.09.59.mp4',
    'https://teamcellmania-public.s3.us-east-1.amazonaws.com/eventosvideos/WhatsApp+Video+2025-10-29+at+17.06.25.mp4'
  ];
  currentVideoRight = 0;
  @ViewChild('videoPlayerRight') videoPlayerRight!: ElementRef<HTMLVideoElement>;

  ngAfterViewInit(): void {
    this.playVideo('left');
    this.playVideo('right');
  }

  /**
   * Reproduce el video actual, reintentando si el autoplay falla.
   */
  private playVideo(side: 'left' | 'right', retries = 3): void {
    const videoPlayer =
      side === 'left' ? this.videoPlayerLeft?.nativeElement : this.videoPlayerRight?.nativeElement;
    if (!videoPlayer) return;

    videoPlayer.muted = true;
    videoPlayer.playsInline = true;
    videoPlayer.currentTime = 0;

    const tryPlay = () => {
      const promise = videoPlayer.play();
      if (promise !== undefined) {
        promise.catch(() => {
          if (retries > 0) {
            console.warn(`Reintentando autoplay (${side})...`);
            setTimeout(() => this.playVideo(side, retries - 1), 600);
          } else {
            console.warn(`No se pudo reproducir el video (${side}).`);
          }
        });
      }
    };
    tryPlay();
  }

  /**
   * Avanza al siguiente video del lado indicado.
   */
  nextVideo(side: 'left' | 'right'): void {
    if (side === 'left') {
      this.currentVideoLeft = (this.currentVideoLeft + 1) % this.videoUrlsLeft.length;
      this.playVideo('left');
    } else {
      this.currentVideoRight = (this.currentVideoRight + 1) % this.videoUrlsRight.length;
      this.playVideo('right');
    }
  }


 


 
carouselInterval?: Subscription;

 carouselIndex = 0;

intervalId: any;
currentSlide = 0;
 
 

startCarousel(): void {
  if (!this.event?.images || this.event.images.length === 0) return;

  if (this.intervalId) clearInterval(this.intervalId);

  this.intervalId = setInterval(() => {
    this.nextSlide();
  }, 4000);
}

nextSlide(): void {
  if (!this.event?.images) return;
  this.currentSlide = (this.currentSlide + 1) % this.event.images.length;
}

ngOnDestroy(): void {
  if (this.intervalId) clearInterval(this.intervalId);
}
 
}
