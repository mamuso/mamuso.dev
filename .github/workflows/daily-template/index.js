const fs = require("fs").promises;
const core = require("@actions/core");
const github = require("@actions/github");
const nunjucks = require("nunjucks");

const githubtoken = core.getInput("GITHUB_TOKEN");
const octokit = new github.GitHub(githubtoken);
const context = github.context;
const njenv = nunjucks.configure({ autoescape: false });
const date = new Date().toISOString().split("T")[0];

fs.readFile(".github/daily-template.md", "utf8", function(err, data) {
  console.log(date);
})
  .then(content => {
    const path = `src/pages/${date}/index.md`;

    // 2. Add the date to the template
    const templatedata = { date: date };
    content = njenv.renderString(content, templatedata);

    const tree = octokit.git.createTree({
      ...context.repo,
      base_tree: context.sha,
      tree: [
        {
          path,
          mode: "100644",
          content: content
        }
      ]
    });
    return tree;
  })
  .then(tree => {
    const commit = octokit.git.createCommit({
      ...context.repo,
      message: `${date}`,
      tree: tree.data.sha,
      parents: [context.sha]
    });
    return commit;
  })
  .then(commit => {
    const ref = octokit.git.createRef({
      ...context.repo,
      sha: commit.data.sha,
      ref: `refs/heads/${date}`
    });
    return ref;
  })
  .then(ref => {
    const pull = octokit.pulls.create({
      ...context.repo,
      head: `${context.repo.owner}:${date}`,
      base: "master",
      title: `${date} - Let's post something awesome`
    });
    return pull;
  })
  .then(pull => {
    console.log("Pull request created 🎉");
  })
  .catch(err => {
    console.log(err);
  });
