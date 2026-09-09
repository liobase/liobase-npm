import type { Readable } from 'stream';
export interface ClientOptions {
    apiKey: string;
    apiSecret: string;
    baseUrl?: string;
}
export interface FolderApi {
    folderId: string;
    folderName: string;
}
export interface GetAllFoldersApiResponse {
    folders: FolderApi[];
}
export interface GetProjectIdApiResponse {
    projectId: string;
}
export interface CreateFolderApiResponse {
    folderId: string;
}
export interface UploadFileOptions {
    name: string;
    originalFileName: string;
    folderName?: string;
    isActive?: boolean;
}
export interface UploadStreamOptions {
    name: string;
    originalFileName: string;
    folderName?: string;
    isActive?: boolean;
}
export type UniversalStream = Readable | ReadableStream<Uint8Array>;
export interface UploadObjectMetadata {
    projectId: string;
    name: string;
    originalFileName: string;
    folderId: string;
    isActive: boolean;
}
export interface UploadObjectResponse {
    objectId: string;
}
//# sourceMappingURL=types.d.ts.map