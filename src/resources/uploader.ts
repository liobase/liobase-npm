import { BaseResource } from './base';
import { UploadObjectMetadata, UploadObjectResponse } from '../types';

export class UploaderResource extends BaseResource {
  /**
   * Uploads a file with associated metadata to /upload-object.
   * 
   * @param metadata The JSON metadata required by the server.
   * @param file The file object (File or Blob) to upload.
   */
  async uploadFile(metadata: UploadObjectMetadata, file: File | Blob): Promise<UploadObjectResponse> {
    const formData = new FormData();
    
    // Append the metadata part as a JSON string
    formData.append('metadata', JSON.stringify(metadata));
    
    // Append the file part (include the original filename to be safe)
    formData.append('file', file, metadata.originalFileName);

    return this.client.request<UploadObjectResponse>('/upload-object', {
      method: 'POST',
      body: formData,
    });
  }
}