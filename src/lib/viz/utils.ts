/*
    A generic data source event might be emitted by a 'Source' or a 'Layer'.
    For some operations (eg. DataView related ones) they can have a similar behaviour
*/
export enum GenericDataSourceEvent {
  FILTER_CHANGE = 'filterChange'
}
