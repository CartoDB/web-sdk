import { LegendProperties } from '@/viz/legend';
import { StyledLayer } from '../layer-style';
import { Style, getStyles, BasicOptionsStyle } from '..';

export function basicStyle(options: Partial<BasicOptionsStyle> = {}) {
  const evalFN = (layer: StyledLayer) => {
    const meta = layer.source.getMetadata();
    return getStyles(meta.geometryType, options);
  };

  const evalFNLegend = (layer: StyledLayer): LegendProperties[] => {
    return [{ type: 'point', width: 16, color: '#D4006E', label: 'Layer 1' }];
  };

  return new Style(evalFN, undefined, evalFNLegend);
}
