const fs = require("fs");
const core = require("@actions/core");
const github = require("@actions/github");
const io = require("@actions/io");
const nunjucks = require("nunjucks");
const context = github.context;

const myToken = core.getInput("GITHUB_TOKEN");
const octokit = new github.GitHub(myToken);

const date = new Date().toISOString().split("T")[0];
const template = core.getInput("filename") || ".github/daily-template.md";
const env = nunjucks.configure({ autoescape: false });
const templateVariables = {
  date: date
};
const renderedTemplate = env.renderString(
  fs.readFile(template),
  templateVariables
);

console.log(renderedTemplate);

const process = octokit.git
  .createRef({
    ...context.owner,
    ...context.repo,
    ref: `heads/${date}`,
    ...context.sha
  })
  .then(() => {
    io.mkdirP(`src/pages/${date}`);
  })
  .then(() => {})
  .catch(err => {
    console.log(err);
  });

process;
