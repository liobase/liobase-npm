import { 
  ClientOptions, 
  GetProjectIdApiResponse, 
  GetAllFoldersApiResponse, 
  CreateFolderApiResponse 
} from './types/types';
import { ApiError } from './errors';
import { UploaderResource } from './resources/uploader';

export class LiobaseSDK {
  private apiKey?: string;
  private apiSecret?: string;
  private baseUrl: string = 'https://api.liobase.com/api';

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

  public async ensureInitialized(): Promise<void> {
    if (this.projectId) return;

    if (!this.initPromise) {
      this.initPromise = (async () => {
        try {
          const [projectData, foldersData] = await Promise.all([
            this.request<GetProjectIdApiResponse>('/find-project-id', { method: 'GET' }),
            this.request<GetAllFoldersApiResponse>('/all-folders', { method: 'GET' }),
          ]);

          this.projectId = projectData.projectId;
          
          this.folderCache.clear();
          if (foldersData && Array.isArray(foldersData.folders)) {
            for (const item of foldersData.folders) {
              this.folderCache.set(item.folderName, item.folderId);
            }
          }
        } catch (err) {
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

  public async getOrCreateFolderId(folderName: string = 'Home'): Promise<string> {
    await this.ensureInitialized();

    let folderId = this.folderCache.get(folderName);
    if (folderId) {
      return folderId;
    }

    const response = await this.request<CreateFolderApiResponse>('/create-folder', {
      method: 'POST',
      body: JSON.stringify({
        projectId: this.getProjectId(),
        name: folderName,
      }),
    });

    folderId = response.folderId;
    this.folderCache.set(folderName, folderId);
    return folderId;
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