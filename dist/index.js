import prettyMilliseconds from 'pretty-ms';
import { ValueOrPromise } from 'value-or-promise';
export var StepEvents;
(function (StepEvents) {
    StepEvents["SKIPPED"] = "SKIPPED";
    StepEvents["STARTED"] = "STARTED";
    StepEvents["FULLFILLED"] = "FULLFILLED";
    StepEvents["FAILED"] = "FAILED";
})(StepEvents || (StepEvents = {}));
/**
 * Defaults logger that logs events using `console.log()`.
 */
export class ConsoleLogger {
    /**
     * @param useGroup Boolean indicating if [[`console.group`]] will be used. Defaults to false.
     */
    constructor({ useGroup } = {}) {
        this.useGroup = useGroup !== null && useGroup !== void 0 ? useGroup : false;
    }
    log(e) {
        switch (e.type) {
            case StepEvents.SKIPPED:
                {
                    console.log(e.reason ? `[SKIPPED] ${e.title} (${e.reason})` : `[SKIPPED] ${e.title}`);
                }
                break;
            case StepEvents.STARTED:
                {
                    const message = `[STARTED] ${e.title}`;
                    if (this.useGroup) {
                        console.group(message);
                    }
                    else {
                        console.log(message);
                    }
                }
                break;
            case StepEvents.FULLFILLED:
                {
                    console.groupEnd();
                    console.log(`[SUCCESS] ${e.title} (${prettyMilliseconds(e.duration)})`);
                }
                break;
            case StepEvents.FAILED:
                {
                    console.groupEnd();
                    console.log(`[FAILURE] ${e.title} (${prettyMilliseconds(e.duration)})`);
                }
                break;
        }
    }
}
function executeStep(data, { logger }) {
    const start = new Date();
    const { title, action, skip } = data;
    const skipped = skip && skip();
    if (skipped) {
        logger.log({ type: StepEvents.SKIPPED, date: new Date(), title, reason: typeof skipped === 'string' ? skipped : undefined });
        return;
    }
    logger.log({ type: StepEvents.STARTED, title, date: start });
    return new ValueOrPromise(action)
        .then((args) => { const date = new Date(); logger.log({ type: StepEvents.FULLFILLED, title, date, duration: date.getTime() - start.getTime() }); return args; }, (err) => { const date = new Date(); logger.log({ type: StepEvents.FAILED, title, date, duration: date.getTime() - start.getTime() }); throw err; })
        .resolve();
}
/**
 * Helper to initialize a new [[`step()`]] function.
 *
 * @param logger The logger to use.
 *
 * @returns A `StepFunction`.
 */
export function makeStepFunction(logger) {
    const opts = { logger };
    return function (...args) {
        if (typeof args[0] === 'string') {
            return executeStep({ title: args[0], action: args[1] }, opts);
        }
        else {
            return executeStep(args[0], opts);
        }
    };
}
/**
 * Default step function that uses a [[`ConsoleLogger`]].
 */
export const step = makeStepFunction(new ConsoleLogger());
//# sourceMappingURL=index.js.map