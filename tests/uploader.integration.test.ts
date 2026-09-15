/// <reference types="node" />

import { describe, it, expect, beforeAll } from 'vitest';
import { LiobaseSDK } from '../src/client';
import fs from 'fs';
import path from 'path';

describe('UploaderResource Integration Tests', () => {
  let sdk: LiobaseSDK;
  const testFilePath = path.join(__dirname, 'mocks', 'image.jpg');

  beforeAll(async () => {
    const apiKey = process.env.VITE_LIOBASE_API_KEY;
    const apiSecret = process.env.VITE_LIOBASE_API_SECRET;
    const baseUrl = process.env.VITE_LIOBASE_BASE_URL || 'http://localhost:3000/api';

    if (!apiKey || !apiSecret) {
      throw new Error('Missing VITE_LIOBASE_API_KEY or VITE_LIOBASE_API_SECRET in .env file.');
    }

    sdk = new LiobaseSDK();
    sdk.config({ apiKey, apiSecret, baseUrl });
    
    await sdk.ensureInitialized();
  });

  it('should successfully upload an image as a Blob', async () => {
    // 1. Read the mock image file buffer
    const fileBuffer = fs.readFileSync(testFilePath);
    
    // 2. Convert buffer to a native Blob/File
    const imageBlob = new Blob([fileBuffer], { type: 'image/jpeg' });

    // 3. Upload via the Blob endpoint
    const response = await sdk.uploader.uploadImage(
      {
        name: 'Integration Test Blob Image',
        originalFileName: 'image.jpg',
        folderName: 'TestFolder',
      },
      imageBlob
    );

    // Verify response properties
    expect(response).toBeDefined();
    expect(response.objectId).toBeTruthy();
    expect(typeof response.objectId).toBe('string');
    expect(response.secure_url).toContain(response.objectId);
  });

  it('should successfully upload an image using a stream', async () => {
    const fileStream = fs.createReadStream(testFilePath);

    const response = await sdk.uploader.uploadImageStream(
      {
        name: 'Integration Test Stream Image',
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