export type HistoricalTyphoonSource = 'CMA' | 'JTWC' | 'IBTrACS' | 'CUSTOM';

export interface HistoricalTyphoonPoint {
  time: string;
  lng: number;
  lat: number;
  pressure?: number;
  maxWindSpeed: number;
  movingSpeed?: number;
  movingDirection?: number;
}

export interface HistoricalTyphoon {
  id: string;
  name: string;
  source: HistoricalTyphoonSource;
  year: number;
  description?: string;
  points: HistoricalTyphoonPoint[];
}
