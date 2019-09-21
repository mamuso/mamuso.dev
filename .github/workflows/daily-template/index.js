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
const path = `src/pages/${date}/index.md`;
const blob = octokit.git.createBlob({
  ...context.repo,
  encoding: "utf-8",
  content
});
console.log(`blob: ${blob}`);

console.log("1. Render template");
const content = fs.readFile(template, "utf8", function(err, data) {
  return env.renderString(data, templateVariables);
});

console.log("2. Create tree");
octokit.git
  .createTree({
    ...context.repo,
    base_tree: context.payload.head_commit.tree_id,
    tree: [
      {
        path,
        mode: "100644",
        type: "blob",
        sha: blob
      }
    ]
  })
  .then(res => {
    console.log("3. Create commit");
    octokit.git.createCommit({
      ...context.repo,
      message: `${date}`,
      tree: res.data.sha,
      parents: [context.sha]
    });
  })
  .then(res => {
    console.log("4. Create ref");
    octokit.git.createRef({
      ...context.repo,
      sha: res.data.sha,
      ref: `refs/heads/${date}`
    });
  })
  .then(res => {
    console.log("5. Create pull request");
    octokit.pulls.create({
      ...context.repo,
      head: `${context.repo.owner}:${context.ref.replace("refs/heads/", "")}`,
      base: context.ref.replace("refs/", ""),
      title: "test",
      body: "tost"
    });
  })
  .catch(err => {
    console.log(err);
    context.ref.replace("refs/heads/", "");
  });
