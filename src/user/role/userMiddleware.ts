/**
 * User Middleware Module
 * Implements custom middleware for the Kibo Commerce SDK with request/response logging
 * and direct HTTP fetch capabilities for the AdminUser API.
 *
 * The middleware intercepts API calls to log request/response details and provides
 * a helper method for performing direct HTTP requests to bypass SDK wrapper methods
 * when needed for custom query parameters or response handling.
 *
 * @module userMiddleware
 * @exports UserMiddleware - Custom middleware class
 */

import {
  Middleware,
  RequestContext,
  ResponseContext,
  FetchParams,
  ErrorContext,
} from "@kibocommerce/rest-sdk/types";

/**
 * Custom Middleware for Kibo Commerce SDK
 * Implements the Middleware interface for request/response interception and logging.
 * Also provides direct HTTP fetch capability for the AdminUser API.
 *
 * @class UserMiddleware
 * @implements {Middleware}
 */
export class UserMiddleware implements Middleware {
  /**
   * Pre-request middleware hook.
   * Logs outgoing API requests with HTTP method and URL.
   * Called before the API request is sent.
   *
   * @async
   * @param {RequestContext} context - The request context containing method, URL, headers, etc.
   * @returns {Promise<FetchParams | void>} Optional fetch parameters or undefined
   *
   * @example
   * // Automatically called by SDK before each request
   * // Logs: "sending METHOD: GET URL: https://api.example.com/..."
   */
  public async pre(context: RequestContext): Promise<FetchParams | void> {
    console.log(`sending METHOD: ${context.init.method} URL: ${context.url}`);
    return;
  }

  /**
   * Post-response middleware hook.
   * Logs incoming API responses with HTTP status code.
   * Called after the API response is received.
   *
   * @async
   * @param {ResponseContext} context - The response context containing status code and response object
   * @returns {Promise<Response | void>} Optional response override or undefined
   *
   * @example
   * // Automatically called by SDK after each response
   * // Logs: "response STATUS: 200"
   */
  public async post(context: ResponseContext): Promise<Response | void> {
    try {
      console.log(`response STATUS: ${context.response.status}`);
    } catch (e) {
      // Silently ignore logging errors
    }
    return;
  }

  /**
   * Error middleware hook.
   * Logs any errors that occur during the API request/response cycle.
   * Called when an error occurs in the request pipeline.
   *
   * @async
   * @param {ErrorContext} context - The error context containing the error object
   * @returns {Promise<Response | void>} Optional response override or undefined
   *
   * @example
   * // Automatically called by SDK on request/response errors
   * // Logs: "logging error TypeError: Network error"
   */
  public async onError(context: ErrorContext): Promise<Response | void> {
    console.error("logging error", context.error);
  }
}
