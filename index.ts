import prettyMilliseconds from 'pretty-ms';
import { ValueOrPromise } from 'value-or-promise';

interface BaseEvent {
  title: string;
  date: Date;
}

interface StartEvent extends BaseEvent {
  type: 'start';
}

interface SkipEvent extends BaseEvent {
  type: 'skip';
  reason?: string;
}

interface SuccessEvent extends BaseEvent {
  type: 'success';
  duration: number;
}

interface FailureEvent extends BaseEvent {
  type: 'failure';
  duration: number;
}

export type Event = StartEvent | SkipEvent | SuccessEvent | FailureEvent;

export function defaultLogFunction(event: Event) {
  switch (event.type) {
    case 'skip': {
      console.log(event.reason ? `[SKIPPED] ${event.title} (${event.reason})` : `[SKIPPED] ${event.title}`);
    } break;
    case 'start': {
      console.log(`[STARTED] ${event.title}`);
    } break;
    case 'success': {
      console.log(`[SUCCESS] ${event.title} (${prettyMilliseconds(event.duration)})`);
    } break;
    case 'failure': {
      console.log(`[FAILURE] ${event.title} (${prettyMilliseconds(event.duration)})`);
    } break;
  }
}
interface NonSkippableStepSpecs<T> {
  title: string;
  action: () => T;
}

interface StepSpecs<T> extends NonSkippableStepSpecs<T> {
  skip?: () => string | boolean;
}

type SkippableStepSpecs<T> = Required<StepSpecs<T>>;

interface StepOptions {
  logFunction?: (event: Event) => void;
}

export interface StepFunction {
  <T>(data: NonSkippableStepSpecs<T>): T;
  <T>(data: NonSkippableStepSpecs<Promise<T>>): Promise<T>;
  <T>(data: SkippableStepSpecs<T>): T | undefined;
  <T>(data: SkippableStepSpecs<Promise<T>>): Promise<T> | undefined;
}

export function step<T>(data: NonSkippableStepSpecs<T>, options?: StepOptions): T;
export function step<T>(data: NonSkippableStepSpecs<Promise<T>>, options?: StepOptions): Promise<T>;
export function step<T>(data: SkippableStepSpecs<T>, options?: StepOptions): T | undefined;
export function step<T>(data: SkippableStepSpecs<Promise<T>>, options?: StepOptions): Promise<T> | undefined;
export function step<T>(data: StepSpecs<T | Promise<T>>, options: StepOptions = {}): T | Promise<T> | undefined {
  const start = new Date();

  const {title, action, skip} = data;
  const {logFunction: log = defaultLogFunction} = options;

  const skipped = skip && skip();
  if (skipped) {
    log({type: 'skip', date: new Date(), title, reason: typeof skipped === 'string' ? skipped : undefined});
    return;
  }

  log({type: 'start', title, date: start})

  return new ValueOrPromise(action)
    .then(
      (args) => { const date = new Date(); log({type: 'success', title, date, duration: date.getTime() - start.getTime()}); return args; },
      (err) => { const date = new Date(); log({type: 'failure', title, date, duration: date.getTime() - start.getTime()}); throw err; }
    )
    .resolve();
}
