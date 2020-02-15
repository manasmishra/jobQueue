function createJobQueue() {
  // TODO - create and return a job queue
  let jobQueue = [];
  return {
    addJob: function(job) {
      jobQueue.push(
        new Promise(async (resolve, reject) => {
          try {
            let res = await job();
            resolve(res);
          } catch (error) {
            reject(error);
          }
        })
      )
      return jobQueue[jobQueue.length-1]
    },
    processAllJobs : () => {
      return new Promise((resolve, reject) => {
        Promise.allSettled(jobQueue).then(res => {
          resolve(res.length);
        })
      })
      
    },
    cancelJob: (job)=> {
      let index = jobQueue.findIndex((ele, index) => {
        if(ele.toString() == job.toString()) {
          return index;
        }});
      if(index>-1) {
        console.log('index is:', index)
        jobQueue.splice(index,1)
        return Promise.reject(job);
        
      }
    }
  }
}

module.exports = { createJobQueue };