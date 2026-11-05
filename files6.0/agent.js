(() => {
    const AGENT_TABLE = "agent_applications";

    function esc(value) {
        return String(value ?? "").replace(/[&<>"']/g, (char) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[char]));
    }

    async function getAgentApplication(userId) {
        if (!userId || !window.supabaseClient) return null;
        const { data, error } = await window.supabaseClient
            .from(AGENT_TABLE)
            .select("*")
            .eq("user_id", userId)
            .maybeSingle();
        if (error) {
            console.error("Agent application load error:", error);
            return null;
        }
        return data || null;
    }

    window.getAgentApplication = getAgentApplication;

    async function initAgentApplyPage() {
        const form = document.getElementById("agentApplyForm");
        if (!form) return;

        const user = typeof getSignedInUser === "function"
            ? await getSignedInUser()
            : null;
        if (!user) {
            window.location.href = "login.html";
            return;
        }

        const role = typeof fetchProfileRole === "function"
            ? await fetchProfileRole(user.id)
            : "user";
        const allowed = typeof canUseAgentApplyPage === "function"
            ? canUseAgentApplyPage(user, role)
            : role === "agent_pending";
        if (!allowed) {
            const dest = typeof dashboardPathForRole === "function"
                ? dashboardPathForRole(role)
                : (role === "admin" ? "admin.html" : "index.html");
            window.location.replace(dest);
            return;
        }

        const emailInput = document.getElementById("agentEmail");
        if (emailInput && !emailInput.value) emailInput.value = user.email || "";

        const name = String(user.user_metadata?.full_name || "").trim();
        if (name) {
            const parts = name.split(/\s+/);
            const first = document.getElementById("agentFirstName");
            const last = document.getElementById("agentLastName");
            if (first && !first.value) first.value = parts[0] || "";
            if (last && !last.value) last.value = parts.slice(1).join(" ");
        }

        const existing = await getAgentApplication(user.id);
        if (existing && existing.status !== "rejected") {
            showWaiting(existing.status === "approved");
            return;
        }

        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            const message = document.getElementById("agentApplyMessage");
            const firstName = document.getElementById("agentFirstName").value.trim();
            const lastName = document.getElementById("agentLastName").value.trim();
            const phone = document.getElementById("agentPhone").value.trim();
            const email = document.getElementById("agentEmail").value.trim();
            const location = document.getElementById("agentLocation").value.trim();
            const pincode = document.getElementById("agentPincode").value.trim();

            if (firstName.length < 2 || lastName.length < 1) {
                if (message) message.textContent = "Enter your first and last name.";
                return;
            }
            if (!/^[0-9]{10}$/.test(phone)) {
                if (message) message.textContent = "Enter a valid 10-digit phone number.";
                return;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                if (message) message.textContent = "Enter a valid email.";
                return;
            }
            if (!location) {
                if (message) message.textContent = "Enter where you are situated.";
                return;
            }
            if (!/^[0-9]{6}$/.test(pincode)) {
                if (message) message.textContent = "Enter a valid 6-digit pin code.";
                return;
            }

            const submit = form.querySelector("button[type=submit]");
            if (submit) {
                submit.disabled = true;
                submit.textContent = "Submitting...";
            }
            if (message) message.textContent = "";

            const payload = {
                user_id: user.id,
                first_name: firstName,
                last_name: lastName,
                phone,
                email,
                location,
                pincode,
                status: "pending"
            };

            const { error } = await window.supabaseClient
                .from(AGENT_TABLE)
                .upsert(payload, { onConflict: "user_id" });

            const { error: profileError } = await window.supabaseClient.from("profiles").upsert({
                id: user.id,
                full_name: `${firstName} ${lastName}`.trim(),
                role: "agent_pending"
            });
            if (profileError) {
                console.error("Pending agent role error:", profileError);
                await window.supabaseClient.from("profiles").upsert({
                    id: user.id,
                    full_name: `${firstName} ${lastName}`.trim(),
                    role: "user"
                });
                try {
                    await window.supabaseClient.auth.updateUser({
                        data: { role: "agent", agent_status: "pending" }
                    });
                } catch (metaError) {
                    console.error("Agent metadata error:", metaError);
                }
            }

            if (submit) {
                submit.disabled = false;
                submit.textContent = "Submit";
            }

            if (error) {
                console.error(error);
                if (message) message.textContent = `Could not submit: ${error.message}. Run the agent_applications SQL in Supabase if this table is missing.`;
                return;
            }

            showSuccessPopup();
            showWaiting(false);
        });

        document.getElementById("agentLogoutBtn")?.addEventListener("click", async () => {
            await window.supabaseClient.auth.signOut();
            window.location.href = "login.html";
        });
        document.getElementById("agentSuccessOk")?.addEventListener("click", () => {
            document.getElementById("agentSuccessModal").hidden = true;
        });
    }

    function showWaiting() {
        const form = document.getElementById("agentApplyForm");
        const waiting = document.getElementById("agentWaitingCard");
        if (form) form.hidden = true;
        if (waiting) waiting.hidden = false;
    }

    function showSuccessPopup() {
        const modal = document.getElementById("agentSuccessModal");
        if (modal) modal.hidden = false;
    }

    async function renderHomeAgents() {
        const list = document.getElementById("homeAgentsList");
        const section = document.getElementById("homeAgentsSection");
        if (!list || !section || !window.supabaseClient) return;

        const { data, error } = await window.supabaseClient
            .from(AGENT_TABLE)
            .select("user_id, first_name, last_name, location, phone")
            .eq("status", "approved")
            .order("created_at", { ascending: false });

        if (error || !data?.length) {
            section.hidden = true;
            return;
        }

        const ids = data.map((row) => row.user_id);
        let counts = {};
        const { data: buildings } = await window.supabaseClient
            .from("buildings")
            .select("created_by")
            .in("created_by", ids);
        (buildings || []).forEach((row) => {
            counts[row.created_by] = (counts[row.created_by] || 0) + 1;
        });

        section.hidden = false;
        list.innerHTML = data.map((agent) => {
            const name = `${agent.first_name || ""} ${agent.last_name || ""}`.trim() || "Agent";
            const listed = counts[agent.user_id] || 0;
            return `
                <article class="home-agent-card">
                    <p class="home-agent-badge">RoomDhundo Agent</p>
                    <h3>${esc(name)}</h3>
                    <p class="home-agent-meta">${esc(agent.location || "Location on file")}</p>
                    <div class="home-agent-stats">
                        <div><strong>${listed}</strong><span>Properties listed</span></div>
                    </div>
                    <a class="home-agent-cta" href="index.html?agent=${encodeURIComponent(agent.user_id)}">View properties</a>
                </article>
            `;
        }).join("");
    }

    document.addEventListener("DOMContentLoaded", () => {
        initAgentApplyPage();
        renderHomeAgents();
    });
})();
