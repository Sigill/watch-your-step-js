import * as chai from 'chai';
import * as sinon from 'sinon';
import chaiAsPromised  from 'chai-as-promised';
import sinonChai from 'sinon-chai';
import { ConsoleLogger, makeStepFunction, StepEvents } from './index.js';

chai.use(chaiAsPromised);
chai.use(sinonChai);

const expect = chai.expect;
const match = sinon.match;

function quoteIfString(v: string | number) {
  return typeof v === 'string' ? `"${v}"` : v;
}

const hasNo = (member: string | number) => sinon.match(function (value) {
  return value[member] === undefined;
}, `hasNo(${quoteIfString(member)})`);

describe('ConsoleLogger', function() {
  const logger = new ConsoleLogger();
  let log: sinon.SinonSpy<[message?: any, ...optionalParams: any[]], void>;
  beforeEach(function() {
    log = sinon.stub(console, 'log');
  });
  afterEach(function() {
    sinon.restore();
  });

  it('log start events', function() {
    logger.log({type: StepEvents.STARTED, title: 'started step', date: new Date()});
    expect(log).to.have.been.calledOnceWith('[STARTED] started step');
  });

  it('log skip events', function() {
    logger.log({type: StepEvents.SKIPPED, title: 'skipped step', date: new Date()});
    expect(log).to.have.been.calledOnceWith('[SKIPPED] skipped step');
  });

  it('log success events', function() {
    logger.log({type: StepEvents.FULLFILLED, title: 'successful step', date: new Date(), duration: 200});
    expect(log).to.have.been.calledOnceWith('[SUCCESS] successful step (200ms)');
  });

  it('log failure events', function() {
    logger.log({type: StepEvents.FAILED, title: 'failed step', date: new Date(), duration: 1200});
    expect(log).to.have.been.calledOnceWith('[FAILURE] failed step (1.2s)');
  });
});

describe('ConsoleLoggerWithGroup', function() {
  const logger = new ConsoleLogger({useGroup: true});
  let log: sinon.SinonSpy<Parameters<typeof console['log']>, ReturnType<typeof console['log']>>;
  let group: sinon.SinonSpy<Parameters<typeof console['group']>, ReturnType<typeof console['group']>>;
  let groupEnd: sinon.SinonSpy<Parameters<typeof console['groupEnd']>, ReturnType<typeof console['groupEnd']>>;
  beforeEach(function() {
    log = sinon.stub(console, 'log');
    group = sinon.stub(console, 'group');
    groupEnd = sinon.stub(console, 'groupEnd');
  });
  afterEach(function() {
    sinon.restore();
  });

  it('log start events', function() {
    logger.log({type: StepEvents.STARTED, title: 'started step', date: new Date()});
    expect(group).to.have.been.calledOnceWith('[STARTED] started step');
  });

  it('log skip events', function() {
    logger.log({type: StepEvents.SKIPPED, title: 'skipped step', date: new Date()});
    expect(log).to.have.been.calledOnceWith('[SKIPPED] skipped step');
  });

  it('log success events', function() {
    logger.log({type: StepEvents.FULLFILLED, title: 'successful step', date: new Date(), duration: 200});
    expect(log).to.have.been.calledOnceWith('[SUCCESS] successful step (200ms)');
    expect(groupEnd).to.have.been.calledOnceWith();
  });

  it('log failure events', function() {
    logger.log({type: StepEvents.FAILED, title: 'failed step', date: new Date(), duration: 1200});
    expect(log).to.have.been.calledOnceWith('[FAILURE] failed step (1.2s)');
    expect(groupEnd).to.have.been.calledOnceWith();
  });
});

