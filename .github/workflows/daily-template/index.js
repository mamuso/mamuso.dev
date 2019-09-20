const core = require("@actions/core");
const github = require("@actions/github");
const context = github.context;

const myToken = core.getInput("GITHUB_TOKEN");
const octokit = new github.GitHub(myToken);

const master = octokit.git.getRef({
  ...context.owner,
  ...context.repo,
  ref: "heads/master"
});

console.log("---");
console.log(master);
