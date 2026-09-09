export interface ClientOptions {
    baseUrl?: string;
    timeout?: number;
}
export interface HealthResponse {
    status: string;
    [key: string]: unknown;
}
export declare class ApiClient {
    private baseUrl;
    constructor(options?: ClientOptions);
    /**
     * Checks the health of the API endpoint.
     */
    checkHealth(): Promise<HealthResponse>;
}
//# sourceMappingURL=index.d.ts.map