import { BaseResource } from './base';
import { UploadFileOptions, UploadStreamOptions, UploadImageOptions, UniversalStream, UploadObjectResponse, UploadImageResponse } from '../types/types';
export declare class UploaderResource extends BaseResource {
    private resolveCollectionId;
    private buildBaseMetadata;
    private formatUploadResponse;
    private executeStreamUpload;
    /**
     * Uploads an in-memory File or Blob object.
     */
    uploadFile(options: UploadFileOptions, file: File | Blob): Promise<UploadObjectResponse>;
    /**
     * Uploads a file stream
     * (Node.js Readable or Web Standard ReadableStream).
     */
    uploadFileStream(options: UploadStreamOptions, stream: UniversalStream): Promise<UploadObjectResponse>;
    /**
     * Uploads an in-memory image File or Blob object
     * with optional transformations.
     */
    uploadImage(options: UploadImageOptions, file: File | Blob): Promise<UploadImageResponse>;
    /**
     * Uploads an image stream
     * (Node.js Readable or Web Standard ReadableStream)
     * with optional transformations.
     */
    uploadImageStream(options: UploadImageOptions, stream: UniversalStream): Promise<UploadImageResponse>;
}
//# sourceMappingURL=uploader.d.ts.map