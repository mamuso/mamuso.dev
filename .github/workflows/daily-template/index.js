const core = require("@actions/core");
const github = require("@actions/github");
const context = github.context;

const myToken = core.getInput("GITHUB_TOKEN");
console.log(myToken);

const octokit = new github.GitHub(myToken);
console.log(octokit);

const master = octokit.git.getRef({
  ...context.owner,
  ...context.repo,
  ref: "heads/master"
});

console.log("---");
console.log(master);
