const { expect } = require('chai');
const { createJobQueue } = require('./jobQueue' );

describe('Job Queue / Read-Only Tests', function() {
  describe('addJob', function() {
    let jobQueue;
    beforeEach(function () {
      jobQueue = createJobQueue();
    });

    it('adds a job to the queue and returns a promise that resolves with the value returned by the job', async function() {
      const jobPromise = jobQueue.addJob(async () => 42);
      await jobQueue.processAllJobs();
      expect(await jobPromise).to.equal(42);
    });

    it('adds a job to the queue and returns a promise that resolves with the value returned by the job', async function() {
      let executed = 0;
      const jobPromise = jobQueue.addJob(async () => executed = 1);
      await jobQueue.processAllJobs();
      expect(executed).to.equal(1);
    });

    it('returns a promise that rejects if job rejects', async function() {
      const jobPromise = jobQueue.addJob(async () => {
        throw new Error('Ah ah ah, you didn\'t say the magic word!');
      });
      await jobQueue.processAllJobs();

      return jobPromise
        .then(() => {
          throw new Error('should have rejected');
        })
        .catch(error => {
          expect(true).to.be.true;
        });
    });
  });

  describe('cancelJob', function() {
    let jobQueue;
    beforeEach(function () {
      jobQueue = createJobQueue();
    });

    it('removes a job from the queue', async function() {
      let executed = false;
      const job = async () => {
        executed = true;
      };

      const jobPromise = jobQueue.addJob(job);
      jobQueue.cancelJob(job);

      await jobQueue.processAllJobs();
      expect(executed).to.equal(false);

      return jobPromise.catch(() => {
        // avoid unhandled promise rejection warning
      });
    });

    it('rejects the promise returned by addJob', function() {
      const job = async () => 42;
      const jobPromise = jobQueue.addJob(job);
      jobQueue.cancelJob(job);

      return jobPromise
        .then(() => {
          throw new Error('should have rejected');
        })
        .catch(error => {
          expect(true).to.be.true;
        });
    });

    it('does nothing if no matching job is found', async function() {
      jobQueue.addJob(async () => 41);
      jobQueue.addJob(async () => 42);
      jobQueue.cancelJob(async () => 43);
      const numProcessed = await jobQueue.processAllJobs();
      expect(numProcessed).to.equal(2);
    });
  });

  describe('processAllJobs', function() {
    let jobQueue;
    beforeEach(function () {
      jobQueue = createJobQueue();
    });

    it('processes all jobs, in order, and resolves with the number of jobs successfully processed', async function() {
      let output = '';
      jobQueue.addJob(async () => output += '1');
      jobQueue.addJob(async () => output += '2');
      jobQueue.addJob(async () => output += '3');
      const numProcessed = await jobQueue.processAllJobs();
      expect(output).to.equal('123');
      expect(numProcessed).to.equal(3);
    });

    it('does not process more than one job at a time', async function() {
      let isProcessing = false;

      const executeOneJob = async () => {
        expect(isProcessing).to.be.false;
        isProcessing = true;

        await new Promise(resolve => {
          setImmediate(() => {
            isProcessing = false;
            resolve();
          });
        });
      };

      jobQueue.addJob(async () => executeOneJob());
      jobQueue.addJob(async () => executeOneJob());
      jobQueue.addJob(async () => executeOneJob());

      const numProcessed = await jobQueue.processAllJobs();
      expect(numProcessed).to.equal(3);
    });

    it('does not reject if any of the jobs throw an error', async function() {
      let output = '';

      jobQueue.addJob(async () => output += '1');
      jobQueue.addJob(async () => output += '3');

      const errorPromise = jobQueue.addJob(async () => {
        throw new Error('this job does not work');
      });

      await jobQueue.processAllJobs();
      expect(output).to.equal('13');
      return errorPromise.catch(() => {
        // avoid unhandled promise rejection warning
      });
    });
  });
});
