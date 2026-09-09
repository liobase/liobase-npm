import type { LiobaseSDK } from '../client';

export abstract class BaseResource {
  protected client: LiobaseSDK;

  constructor(client: LiobaseSDK) {
    this.client = client;
  }
}