const stringLitArray = <L extends string>(arr: L[]) => arr;

const colorsProperties = stringLitArray(['color', 'strokeColor']);
type ColorsProperties = typeof colorsProperties[number];
const isColorProperty = (x: any): x is ColorsProperties => colorsProperties.includes(x);

const sizeProperties = stringLitArray(['size', 'strokeWidth']);
type SizeProperties = typeof sizeProperties[number];
const isSizeProperty = (x: any): x is SizeProperties => sizeProperties.includes(x);

export { ColorsProperties, SizeProperties, isColorProperty, isSizeProperty };
