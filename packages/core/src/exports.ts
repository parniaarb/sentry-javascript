import type {
  Breadcrumb,
  BreadcrumbHint,
  CaptureContext,
  CheckIn,
  Client,
  CustomSamplingContext,
  Event,
  EventHint,
  Extra,
  Extras,
  FinishedCheckIn,
  MonitorConfig,
  Primitive,
  Severity,
  SeverityLevel,
  TransactionContext,
  User,
} from '@sentry/types';
import { isThenable, logger, timestampInSeconds, uuid4 } from '@sentry/utils';

import { DEBUG_BUILD } from './debug-build';
import type { Hub } from './hub';
import { getCurrentHub } from './hub';
import type { Scope } from './scope';
import type { ExclusiveEventHintOrCaptureContext } from './utils/prepareEvent';
import { parseEventHintOrCaptureContext } from './utils/prepareEvent';

// Note: All functions in this file are typed with a return value of `ReturnType<Hub[HUB_FUNCTION]>`,
// where HUB_FUNCTION is some method on the Hub class.
//
// This is done to make sure the top level SDK methods stay in sync with the hub methods.
// Although every method here has an explicit return type, some of them (that map to void returns) do not
// contain `return` keywords. This is done to save on bundle size, as `return` is not minifiable.

/**
 * Captures an exception event and sends it to Sentry.
 * This accepts an event hint as optional second parameter.
 * Alternatively, you can also pass a CaptureContext directly as second parameter.
 */
export function captureException(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  exception: any,
  hint?: ExclusiveEventHintOrCaptureContext,
): ReturnType<Hub['captureException']> {
  return getCurrentHub().captureException(exception, parseEventHintOrCaptureContext(hint));
}

/**
 * Captures a message event and sends it to Sentry.
 *
 * @param message The message to send to Sentry.
 * @param Severity Define the level of the message.
 * @returns The generated eventId.
 */
export function captureMessage(
  message: string,
  // eslint-disable-next-line deprecation/deprecation
  captureContext?: CaptureContext | Severity | SeverityLevel,
): ReturnType<Hub['captureMessage']> {
  // This is necessary to provide explicit scopes upgrade, without changing the original
  // arity of the `captureMessage(message, level)` method.
  const level = typeof captureContext === 'string' ? captureContext : undefined;
  const context = typeof captureContext !== 'string' ? { captureContext } : undefined;
  return getCurrentHub().captureMessage(message, level, context);
}

/**
 * Captures a manually created event and sends it to Sentry.
 *
 * @param event The event to send to Sentry.
 * @returns The generated eventId.
 */
export function captureEvent(event: Event, hint?: EventHint): ReturnType<Hub['captureEvent']> {
  return getCurrentHub().captureEvent(event, hint);
}

/**
 * Callback to set context information onto the scope.
 * @param callback Callback function that receives Scope.
 *
 * @deprecated Use getCurrentScope() directly.
 */
export function configureScope(callback: (scope: Scope) => void): ReturnType<Hub['configureScope']> {
  // eslint-disable-next-line deprecation/deprecation
  getCurrentHub().configureScope(callback);
}

/**
 * Records a new breadcrumb which will be attached to future events.
 *
 * Breadcrumbs will be added to subsequent events to provide more context on
 * user's actions prior to an error or crash.
 *
 * @param breadcrumb The breadcrumb to record.
 */
export function addBreadcrumb(breadcrumb: Breadcrumb, hint?: BreadcrumbHint): ReturnType<Hub['addBreadcrumb']> {
  getCurrentHub().addBreadcrumb(breadcrumb, hint);
}

/**
 * Sets context data with the given name.
 * @param name of the context
 * @param context Any kind of data. This data will be normalized.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setContext(name: string, context: { [key: string]: any } | null): ReturnType<Hub['setContext']> {
  getCurrentHub().setContext(name, context);
}

/**
 * Set an object that will be merged sent as extra data with the event.
 * @param extras Extras object to merge into current context.
 */
export function setExtras(extras: Extras): ReturnType<Hub['setExtras']> {
  getCurrentHub().setExtras(extras);
}

/**
 * Set key:value that will be sent as extra data with the event.
 * @param key String of extra
 * @param extra Any kind of data. This data will be normalized.
 */
export function setExtra(key: string, extra: Extra): ReturnType<Hub['setExtra']> {
  getCurrentHub().setExtra(key, extra);
}

/**
 * Set an object that will be merged sent as tags data with the event.
 * @param tags Tags context object to merge into current context.
 */
export function setTags(tags: { [key: string]: Primitive }): ReturnType<Hub['setTags']> {
  getCurrentHub().setTags(tags);
}

/**
 * Set key:value that will be sent as tags data with the event.
 *
 * Can also be used to unset a tag, by passing `undefined`.
 *
 * @param key String key of tag
 * @param value Value of tag
 */
export function setTag(key: string, value: Primitive): ReturnType<Hub['setTag']> {
  getCurrentHub().setTag(key, value);
}

/**
 * Updates user context information for future events.
 *
 * @param user User context object to be set in the current context. Pass `null` to unset the user.
 */
export function setUser(user: User | null): ReturnType<Hub['setUser']> {
  getCurrentHub().setUser(user);
}

