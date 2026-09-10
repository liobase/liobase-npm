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


export const ALLOWED_FORMATS = ["jpeg", "jpg", "png", "webp", "avif"] as const;
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


export interface UploadImageOptions {
  name: string;
  originalFileName: string;
  folderName?: string;
  isActive?: boolean;
  transformations?: ImageTransformations;
}

export interface UploadImageApiMetadataRequest {
  projectId: string;
  name: string;
  folderId: string;
  originalFileName: string;
  isActive: boolean;
  transformations: ImageTransformations;
}

export interface UploadImageResponse {
  objectId: string;
}