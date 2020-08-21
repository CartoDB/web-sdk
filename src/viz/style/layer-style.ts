import { Deck } from '@deck.gl/core';
import { Source } from '@/viz';

export interface StyledLayer {
  getId(): string;
  getMap(): Deck;
  source: Source;
  // getSource(): Source;
}
