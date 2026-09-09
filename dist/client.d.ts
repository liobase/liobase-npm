import { ClientOptions } from './types/types';
import { UploaderResource } from './resources/uploader';
export declare class LiobaseSDK {
    private apiKey?;
    private apiSecret?;
    private baseUrl;
    private projectId?;
    private folderCache;
    private initPromise;
    uploader: UploaderResource;
    constructor();
    config(options: ClientOptions): void;
    ensureInitialized(): Promise<void>;
    getProjectId(): string;
    getOrCreateFolderId(folderName?: string): Promise<string>;
    request<T>(endpoint: string, options?: RequestInit): Promise<T>;
}
//# sourceMappingURL=client.d.ts.map