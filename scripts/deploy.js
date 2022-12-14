const ghpages = require("gh-pages");

ghpages.publish("apps/main/dist", function (err) {
  if (err) {
    console.log(err);
    return;
  }
  console.log("Deploy success!");
});
