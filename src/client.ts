import { ClientOptions, HealthResponse } from './types';
import { ApiError } from './errors';

export class ApiClient {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;

  constructor(options: ClientOptions) {
    if (!options.apiKey || !options.apiSecret) {
      throw new Error('Both apiKey and apiSecret are required to initialize ApiClient.');
    }

    this.apiKey = options.apiKey;
    this.apiSecret = options.apiSecret;
    this.baseUrl = (options.baseUrl || 'https://api.liobase.com').replace(/\/$/, '');
  }

  /**
   * Internal HTTP handler that injects authentication headers and parses responses
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${formattedEndpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'API-Key': this.apiKey,
      'API-Secret': this.apiSecret,
      ...(options.headers as Record<string, string>),
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        errorData.message || `Request failed with status ${response.status}`,
        errorData
      );
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json() as Promise<T>;
  }

  /**
   * Helper method for custom GET requests
   */
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * Helper method for custom POST requests
   */
  async post<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
}