/**
 * Creates a new scope with and executes the given operation within.
 * The scope is automatically removed once the operation
 * finishes or throws.
 *
 * This is essentially a convenience function for:
 *
 *     pushScope();
 *     callback();
 *     popScope();
 *
 * @param callback that will be enclosed into push/popScope.
 */
export function withScope<T>(callback: (scope: Scope) => T): T {
  return getCurrentHub().withScope(callback);
}

/**
 * Starts a new `Transaction` and returns it. This is the entry point to manual tracing instrumentation.
 *
 * A tree structure can be built by adding child spans to the transaction, and child spans to other spans. To start a
 * new child span within the transaction or any span, call the respective `.startChild()` method.
 *
 * Every child span must be finished before the transaction is finished, otherwise the unfinished spans are discarded.
 *
 * The transaction must be finished with a call to its `.end()` method, at which point the transaction with all its
 * finished child spans will be sent to Sentry.
 *
 * NOTE: This function should only be used for *manual* instrumentation. Auto-instrumentation should call
 * `startTransaction` directly on the hub.
 *
 * @param context Properties of the new `Transaction`.
 * @param customSamplingContext Information given to the transaction sampling function (along with context-dependent
 * default values). See {@link Options.tracesSampler}.
 *
 * @returns The transaction which was just started
 */
export function startTransaction(
  context: TransactionContext,
  customSamplingContext?: CustomSamplingContext,
): ReturnType<Hub['startTransaction']> {
  return getCurrentHub().startTransaction({ ...context }, customSamplingContext);
}

/**
 * Create a cron monitor check in and send it to Sentry.
 *
 * @param checkIn An object that describes a check in.
 * @param upsertMonitorConfig An optional object that describes a monitor config. Use this if you want
 * to create a monitor automatically when sending a check in.
 */
export function captureCheckIn(checkIn: CheckIn, upsertMonitorConfig?: MonitorConfig): string {
  const scope = getCurrentScope();
  const client = getClient();
  if (!client) {
    DEBUG_BUILD && logger.warn('Cannot capture check-in. No client defined.');
  } else if (!client.captureCheckIn) {
    DEBUG_BUILD && logger.warn('Cannot capture check-in. Client does not support sending check-ins.');
  } else {
    return client.captureCheckIn(checkIn, upsertMonitorConfig, scope);
  }

  return uuid4();
}

/**
 * Wraps a callback with a cron monitor check in. The check in will be sent to Sentry when the callback finishes.
 *
 * @param monitorSlug The distinct slug of the monitor.
 * @param upsertMonitorConfig An optional object that describes a monitor config. Use this if you want
 * to create a monitor automatically when sending a check in.
 */
export function withMonitor<T>(
  monitorSlug: CheckIn['monitorSlug'],
  callback: () => T,
  upsertMonitorConfig?: MonitorConfig,
): T {
  const checkInId = captureCheckIn({ monitorSlug, status: 'in_progress' }, upsertMonitorConfig);
  const now = timestampInSeconds();

  function finishCheckIn(status: FinishedCheckIn['status']): void {
    captureCheckIn({ monitorSlug, status, checkInId, duration: timestampInSeconds() - now });
  }

  let maybePromiseResult: T;
  try {
    maybePromiseResult = callback();
  } catch (e) {
    finishCheckIn('error');
    throw e;
  }

  if (isThenable(maybePromiseResult)) {
    Promise.resolve(maybePromiseResult).then(
      () => {
        finishCheckIn('ok');
      },
      () => {
        finishCheckIn('error');
      },
    );
  } else {
    finishCheckIn('ok');
  }

  return maybePromiseResult;
}

/**
 * Call `flush()` on the current client, if there is one. See {@link Client.flush}.
 *
 * @param timeout Maximum time in ms the client should wait to flush its event queue. Omitting this parameter will cause
 * the client to wait until all events are sent before resolving the promise.
 * @returns A promise which resolves to `true` if the queue successfully drains before the timeout, or `false` if it
 * doesn't (or if there's no client defined).
 */
export async function flush(timeout?: number): Promise<boolean> {
  const client = getClient();
  if (client) {
    return client.flush(timeout);
  }
  DEBUG_BUILD && logger.warn('Cannot flush events. No client defined.');
  return Promise.resolve(false);
}

/**
 * Call `close()` on the current client, if there is one. See {@link Client.close}.
 *
 * @param timeout Maximum time in ms the client should wait to flush its event queue before shutting down. Omitting this
 * parameter will cause the client to wait until all events are sent before disabling itself.
 * @returns A promise which resolves to `true` if the queue successfully drains before the timeout, or `false` if it
 * doesn't (or if there's no client defined).
 */
export async function close(timeout?: number): Promise<boolean> {
  const client = getClient();
  if (client) {
    return client.close(timeout);
  }
  DEBUG_BUILD && logger.warn('Cannot flush events and disable SDK. No client defined.');
  return Promise.resolve(false);
}

/**
 * This is the getter for lastEventId.
 *
 * @returns The last event id of a captured event.
 */
export function lastEventId(): string | undefined {
  return getCurrentHub().lastEventId();
}

/**
 * Get the currently active client.
 */
export function getClient<C extends Client>(): C | undefined {
  return getCurrentHub().getClient<C>();
}

/**
 * Get the currently active scope.
 */
export function getCurrentScope(): Scope {
  return getCurrentHub().getScope();
}
