const {
  normalizeSession,
  getDzikirSummary,
  getSessionMeta,
  getDzikirListBySession,
  getDzikirPracticePayload,
} = require("../services/dzikirService");

function renderDzikirHub(req, res) {
  const summary = getDzikirSummary();
  const pagiItems = getDzikirListBySession("pagi");
  const petangItems = getDzikirListBySession("petang");

  return res.render("pages/dzikir/index", {
    title: "Dzikir Pagi & Petang - Prayer Streak",
    summary,
    pagiMeta: getSessionMeta("pagi"),
    petangMeta: getSessionMeta("petang"),
    pagiItems,
    petangItems,
  });
}

function renderDzikirList(req, res) {
  const activeSession = normalizeSession(req.query.waktu);
  const summary = getDzikirSummary();
  const dzikirItems = getDzikirListBySession(activeSession);
  const sessionMeta = getSessionMeta(activeSession);

  return res.render("pages/dzikir/list", {
    title: `${sessionMeta.title} - Prayer Streak`,
    activeSession,
    summary,
    sessionMeta,
    dzikirItems,
  });
}

function renderDzikirPractice(req, res) {
  const payload = getDzikirPracticePayload(req.params.session, req.params.index);

  return res.render("pages/dzikir/practice", {
    title: `${payload.sessionMeta.title} - Prayer Streak`,
    ...payload,
  });
}

module.exports = {
  renderDzikirHub,
  renderDzikirList,
  renderDzikirPractice,
};
