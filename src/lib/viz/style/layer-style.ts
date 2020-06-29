import { Deck } from '@deck.gl/core';
import { Source } from '@/source';

export interface StyledLayer {
  getMapInstance(): Deck;
  source: Source;
}
