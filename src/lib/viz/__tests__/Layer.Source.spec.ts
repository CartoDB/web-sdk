import { Layer } from '@/viz/layer/Layer';
import { CARTOSource } from '@/viz/sources';
import { Deck } from '@deck.gl/core';
import { colorBinsStyle } from '@/viz/style/helpers/color-bins-style';
import { NumericFieldStats } from '@/viz/sources/Source';

const DEFAULT_DATASET = 'default_dataset';

const mockSourceInit = jest.fn().mockImplementation();
const mockGetMetadata = jest.fn().mockImplementation(() => {
  return {
    geometryType: 'Polygon',
    stats: [{} as NumericFieldStats]
  };
});

jest.mock('@/viz/sources/CARTOSource', () => ({
  CARTOSource: jest.fn().mockImplementation(() => ({
    isInitialized: false,
    init: mockSourceInit,
    // extra
    getProps: jest.fn(),
    getMetadata: mockGetMetadata,
    sourceType: 'CARTOSource'
  }))
}));

describe('Layer & Source instantiation', () => {
  let deckInstanceMock: Deck;

  beforeEach(() => {
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
  });

  it('should trigeer a first Source init when adding the layer', async () => {
    const source = new CARTOSource(DEFAULT_DATASET);
    const layer = new Layer(source);
    await layer.addTo(deckInstanceMock);
    expect(mockSourceInit).toHaveBeenCalled();
  });

  it('should trigeer a second Source init when modifying styles requires it', async () => {
    const source = new CARTOSource(DEFAULT_DATASET);
    const layer = new Layer(source);
    await layer.addTo(deckInstanceMock);
    mockSourceInit.mockClear();

    const styleWithNewColumn = colorBinsStyle('attributeName');
    layer.setStyle(styleWithNewColumn);
    expect(mockSourceInit).toHaveBeenCalledTimes(4);
  });
});
