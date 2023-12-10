# watch-your-step

Minimal ~~task~~ step runner.

It was designed with build-scripts in mind.
Those often rely on external tools (e.g. CMake, Ninja...) that can produce lots of logs, which does not play nice with fancy task runners with dynamic logging capabilities like [Listr2](https://github.com/cenk1cenk2/listr2) or [Tasuku](https://github.com/privatenumber/tasuku).

## Install

```sh
npm i @sigill/watch-your-step
```

## Usage

```ts
import { step } from '@sigill/watch-your-step'

step({
  title: 'Main step',
  action: () => {
    step('Substep 1', () => {
      console.log('Working on substep 1...');
    });

    step({
      title: 'Substep 2',
      skip: () => 'We are skipping that step',
      action: () => {
        console.log('Working on substep 2...');
      }
    });

    step({
      title: 'Substep 3',
      action: () => {
        console.log('Working on substep 3...');
        throw new Error('something went wrong');
      }
    });
}});

// [STARTED] Main step
// [STARTED] Substep 1
// Working on substep 1...
// [SUCCESS] Substep 1 (0ms)
// [SKIPPED] Substep 2 (We are skipping that step)
// [STARTED] Substep 3
// Working on substep 3...
// [FAILURE] Substep 3 (1ms)
// [FAILURE] Main step (4ms)
// Error: something went wrong
//     at action (file://[...]/example.ts:22:15)
//     ...
```

To use a custom logger:

```typescript
import { ConsoleLogger, makeStepFunction } from './index.js';

const logger = new ConsoleLogger({useGroup: true}); // Or any custom logger.
const step = makeStepFunction(logger);

step(...);
```

## API

### `step<T>(spec)`, `step<T>(title, action)`

Executes an action.

The various prototypes of this function are just provided to enhance type-checking.
In particular, if the step is skippable, its return value can be `undefined`.

#### Parameters

- `spec` (`Step<T>`, required) - The action to execute.
  - `title` (`string`, required) - Title of the step.
  - `action` (`() => T`, required) - The action to execute.
    If it is asynchronous, `T` is a `Promise`.
  - `skip` (`() => string | boolean`, optional) - If thuthy, skips the action.
    If the returned value is a `string`, its value should describe why the action has been skipped.

#### Returns

- `T | undefined` - The value returned by the action, or undefined if the action was skipped.

### `makeStepFunction(logger: Logger)`

Creates a new `step()` function that uses the specified logger.

See the `Logger` class for details on how to write your own.

### `ConsoleLogger`

Default `Logger` implementation that logs step events to the console.

#### Parameters

- `useGroup` (`boolean`, optional, defaults to `false`) - Indicates if `console.group` will be used when logging step events.

## License

This project is released under the terms of the MIT License. See the LICENSE.txt file for more details.
