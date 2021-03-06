import prettyMilliseconds from 'pretty-ms';
import { ValueOrPromise } from 'value-or-promise';

export enum StepEvents {
  SKIPPED = 'SKIPPED',
  STARTED = 'STARTED',
  FULLFILLED = 'FULLFILLED',
  FAILED = 'FAILED'
}

/** Base event type. */
export interface BaseStepEvent {
  /** Title of the step. */
  title: string;

  /** Date of the event. */
  date: Date;
}

export interface StepStartedEvent extends BaseStepEvent {
  type: StepEvents.STARTED;
}

export interface StepSkippedEvent extends BaseStepEvent {
  type: StepEvents.SKIPPED;

  /** Reason why the step was skipped. */
  reason?: string;
}

export interface StepSettledEvent extends BaseStepEvent {
  /** Duration of the step. */
  duration: number;
}

export interface StepFullfilledEvent extends StepSettledEvent {
  type: StepEvents.FULLFILLED;
}

export interface StepFailedEvent extends StepSettledEvent {
  type: StepEvents.FAILED;
}

/** Type of all events passed to the log function. */
export type StepEvent = StepStartedEvent | StepSkippedEvent | StepFullfilledEvent | StepFailedEvent;

/**
 * Defaults log function that logs events using `console.log()`.
 *
 * @param e The event.
 */
export function defaultLogFunction(e: StepEvent) {
  switch (e.type) {
    case StepEvents.SKIPPED: {
      console.log(e.reason ? `[SKIPPED] ${e.title} (${e.reason})` : `[SKIPPED] ${e.title}`);
    } break;
    case StepEvents.STARTED: {
      console.log(`[STARTED] ${e.title}`);
    } break;
    case StepEvents.FULLFILLED: {
      console.log(`[SUCCESS] ${e.title} (${prettyMilliseconds(e.duration)})`);
    } break;
    case StepEvents.FAILED: {
      console.log(`[FAILURE] ${e.title} (${prettyMilliseconds(e.duration)})`);
    } break;
  }
}

/**
 * A non skippable step.
 * @template T Return type of the step.
 */
export interface NonSkippableStep<T> {
  /** Title of the step. */
  title: string;

  /** The function to execute. */
  action: () => T;
}

/**
 * A step.
 * @template T Return type of the step.
 */
export interface Step<T> extends NonSkippableStep<T> {
  skip?: () => string | boolean;
}

/** Options accepted by [[`step`]]. */
interface StepOptions {
  logFunction?: (e: StepEvent) => void;
}

 export interface StepShortFunction {
  <T>(title: string, action: () => T): T;
}

export interface StepLongFunction {
  <T>(data: NonSkippableStep<T>): T;
  <T>(data: Step<T>): T | undefined;
}

export interface StepFunctionCommon {
  <T>(...args: any[]): T | undefined;
}

/**
 * Minimal prototype of the [[`step`]] function (without options).
 *
 * Use it when you need to define a customized version of [[`step`]].
 *
 * See [[`step`]] for more details about the various prototypes.
 *
 * @example
 * ```typescript
 * function customLogFunction(e: StepEvent) { ... }
 * const customStep = ((...args: any[]) => (step as StepGenericPrototype)(...args, {logFunction: log})) as StepFunction;
 * ```
 */
export interface StepFunction extends StepShortFunction, StepLongFunction {}

export function step_impl<T>(data: Step<T>, options: StepOptions = {}): T | undefined {
  const start = new Date();

  const {title, action, skip} = data;
  const {logFunction: log = defaultLogFunction} = options;

  const skipped = skip && skip();
  if (skipped) {
    log({type: StepEvents.SKIPPED, date: new Date(), title, reason: typeof skipped === 'string' ? skipped : undefined});
    return;
  }

  log({type: StepEvents.STARTED, title, date: start})

  return new ValueOrPromise(action)
    .then(
      (args) => { const date = new Date(); log({type: StepEvents.FULLFILLED, title, date, duration: date.getTime() - start.getTime()}); return args; },
      (err) => { const date = new Date(); log({type: StepEvents.FAILED, title, date, duration: date.getTime() - start.getTime()}); throw err; }
    )
    .resolve() as T;
}

/**
 * Execute an action.
 *
 * @param title Title of the task.
 * @param action The action to execute.
 * @param options
 *
 * @returns The value returned by the action.
 */
export function step<T>(title: string, action: () => T, options?: StepOptions): T;

/**
 * Execute an action.
 *
 * @param specs Full configuration of the step.
 * @param options
 *
 * @returns The value returned by the action.
 */
export function step<T>(specs: NonSkippableStep<T>, options?: StepOptions): T;

/**
 * Execute an action.
 *
 * @param specs Full configuration of the ste
 * @param options
 *
 * @returns The value returned by the action, or undefined if the action was skipped.
 */
export function step<T>(specs: Step<T>, options?: StepOptions): T | undefined;

export function step<T>(...args: any[]): T | undefined {
  if (typeof args[0] === 'string') {
    return step_impl({title: args[0], action: args[1]}, args[2] || {});
  } else {
    return step_impl(args[0], args[1] || {});
  }
}
