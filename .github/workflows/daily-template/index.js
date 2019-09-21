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

console.log("1. Render template");
const content = fs.readFile(template, "utf8", function(err, data) {
  return env.renderString(data, templateVariables);
});

console.log("2. Create tree");
octokit.git
  .createTree({
    ...context.repo,
    base_tree: context.payload.head_commit.tree_id,
    tree: {
      path: `src/pages/${date}/index.md`,
      mode: "100644",
      content: content
    }
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
