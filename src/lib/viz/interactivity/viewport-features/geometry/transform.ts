/* eslint-disable @typescript-eslint/ban-types */

import { Matrix4 } from '@math.gl/core';
import { CartoError } from '@/core/errors/CartoError';
import { Viewport } from '@deck.gl/core';
import { GeometryTypes, GeometryData } from './types';

const WORLD_SIZE = 512;

const transformFunctions: Record<string, Function> = {
  [GeometryTypes.Point](coordinates: GeoJSON.Position, fn: Function) {
    return fn(coordinates);
  },

  [GeometryTypes.MultiPoint](points: GeoJSON.Position[], fn: Function) {
    return points.map(point => transformFunctions.Point(point, fn));
  },

  [GeometryTypes.LineString](coordinates: GeoJSON.Position[], fn: Function) {
    return coordinates.map(coordinatePairs => transformFunctions.Point(coordinatePairs, fn));
  },

  [GeometryTypes.MultiLineString](lines: GeoJSON.Position[][], fn: Function) {
    return lines.map(line => transformFunctions.LineString(line, fn));
  },

  [GeometryTypes.Polygon](coordinates: GeoJSON.Position[][], fn: Function) {
    return coordinates.map(polygonRingCoordinates =>
      transformFunctions.LineString(polygonRingCoordinates, fn)
    );
  },

  [GeometryTypes.MultiPolygon](polygons: GeoJSON.Position[][][], fn: Function) {
    return polygons.map(polygon => transformFunctions.Polygon(polygon, fn));
  }
};

export function getTransformationMatrixFromTile(tile: { x: number; y: number; z: number }) {
  const worldScale = 2 ** tile.z;

  const xScale = WORLD_SIZE / worldScale;
  const yScale = -xScale;

  const xOffset = (WORLD_SIZE * tile.x) / worldScale;
  const yOffset = WORLD_SIZE * (1 - tile.y / worldScale);

  return new Matrix4().translate([xOffset, yOffset, 0]).scale([xScale, yScale, 1]);
}

export function transformGeometryCoordinatesToCommonSpaceByMatrix(
  geometry: GeometryData,
  matrix: Matrix4
) {
  const matrixFunction = (coordinates: GeoJSON.Position) => {
    return matrix.transformPoint(coordinates, undefined);
  };

  return transformGeometryCoordinatesToCommonSpace(geometry, matrixFunction);
}

export function transformGeometryCoordinatesToCommonSpaceByViewport(
  geometry: GeometryData,
  viewport: Viewport
) {
  const viewportFunction = (coordinates: GeoJSON.Position) => {
    return viewport.projectPosition(coordinates);
  };

  return transformGeometryCoordinatesToCommonSpace(geometry, viewportFunction);
}

function transformGeometryCoordinatesToCommonSpace(geometry: GeometryData, fn: Function) {
  const transformFunction = transformFunctions[geometry.type as GeometryTypes];

  if (!transformFunction) {
    throw new CartoError({
      type: 'ViewportFeatures',
      message: `Transformation to local coordinates from ${geometry.type} is not implemented`
    });
  }

  return {
    ...geometry,
    coordinates: transformFunction(geometry.coordinates, fn)
  };
}
