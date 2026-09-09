import { ClientOptions } from './types';
import { ApiError } from './errors';
import { UploaderResource } from './resources/uploader';

export class LiobaseSDK {
  private apiKey?: string;
  private apiSecret?: string;
  private baseUrl: string = 'https://api.liobase.com/api';

  public uploader: UploaderResource;

  constructor() {
    this.uploader = new UploaderResource(this);
  }

  /**
   * Configure the global SDK with your API credentials
   */
  public config(options: ClientOptions): void {
    if (!options.apiKey || !options.apiSecret) {
      throw new Error('Both apiKey and apiSecret are required in liobase.config().');
    }

    this.apiKey = options.apiKey;
    this.apiSecret = options.apiSecret;

    if (options.baseUrl) {
      this.baseUrl = options.baseUrl.replace(/\/$/, '');
    }
  }

  /**
   * Internal request engine
   */
public async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('blabla is not configured. Call blabla.config() first.');
    }

    const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${formattedEndpoint}`;

    // Build base headers
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'API-Key': this.apiKey,
      'API-Secret': this.apiSecret,
      ...(options.headers as Record<string, string>),
    };

    // Inject Content-Type only if it's NOT a FormData request
    // FormData automatically generates its own Content-Type with a boundary
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        errorData.message || `Request failed with status ${response.status}`,
        errorData
      );
    }

    return response.json() as Promise<T>;
  }
}