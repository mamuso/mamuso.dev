const core = require("@actions/core");
const github = require("@actions/github");
const context = github.context;

const myToken = core.getInput(process.env.GITHUB_TOKEN);
const octokit = new github.GitHub(myToken);

const master = octokit.git
  .getRef({
    ...context.owner,
    ...context.repo,
    ref: "heads/master"
  })
  .then(result => {
    console.log("------");
    console.log(result);
  })
  .catch(err => {
    console.log(err);
  });

console.log(process.env.GITHUB_SHA);
