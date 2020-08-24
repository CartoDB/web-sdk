import { LegendProperties, LegendGeometryType, LegendWidgetOptions } from '@/viz/legend';
import { isEmpty } from '@/core/utils/variables';
import { StyledLayer } from '../layer-style';
import { Style, getStyles, BasicOptionsStyle } from '..';

export function basicStyle(options: Partial<BasicOptionsStyle> = {}) {
  const evalFN = async (layer: StyledLayer) => {
    const meta = layer.getSource().getMetadata();
    return getStyles(meta.geometryType, options);
  };

  const evalFNLegend = async (
    layer: StyledLayer,
    legendWidgetOptions: LegendWidgetOptions = { label: '' }
  ): Promise<LegendProperties[]> => {
    // TODO getMetadata throws an exception if source is empty. It could happen
    // if the user calls getLegendData layer method before ready event has been sent

    const meta = layer.getSource().getMetadata();

    if (!meta.geometryType) {
      return [];
    }

    const styles = getStyles(meta.geometryType, options) as any;
    const color = meta.geometryType === 'Line' ? styles.getLineColor : styles.getFillColor;

    if (styles.opacity) {
      color[color.length - 1] = styles.opacity * 255;
    }

    let { label } = legendWidgetOptions;

    if (isEmpty(label)) {
      label = layer.getId();
    }

    return [
      {
        type: meta.geometryType.toLocaleLowerCase() as LegendGeometryType,
        label,
        color: `rgba(${color.join(',')})`,
        strokeColor: styles.getLineColor ? `rgba(${styles.getLineColor.join(',')})` : undefined,
        width: styles.getSize
      }
    ];
  };

  return new Style(evalFN, undefined, evalFNLegend);
}
