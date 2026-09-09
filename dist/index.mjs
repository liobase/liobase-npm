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

// src/resources/base.ts
var BaseResource = class {
  client;
  constructor(client) {
    this.client = client;
  }
};

// src/resources/uploader.ts
var UploaderResource = class extends BaseResource {
  // for uploading to api
};

// src/client.ts
var LiobaseSDK = class {
  apiKey;
  apiSecret;
  baseUrl = "https://api.liobase.com/api";
  uploader;
  constructor() {
    this.uploader = new UploaderResource(this);
  }
  /**
   * Configure the global SDK with your API credentials
   */
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
  /**
   * Internal request engine
   */
  async request(endpoint, options = {}) {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error(
        "liobase is not configured. Call liobase.config({ apiKey, apiSecret }) before calling API endpoints."
      );
    }
    const formattedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${formattedEndpoint}`;
    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "API-Key": this.apiKey,
      "API-Secret": this.apiSecret,
      ...options.headers
    };
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
export {
  ApiError,
  index_default as default,
  liobase
};
