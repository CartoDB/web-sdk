import { Credentials } from '../../core/Credentials';
import { MapOptions, Client } from '../Client';

describe('maps', () => {
  it('can be easily created', () => {
    const credentials = new Credentials('aUser', 'anApiKey');
    const m = new Client(credentials);
    expect(m).toBeTruthy();
  });

  describe('create a simple map', () => {
    it('fails without dataset or sql query', async () => {
      const credentials = new Credentials('aUser', 'anApiKey');
      const m = new Client(credentials);

      const mapOptions: MapOptions = {
        vectorExtent: 2048,
        vectorSimplifyExtent: 2048
      };

      await expect(m.instantiateMapFrom(mapOptions)).rejects.toThrowError(
        'Please provide a dataset or a SQL query'
      );
    });
  });
});
