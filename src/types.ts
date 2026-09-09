// types.ts
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

export interface CreateFolderApiRequest {
  projectId: string;
  name: string;
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