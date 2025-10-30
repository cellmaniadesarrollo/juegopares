export interface EventImage {
  id?: string; // Opcional porque Firebase lo genera
  nameempresa: string;
  img: string;
}

export interface Event {
  id?: string; // Opcional porque Firebase lo genera
  name: string;
  img: string;
  location: string;
  date: Date | any; // any para compatibilidad con Firebase Timestamp
  description: string;
  isActive: boolean;
  images: EventImage[];
}

// Datos de ejemplo con imágenes reales
export const SAMPLE_EVENTS: Omit<Event, 'id'>[] = [
  {
    name: 'FESTIVALAZO',
    location: 'Tayles',
    img:"https://teamcellmania-public.s3.us-east-1.amazonaws.com/eventologos/logo+festivalazo+2025.png",
    date: new Date('2025-10-28'),
    description: 'Feria - Experiencias - Sabores',
    isActive: true,
    images: [
      {
        nameempresa: 'Prefectura Cañar',
        img: 'https://teamcellmania-public.s3.us-east-1.amazonaws.com/eventologos/FONDO+TRANSPARENTE+logotipo+PREFECTURA+CAN%E2%95%A0%C3%A2AR-03.png'
      },
      {
        nameempresa: 'Ital Deli',
        img: 'https://teamcellmania-public.s3.us-east-1.amazonaws.com/eventologos/Ital-Deli-Cuenca-Logo.png'
      },
      {
        nameempresa: 'Hospital Catolico',
        img: 'https://teamcellmania-public.s3.us-east-1.amazonaws.com/eventologos/LOGO+HOSPITAL+CATO%CC%81LICO.png'
      },
      {
        nameempresa: 'Mana',
        img: 'https://teamcellmania-public.s3.us-east-1.amazonaws.com/eventologos/logo+man%C3%A1_editable+en+alta.png'
      },
      {
        nameempresa: 'Perspectiva',
        img: 'https://teamcellmania-public.s3.us-east-1.amazonaws.com/eventologos/logo+perspectiva.png'
      },
      {
        nameempresa: 'Universidad Catolica de Cuenca',
        img: 'https://teamcellmania-public.s3.us-east-1.amazonaws.com/eventologos/LOGO+UNIVERSIDAD+CATO%CC%81LICA+DE+CUENCA.png'
      },
        {
        nameempresa: 'Supermercados la Bodega',
        img: 'https://teamcellmania-public.s3.us-east-1.amazonaws.com/eventologos/logo+y+frase_supermecados+la+bodega.png'
      },
      {
        nameempresa: 'Radio Estelar',
        img: 'https://teamcellmania-public.s3.us-east-1.amazonaws.com/eventologos/Mesa+de+trabajo+1logos.png'
      },
      {
        nameempresa: 'GONET',
        img: 'https://teamcellmania-public.s3.us-east-1.amazonaws.com/eventologos/NUEVO+LOGO+GONET+(1).png'
      } 
    ]
  },
  // {
  //   name: 'Feria San Francisco',
  //   location: 'Parque San Francisco',
  //   img:"https://teamcellmania-public.s3.us-east-1.amazonaws.com/eventologos/logo-teamcellmania.png",
  //   date: new Date('2024-01-15'),
  //   description: 'Feria tradicional con productos locales',
  //   isActive: true,
  //   images: [
  //     {
  //       nameempresa: 'Artesanías Azuay',
  //       img: 'https://images.unsplash.com/photo-1566476960074-41ff5f0d10d3?w=400&h=300&fit=crop'
  //     },
  //     {
  //       nameempresa: 'Dulces Tradicionales',
  //       img: 'https://images.unsplash.com/photo-1558961360-f9e2e06137d1?w=400&h=300&fit=crop'
  //     },
  //     {
  //       nameempresa: 'Textiles Andinos',
  //       img: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop'
  //     },
  //     {
  //       nameempresa: 'Cerámica Cuencana',
  //       img: 'https://images.unsplash.com/photo-1577937927139-79eaf8e7e7c5?w=400&h=300&fit=crop'
  //     },
  //     {
  //       nameempresa: 'Juguetes Manuales',
  //       img: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&h=300&fit=crop'
  //     },
  //     {
  //       nameempresa: 'Gastronomía Local',
  //       img: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&h=300&fit=crop'
  //     },
  //       {
  //       nameempresa: 'Iluminaciones LED',
  //       img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop'
  //     },
  //     {
  //       nameempresa: 'Comida Nocturna',
  //       img: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop'
  //     },
  //     {
  //       nameempresa: 'Bebidas Especiales',
  //       img: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop'
  //     },
  //     {
  //       nameempresa: 'Música en Vivo',
  //       img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=300&fit=crop'
  //     },
  //     {
  //       nameempresa: 'Decoraciones',
  //       img: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop'
  //     },
  //     {
  //       nameempresa: 'Ambientación',
  //       img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop'
  //     }
  //   ]
  // },
 
];