// @ts-nocheck

const { CartStorage } = require("@timbouc/cart");
const Redis = require("ioredis");

class RedisStorage extends CartStorage {
   client;

  constructor(config) {
    super();
    const client = new Redis(config);
    this.client = client;
  }

  /**
   * Check if key exists
   */
  async has(key) {
    let value = await this.client.get(key);
    return !!value;
  }

  /**
   * Get cart item
   */
  async get(key) {
    return this.client.get(key);
  }

  /**
   * Put into storage
   */
  async put(key, value) {
    return this.client.set(key, value);
  }

  /**
   * Clear storage
   */
  async clear() {
    // return this.client.del(key)
  }
}

module.exports = {
  RedisStorage
}