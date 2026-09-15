import { ClientOptions, CollectionApi } from './types/types';
import { UploaderResource } from './resources/uploader';
export declare class LiobaseSDK {
    private apiKey?;
    private apiSecret?;
    private baseUrl;
    private projectId?;
    private folderCache;
    private collectionCache;
    private initPromise;
    uploader: UploaderResource;
    constructor();
    config(options: ClientOptions): void;
    ensureInitialized(): Promise<void>;
    getProjectId(): string;
    getOrCreateFolderId(folderName?: string): Promise<string>;
    /**
     * Resolves collection name to collection ID.
     * Throws an error if the collection does not exist.
     */
    getCollectionId(collectionName: string): Promise<string>;
    /**
     * Returns all available collections for the configured project.
     */
    getCollections(): Promise<CollectionApi[]>;
    request<T>(endpoint: string, options?: RequestInit): Promise<T>;
}
//# sourceMappingURL=client.d.ts.map