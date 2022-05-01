import assert from 'assert';
import { ValueOrPromise } from 'value-or-promise';

export function step<T>({title, action, skip}: { title?: string; action: () => T; skip?: () => string | boolean; }): T | undefined;
export function step<T>({title, action, skip}: { title?: string; action: () => Promise<T>; skip?: () => string | boolean; }): Promise<T> | undefined;
export function step<T>({title, action, skip}: { title?: string; action: () => T | Promise<T>; skip?: () => string | boolean; }): T | Promise<T> | undefined {
  assert(!skip || title, 'Title required for skippable tasks');

  const skipped = skip && skip();
  if (skipped) {
    console.log(typeof skipped === 'string' ? `[SKIPPED] ${title} (${skipped})` : `[SKIPPED] ${title}`);
    return;
  }

  if (title)
    console.log(`[STARTED] ${title}`);

  const start = Date.now();
  const log_finish = (status: string) => {
    if (title) {
      const finish = Date.now();
      console.log(`[${status}] ${title} (${((finish - start)/1000).toFixed(1)}s)`);
    }
  };

  return new ValueOrPromise(action)
    .then(
      (args) => { log_finish('SUCCESS'); return args; },
      (err) => { log_finish('FAILED'); throw err; }
    )
    .resolve();
}