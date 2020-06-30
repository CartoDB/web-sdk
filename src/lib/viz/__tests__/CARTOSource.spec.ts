import { Credentials, defaultCredentials, setDefaultCredentials } from '@/auth';
import { Client } from '@/maps/Client';
import { CARTOSource } from '@/viz/sources/CARTOSource';

const TEST_CREDENTIALS = {
  username: 'test_username',
  apiKey: 'default_public',
  serverUrlTemplate: 'https://{user}.example.com'
};

const DEFAULT_DATASET = 'default_dataset';

describe('CARTOSource', () => {
  describe('Source creation', () => {
    it('should create a new Layer instance properly', () => {
      expect(() => new CARTOSource(DEFAULT_DATASET)).not.toThrow();
    });
  });

  describe('Credentials', () => {
    beforeEach(() => {
      setDefaultCredentials({ ...TEST_CREDENTIALS });
    });

    it('should use provided credentials', () => {
      const credentials = new Credentials(
        'not_default_username',
        'not_default_apikey',
        'https://notdefaultserver.com'
      );

      const source = new CARTOSource(DEFAULT_DATASET, { credentials });
      expect(source.credentials).toBe(credentials);
    });

    it('should use default credentials if not provided', () => {
      const source = new CARTOSource(DEFAULT_DATASET);
      expect(source.credentials).toBe(defaultCredentials);
    });
  });

  describe('Instantiation fails', () => {
    beforeEach(() => {
      setDefaultCredentials({ ...TEST_CREDENTIALS });

      Client.prototype.instantiateMapFrom = jest.fn().mockImplementation(() => {
        throw new Error('Error fake');
      });
    });

    it('should fail with error in instantiation', async () => {
      const source = new CARTOSource(DEFAULT_DATASET);

      expect(async () => {
        await source.init({ sample: new Set(), aggregation: new Set() });
      }).rejects.toEqual(new Error('Error fake'));
    });
  });
});
