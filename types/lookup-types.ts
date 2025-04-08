export interface LookupResult {
  query: string;
  results: PlaceResult[];
  error?: {
    code: string;
    message: string;
    suggestions?: string[];
  };
}

export interface PlaceResult {
  place_id: string;
  name: string | null;
  lat: number;
  lng: number;
  address: string;
}

export interface BatchProcessingStatus {
  totalItems: number;
  processedItems: number;
  currentBatch: number;
  totalBatches: number;
  isProcessing: boolean;
  estimatedTimeRemaining?: number;
}

export interface BatchConfig {
  batchSize: number;
  delayBetweenBatches: number;
}
