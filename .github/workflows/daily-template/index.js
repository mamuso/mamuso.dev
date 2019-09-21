const fs = require("fs").promises;
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

console.log("1. Render template");
async function process() {
  return fs.readFile(template, "utf8", function(err, data) {
    return env.renderString(data, templateVariables);
  });
}

process()
  .then(content => {
    const blob = octokit.git.createBlob({
      ...context.repo,
      encoding: "utf-8",
      content: content
    });
    console.log(`blob: ${blob}`);
    return content, blob;
  })
  .then((content, blob) => {
    console.log("2. Create tree");
    const res = octokit.git.createTree({
      ...context.repo,
      base_tree: context.payload.head_commit.tree_id,
      tree: [
        {
          path,
          mode: "100644",
          type: "blob",
          sha: blob,
          content: content
        }
      ]
    });
    console.log("pre-res");
    console.log(res);
    return res;
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
