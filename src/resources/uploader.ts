import { Readable } from 'stream';
import { BaseResource } from './base';
import { 
  UploadFileOptions, 
  UploadStreamOptions, 
  UploadImageOptions,
  UniversalStream,
  UploadObjectMetadata, 
  UploadImageApiMetadataRequest,
  UploadObjectResponse,
  UploadImageResponse 
} from '../types/types';

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
   * Supports Node.js Readable streams and Web Standard ReadableStreams.
   */
  async uploadFileStream(
    options: UploadStreamOptions,
    stream: UniversalStream
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

    const encoder = new TextEncoder();

    // Handle Web Standard ReadableStream (Next.js App Router, Cloudflare Workers, Fastly, fetch Request)
    if ('getReader' in stream && typeof stream.getReader === 'function') {
      const reader = stream.getReader();

      const webStream = new ReadableStream<Uint8Array>({
        async start(controller) {
          controller.enqueue(encoder.encode(metadataPart));
          controller.enqueue(encoder.encode(fileHeaderPart));
        },
        async pull(controller) {
          try {
            const { done, value } = await reader.read();
            if (done) {
              controller.enqueue(encoder.encode(footerPart));
              controller.close();
            } else {
              controller.enqueue(value);
            }
          } catch (err) {
            controller.error(err);
          }
        },
        cancel(reason) {
          reader.cancel(reason);
        }
      });

      return this.client.request<UploadObjectResponse>('/upload-object', {
        method: 'POST',
        body: webStream,
        duplex: 'half',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
      });
    }

    // Handle Node.js Readable stream (Express, Koa, Fastify, fs.createReadStream)
    const bodyStream = Readable.from(async function* () {
      yield Buffer.from(metadataPart, 'utf-8');
      yield Buffer.from(fileHeaderPart, 'utf-8');

      for await (const chunk of stream as Readable) {
        yield typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
      }

      yield Buffer.from(footerPart, 'utf-8');
    }());

    return this.client.request<UploadObjectResponse>('/upload-object', {
      method: 'POST',
      // @ts-expect-error Native fetch accepts Readable streams with duplex: 'half'
      body: bodyStream,
      duplex: 'half',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
    });
  }

  /**
   * Uploads an in-memory image File or Blob object with optional transformations.
   */
  async uploadImage(
    options: UploadImageOptions, 
    file: File | Blob
  ): Promise<UploadImageResponse> {
    const targetFolderName = options.folderName ?? 'Home';
    const folderId = await this.client.getOrCreateFolderId(targetFolderName);

    const metadata: UploadImageApiMetadataRequest = {
      projectId: this.client.getProjectId(),
      name: options.name,
      originalFileName: options.originalFileName,
      folderId: folderId,
      isActive: options.isActive ?? true,
      transformations: options.transformations ?? {},
    };

    const formData = new FormData();
    formData.append('metadata', JSON.stringify(metadata));
    formData.append('file', file, options.originalFileName);

    return this.client.request<UploadImageResponse>('/upload-image', {
      method: 'POST',
      body: formData,
    });
  }


  async uploadImageStream(
    options: UploadImageOptions,
    stream: UniversalStream
  ): Promise<UploadImageResponse> {
    const targetFolderName = options.folderName ?? 'Home';
    const folderId = await this.client.getOrCreateFolderId(targetFolderName);

    const metadata: UploadImageApiMetadataRequest = {
      projectId: this.client.getProjectId(),
      name: options.name,
      originalFileName: options.originalFileName,
      folderId: folderId,
      isActive: options.isActive ?? true,
      transformations: options.transformations ?? {},
    };

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

    const encoder = new TextEncoder();

    // Handle Web Standard ReadableStream (Next.js App Router, Cloudflare Workers, Fastly, fetch Request)
    if ('getReader' in stream && typeof stream.getReader === 'function') {
      const reader = stream.getReader();

      const webStream = new ReadableStream<Uint8Array>({
        async start(controller) {
          controller.enqueue(encoder.encode(metadataPart));
          controller.enqueue(encoder.encode(fileHeaderPart));
        },
        async pull(controller) {
          try {
            const { done, value } = await reader.read();
            if (done) {
              controller.enqueue(encoder.encode(footerPart));
              controller.close();
            } else {
              controller.enqueue(value);
            }
          } catch (err) {
            controller.error(err);
          }
        },
        cancel(reason) {
          reader.cancel(reason);
        }
      });

      return this.client.request<UploadImageResponse>('/upload-image', {
        method: 'POST',
        body: webStream,
        duplex: 'half',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
      });
    }

    // Handle Node.js Readable stream (Express, Koa, Fastify, fs.createReadStream)
    const bodyStream = Readable.from(async function* () {
      yield Buffer.from(metadataPart, 'utf-8');
      yield Buffer.from(fileHeaderPart, 'utf-8');

      for await (const chunk of stream as Readable) {
        yield typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
      }

      yield Buffer.from(footerPart, 'utf-8');
    }());

    return this.client.request<UploadImageResponse>('/upload-image', {
      method: 'POST',
      // @ts-expect-error Native fetch accepts Readable streams with duplex: 'half'
      body: bodyStream,
      duplex: 'half',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
    });
  }
}