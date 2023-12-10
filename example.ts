import { step } from './index.js';

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
