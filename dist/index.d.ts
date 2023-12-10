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
export type StepEvent = StepStartedEvent | StepSkippedEvent | StepFullfilledEvent | StepFailedEvent;
/**
 * Logger interface.
 */
export interface Logger {
    log(e: StepEvent): void;
}
/**
 * Defaults logger that logs events using `console.log()`.
 */
export declare class ConsoleLogger implements Logger {
    private readonly useGroup;
    /**
     * @param useGroup Boolean indicating if [[`console.group`]] will be used. Defaults to false.
     */
    constructor({ useGroup }?: {
        useGroup?: boolean;
    });
    log(e: StepEvent): void;
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
export declare function makeStepFunction(logger: Logger): StepFunction;
/**
 * Default step function that uses a [[`ConsoleLogger`]].
 */
export declare const step: StepFunction;
