/// <reference types="node" />

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { LiobaseSDK } from '../src/client';
import fs from 'fs';
import path from 'path';

describe('UploaderResource Integration Tests', () => {
  let sdk: LiobaseSDK;
  const testFileName = 'temp-test-image.jpg';
  const testFilePath = path.join(__dirname, testFileName);

  beforeAll(async () => {
    // 1. Pull credentials from the .env file
    const apiKey = process.env.LIOBASE_API_KEY;
    const apiSecret = process.env.LIOBASE_API_SECRET;
    const baseUrl = process.env.LIOBASE_BASE_URL || 'http://localhost:8080';

    if (!apiKey || !apiSecret) {
      throw new Error('Missing LIOBASE_API_KEY or LIOBASE_API_SECRET in .env file.');
    }

    // 2. Configure the SDK
    sdk = new LiobaseSDK();
    sdk.config({ apiKey, apiSecret, baseUrl });

    // 3. Create a temporary dummy file for testing
    fs.writeFileSync(testFilePath, 'dummy-image-data-for-testing');
    
    // Ensure SDK is initialized before tests run
    await sdk.ensureInitialized();
  });

  afterAll(() => {
    // Clean up the temporary file after tests finish
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  });

  it('should successfully upload an image using a stream', async () => {
    const fileStream = fs.createReadStream(testFilePath);

    const response = await sdk.uploader.uploadImageStream(
      {
        name: 'Integration Test Image',
        originalFileName: testFileName,
        folderName: 'TestFolder',
        // Omit collectionName if you don't have a guaranteed collection on your local DB,
        // or ensure the collection exists before running the test.
      },
      fileStream
    );

    // Assert the response object structure and properties
    expect(response).toBeDefined();
    
    // Check that objectId and public_id exist and match
    expect(response.objectId).toBeTruthy();
    expect(typeof response.objectId).toBe('string');
    expect(response.public_id).toBe(response.objectId);

    // Check that the secure_url is formatted correctly
    expect(response.secure_url).toContain('https://cdn.liobase.com/public/');
    expect(response.secure_url).toContain(sdk.getProjectId());
    expect(response.secure_url).toContain(response.objectId);
  });

  it('should successfully upload an image using a Blob/File object', async () => {
    // Node 18+ has native global Blob support
    const fileBlob = new Blob(['dummy-image-data-for-testing'], { type: 'image/jpeg' });

    const response = await sdk.uploader.uploadImage(
      {
        name: 'Integration Test Blob',
        originalFileName: 'blob-test.jpg',
        folderName: 'TestFolder',
      },
      fileBlob
    );

    expect(response.objectId).toBeTruthy();
    expect(response.secure_url).toContain(response.objectId);
  });
});