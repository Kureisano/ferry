import { TVChannel, CCTVCamera, Promotion, TickerConfig, LayoutConfig, SignageState, WeatherArea } from './types';

export const PRESET_LAYOUTS: LayoutConfig[] = [
  {
    id: 'l1',
    name: 'Standard Landscape TV Layout (Full TV)',
    mode: 'full_tv',
    orientation: 'landscape',
    aspectRatio: '16:9',
    showTicker: true,
  },
  {
    id: 'l2',
    name: 'L-Shape Retail Split Screen',
    mode: 'l_shape',
    orientation: 'landscape',
    aspectRatio: '16:9',
    showTicker: true,
  },
  {
    id: 'l3',
    name: 'CCTV Split Layout (Security Focus)',
    mode: 'split_tv_cctv',
    orientation: 'landscape',
    aspectRatio: '16:9',
    showTicker: true,
  },
  {
    id: 'l4',
    name: 'Security Quad Camera Grid',
    mode: 'quad_cctv',
    orientation: 'landscape',
    aspectRatio: '16:9',
    showTicker: false,
  },
  {
    id: 'l5',
    name: 'Portrait Digital Signage Stand',
    mode: 'promo_focus',
    orientation: 'portrait',
    aspectRatio: '9:16',
    showTicker: true,
  },
  {
    id: 'l6',
    name: 'Interactive Café & Menu Showcase',
    mode: 'l_shape',
    orientation: 'landscape',
    aspectRatio: '16:9',
    showTicker: true,
  },
  {
    id: 'l7',
    name: 'High-Density Security Matrix & Weather Hub',
    mode: 'split_tv_cctv',
    orientation: 'landscape',
    aspectRatio: '16:9',
    showTicker: true,
  }
];

export const PRESET_CHANNELS: TVChannel[] = [
  {
    id: 'ch1',
    name: 'Global Business News (LIVE)',
    category: 'News',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-working-at-a-busy-news-office-43015-large.mp4',
    isSimulated: false,
    overlayText: 'BREAKING: Global Market Stocks Climb to All-Time Highs • Tech Sector Leads Recovery • Inflation Concerns Ease'
  },
  {
    id: 'ch2',
    name: 'Horizon Nature & Travel',
    category: 'Scenery',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-drone-shot-of-a-beautiful-waterfall-in-a-forest-42340-large.mp4',
    isSimulated: false,
    overlayText: 'EXPLORE MORE: Discovering the untouched beauty of volcanic valleys and pristine lagoons.'
  },
  {
    id: 'ch3',
    name: 'Velocity Sports Network',
    category: 'Sports',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-skateboarding-on-a-sunny-afternoon-42566-large.mp4',
    isSimulated: false,
    overlayText: 'VELOCITY DAILY: Highlights of the skate grand championship • Next event in Tokyo scheduled for next Saturday'
  },
  {
    id: 'ch4',
    name: 'Simulated Ambient Music Visualizer',
    category: 'Entertainment',
    videoUrl: '',
    isSimulated: true,
    overlayText: 'NOW PLAYING: Lo-Fi Chill Beats • Relaxing tunes for workspace and cafe environments.'
  }
];

export const PRESET_CCTVS: CCTVCamera[] = [
  {
    id: 'cam1',
    name: 'CAM-01 • Front Lobby Reception',
    location: 'Main Entry Area',
    status: 'online',
    fps: 30,
    noiseLevel: 5,
    panSpeed: 1,
    hasMotion: false,
    colorTheme: 'monochrome'
  },
  {
    id: 'cam2',
    name: 'CAM-02 • Parking Area Gates',
    location: 'B1 West Gate',
    status: 'online',
    fps: 24,
    noiseLevel: 15,
    panSpeed: 0.5,
    hasMotion: false,
    colorTheme: 'nightvision'
  },
  {
    id: 'cam3',
    name: 'CAM-03 • Central Server Room',
    location: 'HQ Floor 4 Block C',
    status: 'online',
    fps: 15,
    noiseLevel: 2,
    panSpeed: 0,
    hasMotion: false,
    colorTheme: 'emerald'
  },
  {
    id: 'cam4',
    name: 'CAM-04 • Premium Retail Lounge',
    location: 'Ground Floor Storefront',
    status: 'online',
    fps: 30,
    noiseLevel: 4,
    panSpeed: 2,
    hasMotion: false,
    colorTheme: 'monochrome'
  },
  {
    id: 'cam5',
    name: 'CAM-05 • Main Escalators Gate',
    location: 'East Wing Escalators',
    status: 'online',
    fps: 25,
    noiseLevel: 8,
    panSpeed: 1.5,
    hasMotion: false,
    colorTheme: 'amber'
  }
];

