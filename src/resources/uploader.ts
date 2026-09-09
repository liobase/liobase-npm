// resources/uploader.ts
import { BaseResource } from './base';
import { UploadFileOptions, UploadObjectMetadata, UploadObjectResponse } from '../types';

export class UploaderResource extends BaseResource {
  /**
   * Uploads a file with associated options to /upload-object.
   * Automatically defaults to the "Home" folder and handles dynamic folder creation.
   */
  async uploadFile(options: UploadFileOptions, file: File | Blob): Promise<UploadObjectResponse> {
    const targetFolderName = options.folderName ?? 'Home';
    
    // Resolve or automatically create the folder on the server if missing
    const folderId = await this.client.getOrCreateFolderId(targetFolderName);

    const metadata: UploadObjectMetadata = {
      projectId: this.client.getProjectId(),
      name: options.name,
      originalFileName: options.originalFileName,
      folderId: folderId,
      isActive: options.isActive ?? true,
    };

    const formData = new FormData();
    formData.append('metadata', JSON.stringify(metadata));
    formData.append('file', file, options.originalFileName);

    return this.client.request<UploadObjectResponse>('/upload-object', {
      method: 'POST',
      body: formData,
    });
  }
}