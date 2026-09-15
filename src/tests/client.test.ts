import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { LiobaseSDK } from '../client';

describe('LiobaseSDK Client', () => {
  let sdk: LiobaseSDK;

  beforeEach(() => {
    sdk = new LiobaseSDK();
    // Mock global fetch to intercept API calls
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should throw an error if config is called without API keys', () => {
    expect(() => {
      sdk.config({ apiKey: '', apiSecret: '' });
    }).toThrow('Both apiKey and apiSecret are required');
  });

  it('should throw an error if making a request before config', async () => {
    await expect(sdk.request('/test')).rejects.toThrow('SDK is not configured');
  });

  it('should initialize successfully and cache projectId, folders, and collections', async () => {
    // 1. Configure the SDK
    sdk.config({ apiKey: 'test_key', apiSecret: 'test_secret' });

    // 2. Mock the fetch responses
    const mockFetch = vi.mocked(global.fetch);

    // First call: /find-project-id
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ projectId: 'proj_123' })
    } as Response);

    // Second call: /all-folders (runs in Promise.all)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ folders: [{ folderId: 'fld_1', folderName: 'Home' }] })
    } as Response);

    // Third call: /all-collections (runs in Promise.all)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ collections: [{ collectionId: 'col_1', collectionName: 'Avatars' }] })
    } as Response);

    // 3. Trigger initialization
    await sdk.ensureInitialized();

    // 4. Assertions
    expect(sdk.getProjectId()).toBe('proj_123');
    
    // Test collection fetching helper
    const collections = await sdk.getCollections();
    expect(collections).toHaveLength(1);
    expect(collections[0].collectionName).toBe('Avatars');

    // Test folder caching
    const homeFolderId = await sdk.getOrCreateFolderId('Home');
    expect(homeFolderId).toBe('fld_1');
    
    // Ensure fetch was called exactly 3 times
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });
});