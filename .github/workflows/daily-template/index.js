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

// console.log(context);
console.log("1. ------");
console.log(context);

octokit.repos
  .listCommits({
    ...context.repo,
    sha: context.sha,
    per_page: 1
  })
  .then(res => {
    console.log("2. ------");
    console.log(res.data);
    console.log(context.sha);
    console.log(res.data[0].commit.tree.sha);
  })
  .catch(err => {
    console.log(err);
  });

// octokit.git
//   .getRef({
//     ...context.repo,
//     ref: context.ref.replace("refs/", "")
//   })
//   .then(res => {
//     console.log("2. ------");
//     console.log(res.data);
//     // let latestCommitSha = res.data[0].sha;
//     // const treeSha = res.data[0].commit.tree.sha;
//     //.data.default_branch;
//   })
//   .catch(err => {
//     console.log(err);
//   });

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
