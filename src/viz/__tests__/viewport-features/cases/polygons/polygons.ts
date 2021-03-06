import { Vector3 } from '@math.gl/core';
import { ViewportFrustumPlanes } from '../../../../interactivity/viewport-features/geometry/types';
import tiles from './tiles.json';

export {
  name,
  tiles,
  viewportFeaturesColumns,
  viewportFeaturesResult,
  viewportFeaturesCount,
  viewportFeaturesCountWithCustomId,
  frustumPlanes
};

const name = 'Polygons';

const viewportFeaturesColumns = ['name', 'pop_est'];

const viewportFeaturesResult = [
  {
    name: 'New Zealand',
    pop_est: 4213418
  }
];
const viewportFeaturesCount = 1;
const viewportFeaturesCountWithCustomId = 3;
// :top fake 3 different features (same cartodb_id 166 for different portions but different custom_id)

const frustumPlanes: ViewportFrustumPlanes = {
  near: {
    distance: 48.06599592697578,
    normal: new Vector3(0, 0, 1)
  },
  far: {
    distance: 0.5149928135033051,
    normal: new Vector3(0, 0, -1)
  },
  right: {
    distance: 476.8705880716162,
    normal: new Vector3(0.9202638569211192, 0, 0.39129839463594246)
  },
  left: {
    distance: -436.56741583703763,
    normal: new Vector3(-0.9202638569211192, 0, 0.39129839463594246)
  },
  top: {
    distance: 200.317060301175,
    normal: new Vector3(0, 0.948683298050513, 0.3162277660168403)
  },
  bottom: {
    distance: -167.74605491539904,
    normal: new Vector3(0, -0.948683298050513, 0.3162277660168403)
  }
};
