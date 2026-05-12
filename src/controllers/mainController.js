function renderHome(req, res) {
  res.render("pages/home", {
    title: "Prayer Streak",
    hideTopbar: true,
  });
}

module.exports = {
  renderHome,
};
