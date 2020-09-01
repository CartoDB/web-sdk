import React from 'react';
import { auth, viz } from '@carto/web-sdk';

class Map extends React.Component {
  map = null;

  componentDidMount() {
    auth.setDefaultCredentials({ username: 'public' });
    // this.map = viz.createMap();
    this.map = viz.createMap({
      basemap: 'darkmatter',
      view: { zoom: 4, longitude: 3, latitude: 40, pitch: 0, bearing: 0 },
      container: 'map'
    });

    const ports = new viz.Layer('world_ports');
    ports.addTo(this.map);
  }

  render() {
    return <div id="map">Map</div>;
  }
}

export default Map;