describe('step', function() {
  let log: sinon.SinonSpy;
  let spiedStep: ReturnType<typeof makeStepFunction>;
  const title = 'action title';
  const reason = 'because';

  beforeEach(function() {
    log = sinon.spy();
    spiedStep = makeStepFunction({log});
  });
  afterEach(function() {
    sinon.restore();
  });

  function expectStartedEvent(logCall: sinon.SinonSpyCall<any[], any>) {
    expect(logCall).to.have.been.calledWith(
      match.object
      .and(match.has('type', StepEvents.STARTED))
      .and(match.has('title', title))
      .and(match.has('date', sinon.match.date)));
  }

  function expectSettledEvent(logCall: sinon.SinonSpyCall<any[], any>, {eventType}: {eventType: StepEvents.FULLFILLED | StepEvents.FAILED}) {
    expect(logCall).to.have.been.calledWith(
      match.object
      .and(match.has('type', eventType))
      .and(match.has('title', title))
      .and(match.has('date', sinon.match.date))
      .and(match.has('duration', sinon.match.number)));
  }

  function expectFullfilledEvent(logCall: sinon.SinonSpyCall<any[], any>) {
    expectSettledEvent(logCall, {eventType: StepEvents.FULLFILLED});
  }

  function expectFailedEvent(logCall: sinon.SinonSpyCall<any[], any>) {
    expectSettledEvent(logCall, {eventType: StepEvents.FAILED});
  }

  function expectSkippedEvent(logCall: sinon.SinonSpyCall<any[], any>, {reason}: {reason?: string} = {}) {
    const makeMatcher = () => {
      const matcher = match.object
        .and(match.has('type', StepEvents.SKIPPED))
        .and(match.has('title', sinon.match.same(title)))
        .and(match.has('date', sinon.match.date));
      return reason === undefined ? matcher.and(hasNo('reason')) : matcher.and(match.has('reason', reason));
    }
    expect(logCall).to.have.been.calledWith(makeMatcher());
  }

  describe('using object syntax', () => {
    it("emits 'started' and 'fullfilled' events, then returns the value returned by a synchronous function", function() {
      const a: number = spiedStep({title, action: () => 42});
      expect(a).to.be.equal(42);
      expect(log).to.have.been.calledTwice;
      expectStartedEvent(log.firstCall);
      expectFullfilledEvent(log.secondCall);
    });

    it("emits 'started' and 'failed' events, then rethrow the error thrown by a synchronous function", function() {
      const err = new Error('plonk');
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const a: number = spiedStep({title, action: () => { throw err; }});
      }).to.throw(err);
      expect(log).to.have.been.calledTwice;
      expectStartedEvent(log.firstCall);
      expectFailedEvent(log.secondCall);
    });

    it("emits 'started' and 'fullfilled' events, then returns the promise returned by an asynchronous function", async function() {
      const a: Promise<number> = spiedStep({title, action: async () => new Promise(resolve => setTimeout(() => resolve(42), 75))});
      await expect(a).to.eventually.be.equal(42);
      expect(log).to.have.been.calledTwice;
      expectStartedEvent(log.firstCall);
      expectFullfilledEvent(log.secondCall);
    });

    it("emits 'started' and 'failed' events, then returns the rejected promise rejected using an asynchronous function", async function() {
      const err = new Error('plonk');
      const a: Promise<number> = spiedStep({title, action: async () => new Promise((_, reject) => setTimeout(() => reject(err), 75))});
      await expect(a).to.eventually.be.rejectedWith(Error, 'plonk');
      expect(log).to.have.been.calledTwice;
      expectStartedEvent(log.firstCall);
      expectFailedEvent(log.secondCall);
    });

    it("emits 'skipped' event, then returns undefined when skipping", function() {
      const a: number | undefined = spiedStep({title, action: () => 42, skip: () => true});
      expect(a).to.be.undefined;
      expect(log).to.have.been.calledOnce;
      expectSkippedEvent(log.firstCall);
    });

    it("emits 'skipped' event with a reason, then returns undefined when skipping", function() {
      const a: number | undefined = spiedStep({title, action: () => 42, skip: () => reason});
      expect(a).to.be.undefined;
      expect(log).to.have.been.calledOnce;
      expectSkippedEvent(log.firstCall, {reason});
    });
  });

  describe('using shorthand syntax', () => {
    it("emits 'started' and 'fullfilled' events, then returns the value returned by a synchronous function", function() {
      const a: number = spiedStep(title, () => 42);
      expect(a).to.be.equal(42);
      expect(log).to.have.been.calledTwice;
      expectStartedEvent(log.firstCall);
      expectFullfilledEvent(log.secondCall);
    });

    it("emits 'started' and 'failed' events, then rethrow the error thrown by a synchronous function", function() {
      const err = new Error('plonk');
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const a: number = spiedStep(title, () => { throw err; });
      }).to.throw(err);
      expect(log).to.have.been.calledTwice;
      expectStartedEvent(log.firstCall);
      expectFailedEvent(log.secondCall);
    });

    it("emits 'started' and 'fullfilled' events, then returns the promise returned by an asynchronous function", async function() {
      const a: Promise<number> = spiedStep(title, async () => new Promise(resolve => setTimeout(() => resolve(42), 75)));
      await expect(a).to.eventually.be.equal(42);
      expect(log).to.have.been.calledTwice;
      expectStartedEvent(log.firstCall);
      expectFullfilledEvent(log.secondCall);
    });

    it("emits 'started' and 'failed' events, then returns the rejected promise rejected using an asynchronous function", async function() {
      const err = new Error('plonk');
      const a: Promise<number> = spiedStep(title, async () => new Promise((_, reject) => setTimeout(() => reject(err), 75)));
      await expect(a).to.eventually.be.rejectedWith(Error, 'plonk');
      expect(log).to.have.been.calledTwice;
      expectStartedEvent(log.firstCall);
      expectFailedEvent(log.secondCall);
    });
  });
});
