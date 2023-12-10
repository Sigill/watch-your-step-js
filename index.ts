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
 * Logger interface.
 */
export interface Logger {
  /*
   * @param e The event.
   */
  log(e: StepEvent): void;
}

/**
 * Defaults logger that logs events using `console.log()`.
 */
export class ConsoleLogger implements Logger {
  private readonly useGroup: boolean;

  /**
   * @param useGroup Boolean indicating if [[`console.group`]] will be used. Defaults to false.
   */
  constructor({useGroup}: {useGroup?: boolean} = {}) {
    this.useGroup = useGroup ?? false;
  }

  log(e: StepEvent) {
    switch (e.type) {
      case StepEvents.SKIPPED: {
        console.log(e.reason ? `[SKIPPED] ${e.title} (${e.reason})` : `[SKIPPED] ${e.title}`);
      } break;
      case StepEvents.STARTED: {
        const message = `[STARTED] ${e.title}`;
        if (this.useGroup) {
          console.group(message);
        } else {
          console.log(message);
        }
      } break;
      case StepEvents.FULLFILLED: {
        console.groupEnd();
        console.log(`[SUCCESS] ${e.title} (${prettyMilliseconds(e.duration)})`);
      } break;
      case StepEvents.FAILED: {
        console.groupEnd();
        console.log(`[FAILURE] ${e.title} (${prettyMilliseconds(e.duration)})`);
      } break;
    }
  }
}

/**
 * A non skippable step.
 * @template T Return type of the action.
 */
export interface NonSkippableStep<T> {
  /** Title of the step. */
  title: string;

  /** The function to execute. */
  action: () => T;
}

/**
 * A step.
 * @template T Return type of the action.
 */
export interface Step<T> extends NonSkippableStep<T> {
  skip?: () => string | boolean;
}

function executeStep<T>(data: Step<T>, {logger}: {logger: Logger}): T | undefined {
  const start = new Date();

  const {title, action, skip} = data;

  const skipped = skip && skip();
  if (skipped) {
    logger.log({type: StepEvents.SKIPPED, date: new Date(), title, reason: typeof skipped === 'string' ? skipped : undefined});
    return;
  }

  logger.log({type: StepEvents.STARTED, title, date: start})

  return new ValueOrPromise(action)
    .then(
      (args) => { const date = new Date(); logger.log({type: StepEvents.FULLFILLED, title, date, duration: date.getTime() - start.getTime()}); return args; },
      (err) => { const date = new Date(); logger.log({type: StepEvents.FAILED, title, date, duration: date.getTime() - start.getTime()}); throw err; }
    )
    .resolve() as T;
}

/**
 * Prototype of the [[`step`]] function.
 */
export interface StepFunction {
  /**
   * Execute an action.
   *
   * @param title Title of the task.
   * @param action The action to execute.
   *
   * @returns The value returned by the action.
   */
  <T>(title: string, action: () => T): T;

  /**
   * Execute an action.
   *
   * @param specs Full configuration of the step.
   *
   * @returns The value returned by the action.
   */
  <T>(data: NonSkippableStep<T>): T;

  /**
   * Execute an action.
   *
   * @param specs Full configuration of the ste
   *
   * @returns The value returned by the action, or undefined if the action was skipped.
   */
  <T>(data: Step<T>): T | undefined;
}

/**
 * Helper to initialize a new [[`step()`]] function.
 *
 * @param logger The logger to use.
 *
 * @returns A `StepFunction`.
 */
export function makeStepFunction(logger: Logger): StepFunction {
  const opts = {logger};

  return function <T>(...args: any[]): T | undefined {
    if (typeof args[0] === 'string') {
      return executeStep({title: args[0], action: args[1]}, opts);
    } else {
      return executeStep(args[0], opts);
    }
  } as StepFunction;
}

/**
 * Default step function that uses a [[`ConsoleLogger`]].
 */
export const step = makeStepFunction(new ConsoleLogger());
