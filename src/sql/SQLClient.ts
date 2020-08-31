import { DEFAULT_ID_PROPERTY } from '@/viz/source/SQLSource';
import { Credentials } from '../auth';
import { encodeParameter, getRequest, postRequest } from '../core/utils/request-utils';
import errorHandlers from '../maps/errors';

const REQUEST_GET_MAX_URL_LENGTH = 2048;
export const GEOMETRY_WKT_ALIAS = 'the_geom_wkt';

export class SQLClient {
  private _credentials: Credentials;

  constructor(credentials: Credentials) {
    this._credentials = credentials;
  }

  public async getRowById(id: string, origin: string) {
    const sql = `SELECT *, ST_AsText(the_geom) as ${GEOMETRY_WKT_ALIAS} FROM (${origin}) as __cdb_orig WHERE ${DEFAULT_ID_PROPERTY} = '${id}'`;
    return this.execute(sql);
  }

  /**
   *
   * @param sql
   */
  public async execute(sql: string) {
    if (!sql) {
      throw new Error('Please provide an SQL query');
    }

    let response;

    try {
      response = await fetch(this.makeSQLApiRequest(sql));
    } catch (error) {
      throw new Error(
        `Failed to connect to Maps API with the user ('${this._credentials.username}'): ${error}`
      );
    }

    const result = (await response.json()) as never;

    if (!response.ok) {
      this.dealWithSQLApiErrors(response, result);
    }

    return result;
  }

  private makeSQLApiRequest(sql: string) {
    const encodedApiKey = encodeParameter('api_key', this._credentials.apiKey);
    const parameters = [encodedApiKey];
    const url = this.generateSQLApiUrl(parameters);

    const getUrl = `${url}&${encodeParameter('q', sql)}`;

    if (getUrl.length < REQUEST_GET_MAX_URL_LENGTH) {
      return getRequest(getUrl);
    }

    return postRequest(url, sql);
  }

  private dealWithSQLApiErrors(
    response: { status: number },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result: any
  ) {
    const errorForCode = errorHandlers[response.status];

    if (errorForCode) {
      errorForCode(this._credentials);
      return;
    }

    throw new Error(`${JSON.stringify(result.errors)}`);
  }

  private generateSQLApiUrl(parameters: string[] = []) {
    const base = `${this._credentials.serverURL}api/v1/sql`;
    return `${base}?${parameters.join('&')}`;
  }
}
