import { BaseResource } from './base';
import { UploadFileOptions, UploadStreamOptions, UploadImageOptions, UniversalStream, UploadObjectResponse, UploadImageResponse } from '../types/types';
export declare class UploaderResource extends BaseResource {
    /**
     * Uploads an in-memory File or Blob object.
     */
    uploadFile(options: UploadFileOptions, file: File | Blob): Promise<UploadObjectResponse>;
    /**
     * True zero-RAM streaming upload method.
     * Supports Node.js Readable streams and Web Standard ReadableStreams.
     */
    uploadFileStream(options: UploadStreamOptions, stream: UniversalStream): Promise<UploadObjectResponse>;
    /**
     * Uploads an in-memory image File or Blob object with optional transformations.
     */
    uploadImage(options: UploadImageOptions, file: File | Blob): Promise<UploadImageResponse>;
    uploadImageStream(options: UploadImageOptions, stream: UniversalStream): Promise<UploadImageResponse>;
}
//# sourceMappingURL=uploader.d.ts.map