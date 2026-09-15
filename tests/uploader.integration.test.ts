/// <reference types="node" />

import { describe, it, expect, beforeAll } from 'vitest';
import { LiobaseSDK } from '../src/client';
import fs from 'fs';
import path from 'path';

describe('UploaderResource Integration Tests', () => {
  let sdk: LiobaseSDK;
  const testFilePath = path.join(__dirname, 'mocks', 'image.jpg');

  beforeAll(async () => {
    // Read with the VITE_ prefix
    const apiKey = process.env.VITE_LIOBASE_API_KEY;
    const apiSecret = process.env.VITE_LIOBASE_API_SECRET;
    const baseUrl = process.env.VITE_LIOBASE_BASE_URL || 'http://localhost:8080';

    if (!apiKey || !apiSecret) {
      throw new Error('Missing VITE_LIOBASE_API_KEY or VITE_LIOBASE_API_SECRET in .env file.');
    }

    sdk = new LiobaseSDK();
    sdk.config({ apiKey, apiSecret, baseUrl });
    
    await sdk.ensureInitialized();
  });

  it('should successfully upload a real image using a stream', async () => {
    const fileStream = fs.createReadStream(testFilePath);

    const response = await sdk.uploader.uploadImageStream(
      {
        name: 'Integration Test Image',
        originalFileName: 'image.jpg',
        folderName: 'TestFolder',
      },
      fileStream
    );

    expect(response).toBeDefined();
    expect(response.objectId).toBeTruthy();
    expect(response.secure_url).toContain(response.objectId);
  });
});