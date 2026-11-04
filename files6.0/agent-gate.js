(function () {
    var page = (location.pathname.split("/").pop() || "index.html").split("?")[0].toLowerCase();
    var allowed = {
        "be-an-agent.html": 1,
        "login.html": 1,
        "signup.html": 1,
        "reset-password.html": 1,
        "auth-callback.html": 1,
        "policies.html": 1
    };
    if (allowed[page]) return;
    var lock = "";
    var role = "";
    try {
        lock = sessionStorage.getItem("roomdhundo_agent_lock") || "";
        role = localStorage.getItem("roomdhundo_role") || "";
    } catch (error) {
        return;
    }
    if (lock === "pending" || lock === "rejected" || role === "agent_pending") {
        location.replace("be-an-agent.html");
    }
})();
