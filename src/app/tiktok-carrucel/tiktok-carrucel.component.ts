import { Component, Input, OnChanges, SimpleChanges, Renderer2 } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
 
@Component({
  selector: 'app-tiktok-carrucel',
  imports: [],
  templateUrl: './tiktok-carrucel.component.html',
  styleUrl: './tiktok-carrucel.component.scss'
})
export class TiktokCarrucelComponent {
 @Input() videoId!: string;
  tiktokUrl: SafeResourceUrl = '';

  constructor(private sanitizer: DomSanitizer,private renderer: Renderer2) {}

  ngOnInit(): void {
     
  }


  ngOnChanges(changes: SimpleChanges): void {
    if (changes['videoId']) {
      this.updateVideoUrl();
    }
  }
  //`https://www.tiktok.com/embed/v2/${this.videoId}`;
  //`https://www.tiktok.com/embed/v2/${this.videoId}?autoplay=1&loop=1&controls=1`
  //`https://www.tiktok.com/embed/${this.videoId}`
  updateVideoUrl(): void {
    this.tiktokUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.tiktok.com/embed/v2/${this.videoId}`
    );
  }
}
