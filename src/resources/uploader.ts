import { Readable } from 'stream';
import { BaseResource } from './base';
import { 
  UploadFileOptions, 
  UploadStreamOptions, 
  UploadObjectMetadata, 
  UploadObjectResponse 
} from '../types';

export class UploaderResource extends BaseResource {
  /**
   * Uploads an in-memory File or Blob object.
   */
  async uploadFile(options: UploadFileOptions, file: File | Blob): Promise<UploadObjectResponse> {
    const targetFolderName = options.folderName ?? 'Home';
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

  /**
   * True zero-RAM streaming upload method.
   * Pipes chunks directly from an incoming Node.js Readable stream or HTTP request.
   */
  async uploadFileStream(
    options: UploadStreamOptions,
    stream: Readable
  ): Promise<UploadObjectResponse> {
    const targetFolderName = options.folderName ?? 'Home';
    const folderId = await this.client.getOrCreateFolderId(targetFolderName);

    const metadata: UploadObjectMetadata = {
      projectId: this.client.getProjectId(),
      name: options.name,
      originalFileName: options.originalFileName,
      folderId: folderId,
      isActive: options.isActive ?? true,
    };

    // Construct a multipart stream dynamically using an async generator
    const boundary = `----LiobaseBoundary${Math.random().toString(36).substring(2)}`;

    const metadataPart = 
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="metadata"\r\n` +
      `Content-Type: application/json\r\n\r\n` +
      `${JSON.stringify(metadata)}\r\n`;

    const fileHeaderPart = 
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${options.originalFileName}"\r\n` +
      `Content-Type: application/octet-stream\r\n\r\n`;

    const footerPart = `\r\n--${boundary}--\r\n`;

    // Wrap in a Node Readable stream that yields parts on-demand
    const bodyStream = Readable.from(async function* () {
      yield Buffer.from(metadataPart, 'utf-8');
      yield Buffer.from(fileHeaderPart, 'utf-8');
      
      // Stream file chunks directly without collecting them in RAM
      for await (const chunk of stream) {
        yield typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
      }
      
      yield Buffer.from(footerPart, 'utf-8');
    }());

    return this.client.request<UploadObjectResponse>('/upload-object', {
      method: 'POST',
      // @ts-expect-error Node fetch accepts Readable streams with duplex: 'half'
      body: bodyStream,
      duplex: 'half',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
    });
  }
}