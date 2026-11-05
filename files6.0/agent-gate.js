(function () {
    var page = (location.pathname.split("/").pop() || "index.html").split("?")[0].toLowerCase();
    var role = "";
    var lock = "";
    try {
        role = localStorage.getItem("roomdhundo_role") || "";
        lock = sessionStorage.getItem("roomdhundo_agent_lock") || "";
    } catch (error) {
        return;
    }

    if (page === "be-an-agent.html") {
        if (role === "admin" || role === "owner" || role === "user" || role === "agent") {
            location.replace(role === "admin" ? "admin.html" : role === "owner" ? "owner-dashboard.html" : "index.html");
        }
        return;
    }

    var allowed = {
        "login.html": 1,
        "signup.html": 1,
        "reset-password.html": 1,
        "auth-callback.html": 1,
        "policies.html": 1
    };
    if (allowed[page]) return;
    if (role === "admin" || role === "owner" || role === "user" || role === "agent") return;
    if (lock === "pending" || lock === "rejected" || role === "agent_pending") {
        location.replace("be-an-agent.html");
    }
})();
