/// <reference types="node" />

import { describe, it, expect, beforeAll } from 'vitest';
import { LiobaseSDK } from '../src/client';
import fs from 'fs';
import path from 'path';

describe('UploaderResource Integration Tests', () => {
  let sdk: LiobaseSDK;
  // Point to the static mock image
  const testFilePath = path.join(__dirname, 'mocks', 'image.jpg');

  beforeAll(async () => {
    const apiKey = process.env.LIOBASE_API_KEY;
    const apiSecret = process.env.LIOBASE_API_SECRET;
    const baseUrl = process.env.LIOBASE_BASE_URL || 'https://api.liobase.com/api';

    if (!apiKey || !apiSecret) {
      throw new Error('Missing LIOBASE_API_KEY or LIOBASE_API_SECRET in .env file.');
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