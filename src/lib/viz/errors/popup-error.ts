import { CartoError } from '../../core/errors/CartoError';

/**
 * Utility to build a CartoError related to Popup errors.
 *
 * @return {CartoError} A well formed object representing the error.
 */

/**
 * CartoPopupError types:
 * - [Error]
 * - [Missing property]
 * - [Invalid coordinate]
 *
 * @name CartoPopupError
 * @memberof CartoError
 * @api
 */
export class CartoPopupError extends CartoError {
  constructor(message: string, type = popupErrorTypes.DEFAULT) {
    super({ message, type });
    this.name = 'CartoPopupError';
  }
}

export const popupErrorTypes = {
  DEFAULT: '[Error]',
  PROPERTY_MISSING: '[Missing property]',
  FORMAT_INVALID: '[Invalid format]',
  COORDINATE_INVALID: '[Invalid coordinate]'
};
