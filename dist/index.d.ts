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
export declare type Event = StartEvent | SkipEvent | SuccessEvent | FailureEvent;
export declare function defaultLogFunction(event: Event): void;
interface NonSkippableStepSpecs<T> {
    title: string;
    action: () => T;
}
interface StepSpecs<T> extends NonSkippableStepSpecs<T> {
    skip?: () => string | boolean;
}
declare type SkippableStepSpecs<T> = Required<StepSpecs<T>>;
interface StepOptions {
    logFunction?: (event: Event) => void;
}
export interface StepFunction {
    <T>(data: NonSkippableStepSpecs<T>): T;
    <T>(data: NonSkippableStepSpecs<Promise<T>>): Promise<T>;
    <T>(data: SkippableStepSpecs<T>): T | undefined;
    <T>(data: SkippableStepSpecs<Promise<T>>): Promise<T> | undefined;
}
export declare function step<T>(data: NonSkippableStepSpecs<T>, options?: StepOptions): T;
export declare function step<T>(data: NonSkippableStepSpecs<Promise<T>>, options?: StepOptions): Promise<T>;
export declare function step<T>(data: SkippableStepSpecs<T>, options?: StepOptions): T | undefined;
export declare function step<T>(data: SkippableStepSpecs<Promise<T>>, options?: StepOptions): Promise<T> | undefined;
export {};
