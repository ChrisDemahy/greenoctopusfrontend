import { Worker, Job, QueueEvents } from "bullmq";
import IORedis from "ioredis";
let throng = require("throng");

// Connect to a local redis instance locally, and the Heroku-provided URL in production
const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const connection = new IORedis(REDIS_URL);

// Spin up multiple processes to handle jobs to take advantage of more CPU cores
// See: https://devcenter.heroku.com/articles/node-concurrency for more info
const workers = process.env.WEB_CONCURRENCY || 2;

// The maximum number of jobs each worker should process at once. This will need
// to be tuned for your application. If each job is mostly waiting on network
// responses it can be much higher. If each job is CPU-intensive, it might need
// to be much lower.
const maxJobsPerWorker = 50;

const queueName = process.env.QUE_NAME || "webjobque";

function start() {
  // Connect to the named work queue

  const worker = new Worker(
    queueName,
    async (job: Job) => {
      // Do something with job
      // Optionally report some progress
      job.updateProgress(42);
      return "some value";
    },
    {
      concurrency: maxJobsPerWorker,
      connection: connection.duplicate(),
    }
  );
  worker.on("error", (err) => {
    // log the error
    console.error(err);
  });
}

// Initialize the clustered worker process
// See: https://devcenter.heroku.com/articles/node-concurrency for more info
throng({ workers, start });

// Create some logs for jobs
const queueEvents = new QueueEvents(queueName, {
  connection: connection.duplicate(),
});

queueEvents.on("waiting", ({ jobId }) => {
  console.log(`A job with ID ${jobId} is waiting`);
});

queueEvents.on("active", ({ jobId }) => {
  console.log(`Job ${jobId} is now active`);
});

queueEvents.on("completed", ({ jobId, returnvalue }) => {
  console.log(`${jobId} has completed and returned ${returnvalue}`);
});

queueEvents.on("failed", ({ jobId, failedReason }) => {
  console.log(`${jobId} has failed with reason ${failedReason}`);
});
