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

  // --- IMAGE UPLOADS ---

  it('should successfully upload an image as a Blob', async () => {
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
    expect(response.objectId).toBeDefined();
    expect(response.secure_url).toContain('https://cdn.liobase.com/public/');
  });

  it('should successfully upload an image as a Stream', async () => {
    const imageStream = fs.createReadStream(testFilePath);

    const response = await sdk.uploader.uploadImageStream(
      {
        name: 'Integration Test Stream Image',
        originalFileName: 'image.jpg',
        folderName: 'Home',
        isActive: false,
      },
      imageStream
    );

    expect(response).toBeDefined();
    expect(response.objectId).toBeDefined();
    expect(response.secure_url).toContain('https://cdn.liobase.com/public/');
  });

  // GENERIC FILE UPLOADS

  it('should successfully upload a file as a Blob', async () => {
    const fileBuffer = fs.readFileSync(testFilePath);
    const fileBlob = new Blob([fileBuffer], { type: 'application/octet-stream' });

    const response = await sdk.uploader.uploadFile(
      {
        name: 'Integration Test File',
        originalFileName: 'generic-file.bin',
        folderName: 'Home',
        isActive: false,
      },
      fileBlob
    );

    expect(response).toBeDefined();
    expect(response.objectId).toBeDefined();
    expect(response.secure_url).toContain('https://cdn.liobase.com/public/');
  });

  it('should successfully upload a file as a Stream', async () => {
    const fileStream = fs.createReadStream(testFilePath);

    const response = await sdk.uploader.uploadFileStream(
      {
        name: 'Integration Test Stream File',
        originalFileName: 'generic-file.bin',
        folderName: 'Home',
        isActive: false,
      },
      fileStream
    );

    expect(response).toBeDefined();
    expect(response.objectId).toBeDefined();
    expect(response.secure_url).toContain('https://cdn.liobase.com/public/');
  });
});