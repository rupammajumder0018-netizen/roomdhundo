(() => {
    const URL = "https://vyusxdilgwrcgmqqvzsp.supabase.co";
    const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5dXN4ZGlsZ3dyY2dtcXF2enNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNjYyNTYsImV4cCI6MjEwMjc0MjI1Nn0.X6FbzDad06d5-kj1aK4zQkPSPrrLUW_O7CdfZ-ghwrM";
    const db = typeof supabaseClient !== "undefined"
        ? supabaseClient
        : window.supabase.createClient(URL, KEY);

    const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));

    async function loadAdminAgents() {
        const body = document.getElementById("adminAgentsBody");
        if (!body) return;
        body.innerHTML = `<tr><td colspan="7">Loading...</td></tr>`;
        const { data, error } = await db.from("agent_applications").select("*").order("created_at", { ascending: false });
        if (error) {
            body.innerHTML = `<tr><td colspan="7">${esc(error.message)}. Run files6.0/sql/agent-applications.sql in Supabase.</td></tr>`;
            return;
        }
        const rows = data || [];
        document.getElementById("adminAgentsPendingCount") && (document.getElementById("adminAgentsPendingCount").textContent = String(rows.filter((r) => r.status === "pending").length));
        document.getElementById("adminAgentsApprovedCount") && (document.getElementById("adminAgentsApprovedCount").textContent = String(rows.filter((r) => r.status === "approved").length));
        if (!rows.length) {
            body.innerHTML = `<tr><td colspan="7">No agent applications yet.</td></tr>`;
            return;
        }
        body.innerHTML = rows.map((row) => `
            <tr>
                <td><b>${esc(row.first_name)} ${esc(row.last_name)}</b></td>
                <td>${esc(row.phone)}<br>${esc(row.email)}</td>
                <td>${esc(row.location)}<br>${esc(row.pincode)}</td>
                <td>${esc(row.status)}</td>
                <td>${row.created_at ? new Date(row.created_at).toLocaleString("en-IN") : "—"}</td>
                <td>
                    ${row.status === "pending" ? `
                        <div class="hotel-booking-actions">
                            <button class="approve" data-agent-action="approved" data-id="${esc(row.id)}" data-user="${esc(row.user_id)}">Approve</button>
                            <button class="reject" data-agent-action="rejected" data-id="${esc(row.id)}" data-user="${esc(row.user_id)}">Reject</button>
                        </div>` : "—"}
                </td>
            </tr>
        `).join("");

        body.querySelectorAll("[data-agent-action]").forEach((btn) => {
            btn.addEventListener("click", async () => {
                const status = btn.dataset.agentAction;
                const id = btn.dataset.id;
                const userId = btn.dataset.user;
                btn.disabled = true;
                const { error: updateError } = await db.from("agent_applications").update({
                    status,
                    reviewed_at: new Date().toISOString()
                }).eq("id", id);
                if (!updateError && userId) {
                    await db.from("profiles").update({
                        role: status === "approved" ? "agent" : "agent_pending"
                    }).eq("id", userId);
                }
                if (updateError) alert(updateError.message);
                await loadAdminAgents();
            });
        });
    }

    window.loadAdminAgents = loadAdminAgents;
    document.addEventListener("DOMContentLoaded", loadAdminAgents);
    document.querySelector('[data-section="agents"]')?.addEventListener("click", loadAdminAgents);
})();
