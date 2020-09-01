import { MapsApiClient, MapOptions } from '@/maps';
import { Credentials } from '../../auth';

describe('maps', () => {
  it('can be easily created', () => {
    const credentials = new Credentials('aUser', 'anApiKey');
    const m = new MapsApiClient(credentials);
    expect(m).toBeTruthy();
  });

  describe('create a simple map', () => {
    it('fails without dataset or sql query', async () => {
      const credentials = new Credentials('aUser', 'anApiKey');
      const m = new MapsApiClient(credentials);

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
