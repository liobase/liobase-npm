export interface ClientOptions {
  baseUrl?: string;
  timeout?: number;
}

export interface HealthResponse {
  status: string;
  [key: string]: unknown;
}

export class ApiClient {
  private baseUrl: string;

  constructor(options?: ClientOptions) {
    this.baseUrl = options?.baseUrl || 'https://api.com';
  }

  /**
   * Checks the health of the API endpoint.
   */
  async checkHealth(): Promise<HealthResponse> {
    const response = await fetch(`${this.baseUrl}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Health check failed with status: ${response.status}`);
    }

    return response.json() as Promise<HealthResponse>;
  }
}