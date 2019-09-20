const core = require("@actions/core");
const github = require("@actions/github");
const context = github.context;

const myToken = core.getInput("GITHUB_TOKEN");
const octokit = new github.GitHub(myToken);

const date = new Date().toISOString().split("T")[0];

const process = octokit.git
  .createRef({
    ...context.owner,
    ...context.repo,
    ref: `heads/${date}`,
    ...context.sha
  })
  .then(result => {
    console.log(`------ ${date}`);
    console.log(result);
  })
  .catch(err => {
    console.log(err);
  });

console.log(process.env.GITHUB_SHA);
