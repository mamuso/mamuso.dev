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

console.log(`SHA1: ${context.sha}`);

const process = octokit.git
  .createRef({
    ...context.owner,
    ...context.repo,
    sha: context.sha,
    ref: `heads/${date}`
  })
  .then(() => {
    io.mkdirP(`src/pages/${date}`);
    fs.readFile(template, "utf8", function(err, data) {
      data = env.renderString(data, templateVariables);
      fs.writeFile(`src/pages/${date}/index.md`, data, function(err, result) {
        if (err) console.log("error", err);
      });
    });
  })
  .then(() => {
    console.log("done!");
  })
  .catch(err => {
    console.log(err);
  });

process;
