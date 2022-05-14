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
 * Defaults log function that logs events using `console.log()`.
 *
 * @param e The event.
 */
export function defaultLogFunction(e) {
    switch (e.type) {
        case StepEvents.SKIPPED:
            {
                console.log(e.reason ? `[SKIPPED] ${e.title} (${e.reason})` : `[SKIPPED] ${e.title}`);
            }
            break;
        case StepEvents.STARTED:
            {
                console.log(`[STARTED] ${e.title}`);
            }
            break;
        case StepEvents.FULLFILLED:
            {
                console.log(`[SUCCESS] ${e.title} (${prettyMilliseconds(e.duration)})`);
            }
            break;
        case StepEvents.FAILED:
            {
                console.log(`[FAILURE] ${e.title} (${prettyMilliseconds(e.duration)})`);
            }
            break;
    }
}
export function step_impl(data, options = {}) {
    const start = new Date();
    const { title, action, skip } = data;
    const { logFunction: log = defaultLogFunction } = options;
    const skipped = skip && skip();
    if (skipped) {
        log({ type: StepEvents.SKIPPED, date: new Date(), title, reason: typeof skipped === 'string' ? skipped : undefined });
        return;
    }
    log({ type: StepEvents.STARTED, title, date: start });
    return new ValueOrPromise(action)
        .then((args) => { const date = new Date(); log({ type: StepEvents.FULLFILLED, title, date, duration: date.getTime() - start.getTime() }); return args; }, (err) => { const date = new Date(); log({ type: StepEvents.FAILED, title, date, duration: date.getTime() - start.getTime() }); throw err; })
        .resolve();
}
export function step(...args) {
    if (typeof args[0] === 'string') {
        return step_impl({ title: args[0], action: args[1] }, args[2] || {});
    }
    else {
        return step_impl(args[0], args[1] || {});
    }
}
//# sourceMappingURL=index.js.map