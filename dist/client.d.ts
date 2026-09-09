import { ClientOptions } from './types';
import { UploaderResource } from './resources/uploader';
export declare class LiobaseSDK {
    private apiKey?;
    private apiSecret?;
    private baseUrl;
    uploader: UploaderResource;
    constructor();
    /**
     * Configure the global SDK with your API credentials
     */
    config(options: ClientOptions): void;
    /**
     * Internal request engine
     */
    request<T>(endpoint: string, options?: RequestInit): Promise<T>;
}
//# sourceMappingURL=client.d.ts.map