import { BaseResource } from './base';
import { UploadFileOptions, UploadStreamOptions, UniversalStream, UploadObjectResponse } from '../types/types';
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
}
//# sourceMappingURL=uploader.d.ts.map