export const PRESET_PROMOS: Promotion[] = [
  {
    id: 'p1',
    title: 'Morning Coffee & Croissant Combo',
    description: 'Start your productive day with our premium single-origin Arabica latte paired with a warm freshly baked butter croissant.',
    discountValue: '30% DISCOUNT',
    badgeText: 'MORNING SPECIAL',
    imageUrl: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&q=80&w=800',
    theme: 'elegant_gold',
    schedule: {
      allDay: false,
      startTime: '07:00',
      endTime: '11:00',
      daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday
    },
    duration: 10,
    isActive: true,
  },
  {
    id: 'p2',
    title: 'Healthy Salad Bowl + Fresh Juice',
    description: 'Nourish your body during midday work with our organic avocado quinoa salad and cold-pressed citrus juice blend.',
    discountValue: 'SPECIAL PRICE IDR 75K',
    badgeText: 'MIDDAY ENERGY BOOST',
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=800',
    theme: 'emerald_fresh',
    schedule: {
      allDay: false,
      startTime: '11:30',
      endTime: '14:30',
      daysOfWeek: [1, 2, 3, 4, 5, 6, 0], // Daily
    },
    duration: 8,
    isActive: true,
  },
  {
    id: 'p3',
    title: 'Post-Workout Power Smoothie',
    description: 'Get that optimal post-workout recovery. High-protein whey shakes with bananas, wild berries, and organic chia seeds.',
    discountValue: 'FREE PROTEIN BAR',
    badgeText: 'FITNESS HOUR',
    imageUrl: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&q=80&w=800',
    theme: 'cyber_blue',
    schedule: {
      allDay: false,
      startTime: '16:00',
      endTime: '20:00',
      daysOfWeek: [1, 2, 3, 4, 5, 6], // Monday - Saturday
    },
    duration: 10,
    isActive: true,
  },
  {
    id: 'p4',
    title: 'USDA Prime Sizzling Ribeye Steak',
    description: 'Indulge in a premium, perfectly seared USDA Prime steak served on a sizzling hot skillet with truffle mash and asparagus.',
    discountValue: 'COMPLIMENTARY WINE',
    badgeText: 'WEEKEND DINNER EXQUISITE',
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800',
    theme: 'crimson_hot',
    schedule: {
      allDay: false,
      startTime: '18:00',
      endTime: '23:00',
      daysOfWeek: [5, 6, 0], // Friday - Sunday
    },
    duration: 12,
    isActive: true,
  },
  {
    id: 'p5',
    title: 'Interactive Gaming Zone Promo',
    description: 'Buy 2 hours on our premium VR or sim-racing rigs, get 1 hour absolutely free. Free soft drink and popcorn included!',
    discountValue: 'BUY 2 GET 1 FREE',
    badgeText: 'NIGHT OWL CHILL',
    imageUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&q=80&w=800',
    theme: 'neon_sunset',
    schedule: {
      allDay: true,
      startTime: '00:00',
      endTime: '23:59',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Always
    },
    duration: 8,
    isActive: true,
  }
];

export const DEFAULT_TICKER: TickerConfig = {
  text: '✨ SELAMAT DATANG DI SMART SIGNAGE TV • KAMI MENYEDIAKAN PROMOSI TERBAIK DAN PEMANTAUAN KEAMANAN TERPADU • INFO KEMITRAAN HUBUNGI +62-21-555-0199 • PROTOKOL KESEHATAN DAN KEAMANAN SELEKTIF TETAP DIJALANKAN DENGAN DISIPLIN ✨',
  speed: 'medium',
  backgroundColor: '#0f172a', // slate-900
  textColor: '#f8fafc', // slate-50
  fontSize: 'md'
};

export const PRESET_WEATHER_AREAS: WeatherArea[] = [
  {
    id: 'area_gadog',
    name: 'Gadog • Puncak (Kawasan Wisata)',
    tempDay: 23,
    tempNight: 18,
    descDay: 'Hujan Ringan / Berkabut',
    descNight: 'Hujan Ringan & Dingin',
    humidity: 85,
    windSpeed: 3,
    iconDay: '🌧️',
    iconNight: '🌫️'
  },
  {
    id: 'area_cibinong',
    name: 'Cibinong • Pusat Pemerintahan',
    tempDay: 32,
    tempNight: 26,
    descDay: 'Cerah Berawan',
    descNight: 'Berawan Tipis',
    humidity: 68,
    windSpeed: 5,
    iconDay: '☀️',
    iconNight: '🌙'
  },
  {
    id: 'area_ciawi',
    name: 'Ciawi • Persimpangan Utama',
    tempDay: 28,
    tempNight: 22,
    descDay: 'Berawan Tebal',
    descNight: 'Hujan Ringan',
    humidity: 75,
    windSpeed: 4,
    iconDay: '☁️',
    iconNight: '🌧️'
  },
  {
    id: 'area_bogor_kota',
    name: 'Kota Bogor • Kebun Raya',
    tempDay: 27,
    tempNight: 21,
    descDay: 'Hujan Petir Berpotensi',
    descNight: 'Gerimis Berlanjut',
    humidity: 82,
    windSpeed: 4,
    iconDay: '⛈️',
    iconNight: '🌧️'
  },
  {
    id: 'area_sentul',
    name: 'Sentul • Bukit Hambalang',
    tempDay: 31,
    tempNight: 25,
    descDay: 'Cerah Panas',
    descNight: 'Cerah Berangin',
    humidity: 64,
    windSpeed: 6,
    iconDay: '☀️',
    iconNight: '🌌'
  }
];

export const INITIAL_SIGNAGE_STATE: SignageState = {
  currentLayoutId: 'l2', // Default to L-Shape split
  activeTVChannelId: 'ch1',
  activeCCTVIds: ['cam1', 'cam2', 'cam3', 'cam4'],
  ticker: DEFAULT_TICKER,
  promotions: PRESET_PROMOS,
  channels: PRESET_CHANNELS,
  cctvs: PRESET_CCTVS,
  useSystemTime: true,
  simulatedTime: '12:00',
  volume: 50,
  layouts: PRESET_LAYOUTS,
  weatherAreaId: 'area_gadog', // Default to Gadog Puncak
  weatherAreas: PRESET_WEATHER_AREAS,
  displayTheme: 'slate_minimal'
};
