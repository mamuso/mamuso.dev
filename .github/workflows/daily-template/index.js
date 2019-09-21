// Require
const fs = require("fs").promises;
const core = require("@actions/core");
const github = require("@actions/github");
const nunjucks = require("nunjucks");

// Setting the script up
const githubtoken = core.getInput("GITHUB_TOKEN");
const octokit = new github.GitHub(githubtoken);
const context = github.context;
const njenv = nunjucks.configure({ autoescape: false });
const date = new Date().toISOString().split("T")[0];
const ref = "heads/master";

// 1. Compose the template
fs.readFile(".github/daily-template.md", "utf8", function(err, data) {
  console.log(date);
  const templatedata = { date: date };
  data = njenv.renderString(data, templatedata);
  return data;
})
  .then(content => {
    console.log(content);
    octokit.git.createBlob({
      ...context.repo,
      encoding: "utf-8",
      content: content
    });
  })
  .then(blob => {
    console.log(blob);
    console.log("end");
  });

const path = `src/pages/${date}/index.md`;

// process()
//   .then(content => {
//     return content, blob;
//   })
//   .then((content, blob) => {
//     console.log("2. Create tree");
//     console.log(`content: ${content}`);
//     console.log(`blob: ${blob}`);
//     const res = octokit.git.createTree({
//       ...context.repo,
//       base_tree: context.payload.head_commit.tree_id,
//       tree: [
//         {
//           path,
//           mode: "100644",
//           type: "blob",
//           sha: blob,
//           content: content
//         }
//       ]
//     });
//     console.log("pre-res");
//     console.log(res);
//     return res;
//   })
//   .then(res => {
//     console.log("3. Create commit");
//     octokit.git.createCommit({
//       ...context.repo,
//       message: `${date}`,
//       tree: res.data.sha,
//       parents: [context.sha]
//     });
//   })
//   .then(res => {
//     console.log("4. Create ref");
//     octokit.git.createRef({
//       ...context.repo,
//       sha: res.data.sha,
//       ref: `refs/heads/${date}`
//     });
//   })
//   .then(res => {
//     console.log("5. Create pull request");
//     octokit.pulls.create({
//       ...context.repo,
//       head: `${context.repo.owner}:${context.ref.replace("refs/heads/", "")}`,
//       base: context.ref.replace("refs/", ""),
//       title: "test",
//       body: "tost"
//     });
//   })
//   .catch(err => {
//     console.log(err);
//     context.ref.replace("refs/heads/", "");
//   });
