import { LegendProperties, LegendGeometryType } from '@/viz/legend';
import { StyledLayer } from '../layer-style';
import { Style, getStyles, BasicOptionsStyle } from '..';

export function basicStyle(options: Partial<BasicOptionsStyle> = {}) {
  const evalFN = (layer: StyledLayer) => {
    const meta = layer.source.getMetadata();
    return getStyles(meta.geometryType, options);
  };

  const evalFNLegend = (layer: StyledLayer, properties = {}): LegendProperties[] => {
    // TODO getMetadata throws an exception if source is empty. It could happen
    // if the user calls getLegendData layer method before ready event has been sent

    const meta = layer.source.getMetadata();

    if (!meta.geometryType) {
      return [];
    }

    return [
      {
        type: meta.geometryType.toLocaleLowerCase() as LegendGeometryType,
        color: options.color,
        strokeColor: options.strokeColor,
        width: options.size,
        ...properties
      }
    ];
  };

  return new Style(evalFN, undefined, evalFNLegend);
}
