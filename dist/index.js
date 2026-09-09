"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  ApiError: () => ApiError,
  LiobaseSDK: () => LiobaseSDK,
  default: () => index_default,
  liobase: () => liobase
});
module.exports = __toCommonJS(index_exports);

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
var import_stream = require("stream");

// src/resources/base.ts
var BaseResource = class {
  client;
  constructor(client) {
    this.client = client;
  }
};

// src/resources/uploader.ts
var UploaderResource = class extends BaseResource {
  /**
   * Uploads an in-memory File or Blob object.
   */
  async uploadFile(options, file) {
    const targetFolderName = options.folderName ?? "Home";
    const folderId = await this.client.getOrCreateFolderId(targetFolderName);
    const metadata = {
      projectId: this.client.getProjectId(),
      name: options.name,
      originalFileName: options.originalFileName,
      folderId,
      isActive: options.isActive ?? true
    };
    const formData = new FormData();
    formData.append("metadata", JSON.stringify(metadata));
    formData.append("file", file, options.originalFileName);
    return this.client.request("/upload-object", {
      method: "POST",
      body: formData
    });
  }
  /**
   * True zero-RAM streaming upload method.
   * Supports Node.js Readable streams and Web Standard ReadableStreams.
   */
  async uploadFileStream(options, stream) {
    const targetFolderName = options.folderName ?? "Home";
    const folderId = await this.client.getOrCreateFolderId(targetFolderName);
    const metadata = {
      projectId: this.client.getProjectId(),
      name: options.name,
      originalFileName: options.originalFileName,
      folderId,
      isActive: options.isActive ?? true
    };
    const boundary = `----LiobaseBoundary${Math.random().toString(36).substring(2)}`;
    const metadataPart = `--${boundary}\r
Content-Disposition: form-data; name="metadata"\r
Content-Type: application/json\r
\r
${JSON.stringify(metadata)}\r
`;
    const fileHeaderPart = `--${boundary}\r
Content-Disposition: form-data; name="file"; filename="${options.originalFileName}"\r
Content-Type: application/octet-stream\r
\r
`;
    const footerPart = `\r
--${boundary}--\r
`;
    const encoder = new TextEncoder();
    if ("getReader" in stream && typeof stream.getReader === "function") {
      const reader = stream.getReader();
      const webStream = new ReadableStream({
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
      return this.client.request("/upload-object", {
        method: "POST",
        body: webStream,
        duplex: "half",
        headers: {
          "Content-Type": `multipart/form-data; boundary=${boundary}`
        }
      });
    }
    const bodyStream = import_stream.Readable.from((async function* () {
      yield Buffer.from(metadataPart, "utf-8");
      yield Buffer.from(fileHeaderPart, "utf-8");
      for await (const chunk of stream) {
        yield typeof chunk === "string" ? Buffer.from(chunk) : chunk;
      }
      yield Buffer.from(footerPart, "utf-8");
    })());
    return this.client.request("/upload-object", {
      method: "POST",
      // @ts-expect-error Native fetch accepts Readable streams with duplex: 'half'
      body: bodyStream,
      duplex: "half",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`
      }
    });
  }
};

// src/client.ts
var LiobaseSDK = class {
  apiKey;
  apiSecret;
  baseUrl = "https://api.liobase.com/api";
  projectId;
  folderCache = /* @__PURE__ */ new Map();
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
          const [projectData, foldersData] = await Promise.all([
            this.request("/find-project-id", { method: "GET" }),
            this.request("/all-folders", { method: "GET" })
          ]);
          this.projectId = projectData.projectId;
          this.folderCache.clear();
          if (foldersData && Array.isArray(foldersData.folders)) {
            for (const item of foldersData.folders) {
              this.folderCache.set(item.folderName, item.folderId);
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

// src/index.ts
var liobase = new LiobaseSDK();
var index_default = liobase;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ApiError,
  LiobaseSDK,
  liobase
});
