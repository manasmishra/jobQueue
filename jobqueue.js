function createJobQueue() {
  // TODO - create and return a job queue
  let jobQueue = [];
  return {
    addJob: function (job) {
      var wp = new Promise(async (resolve, reject) => {
        jobQueue.push({ job, resolve, reject })
      });
      return wp;
    },
    processAllJobs: async () => {
      let count = 0;
      for (let item of jobQueue) {
        try {
          var result = await item.job()
          item.resolve(result);
          count++
        } catch (error) {
          item.reject(error);
        }
      }
      return count;
    },
    cancelJob: (job) => {
      let index = jobQueue.findIndex((ele) => ele.job == job.toString())
      if (index > -1) {
        var ele = jobQueue.splice(index, 1)
        return ele[0].reject();
      }
    }
  }
}

module.exports = { createJobQueue };