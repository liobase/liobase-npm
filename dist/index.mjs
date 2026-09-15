// src/errors.ts
var ApiError = class extends Error {
  status;
  data;
  constructor(status, message, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
};

// src/resources/uploader.ts
import { Readable } from "stream";

// src/resources/base.ts
var BaseResource = class {
  client;
  constructor(client) {
    this.client = client;
  }
};

// src/resources/uploader.ts
var UploaderResource = class extends BaseResource {
  async resolveCollectionId(options) {
    if (options.collectionId) return options.collectionId;
    if (options.collectionName) return this.client.getCollectionId(options.collectionName);
    return void 0;
  }
  async buildBaseMetadata(options) {
    const targetFolderName = options.folderName ?? "Home";
    const folderId = await this.client.getOrCreateFolderId(targetFolderName);
    const collectionId = await this.resolveCollectionId(options);
    return {
      projectId: this.client.getProjectId(),
      name: options.name,
      originalFileName: options.originalFileName,
      folderId,
      ...collectionId && { collectionId },
      isActive: options.isActive ?? true
    };
  }
  formatUploadResponse(raw) {
    const projectId = this.client.getProjectId();
    const objectId = raw.objectId;
    return {
      objectId,
      public_id: objectId,
      secure_url: `https://cdn.liobase.com/public/${projectId}/${objectId}`
    };
  }
  async executeStreamUpload(endpoint, metadata, originalFileName, stream) {
    const boundary = `----LiobaseBoundary${Math.random().toString(36).substring(2)}`;
    const metadataPart = `--${boundary}\r
Content-Disposition: form-data; name="metadata"\r
Content-Type: application/json\r
\r
${JSON.stringify(metadata)}\r
`;
    const fileHeaderPart = `--${boundary}\r
Content-Disposition: form-data; name="file"; filename="${originalFileName}"\r
Content-Type: application/octet-stream\r
\r
`;
    const footerPart = `\r
--${boundary}--\r
`;
    const encoder = new TextEncoder();
    let bodyStream;
    if ("getReader" in stream && typeof stream.getReader === "function") {
      const reader = stream.getReader();
      bodyStream = new ReadableStream({
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
    } else {
      bodyStream = Readable.from((async function* () {
        yield Buffer.from(metadataPart, "utf-8");
        yield Buffer.from(fileHeaderPart, "utf-8");
        for await (const chunk of stream) {
          yield typeof chunk === "string" ? Buffer.from(chunk) : chunk;
        }
        yield Buffer.from(footerPart, "utf-8");
      })());
    }
    return this.client.request(endpoint, {
      method: "POST",
      body: bodyStream,
      duplex: "half",
      headers: { "Content-Type": `multipart/form-data; boundary=${boundary}` }
    });
  }
  /**
   * Uploads an in-memory File or Blob object.
   */
  async uploadFile(options, file) {
    const metadata = await this.buildBaseMetadata(options);
    const formData = new FormData();
    formData.append("metadata", JSON.stringify(metadata));
    formData.append("file", file, options.originalFileName);
    const rawResponse = await this.client.request("/upload-object", {
      method: "POST",
      body: formData
    });
    return this.formatUploadResponse(rawResponse);
  }
  /**
   * Uploads a file stream (Node.js Readable or Web Standard ReadableStream).
   */
  async uploadFileStream(options, stream) {
    const metadata = await this.buildBaseMetadata(options);
    const rawResponse = await this.executeStreamUpload(
      "/upload-object",
      metadata,
      options.originalFileName,
      stream
    );
    return this.formatUploadResponse(rawResponse);
  }
  /**
   * Uploads an in-memory image File or Blob object with optional transformations.
   */
  async uploadImage(options, file) {
    const baseMetadata = await this.buildBaseMetadata(options);
    const metadata = {
      ...baseMetadata,
      transformations: options.transformations ?? {}
    };
    const formData = new FormData();
    formData.append("metadata", JSON.stringify(metadata));
    formData.append("file", file, options.originalFileName);
    const rawResponse = await this.client.request("/upload-image", {
      method: "POST",
      body: formData
    });
    return this.formatUploadResponse(rawResponse);
  }
  /**
   * Uploads an image stream (Node.js Readable or Web Standard ReadableStream) with optional transformations.
   */
  async uploadImageStream(options, stream) {
    const baseMetadata = await this.buildBaseMetadata(options);
    const metadata = {
      ...baseMetadata,
      transformations: options.transformations ?? {}
    };
    const rawResponse = await this.executeStreamUpload(
      "/upload-image",
      metadata,
      options.originalFileName,
      stream
    );
    return this.formatUploadResponse(rawResponse);
  }
};

// src/client.ts
var LiobaseSDK = class {
  apiKey;
  apiSecret;
  baseUrl = "https://api.liobase.com/api";
  projectId;
  folderCache = /* @__PURE__ */ new Map();
  collectionCache = /* @__PURE__ */ new Map();
  initPromise = null;
  uploader;
  constructor() {
    this.uploader = new UploaderResource(this);
  }
  config(options) {
    if (!options.apiKey || !options.apiSecret) {
      throw new Error("Both apiKey and apiSecret are required in liobase.config().");
    }
    this.apiKey = options.apiKey;
    this.apiSecret = options.apiSecret;
    if (options.baseUrl) {
      this.baseUrl = options.baseUrl.replace(/\/$/, "");
    }
  }
  async ensureInitialized() {
    if (this.projectId) return;
    if (!this.initPromise) {
      this.initPromise = (async () => {
        try {
          const [projectData, foldersData, collectionsData] = await Promise.all([
            this.request("/find-project-id", { method: "GET" }),
            this.request("/all-folders", { method: "GET" }),
            this.request("/all-collections", { method: "GET" })
          ]);
          this.projectId = projectData.projectId;
          this.folderCache.clear();
          if (foldersData && Array.isArray(foldersData.folders)) {
            for (const item of foldersData.folders) {
              this.folderCache.set(item.folderName, item.folderId);
            }
          }
          this.collectionCache.clear();
          if (collectionsData && Array.isArray(collectionsData.collections)) {
            for (const item of collectionsData.collections) {
              this.collectionCache.set(item.collectionName, item.collectionId);
            }
          }
        } catch (err) {
          this.initPromise = null;
          throw err;
        }
      })();
    }
    return this.initPromise;
  }
  getProjectId() {
    if (!this.projectId) {
      throw new Error("SDK is not initialized. Call ensureInitialized() first.");
    }
    return this.projectId;
  }
  async getOrCreateFolderId(folderName = "Home") {
    await this.ensureInitialized();
    let folderId = this.folderCache.get(folderName);
    if (folderId) {
      return folderId;
    }
    const response = await this.request("/create-folder", {
      method: "POST",
      body: JSON.stringify({
        projectId: this.getProjectId(),
        name: folderName
      })
    });
    folderId = response.folderId;
    this.folderCache.set(folderName, folderId);
    return folderId;
  }
  /**
   * Resolves collection name to collection ID.
   * Throws an error if the collection does not exist.
   */
  async getCollectionId(collectionName) {
    await this.ensureInitialized();
    const collectionId = this.collectionCache.get(collectionName);
    if (!collectionId) {
      throw new Error(`Collection "${collectionName}" does not exist. Users cannot create new collections.`);
    }
    return collectionId;
  }
  /**
   * Returns all available collections for the configured project.
   */
  async getCollections() {
    await this.ensureInitialized();
    return Array.from(this.collectionCache.entries()).map(([collectionName, collectionId]) => ({
      collectionId,
      collectionName
    }));
  }
  async request(endpoint, options = {}) {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error("SDK is not configured. Call config() first.");
    }
    const formattedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${formattedEndpoint}`;
    const headers = {
      "Accept": "application/json",
      "API-Key": this.apiKey,
      "API-Secret": this.apiSecret,
      ...options.headers
    };
    if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        errorData.message || `Request failed with status ${response.status}`,
        errorData
      );
    }
    return response.json();
  }
};

// src/types/types.ts
var ALLOWED_FORMATS = ["jpeg", "jpg", "png", "webp", "avif"];

// src/index.ts
var liobase = new LiobaseSDK();
var index_default = liobase;
export {
  ALLOWED_FORMATS,
  ApiError,
  LiobaseSDK,
  index_default as default,
  liobase
};
