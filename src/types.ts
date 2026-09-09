export interface ClientOptions {

  apiKey: string;

  apiSecret: string;

  baseUrl?: string;
}

export interface HealthResponse {
  status: string;
  [key: string]: unknown;
}