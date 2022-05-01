import * as chai from "chai";
import * as sinon from "sinon";
import chaiAsPromised  from 'chai-as-promised';
import sinonChai from "sinon-chai";
import { step } from "./index.js";

chai.use(chaiAsPromised);
chai.use(sinonChai);

const expect = chai.expect;

describe('step()', function() {
  let log: sinon.SinonSpy<[message?: any, ...optionalParams: any[]], void>;
  beforeEach(function() {
    log = sinon.spy(console, 'log');
  });
  afterEach(function() {
    sinon.restore();
  });

  it('returns a value when using a synchronous function', function() {
    const a: number | undefined = step({title: 'sync function', action: () => 42});
    expect(log).to.have.been.calledTwice;
    expect(log.firstCall.args[0]).to.match(/^\[STARTED\] sync function$/);
    expect(log.secondCall.args[0]).to.match(/^\[SUCCESS\] sync function \(\d+\.\d+s\)$/);
    expect(a).to.be.equal(42);
  });

  it('returns a promise when using an asynchronous function', async function() {
    const a: Promise<number> | undefined = step({title: 'async function', action: async () => new Promise(resolve => setTimeout(() => resolve(42), 75))});
    await expect(a).to.eventually.be.equal(42);
    expect(log).to.have.been.calledTwice;
    expect(log.firstCall.args[0]).to.match(/^\[STARTED\] async function$/);
    expect(log.secondCall.args[0]).to.match(/^\[SUCCESS\] async function \(\d+\.\d+s\)$/);
  });

  it('returns undefined when skipping', function() {
    const a: number | undefined = step({title: 'skippable function', action: () => 42, skip: () => true});
    expect(log).to.have.been.calledOnce;
    expect(log.firstCall.args[0]).to.match(/^\[SKIPPED\] skippable function$/);
    expect(a).to.be.undefined;
  });

  it('returns undefined when skipping and print the reason for skipping', function() {
    const a: number | undefined = step({title: 'skippable function', action: () => 42, skip: () => 'because'});
    expect(log).to.have.been.calledOnce;
    expect(log.firstCall.args[0]).to.match(/^\[SKIPPED\] skippable function \(because\)$/);
    expect(a).to.be.undefined;
  });
});
