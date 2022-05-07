import { ValueOrPromise } from 'value-or-promise';
export function defaultLogFunction(event) {
    switch (event.type) {
        case 'skip':
            {
                console.log(event.reason ? `[SKIPPED] ${event.title} (${event.reason})` : `[SKIPPED] ${event.title}`);
            }
            break;
        case 'start':
            {
                console.log(`[STARTED] ${event.title}`);
            }
            break;
        case 'success':
            {
                console.log(`[SUCCESS] ${event.title} (${(event.duration / 1000).toFixed(1)}s)`);
            }
            break;
        case 'failure':
            {
                console.log(`[FAILURE] ${event.title} (${(event.duration / 1000).toFixed(1)}s)`);
            }
            break;
    }
}
export function step(data, options = {}) {
    const start = new Date();
    const { title, action, skip } = data;
    const { logFunction: log = defaultLogFunction } = options;
    const skipped = skip && skip();
    if (skipped) {
        log({ type: 'skip', date: new Date(), title, reason: typeof skipped === 'string' ? skipped : undefined });
        return;
    }
    log({ type: 'start', title, date: start });
    return new ValueOrPromise(action)
        .then((args) => { const date = new Date(); log({ type: 'success', title, date, duration: date.getTime() - start.getTime() }); return args; }, (err) => { const date = new Date(); log({ type: 'failure', title, date, duration: date.getTime() - start.getTime() }); throw err; })
        .resolve();
}
//# sourceMappingURL=index.js.map