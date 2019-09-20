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

octokit.repos
  .get({
    ...context.owner,
    ...context.repo
  })
  .then(res => {
    console.log(res);
    //.data.default_branch;
  });

// octokit.git
//   .createRef({
//     ...context.owner,
//     ...context.repo,
//     sha: context.sha,
//     ref: `refs/heads/${date}`
//   })
//   .then(a => {

//     io.mkdirP(`src/pages/${date}`);
//     fs.readFile(template, "utf8", function(err, data) {
//       data = env.renderString(data, templateVariables);
//       console.log(data);
//       fs.writeFile(`src/pages/${date}/index.md`, data, function(err, result) {
//         if (err) console.log("error", err);
//       });
//     });
//   })
//   .then(b => {
//     console.log("done!");
//   })
//   .catch(err => {
//     console.log(err);
//   });
