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
    const baseUrl = process.env.VITE_LIOBASE_BASE_URL || 'https://api.liobase.com/api';

    if (!apiKey || !apiSecret) {
      throw new Error('Missing VITE_LIOBASE_API_KEY or VITE_LIOBASE_API_SECRET in .env file.');
    }

    sdk = new LiobaseSDK();
    sdk.config({ apiKey, apiSecret, baseUrl });
    
    await sdk.ensureInitialized();
  });

  it('should successfully upload an image as a Blob', async () => {
    // Read local image and wrap in a Blob
    const fileBuffer = fs.readFileSync(testFilePath);
    const imageBlob = new Blob([fileBuffer], { type: 'image/jpeg' });

    const response = await sdk.uploader.uploadImage(
      {
        name: 'Integration Test Image',
        originalFileName: 'image.jpg',
        folderName: 'Home',
        isActive: false,
      },
      imageBlob
    );

    expect(response).toBeDefined();
  });
});