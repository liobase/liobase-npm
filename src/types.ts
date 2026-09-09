export interface ClientOptions {
  apiKey: string;
  apiSecret: string;
  baseUrl?: string;
}

export interface FolderItem {
  folderName: string;
  folderId: string;
}

export interface FindProjectResponse {
  projectId: string;
}

// User-facing options (folderName is optional and defaults to "/")
export interface UploadFileOptions {
  name: string;
  originalFileName: string;
  folderName?: string;
  isActive?: boolean;
}

// Low-level metadata required by the API server
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