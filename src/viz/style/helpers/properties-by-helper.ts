const stringLitArray = <L extends string>(arr: L[]) => arr;

const ColorProperty = stringLitArray(['color', 'strokeColor']);
type ColorProperty = typeof ColorProperty[number];
const isColorProperty = (x: any): x is ColorProperty => ColorProperty.includes(x);

const SizeProperty = stringLitArray(['size', 'strokeWidth']);
type SizeProperty = typeof SizeProperty[number];
const isSizeProperty = (x: any): x is SizeProperty => SizeProperty.includes(x);

export { ColorProperty, SizeProperty, isColorProperty, isSizeProperty };
