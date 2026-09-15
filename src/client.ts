import { 
  ClientOptions, 
  GetProjectIdApiResponse, 
  GetAllFoldersApiResponse, 
  CreateFolderApiResponse,
  GetAllCollectionsApiResponse,
  CollectionApi
} from './types/types';
import { ApiError } from './errors';
import { UploaderResource } from './resources/uploader';

export class LiobaseSDK {
  private apiKey?: string;
  private apiSecret?: string;
  private baseUrl: string = 'https://api.liobase.com/api';

  private projectId?: string;
  private folderCache: Map<string, string> = new Map();
  private collectionCache: Map<string, string> = new Map();
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
          // 1. Fetch project ID first
          const projectData = await this.request<GetProjectIdApiResponse>('/find-project-id', { method: 'GET' });
          this.projectId = projectData.projectId;

          // 2. Fetch folders and collections using the retrieved projectId
          const [foldersData, collectionsData] = await Promise.all([
            this.request<GetAllFoldersApiResponse>(`/all-folders?projectId=${this.projectId}`, { method: 'GET' }),
            this.request<GetAllCollectionsApiResponse>(`/all-collections?projectId=${this.projectId}`, { method: 'GET' }),
          ]);
          
          this.folderCache.clear();
          if (foldersData && Array.isArray(foldersData.folders)) {
            for (const item of foldersData.folders) {
              this.folderCache.set(item.folderName, item.folderId);
            }
          }

          this.collectionCache.clear();
          if (collectionsData && Array.isArray(collectionsData.collections)) {
            for (const item of collectionsData.collections) {
              this.collectionCache.set(item.collectionName, item.collectionId);
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

  /**
   * Resolves collection name to collection ID.
   * Throws an error if the collection does not exist.
   */
  public async getCollectionId(collectionName: string): Promise<string> {
    await this.ensureInitialized();

    const collectionId = this.collectionCache.get(collectionName);
    if (!collectionId) {
      throw new Error(`Collection "${collectionName}" does not exist. Users cannot create new collections.`);
    }

    return collectionId;
  }

  /**
   * Returns all available collections for the configured project.
   */
  public async getCollections(): Promise<CollectionApi[]> {
    await this.ensureInitialized();
    return Array.from(this.collectionCache.entries()).map(([collectionName, collectionId]) => ({
      collectionId,
      collectionName,
    }));
  }

  public async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('SDK is not configured. Call config() first.');
    }

    const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${formattedEndpoint}`;

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'X-API-Key': this.apiKey,
      'X-API-Secret': this.apiSecret,
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