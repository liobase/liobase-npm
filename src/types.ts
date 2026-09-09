export interface ClientOptions {
  apiKey: string;
  apiSecret: string;
  baseUrl?: string;
}

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