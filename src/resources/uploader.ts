import { Readable } from 'stream';
import { BaseResource } from './base';
import {
  BaseUploadOptions,
  BaseUploadMetadata,
  UploadFileOptions,
  UploadStreamOptions,
  UploadImageOptions,
  UniversalStream,
  UploadObjectResponse,
  UploadImageResponse
} from '../types/types';

export class UploaderResource extends BaseResource {
  private async resolveCollectionId(
    options: BaseUploadOptions
  ): Promise<string | undefined> {
    if (options.collectionId) {
      return options.collectionId;
    }

    if (options.collectionName) {
      return this.client.getCollectionId(
        options.collectionName
      );
    }

    return undefined;
  }

  private async buildBaseMetadata(
    options: BaseUploadOptions
  ): Promise<BaseUploadMetadata> {
    const targetFolderName =
      options.folderName ?? 'Home';

    const folderId =
      await this.client.getOrCreateFolderId(
        targetFolderName
      );

    const collectionId =
      await this.resolveCollectionId(options);

    return {
      projectId: this.client.getProjectId(),
      name: options.name,
      originalFileName: options.originalFileName,
      folderId,
      ...(collectionId && { collectionId }),
      isActive: options.isActive ?? true,
    };
  }

  private formatUploadResponse<
    T extends UploadObjectResponse | UploadImageResponse
  >(
    raw: { objectId: string }
  ): T {
    const projectId =
      this.client.getProjectId();

    const objectId = raw.objectId;

    return {
      objectId,
      public_id: objectId,
      secure_url:
        `https://cdn.liobase.com/public/${projectId}/${objectId}`,
    } as T;
  }

  private async executeStreamUpload(
    endpoint: string,
    metadata: Record<string, any>,
    originalFileName: string,
    stream: UniversalStream,
    fieldName: string = 'file'
  ): Promise<{ objectId: string }> {
    const boundary =
      `----LiobaseBoundary${Math.random()
        .toString(36)
        .substring(2)}`;

    const metadataPart =
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="metadata"\r\n` +
      `Content-Type: application/json\r\n\r\n` +
      `${JSON.stringify(metadata)}\r\n`;

    const fileHeaderPart =
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="${fieldName}"; filename="${originalFileName}"\r\n` +
      `Content-Type: application/octet-stream\r\n\r\n`;

    const footerPart =
      `\r\n--${boundary}--\r\n`;

    const encoder =
      new TextEncoder();

    let bodyStream:
      | ReadableStream
      | Readable;

    // Web Standard ReadableStream
    if (
      'getReader' in stream &&
      typeof stream.getReader === 'function'
    ) {
      const reader =
        stream.getReader();

      bodyStream =
        new ReadableStream<Uint8Array>({
          async start(controller) {
            controller.enqueue(
              encoder.encode(
                metadataPart
              )
            );

            controller.enqueue(
              encoder.encode(
                fileHeaderPart
              )
            );
          },

          async pull(controller) {
            try {
              const {
                done,
                value,
              } = await reader.read();

              if (done) {
                controller.enqueue(
                  encoder.encode(
                    footerPart
                  )
                );

                controller.close();
              } else {
                controller.enqueue(
                  value
                );
              }
            } catch (err) {
              controller.error(err);
            }
          },

          cancel(reason) {
            reader.cancel(reason);
          },
        });
    }

    // Node.js Readable
    else {
      bodyStream =
        Readable.from(
          (async function* () {
            yield Buffer.from(
              metadataPart,
              'utf-8'
            );

            yield Buffer.from(
              fileHeaderPart,
              'utf-8'
            );

            for await (
              const chunk of stream as Readable
            ) {
              yield typeof chunk === 'string'
                ? Buffer.from(chunk)
                : chunk;
            }

            yield Buffer.from(
              footerPart,
              'utf-8'
            );
          })()
        );
    }

    return this.client.request<{
      objectId: string;
    }>(
      endpoint,
      {
        method: 'POST',
        body: bodyStream as any,
        duplex: 'half',
        headers: {
          'Content-Type':
            `multipart/form-data; boundary=${boundary}`,
        },
      }
    );
  }

  /**
   * Uploads an in-memory File or Blob object.
   */
  async uploadFile(
    options: UploadFileOptions,
    file: File | Blob
  ): Promise<UploadObjectResponse> {
    const metadata =
      await this.buildBaseMetadata(
        options
      );

    const formData =
      new FormData();

    formData.append(
      'metadata',
      JSON.stringify(metadata)
    );

    formData.append(
      'file',
      file,
      options.originalFileName
    );

    const rawResponse =
      await this.client.request<{
        objectId: string;
      }>(
        '/upload-object',
        {
          method: 'POST',
          body: formData,
        }
      );

    return this.formatUploadResponse<UploadObjectResponse>(
      rawResponse
    );
  }

  /**
   * Uploads a file stream
   * (Node.js Readable or Web Standard ReadableStream).
   */
  async uploadFileStream(
    options: UploadStreamOptions,
    stream: UniversalStream
  ): Promise<UploadObjectResponse> {
    const metadata =
      await this.buildBaseMetadata(
        options
      );

    const rawResponse =
      await this.executeStreamUpload(
        '/upload-object',
        metadata,
        options.originalFileName,
        stream,
        'file'
      );

    return this.formatUploadResponse<UploadObjectResponse>(
      rawResponse
    );
  }

  /**
   * Uploads an in-memory image File or Blob object
   * with optional transformations.
   */
  async uploadImage(
    options: UploadImageOptions,
    file: File | Blob
  ): Promise<UploadImageResponse> {
    const baseMetadata =
      await this.buildBaseMetadata(
        options
      );

    const metadata = {
      ...baseMetadata,
      transformations:
        options.transformations ?? {},
    };

    const formData =
      new FormData();

    formData.append(
      'metadata',
      JSON.stringify(metadata)
    );

    formData.append(
      'image',
      file,
      options.originalFileName
    );

    const rawResponse =
      await this.client.request<{
        objectId: string;
      }>(
        '/upload-image',
        {
          method: 'POST',
          body: formData,
        }
      );

    return this.formatUploadResponse<UploadImageResponse>(
      rawResponse
    );
  }

  /**
   * Uploads an image stream
   * (Node.js Readable or Web Standard ReadableStream)
   * with optional transformations.
   */
  async uploadImageStream(
    options: UploadImageOptions,
    stream: UniversalStream
  ): Promise<UploadImageResponse> {
    const baseMetadata =
      await this.buildBaseMetadata(
        options
      );

    const metadata = {
      ...baseMetadata,
      transformations:
        options.transformations ?? {},
    };

    const rawResponse =
      await this.executeStreamUpload(
        '/upload-image',
        metadata,
        options.originalFileName,
        stream,
        'image'
      );

    return this.formatUploadResponse<UploadImageResponse>(
      rawResponse
    );
  }
}