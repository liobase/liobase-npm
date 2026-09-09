export declare class ApiError extends Error {
    status: number;
    data?: unknown;
    constructor(status: number, message: string, data?: unknown);
}
//# sourceMappingURL=errors.d.ts.map