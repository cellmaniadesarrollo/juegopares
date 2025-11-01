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
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
@Component({
  selector: 'app-game',
  imports: [CommonModule, FormsModule, RouterModule],
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
  playerTelefono = '';
  playerRegistered = false;
  playerId: string | null | undefined = null;
  playerModal?: bootstrap.Modal;
  playerSocre = 0;
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
  ) { 
        this.searchCedula$
      .pipe(debounceTime(600), distinctUntilChanged())
      .subscribe((cedula) => this.checkCedula(cedula));
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.eventId = params['eventId'];
      this.loadEvent();
      this.viewRanking()
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
          this.startCentralCarousel();
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
 

  isCheckingCedula = false;
  isRegistering = false;
  cedulaInvalid = false;
  phoneInvalid = false;
  playerExists = false;
  successMessage = '';
  errorMessage = '';
  showOverlaySpinner = false;
showSuccessCheck = false;
  searchCedula$ = new Subject<string>();
  /** 🧍 Registrar jugador y comenzar */ 
   // 👁️ Validar y buscar jugador por cédula
  checkCedula(cedula: string) {
    this.cedulaInvalid = false;
    this.playerExists = false;
    this.playerName = '';
    this.playerTelefono = '';
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.isValidEcuadorianCedula(cedula)) {
      this.cedulaInvalid = true;
      return;
    }

    this.isCheckingCedula = true;

    this.playerService.getPlayerByCedula(cedula).subscribe({
      next: (players) => {
        this.isCheckingCedula = false;
        if (players.length > 0) {
          const player = players[0];
          this.playerExists = true;
          this.playerName = player.name;
          this.playerTelefono = player.telefono;
          this.playerId = player.id;
        }
      },
      error: () => {
        this.isCheckingCedula = false;
      }
    });
  }

  onCedulaChange(cedula: string) {
    this.searchCedula$.next(cedula);
  }

  validatePhone() {
    this.phoneInvalid = !this.isValidPhone(this.playerTelefono);
  }

  /** 🧍 Registrar jugador y comenzar */
registerPlayer(): void {
  if (!this.playerName || !this.playerCedula || !this.playerTelefono) return;
  if (this.cedulaInvalid || this.phoneInvalid) return;

  this.isRegistering = true;
  this.showOverlaySpinner = true;
  this.showSuccessCheck = false;
  this.successMessage = '';
  this.errorMessage = '';

  this.playerService
    .getOrCreatePlayer(this.playerName, this.playerCedula, this.playerTelefono)
    .subscribe({
      next: ({ player, isNew }) => {
        this.playerId = player.id;
        this.successMessage = isNew
          ? '✅ Jugador registrado correctamente'
          : '✅ Jugador encontrado';

        this.isRegistering = false;
        this.showOverlaySpinner = false;
        this.showSuccessCheck = true; // ✅ Mostrar icono de éxito
        this.playerRegistered = true;

        // Esperar un momento antes de cerrar el modal
        setTimeout(() => {
          this.showSuccessCheck = false;
          this.playerModal?.hide();
          this.initGame();
        }, 1000);
      },
      error: (err) => {
        console.error(err);
        this.isRegistering = false;
        this.showOverlaySpinner = false;
        this.errorMessage = '❌ Error al registrar jugador.';
      }
    });
}

  // ✅ Validadores reutilizables
  isValidEcuadorianCedula(cedula: string): boolean {
    if (!/^\d{10}$/.test(cedula)) return false;

    const provinceCode = parseInt(cedula.substring(0, 2), 10);
    if (provinceCode < 1 || provinceCode > 24) return false;

    const thirdDigit = parseInt(cedula.charAt(2), 10);
    if (thirdDigit >= 6) return false;

    const digits = cedula.split('').map(Number);
    const verifier = digits.pop()!;
    let sum = 0;

    digits.forEach((d, i) => {
      if (i % 2 === 0) {
        let mult = d * 2;
        if (mult > 9) mult -= 9;
        sum += mult;
      } else {
        sum += d;
      }
    });

    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === verifier;
  }

  isValidPhone(telefono: string): boolean {
    return /^09\d{8}$/.test(telefono);
  }
  /** 🔹 Inicializa el juego (mezcla y crea las cartas) */
  initGame(): void {
    if (!this.event) return;

    // Si no hay imágenes en el evento, usa un set de prueba
    const imagesSource = this.event.images

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

    // 🧮 Calcular puntaje
    this.playerSocre = this.calculateScore(this.timer, this.gameState.moves, this.totalPairs);

    // 🗂️ Preparar datos para guardar
    const scoreData = {
      playerId: this.playerId!,  // <- el "!" le dice a TypeScript: confía, no es nulo.
      playerName: this.playerName!,
      eventId: this.eventId,
      eventName: this.event.name,
      matchedPairs: this.matchedPairs,
      totalPairs: this.totalPairs,
      moves: this.gameState.moves,
      time: this.timer,
      score: this.playerSocre
    };

    // 💾 Guardar score en Firebase
    this.playerService.createPlayerScore(scoreData).subscribe({
      next: (id) => console.log(`✅ Score guardado con ID: ${id}`),
      error: (err) => console.error('❌ Error al guardar score:', err)
    });
  }
  calculateScore(time: number, moves: number, totalPairs: number): number {
    // Fórmula base: cuanto menor el tiempo y los movimientos, mayor el puntaje
    const efficiency = (totalPairs / moves) * 100;
    const speedBonus = Math.max(0, (totalPairs * 100) - time);
    return Math.max(0, Math.round(efficiency + speedBonus));
  }




  /** 🔹 Volver a jugar */
  playAgain(): void {
    this.initGame();
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


  currentSlide = 0;



  carouselInterval?: Subscription;

  carouselIndex = 0;
  intervalId: any;

  startCarousel(): void {
    if (!this.event?.images || this.event.images.length <= 3) return;

    // Borra intervalos previos por seguridad
    if (this.intervalId) clearInterval(this.intervalId);

    this.intervalId = setInterval(() => {
      this.nextSlide();
    }, 4000); // cada 4 segundos
  }

  nextSlide(): void {
    if (!this.event?.images) return;

    // Avanza de 1 en 1
    this.carouselIndex++;
    // Evita pasar el último visible
    if (this.carouselIndex > this.event.images.length - 3) {
      this.carouselIndex = 0;
    }
  }

  prevSlide(): void {
    if (!this.event?.images) return;

    this.carouselIndex--;
    if (this.carouselIndex < 0) {
      this.carouselIndex = this.event.images.length - 3;
    }
  }


  centralSlideIndex = 0;
  centralIntervalId: any;

  startCentralCarousel(): void {
    if (!this.event?.images || this.event.images.length === 0) return;

    // Detener intervalos anteriores si existen
    if (this.centralIntervalId) clearInterval(this.centralIntervalId);

    // Crear nuevo intervalo
    this.centralIntervalId = setInterval(() => {
      this.nextCentralSlide();
    }, 4000); // ⏱️ Cambia cada 4 segundos
  }

  nextCentralSlide(): void {
    if (!this.event?.images) return;
    this.centralSlideIndex = (this.centralSlideIndex + 1) % this.event.images.length;
  }

  prevCentralSlide(): void {
    if (!this.event?.images) return;
    this.centralSlideIndex =
      (this.centralSlideIndex - 1 + this.event.images.length) % this.event.images.length;
  }


  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.centralIntervalId) clearInterval(this.centralIntervalId);
  }


  resetToEventLoadState(): void {
    // 🔹 Estado visual
    this.loading = false;
    this.error = null;

    // 🔹 Estado del jugador
    this.playerRegistered = false;

    // 🔹 Estado del juego
    this.gameState = {
      isGameStarted: false,
      isGameCompleted: false,
      cards: [],
      moves: 0,
    };
    this.firstCard = null;
    this.secondCard = null;
    this.matchedPairs = 0;
    this.timer = 0;
    this.totalPairs = 8;

    // 🔹 Detener temporizador si estaba activo
    if (this.timerSub) {
      this.timerSub.unsubscribe();
      this.timerSub = undefined;
    }
  }

  scores: any = []
  viewRanking() {
    this.playerService.getEventRanking(this.eventId).subscribe({
      next: (scores) => {
        this.scores = scores;
        console.log('🏆 Ranking:', this.scores);
        // Aquí puedes abrir tu modal o mostrar la lista
      },
      error: (err) => {
        console.error('❌ Error al obtener el ranking:', err);
      }
    });
  }



}
