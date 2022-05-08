export declare enum StepEvents {
    SKIPPED = "SKIPPED",
    STARTED = "STARTED",
    FULLFILLED = "FULLFILLED",
    FAILED = "FAILED"
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
export declare type StepEvent = StepStartedEvent | StepSkippedEvent | StepFullfilledEvent | StepFailedEvent;
/**
 * Defaults log function that logs events using `console.log()`.
 *
 * @param e The event.
 */
export declare function defaultLogFunction(e: StepEvent): void;
/**
 * A non skippable step.
 * @template T Return type of the step.
 */
interface NonSkippableStep<T> {
    /** Title of the step. */
    title: string;
    /** The function to execute. */
    action: () => T;
}
/**
 * A step.
 * @template T Return type of the step.
 */
interface Step<T> extends NonSkippableStep<T> {
    skip?: () => string | boolean;
}
/**
 * A skippable step.
 * @template T Return type of the step.
 */
declare type SkippableStep<T> = Required<Step<T>>;
/** Options accepted by [[`step`]]. */
interface StepOptions {
    logFunction?: (e: StepEvent) => void;
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
 * const customStep: StepFunction = (args: any) => step(args, {logFunction: customLogFunction})
 * ```
 *
 * @returns The value returned by the action.
 */
export interface StepFunction {
    <T>(data: NonSkippableStep<T>): T;
    <T>(data: NonSkippableStep<Promise<T>>): Promise<T>;
    <T>(data: SkippableStep<T>): T | undefined;
    <T>(data: SkippableStep<Promise<T>>): Promise<T> | undefined;
}
/**
 * Execute an action.
 *
 * The various prototypes of this function are just provided to enhance type-checking:
 *
 * - If the action is asynchronous, the returned value will actually be a `Promise`.
 * - An unskippable step will return the action's return value, while a skippable step
 * can also return `undefined`.
 *
 * @param data The action to execute.
 * @param options
 *
 * @returns The value returned by the action, or undefined if the action was skipped.
 */
export declare function step<T>(data: NonSkippableStep<T>, options?: StepOptions): T;
export declare function step<T>(data: NonSkippableStep<Promise<T>>, options?: StepOptions): Promise<T>;
export declare function step<T>(data: SkippableStep<T>, options?: StepOptions): T | undefined;
export declare function step<T>(data: SkippableStep<Promise<T>>, options?: StepOptions): Promise<T> | undefined;
export {};
