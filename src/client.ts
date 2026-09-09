import { ClientOptions, FindProjectResponse, FolderItem } from './types';
import { ApiError } from './errors';
import { UploaderResource } from './resources/uploader';

export class LiobaseSDK {
  private apiKey?: string;
  private apiSecret?: string;
  private baseUrl: string = 'https://api.liobase.com/api';

  // Internal cached state
  private projectId?: string;
  private folderCache: Map<string, string> = new Map();
  private initPromise: Promise<void> | null = null;

  public uploader: UploaderResource;

  constructor() {
    this.uploader = new UploaderResource(this);
  }

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
   * Ensures project ID and folder mappings are fetched and cached.
   * Handles concurrent calls by reusing the pending initialization promise.
   */
  public async ensureInitialized(): Promise<void> {
    if (this.projectId) return; // Already initialized

    if (!this.initPromise) {
      this.initPromise = (async () => {
        try {
          // Fetch project ID and folder list in parallel
          const [projectData, foldersData] = await Promise.all([
            this.request<FindProjectResponse>('/find-project-id', { method: 'GET' }),
            this.request<FolderItem[]>('/all-folders', { method: 'GET' }),
          ]);

          this.projectId = projectData.projectId;
          
          // Populate cache (folderName -> folderId)
          this.folderCache.clear();
          for (const item of foldersData) {
            this.folderCache.set(item.folderName, item.folderId);
          }
        } catch (err) {
          // Reset promise so subsequent requests can retry on failure
          this.initPromise = null;
          throw err;
        }
      })();
    }

    return this.initPromise;
  }

  public getProjectId(): string {
    if (!this.projectId) {
      throw new Error('SDK is not initialized. Call ensureInitialized() first.');
    }
    return this.projectId;
  }

  public getFolderId(folderName: string = '/'): string | undefined {
    return this.folderCache.get(folderName);
  }

  /**
   * Helper to manually update or insert a folder into the local cache
   */
  public registerFolder(folderName: string, folderId: string): void {
    this.folderCache.set(folderName, folderId);
  }

  public async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('SDK is not configured. Call config() first.');
    }

    const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${formattedEndpoint}`;

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'API-Key': this.apiKey,
      'API-Secret': this.apiSecret,
      ...(options.headers as Record<string, string>),
    };

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