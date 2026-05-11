function renderHome(req, res) {
  res.render("pages/home", {
    title: "Prayer Streak",
  });
}

module.exports = {
  renderHome,
};

