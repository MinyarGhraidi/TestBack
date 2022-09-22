import { Exception } from "../../core";

/**
 * An exception indicating a session description handler error Occurred.
 * @public
 */
export class SessionDescriptionHandlerError extends Exception {
  public constructor(message?: string) {
    super(message ? message : "Unspecified session description handler error.");
  }
}
