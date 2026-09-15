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
export interface CollectionApi {
    collectionId: string;
    collectionName: string;
}
export interface GetAllCollectionsApiResponse {
    collections: CollectionApi[];
}
export interface GetProjectIdApiResponse {
    projectId: string;
}
export interface CreateFolderApiResponse {
    folderId: string;
}
export type UniversalStream = Readable | ReadableStream<Uint8Array>;
export interface BaseUploadOptions {
    name: string;
    originalFileName: string;
    folderName?: string;
    collectionName?: string;
    collectionId?: string;
    isActive?: boolean;
}
export interface BaseUploadMetadata {
    projectId: string;
    name: string;
    originalFileName: string;
    folderId: string;
    collectionId?: string;
    isActive: boolean;
}
export interface UploadFileOptions extends BaseUploadOptions {
}
export interface UploadStreamOptions extends BaseUploadOptions {
}
export interface UploadImageOptions extends BaseUploadOptions {
    transformations?: ImageTransformations;
}
export interface UploadObjectMetadata extends BaseUploadMetadata {
}
export interface UploadImageApiMetadataRequest extends BaseUploadMetadata {
    transformations: ImageTransformations;
}
export interface UploadObjectResponse {
    objectId: string;
    public_id: string;
    secure_url: string;
}
export interface UploadImageResponse extends UploadObjectResponse {
}
export declare const ALLOWED_FORMATS: readonly ["jpeg", "jpg", "png", "webp", "avif"];
export type AllowedImageFormat = typeof ALLOWED_FORMATS[number];
export interface CropOptions {
    width: number;
    height: number;
}
export interface ScaleOptions {
    width: number;
    height: number;
}
export interface CompressionOptions {
    compress: boolean;
}
export interface ConversionOptions {
    format: AllowedImageFormat;
}
export interface ImageTransformations {
    crop?: CropOptions;
    scale?: ScaleOptions;
    compression?: CompressionOptions;
    conversion?: ConversionOptions;
}
//# sourceMappingURL=types.d.ts.map