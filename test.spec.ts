import * as chai from 'chai';
import * as sinon from 'sinon';
import chaiAsPromised  from 'chai-as-promised';
import sinonChai from "sinon-chai";
import { defaultLogFunction, step, StepFunction } from './index.js';

chai.use(chaiAsPromised);
chai.use(sinonChai);

const expect = chai.expect;
const match = sinon.match;

describe('defaultLogFunction()', function() {
  let log: sinon.SinonSpy<[message?: any, ...optionalParams: any[]], void>;
  beforeEach(function() {
    log = sinon.stub(console, 'log');
  });
  afterEach(function() {
    sinon.restore();
  });

  it('log start events', function() {
    defaultLogFunction({type: 'start', title: 'started step', date: new Date()});
    expect(log).to.have.been.calledOnceWith('[STARTED] started step');
  });

  it('log skip events', function() {
    defaultLogFunction({type: 'skip', title: 'skipped step', date: new Date()});
    expect(log).to.have.been.calledOnceWith('[SKIPPED] skipped step');
  });

  it('log success events', function() {
    defaultLogFunction({type: 'success', title: 'successful step', date: new Date(), duration: 200});
    expect(log).to.have.been.calledOnceWith('[SUCCESS] successful step (200ms)');
  });

  it('log failure events', function() {
    defaultLogFunction({type: 'failure', title: 'failed step', date: new Date(), duration: 1200});
    expect(log).to.have.been.calledOnceWith('[FAILURE] failed step (1.2s)');
  });
});

describe('step()', function() {
  let log: sinon.SinonSpy;
  const  spiedStep: StepFunction = (args: any) => step(args, {logFunction: log});

  beforeEach(function() {
    log = sinon.spy();
  });
  afterEach(function() {
    sinon.restore();
  });

  it("logs 'start' and 'success' events, then returns the value returned by a synchronous function", function() {
    const a: number = spiedStep({title: 'sync function', action: () => 42});
    expect(log).to.have.been.calledTwice;
    expect(log.firstCall).to.have.been.calledWith(
      match.object
      .and(match.has('type', 'start'))
      .and(match.has('title', 'sync function'))
      .and(match.has('date', sinon.match.date)));
    expect(log.secondCall).to.have.been.calledWith(
      match.object
      .and(match.has('type', 'success'))
      .and(match.has('title', 'sync function'))
      .and(match.has('date', sinon.match.date))
      .and(match.has('duration', sinon.match.number)));
    expect(a).to.be.equal(42);
  });

  it("logs 'start' and 'failure' events, then rethrow the error thrown by a synchronous function", function() {
    const err = new Error('plonk');
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const a: number = spiedStep({title: 'sync function', action: () => { throw err; }});
    }).to.throw(err);
    expect(log).to.have.been.calledTwice;
    expect(log.firstCall).to.have.been.calledWith(
      match.object
      .and(match.has('type', 'start'))
      .and(match.has('title', 'sync function'))
      .and(match.has('date', sinon.match.date)));
    expect(log.secondCall).to.have.been.calledWith(
      match.object
      .and(match.has('type', 'failure'))
      .and(match.has('title', 'sync function'))
      .and(match.has('date', sinon.match.date))
      .and(match.has('duration', sinon.match.number)));
  });

  it("logs 'start' and 'success' events, then returns the promise returned by an asynchronous function", async function() {
    const a: Promise<number> = spiedStep({title: 'async function', action: async () => new Promise(resolve => setTimeout(() => resolve(42), 75))});
    await expect(a).to.eventually.be.equal(42);
    expect(log).to.have.been.calledTwice;
    expect(log.firstCall).to.have.been.calledWith(
      match.object
      .and(match.has('type', 'start'))
      .and(match.has('title', 'async function'))
      .and(match.has('date', sinon.match.date)));
    expect(log.secondCall).to.have.been.calledWith(
      match.object
      .and(match.has('type', 'success'))
      .and(match.has('title', 'async function'))
      .and(match.has('date', sinon.match.date))
      .and(match.has('duration', sinon.match.number)));
  });

  it("logs 'start' and 'failure' events, then returns the rejected promise rejected using an asynchronous function", async function() {
    const err = new Error('plonk');
    const a: Promise<number> = spiedStep({title: 'async function', action: async () => new Promise((_, reject) => setTimeout(() => reject(err), 75))});
    await expect(a).to.eventually.be.rejectedWith(Error, 'plonk');
    expect(log).to.have.been.calledTwice;
    expect(log.firstCall).to.have.been.calledWith(
      match.object
      .and(match.has('type', 'start'))
      .and(match.has('title', 'async function'))
      .and(match.has('date', sinon.match.date)));
    expect(log.secondCall).to.have.been.calledWith(
      match.object
      .and(match.has('type', 'failure'))
      .and(match.has('title', 'async function'))
      .and(match.has('date', sinon.match.date))
      .and(match.has('duration', sinon.match.number)));
  });

  it("logs 'skipped' event, then returns undefined when skipping", function() {
    const a: number | undefined = spiedStep({title: 'skippable function', action: () => 42, skip: () => true});
    expect(log).to.have.been.calledOnceWith(
      match.object
      .and(match.has('type', 'skip'))
      .and(match.has('title', 'skippable function'))
      .and(match.has('date', sinon.match.date)));
    expect(a).to.be.undefined;
  });

  it("logs 'skipped' event with a reason, then returns undefined when skipping", function() {
    const a: number | undefined = spiedStep({title: 'skippable function', action: () => 42, skip: () => 'because'});
    expect(log).to.have.been.calledOnceWith(
      match.object
      .and(match.has('type', 'skip'))
      .and(match.has('title', 'skippable function'))
      .and(match.has('date', sinon.match.date))
      .and(match.has('reason', 'because')));
    expect(a).to.be.undefined;
  });
});
