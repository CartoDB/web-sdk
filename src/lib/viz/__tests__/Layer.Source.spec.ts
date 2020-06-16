import { Layer } from '@/viz/layer/Layer';
import { CARTOSource } from '@/viz/sources';
import { Deck } from '@deck.gl/core';
import { colorBinsStyle } from '@/viz/style/helpers/color-bins-style';
import { NumericFieldStats } from '@/viz/sources/Source';

const DEFAULT_DATASET = 'default_dataset';

const mockSourceInit = jest.fn().mockImplementation();
const mockSourceGetProps = jest.fn().mockImplementation();
const mockSourceGetMetadata = jest.fn().mockImplementation(() => {
  return {
    geometryType: 'Polygon',
    stats: [{} as NumericFieldStats]
  };
});

describe('Layer & Source instantiation', () => {
  let deckInstanceMock: Deck;

  beforeAll(() => {
    const deck = {
      props: {
        layers: []
      },
      setProps: null as unknown
    };
    deck.setProps = jest.fn().mockImplementation(props => {
      deck.props = { ...props };
    });

    deckInstanceMock = (deck as unknown) as Deck;

    CARTOSource.prototype.init = mockSourceInit;
    CARTOSource.prototype.getProps = mockSourceGetProps;
    CARTOSource.prototype.getMetadata = mockSourceGetMetadata;
  });

  afterEach(() => {
    mockSourceInit.mockClear();
    mockSourceGetProps.mockClear();
    mockSourceGetMetadata.mockClear();
  });

  it('should trigger a first Source init when adding the layer', async () => {
    const source = new CARTOSource(DEFAULT_DATASET);
    const layer = new Layer(source);
    await layer.addTo(deckInstanceMock);
    expect(mockSourceInit).toHaveBeenCalledTimes(1);
  });

  it('should trigger a second Source init when modifying styles requires it', async () => {
    const source = new CARTOSource(DEFAULT_DATASET);
    const layer = new Layer(source);
    await layer.addTo(deckInstanceMock);
    expect(mockSourceInit).toHaveBeenCalledTimes(1);

    const styleWithNewColumn = colorBinsStyle('attributeName');
    layer.setStyle(styleWithNewColumn);
    expect(mockSourceInit).toHaveBeenCalledTimes(2);
  });
});
