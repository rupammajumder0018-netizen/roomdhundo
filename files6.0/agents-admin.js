(() => {
    const URL = "https://vyusxdilgwrcgmqqvzsp.supabase.co";
    const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5dXN4ZGlsZ3dyY2dtcXF2enNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNjYyNTYsImV4cCI6MjEwMjc0MjI1Nn0.X6FbzDad06d5-kj1aK4zQkPSPrrLUW_O7CdfZ-ghwrM";
    const db = typeof supabaseClient !== "undefined"
        ? supabaseClient
        : window.supabase.createClient(URL, KEY);

    const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));

    function setCount(id, n) {
        const el = document.getElementById(id);
        if (el) el.textContent = String(n);
    }

    async function loadAdminAgents() {
        const body = document.getElementById("adminAgentsBody");
        if (!body) return;
        body.innerHTML = `<tr><td colspan="6">Loading...</td></tr>`;
        const { data, error } = await db.from("agent_applications").select("*").order("created_at", { ascending: false });
        if (error) {
            body.innerHTML = `<tr><td colspan="6">${esc(error.message)}. Run files6.0/sql/agent-applications.sql in Supabase.</td></tr>`;
            return;
        }
        const rows = data || [];
        setCount("adminAgentsPendingCount", rows.filter((r) => r.status === "pending").length);
        setCount("adminAgentsApprovedCount", rows.filter((r) => r.status === "approved").length);
        setCount("adminAgentsRejectedCount", rows.filter((r) => r.status === "rejected").length);
        if (!rows.length) {
            body.innerHTML = `<tr><td colspan="6">No agent applications yet.</td></tr>`;
            return;
        }
        body.innerHTML = rows.map((row) => {
            const status = String(row.status || "pending").toLowerCase();
            const pending = status === "pending";
            return `
            <tr>
                <td data-label="Name"><b>${esc(row.first_name)} ${esc(row.last_name)}</b></td>
                <td data-label="Contact">${esc(row.phone)}<br>${esc(row.email)}</td>
                <td data-label="Location">${esc(row.location)}<br>${esc(row.pincode)}</td>
                <td data-label="Status"><span class="agent-status ${esc(status)}">${esc(status)}</span></td>
                <td data-label="Submitted">${row.created_at ? new Date(row.created_at).toLocaleString("en-IN") : "—"}</td>
                <td data-label="Action">
                    <div class="agent-actions">
                        ${pending ? `
                        <button type="button" class="approve" data-agent-action="approved" data-id="${esc(row.id)}" data-user="${esc(row.user_id)}">Approve</button>
                        <button type="button" class="reject" data-agent-action="rejected" data-id="${esc(row.id)}" data-user="${esc(row.user_id)}">Reject</button>
                        ` : ""}
                        <button type="button" class="delete" data-agent-action="delete" data-id="${esc(row.id)}" data-user="${esc(row.user_id)}" data-name="${esc(row.first_name)} ${esc(row.last_name)}">Delete</button>
                    </div>
                </td>
            </tr>`;
        }).join("");
    }

    async function handleAgentAction(btn) {
        const action = btn.dataset.agentAction;
        const id = btn.dataset.id;
        const userId = btn.dataset.user;
        const name = btn.dataset.name || "this agent";
        if (!action || !id) return;

        if (action === "delete") {
            const ok = window.confirm(`Delete ${name}? Their agent application will be removed and they will become a renter.`);
            if (!ok) return;
            btn.disabled = true;
            const { error: deleteError } = await db.from("agent_applications").delete().eq("id", id);
            if (!deleteError && userId) {
                await db.from("profiles").update({ role: "user" }).eq("id", userId);
            }
            if (deleteError) {
                btn.disabled = false;
                alert(deleteError.message);
                return;
            }
            await loadAdminAgents();
            return;
        }

        btn.disabled = true;
        const { error: updateError } = await db.from("agent_applications").update({
            status: action,
            reviewed_at: new Date().toISOString()
        }).eq("id", id);
        if (!updateError && userId) {
            await db.from("profiles").update({
                role: action === "approved" ? "agent" : "user"
            }).eq("id", userId);
        }
        if (updateError) {
            btn.disabled = false;
            alert(updateError.message);
            return;
        }
        await loadAdminAgents();
    }

    document.addEventListener("click", (event) => {
        const btn = event.target.closest("[data-agent-action]");
        if (!btn || !document.getElementById("adminAgentsBody")?.contains(btn)) return;
        handleAgentAction(btn);
    });

    window.loadAdminAgents = loadAdminAgents;
    document.addEventListener("DOMContentLoaded", loadAdminAgents);
    document.querySelector('[data-section="agents"]')?.addEventListener("click", loadAdminAgents);
})();
