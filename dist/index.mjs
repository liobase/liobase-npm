// src/index.ts
var ApiClient = class {
  baseUrl;
  constructor(options) {
    this.baseUrl = options?.baseUrl || "https://api.com";
  }
  /**
   * Checks the health of the API endpoint.
   */
  async checkHealth() {
    const response = await fetch(`${this.baseUrl}/health`, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });
    if (!response.ok) {
      throw new Error(`Health check failed with status: ${response.status}`);
    }
    return response.json();
  }
};
export {
  ApiClient
};
