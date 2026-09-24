const SUPABASE_URL = "https://hwqoqskgmwgfdkxvwpwl.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_x3CmMWplu1UXxj2GKrLJXQ_ikBbP1hw";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

console.log("Supabase connected successfully 🚀");

// =====================================================
// BROWSE PROJECTS
// =====================================================

async function setupBrowseProjects() {
  const projectList = document.getElementById("browseProjectsList");

  if (!projectList) return;

  const searchInput = document.getElementById("projectSearch");
  const skillFilter = document.getElementById("skillFilter");
  const interestFilter = document.getElementById("interestFilter");
  const statusFilter = document.getElementById("statusFilter");
  const resultsCount = document.getElementById("projectResultsCount");

  let projects = [];

  // ===================================================
  // LOAD PROJECTS
  // ===================================================

  async function loadProjects() {
    projectList.innerHTML = `
      <div class="browse-loading">
        Loading projects...
      </div>
    `;

    const { data, error } = await supabaseClient
      .from("projects")
      .select(
        `
        id,
        title,
        description,
        required_skills,
        required_roles,
        interests,
        team_size,
        availability_required,
        status,
        created_at,
        creator_id,
        profiles:creator_id (
          full_name,
          college
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading projects:", error);

      projectList.innerHTML = `
        <div class="browse-empty">
          <h3>Could not load projects</h3>
          <p>Please refresh the page and try again.</p>
        </div>
      `;

      return;
    }

    projects = data || [];

    populateFilters();
    renderProjects();
  }

  // ===================================================
  // POPULATE FILTERS
  // ===================================================

  function populateFilters() {
    const skills = new Set();
    const interests = new Set();

    projects.forEach((project) => {
      (project.required_skills || []).forEach((skill) => {
        if (skill) {
          skills.add(skill);
        }
      });

      (project.interests || []).forEach((interest) => {
        if (interest) {
          interests.add(interest);
        }
      });
    });

    skillFilter.innerHTML = `
      <option value="">All Skills</option>

      ${[...skills]
        .sort()
        .map(
          (skill) => `
            <option value="${escapeHtml(skill)}">
              ${escapeHtml(skill)}
            </option>
          `,
        )
        .join("")}
    `;

    interestFilter.innerHTML = `
      <option value="">All Interests</option>

      ${[...interests]
        .sort()
        .map(
          (interest) => `
            <option value="${escapeHtml(interest)}">
              ${escapeHtml(interest)}
            </option>
          `,
        )
        .join("")}
    `;
  }

  // ===================================================
  // RENDER PROJECTS
  // ===================================================

  function renderProjects() {
    const searchTerm = searchInput.value.trim().toLowerCase();

    const selectedSkill = skillFilter.value.toLowerCase();

    const selectedInterest = interestFilter.value.toLowerCase();

    const selectedStatus = statusFilter.value.toLowerCase();

    const filteredProjects = projects.filter((project) => {
      const title = (project.title || "").toLowerCase();

      const description = (project.description || "").toLowerCase();

      const skills = (project.required_skills || []).map((skill) =>
        skill.toLowerCase(),
      );

      const interests = (project.interests || []).map((interest) =>
        interest.toLowerCase(),
      );

      const matchesSearch =
        !searchTerm ||
        title.includes(searchTerm) ||
        description.includes(searchTerm) ||
        skills.some((skill) => skill.includes(searchTerm)) ||
        interests.some((interest) => interest.includes(searchTerm));

      const matchesSkill = !selectedSkill || skills.includes(selectedSkill);

      const matchesInterest =
        !selectedInterest || interests.includes(selectedInterest);

      const matchesStatus =
        !selectedStatus ||
        (project.status || "open").toLowerCase() === selectedStatus;

      return matchesSearch && matchesSkill && matchesInterest && matchesStatus;
    });

    // Results count
    resultsCount.textContent = `${filteredProjects.length} project${
      filteredProjects.length === 1 ? "" : "s"
    }`;

    // No results
    if (!filteredProjects.length) {
      projectList.innerHTML = `
        <div class="browse-empty">

          <div class="browse-empty-icon">
            🔎
          </div>

          <h3>No projects found</h3>

          <p>
            Try changing your search or filters.
          </p>

        </div>
      `;

      return;
    }

    // Render cards
    projectList.innerHTML = filteredProjects
      .map((project) => createBrowseProjectCard(project))
      .join("");
  }

  // ===================================================
  // CREATE PROJECT CARD
  // ===================================================

  function createBrowseProjectCard(project) {
    const skills = project.required_skills || [];

    const interests = project.interests || [];

    const teamSize = Number(project.team_size) || 2;

    const status = (project.status || "open").toLowerCase();

    const creatorName = project.profiles?.full_name || "TeamForge Student";

    const college = project.profiles?.college || "";

    const statusClass =
      status === "full"
        ? "browse-status-full"
        : status === "closed"
          ? "browse-status-closed"
          : "browse-status-open";

    const statusText =
      status === "full" ? "Full" : status === "closed" ? "Closed" : "Open";

    return `
      <article class="browse-project-card">

        <div class="browse-project-top">

          <div class="browse-project-icon">
            🚀
          </div>

          <span class="browse-status ${statusClass}">
            ${statusText}
          </span>

        </div>


        <h3>
          ${escapeHtml(project.title || "Untitled Project")}
        </h3>


        <p class="browse-project-description">
          ${escapeHtml(
            project.description || "No project description provided.",
          )}
        </p>


        <div class="browse-project-meta">

          <span>
            👤 ${escapeHtml(creatorName)}
          </span>

          ${
            college
              ? `
                <span>
                  🏫 ${escapeHtml(college)}
                </span>
              `
              : ""
          }

          <span>
            👥 ${teamSize} members
          </span>

        </div>


        ${
          skills.length
            ? `
              <div class="browse-project-section">

                <span class="browse-project-label">
                  REQUIRED SKILLS
                </span>

                <div class="browse-tags">

                  ${skills
                    .slice(0, 5)
                    .map(
                      (skill) => `
                        <span>
                          ${escapeHtml(skill)}
                        </span>
                      `,
                    )
                    .join("")}

                  ${
                    skills.length > 5
                      ? `
                        <span>
                          +${skills.length - 5}
                        </span>
                      `
                      : ""
                  }

                </div>

              </div>
            `
            : ""
        }


        ${
          interests.length
            ? `
              <div class="browse-project-section">

                <span class="browse-project-label">
                  INTERESTS
                </span>

                <div class="browse-tags browse-interest-tags">

                  ${interests
                    .slice(0, 4)
                    .map(
                      (interest) => `
                        <span>
                          ${escapeHtml(interest)}
                        </span>
                      `,
                    )
                    .join("")}

                </div>

              </div>
            `
            : ""
        }


        <div class="browse-project-footer">

          <a
            href="project.html?id=${project.id}"
            class="browse-view-button"
          >
            View Project →
          </a>

        </div>

      </article>
    `;
  }

  // ===================================================
  // SEARCH + FILTER EVENTS
  // ===================================================

  searchInput.addEventListener("input", renderProjects);

  skillFilter.addEventListener("change", renderProjects);

  interestFilter.addEventListener("change", renderProjects);

  statusFilter.addEventListener("change", renderProjects);

  // Initial load
  await loadProjects();
}

// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
// ======================================================
// PAGE LOADED
// ======================================================
// =====================================================
// REQUEST TO JOIN PROJECT
// =====================================================

async function requestToJoinProject(projectId) {
  const button = document.getElementById("joinProjectBtn");
  const message = document.getElementById("joinProjectMessage");

  if (!button || !projectId) return;

  button.disabled = true;
  button.textContent = "Sending...";

  if (message) {
    message.textContent = "";
    message.className = "profile-message";
  }

  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error("Please log in before requesting to join.");
    }

    // Load project
    const { data: project, error: projectError } = await supabaseClient
      .from("projects")
      .select("id, creator_id, team_size, status")
      .eq("id", projectId)
      .single();

    if (projectError) {
      throw projectError;
    }

    // Prevent creator from joining their own project
    if (project.creator_id === user.id) {
      throw new Error("You are already the creator of this project.");
    }

    // Check project status
    if ((project.status || "open").toLowerCase() !== "open") {
      throw new Error("This project is no longer accepting members.");
    }

    // Check current team size
    const { data: members, error: membersError } = await supabaseClient
      .from("project_members")
      .select("id")
      .eq("project_id", projectId);

    if (membersError) {
      throw membersError;
    }

    const currentTeamSize = (members?.length || 0) + 1;

    if (currentTeamSize >= Number(project.team_size)) {
      throw new Error("This project is already full.");
    }

    // Check whether already a member
    const { data: existingMember, error: memberError } = await supabaseClient
      .from("project_members")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberError) {
      throw memberError;
    }

    if (existingMember) {
      throw new Error("You are already a member of this project.");
    }

    // Check existing pending/accepted request
    const { data: existingRequest, error: requestError } = await supabaseClient
      .from("invitations")
      .select("id, status, request_type")
      .eq("project_id", projectId)
      .eq("receiver_id", user.id)
      .in("status", ["pending", "accepted"])
      .maybeSingle();

    if (requestError) {
      throw requestError;
    }

    if (existingRequest) {
      if (existingRequest.status === "pending") {
        throw new Error("You already have a pending request for this project.");
      }

      throw new Error("You have already joined this project.");
    }

    // Create join request
    const { error: insertError } = await supabaseClient
      .from("invitations")
      .insert({
        project_id: Number(projectId),
        sender_id: user.id,
        receiver_id: project.creator_id,
        status: "pending",
        request_type: "join_request",
      });

    if (insertError) {
      throw insertError;
    }

    // Success
    button.disabled = true;
    button.textContent = "✓ Request Sent";
    button.classList.add("join-requested");

    if (message) {
      message.textContent =
        "Your request has been sent to the project creator.";
      message.className = "profile-message success";
    }
  } catch (error) {
    console.error("Join request error:", error);

    button.disabled = false;
    button.textContent = "Request to Join";

    if (message) {
      message.textContent = error.message || "Could not send your request.";
      message.className = "profile-message error";
    }
  }
}
async function refreshInvitationListAfterResponse(userId) {
  await loadInvitations(userId);
}
document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("registerForm");
  const loginForm = document.getElementById("loginForm");

  if (registerForm || loginForm) {
    setupAuthPage();
  }

  setupLandingPage();

  if (document.getElementById("profileForm")) {
    loadExistingProfile();
    setupProfilePage();
  }

  if (document.querySelector(".dashboard-page")) {
    loadDashboard();
    setupDashboardActions();
  }

  if (document.getElementById("projectForm")) {
    setupCreateProjectPage();
  }

  if (window.location.pathname.endsWith("project.html")) {
    loadProjectDetails();
  }
  if (document.getElementById("browseProjectsList")) {
    setupBrowseProjects();
  }

  console.log("TeamForge JavaScript loaded successfully 🚀");
});

// ======================================================
// AUTH
// ======================================================

function setupAuthPage() {
  const registerForm = document.getElementById("registerForm");
  const loginForm = document.getElementById("loginForm");

  const registerTab = document.getElementById("registerTab");
  const loginTab = document.getElementById("loginTab");

  const authTitle = document.getElementById("authTitle");
  const authSubtitle = document.getElementById("authSubtitle");

  if (registerTab) {
    registerTab.addEventListener("click", () => {
      registerForm?.classList.remove("hidden");
      loginForm?.classList.add("hidden");

      registerTab.classList.add("active");
      loginTab?.classList.remove("active");

      if (authTitle) {
        authTitle.textContent = "Create your account";
      }

      if (authSubtitle) {
        authSubtitle.textContent = "Join TeamForge and find your perfect team.";
      }

      clearAuthMessage();
    });
  }

  if (loginTab) {
    loginTab.addEventListener("click", () => {
      loginForm?.classList.remove("hidden");
      registerForm?.classList.add("hidden");

      loginTab.classList.add("active");
      registerTab?.classList.remove("active");

      if (authTitle) {
        authTitle.textContent = "Welcome back";
      }

      if (authSubtitle) {
        authSubtitle.textContent = "Login to continue building your team.";
      }

      clearAuthMessage();
    });
  }

  // ---------------- REGISTER ----------------

  if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const fullName =
        document.getElementById("registerName")?.value.trim() || "";

      const email =
        document.getElementById("registerEmail")?.value.trim() || "";

      const password = document.getElementById("registerPassword")?.value || "";

      if (!fullName || !email || !password) {
        showAuthMessage("Please fill in all fields.", "error");
        return;
      }

      showAuthMessage("Creating your account...", "loading");

      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        console.error("Registration error:", error);
        showAuthMessage(error.message, "error");
        return;
      }

      if (data.user && !data.session) {
        showAuthMessage(
          "Account created! Please check your email and confirm your account before logging in.",
          "success",
        );

        registerForm.reset();
        return;
      }

      if (data.user && data.session) {
        await createProfile(data.user.id, fullName);

        showAuthMessage(
          "Account created successfully! Redirecting...",
          "success",
        );

        setTimeout(() => {
          window.location.href = "profile.html";
        }, 800);
      }
    });
  }

  // ---------------- LOGIN ----------------

  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const email = document.getElementById("loginEmail")?.value.trim() || "";

      const password = document.getElementById("loginPassword")?.value || "";

      if (!email || !password) {
        showAuthMessage("Please enter your email and password.", "error");
        return;
      }

      showAuthMessage("Logging in...", "loading");

      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Login error:", error);
        showAuthMessage(error.message, "error");
        return;
      }

      if (data.user && data.session) {
        showAuthMessage("Login successful! Redirecting...", "success");

        setTimeout(() => {
          window.location.href = "profile.html";
        }, 700);

        return;
      }

      showAuthMessage(
        "Login succeeded, but your session could not be created.",
        "error",
      );
    });
  }
}

async function createProfile(userId, fullName) {
  const { error } = await supabaseClient.from("profiles").insert({
    id: userId,
    full_name: fullName,
  });

  if (error) {
    console.error("Profile creation error:", error);
  }
}

function showAuthMessage(message, type) {
  const element = document.getElementById("authMessage");

  if (!element) return;

  element.textContent = message;
  element.className = `auth-message ${type}`;
}

function clearAuthMessage() {
  const element = document.getElementById("authMessage");

  if (!element) return;

  element.textContent = "";
  element.className = "auth-message";
}

// ======================================================
// LANDING PAGE
// ======================================================

function setupLandingPage() {
  const redirectButtons = [
    "heroStartBtn",
    "getStartedBtn",
    "loginBtn",
    "ctaBtn",
  ];

  redirectButtons.forEach((id) => {
    const button = document.getElementById(id);

    if (button) {
      button.addEventListener("click", () => {
        window.location.href = "auth.html";
      });
    }
  });

  const exploreBtn = document.getElementById("exploreBtn");

  if (exploreBtn) {
    exploreBtn.addEventListener("click", () => {
      document.getElementById("how-it-works")?.scrollIntoView({
        behavior: "smooth",
      });
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");

      if (!targetId || targetId === "#") return;

      const target = document.querySelector(targetId);

      if (target) {
        event.preventDefault();

        target.scrollIntoView({
          behavior: "smooth",
        });
      }
    });
  });

  const revealElements = document.querySelectorAll(
    ".problem-card, .step-card, .feature-card",
  );

  const reveal = () => {
    revealElements.forEach((element) => {
      if (element.getBoundingClientRect().top < window.innerHeight - 80) {
        element.classList.add("visible");
      }
    });
  };

  window.addEventListener("scroll", reveal);
  reveal();
}

// ======================================================
// PROFILE
// ======================================================

function setupProfilePage() {
  const profileForm = document.getElementById("profileForm");

  if (!profileForm) return;

  profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = document.getElementById("profileMessage");

    message.textContent = "Saving your profile...";
    message.className = "profile-message loading";

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      message.textContent = "You are not logged in. Please log in again.";
      message.className = "profile-message error";
      return;
    }

    const fullName = document.getElementById("profileName")?.value.trim() || "";

    const college = document.getElementById("college")?.value.trim() || "";

    const bio = document.getElementById("bio")?.value.trim() || "";

    const skills = getCommaSeparatedValues("skills");
    const interests = getCommaSeparatedValues("interests");

    const preferredRoles = Array.from(
      document.querySelectorAll('input[name="roles"]:checked'),
    ).map((input) => input.value);

    const availability = document.getElementById("availability")?.value || "";

    const experience =
      document.querySelector('input[name="experience"]:checked')?.value || null;

    if (!fullName) {
      message.textContent = "Please enter your full name.";
      message.className = "profile-message error";
      return;
    }

    const { error } = await supabaseClient.from("profiles").upsert(
      {
        id: user.id,
        full_name: fullName,
        college,
        bio,
        skills,
        interests,
        preferred_roles: preferredRoles,
        availability,
        experience_level: experience,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
      },
    );

    if (error) {
      console.error("Profile save error:", error);

      message.textContent = "Could not save your profile: " + error.message;

      message.className = "profile-message error";
      return;
    }

    message.textContent = "Profile saved successfully! 🎉";
    message.className = "profile-message success";

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 800);
  });
}

async function loadExistingProfile() {
  const {
    data: { user },
    error: userError,
  } = await supabaseClient.auth.getUser();

  if (userError || !user) return;

  const { data: profile, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Profile loading error:", error);
    return;
  }

  if (!profile) {
    const nameInput = document.getElementById("profileName");

    if (nameInput) {
      nameInput.value = user.user_metadata?.full_name || "";
    }

    return;
  }

  setInputValue("profileName", profile.full_name);
  setInputValue("college", profile.college);
  setInputValue("bio", profile.bio);
  setInputValue("skills", (profile.skills || []).join(", "));
  setInputValue("interests", (profile.interests || []).join(", "));
  setInputValue("availability", profile.availability);

  document.querySelectorAll('input[name="roles"]').forEach((input) => {
    input.checked = (profile.preferred_roles || []).includes(input.value);
  });

  document.querySelectorAll('input[name="experience"]').forEach((input) => {
    input.checked = input.value === profile.experience_level;
  });
}

// ======================================================
// DASHBOARD
// ======================================================

async function loadDashboard() {
  const {
    data: { user },
    error: userError,
  } = await supabaseClient.auth.getUser();

  if (userError || !user) {
    window.location.href = "auth.html";
    return;
  }

  const { data: profile, error: profileError } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Profile error:", profileError);
    return;
  }

  if (!profile) {
    window.location.href = "profile.html";
    return;
  }

  const { count: projectCount, error: projectCountError } = await supabaseClient
    .from("projects")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("creator_id", user.id);

  if (!projectCountError) {
    setText("projectCount", projectCount || 0);
  }

  const { count: invitationCount, error: invitationCountError } =
    await supabaseClient
      .from("invitations")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("receiver_id", user.id)
      .eq("status", "pending");

  if (!invitationCountError) {
    setText("invitationCount", invitationCount || 0);
  }

  await loadUserProjects(user.id);
  await loadRecommendedTeammates(user.id);
  await loadInvitations(user.id);
}

// ======================================================
// LOAD PROJECTS
// ======================================================

async function loadUserProjects(userId) {
  const list = document.getElementById("projectsList");

  if (!list) return;

  // ======================================================
  // LOAD CREATED PROJECTS
  // ======================================================

  const { data: createdProjects, error: createdError } = await supabaseClient
    .from("projects")
    .select("*")
    .eq("creator_id", userId)
    .order("created_at", {
      ascending: false,
    });

  if (createdError) {
    console.error("Created projects loading error:", createdError);

    list.innerHTML = '<p class="empty-state">Could not load your projects.</p>';

    return;
  }

  // ======================================================
  // LOAD PROJECT MEMBERSHIPS
  // ======================================================

  const { data: memberships, error: membershipError } = await supabaseClient
    .from("project_members")
    .select(
      `
        project_id,
        role
      `,
    )
    .eq("user_id", userId);

  if (membershipError) {
    console.error("Membership loading error:", membershipError);

    list.innerHTML =
      '<p class="empty-state">Could not load your team projects.</p>';

    return;
  }

  const joinedProjectIds = (memberships || []).map(
    (membership) => membership.project_id,
  );

  // ======================================================
  // LOAD JOINED PROJECT DETAILS
  // ======================================================

  let joinedProjects = [];

  if (joinedProjectIds.length > 0) {
    const { data, error: joinedError } = await supabaseClient
      .from("projects")
      .select("*")
      .in("id", joinedProjectIds)
      .order("created_at", {
        ascending: false,
      });

    if (joinedError) {
      console.error("Joined projects loading error:", joinedError);

      list.innerHTML =
        '<p class="empty-state">Could not load joined projects.</p>';

      return;
    }

    joinedProjects = data || [];
  }

  // ======================================================
  // COMBINE CREATED + JOINED PROJECTS
  // ======================================================

  const projectMap = new Map();

  (createdProjects || []).forEach((project) => {
    projectMap.set(project.id, {
      ...project,
      dashboardRole: "creator",
      memberRole: null,
    });
  });

  joinedProjects.forEach((project) => {
    if (!projectMap.has(project.id)) {
      const membership = (memberships || []).find(
        (item) => item.project_id === project.id,
      );

      projectMap.set(project.id, {
        ...project,
        dashboardRole: "member",
        memberRole: membership?.role || "Team Member",
      });
    }
  });

  const projects = Array.from(projectMap.values()).sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at),
  );

  // ======================================================
  // EMPTY STATE
  // ======================================================

  if (!projects.length) {
    list.innerHTML = `
      <div class="invitation-empty">
        <div class="invitation-empty-icon">📁</div>

        <h3>No projects yet</h3>

        <p>
          Create a project or join a team to see
          your projects here.
        </p>
      </div>
    `;

    setText("projectCount", 0);

    return;
  }

  list.innerHTML = "";

  // ======================================================
  // BUILD PROJECT CARDS
  // ======================================================

  for (const project of projects) {
    const { data: members, error: membersError } = await supabaseClient
      .from("project_members")
      .select(
        `
          *,
          profiles (
            full_name
          )
        `,
      )
      .eq("project_id", project.id);

    if (membersError) {
      console.error("Project members loading error:", membersError);
    }

    const memberCount = members?.length || 0;

    const totalMembers = memberCount + 1;

    const teamSize = Number(project.team_size) || 2;

    const remaining = Math.max(teamSize - totalMembers, 0);

    const isFull = totalMembers >= teamSize;

    const progressPercent = Math.min(
      Math.round((totalMembers / teamSize) * 100),
      100,
    );

    const skills = project.required_skills || [];

    const interests = project.interests || [];

    const roles = project.required_roles || [];

    const card = document.createElement("div");

    card.className = "project-card";

    card.innerHTML = `
      <div class="project-card-top">

        <div class="project-title-area">

          <div class="project-badges">

            <span class="project-status ${
              isFull ? "status-full" : "status-open"
            }">
              ${isFull ? "TEAM FULL" : "OPEN"}
            </span>

            <span class="project-role-badge">
              ${
                project.dashboardRole === "creator"
                  ? "CREATOR"
                  : escapeHtml(project.memberRole || "TEAM MEMBER")
              }
            </span>

          </div>

          <h3>
            ${escapeHtml(project.title)}
          </h3>

          <p class="project-description">
            ${escapeHtml(project.description || "No description available.")}
          </p>

        </div>

        <div class="project-team-icon">
          👥
        </div>

      </div>

      <div class="project-meta-grid">

        <div class="project-meta-item">
          <span class="meta-label">
            TEAM SIZE
          </span>

          <strong>
            ${totalMembers} / ${teamSize}
          </strong>
        </div>

        <div class="project-meta-item">
          <span class="meta-label">
            SPOTS LEFT
          </span>

          <strong>
            ${remaining === 0 ? "Full" : remaining}
          </strong>
        </div>

        <div class="project-meta-item">
          <span class="meta-label">
            AVAILABILITY
          </span>

          <strong>
            ${escapeHtml(project.availability_required || "Flexible")}
          </strong>
        </div>

      </div>

      <div class="project-progress-section">

        <div class="progress-header">

          <span>
            Team Progress
          </span>

          <strong>
            ${progressPercent}%
          </strong>

        </div>

        <div class="project-progress-bar">

          <div
            class="project-progress-fill"
            style="width: ${progressPercent}%"
          ></div>

        </div>

      </div>

      <div class="project-info-sections">

      ${
        skills.length > 0
          ? `
        <div class="project-tags-section">

          <span class="meta-label">
            REQUIRED SKILLS
          </span>

          <div class="project-tags">

            ${skills
              .slice(0, 6)
              .map(
                (skill) =>
                  `<span class="project-tag">
                    ${escapeHtml(skill)}
                  </span>`,
              )
              .join("")}

            ${
              skills.length > 6
                ? `
                  <span class="project-tag more-tag">
                    +${skills.length - 6} more
                  </span>
                `
                : ""
            }

          </div>

        </div>
      `
          : ""
      }

      ${
        roles.length > 0
          ? `
        <div class="project-tags-section">

          <span class="meta-label">
            LOOKING FOR
          </span>

          <div class="project-tags">

            ${roles
              .slice(0, 4)
              .map(
                (role) =>
                  `<span class="project-tag role-tag">
                    ${escapeHtml(role)}
                  </span>`,
              )
              .join("")}

            ${
              roles.length > 4
                ? `
                  <span class="project-tag more-tag">
                    +${roles.length - 4} more
                  </span>
                `
                : ""
            }

          </div>

        </div>
      `
          : ""
      }

      ${
        interests.length > 0
          ? `
        <div class="project-tags-section">

          <span class="meta-label">
            PROJECT INTERESTS
          </span>

          <div class="project-tags">

            ${interests
              .slice(0, 4)
              .map(
                (interest) =>
                  `<span class="project-tag interest-tag">
                    ${escapeHtml(interest)}
                  </span>`,
              )
              .join("")}

            ${
              interests.length > 4
                ? `
                  <span class="project-tag more-tag">
                    +${interests.length - 4} more
                  </span>
                `
                : ""
            }
            </div>

          </div>

        </div>
      `
          : ""
      }

      <div class="project-card-footer">

        <div class="project-team-status">

          ${
            isFull
              ? `
                <span class="complete-indicator">
                  ✓ Team Complete
                </span>
              `
              : `
                <span>
                  ${remaining} spot${remaining === 1 ? "" : "s"} remaining
                </span>
              `
          }

        </div>

        <button
          class="primary-button project-view-button"
          data-project-id="${project.id}"
        >
          View Project →
        </button>

      </div>
    `;

    card.querySelector("[data-project-id]").addEventListener("click", () => {
      window.location.href = `project.html?id=${project.id}`;
    });

    list.appendChild(card);
  }

  setText("projectCount", projects.length);
}

// ======================================================
// MATCHING ALGORITHM
// ======================================================

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function calculateMatch(profile, project) {
  let score = 0;
  const reasons = [];

  const studentSkills = profile.skills || [];

  const requiredSkills = project.required_skills || [];

  const studentInterests = profile.interests || [];

  const projectInterests = project.interests || [];

  const studentRoles = profile.preferred_roles || [];

  const requiredRoles = project.required_roles || [];

  // 50% — Skills

  if (requiredSkills.length) {
    const matchingSkills = requiredSkills.filter((skill) =>
      studentSkills.some(
        (studentSkill) => normalize(studentSkill) === normalize(skill),
      ),
    );

    score += (matchingSkills.length / requiredSkills.length) * 50;

    matchingSkills.forEach((skill) => {
      reasons.push(`✓ ${skill}`);
    });
  }

  // 20% — Interests

  if (projectInterests.length) {
    const matchingInterests = projectInterests.filter((interest) =>
      studentInterests.some(
        (studentInterest) => normalize(studentInterest) === normalize(interest),
      ),
    );

    score += (matchingInterests.length / projectInterests.length) * 20;

    matchingInterests.forEach((interest) => {
      reasons.push(`✓ ${interest} interest`);
    });
  }

  // 15% — Role

  if (requiredRoles.length) {
    const matchingRole = requiredRoles.find((role) =>
      studentRoles.some(
        (studentRole) => normalize(studentRole) === normalize(role),
      ),
    );

    if (matchingRole) {
      score += 15;
      reasons.push(`✓ ${matchingRole} role`);
    }
  }

  // 10% — Availability

  if (
    project.availability_required &&
    profile.availability &&
    normalize(project.availability_required) === normalize(profile.availability)
  ) {
    score += 10;
    reasons.push("✓ Matching availability");
  }

  // 5% — Profile completeness

  const fields = [
    profile.full_name,
    profile.college,
    profile.bio,
    profile.skills,
    profile.interests,
    profile.preferred_roles,
    profile.availability,
    profile.experience_level,
  ];

  const completed = fields.filter(
    (field) => field && (!Array.isArray(field) || field.length > 0),
  ).length;

  score += (completed / fields.length) * 5;

  if (completed === fields.length) {
    reasons.push("✓ Complete profile");
  }

  return {
    score: Math.round(score),
    reasons,
  };
}

// ======================================================
// RECOMMENDED TEAMMATES
// ======================================================

async function loadRecommendedTeammates(userId) {
  const teammatesList = document.getElementById("matchesList");

  if (!teammatesList) {
    console.error("matchesList element not found.");
    return;
  }

  teammatesList.innerHTML =
    '<p class="empty-state">Finding your best teammates...</p>';

  // ======================================================
  // GET USER'S OPEN PROJECTS
  // ======================================================

  const { data: projects, error: projectError } = await supabaseClient
    .from("projects")
    .select("*")
    .eq("creator_id", userId)
    .eq("status", "open")
    .order("created_at", {
      ascending: false,
    });

  if (projectError) {
    console.error("Recommendation project error:", projectError);

    teammatesList.innerHTML =
      '<p class="empty-state">Could not load your project.</p>';

    return;
  }

  if (!projects || projects.length === 0) {
    teammatesList.innerHTML =
      '<p class="empty-state">Create an open project to see teammate recommendations.</p>';

    setText("matchCount", 0);

    return;
  }

  const project = projects[0];

  console.log("Recommendation project:", project);

  // ======================================================
  // GET ALL OTHER STUDENT PROFILES
  // ======================================================

  const { data: profiles, error: profileError } = await supabaseClient
    .from("profiles")
    .select("*")
    .neq("id", userId);

  if (profileError) {
    console.error("Recommendation profile error:", profileError);

    teammatesList.innerHTML =
      '<p class="empty-state">Could not load student profiles.</p>';

    return;
  }

  console.log("Available teammate profiles:", profiles);

  if (!profiles || profiles.length === 0) {
    teammatesList.innerHTML =
      '<p class="empty-state">No other student profiles are available yet.</p>';

    setText("matchCount", 0);

    return;
  }

  // ======================================================
  // GET EXISTING PROJECT MEMBERS
  // ======================================================

  const { data: members, error: membersError } = await supabaseClient
    .from("project_members")
    .select("user_id")
    .eq("project_id", project.id);

  if (membersError) {
    console.error("Project members error:", membersError);

    teammatesList.innerHTML =
      '<p class="empty-state">Could not check the project team.</p>';

    return;
  }

  const memberIds = new Set((members || []).map((member) => member.user_id));

  // ======================================================
  // GET EXISTING PENDING INVITATIONS
  // ======================================================

  const { data: invitations, error: invitationError } = await supabaseClient
    .from("invitations")
    .select("receiver_id, status")
    .eq("project_id", project.id)
    .eq("status", "pending");

  if (invitationError) {
    console.error("Invitation check error:", invitationError);

    teammatesList.innerHTML =
      '<p class="empty-state">Could not check existing invitations.</p>';

    return;
  }

  const invitedIds = new Set(
    (invitations || []).map((invitation) => invitation.receiver_id),
  );

  // ======================================================
  // CALCULATE MATCHES
  // ======================================================

  const recommendations = profiles
    .filter((profile) => {
      if (memberIds.has(profile.id)) {
        return false;
      }

      if (invitedIds.has(profile.id)) {
        return false;
      }

      return true;
    })
    .map((profile) => {
      const result = calculateMatch(profile, project);

      return {
        profile,
        score: result.score,
        reasons: result.reasons,
      };
    })
    .sort((a, b) => b.score - a.score);

  console.log("Final recommendations:", recommendations);

  const meaningfulMatches = recommendations.filter((item) => item.score >= 40);

  setText("matchCount", meaningfulMatches.length);

  if (meaningfulMatches.length === 0) {
    teammatesList.innerHTML =
      '<p class="empty-state">No strong teammate matches found yet.</p>';

    return;
  }

  // ======================================================
  // RENDER RECOMMENDATIONS
  // ======================================================

  teammatesList.innerHTML = "";

  meaningfulMatches.forEach((recommendation) => {
    const profile = recommendation.profile;

    const card = document.createElement("div");

    card.className = "teammate-item";

    const roles = project.required_roles || [];

    const roleOptions =
      roles.length > 0
        ? roles
            .map(
              (role) => `
                <option value="${escapeHtml(role)}">
                  ${escapeHtml(role)}
                </option>
              `,
            )
            .join("")
        : `
            <option value="Team Member">
              Team Member
            </option>
          `;

    // ======================================================
    // MATCH BREAKDOWN
    // ======================================================

    const studentSkills = profile.skills || [];

    const requiredSkills = project.required_skills || [];

    const matchingSkills = requiredSkills.filter((requiredSkill) =>
      studentSkills.some(
        (studentSkill) =>
          studentSkill.toLowerCase() === requiredSkill.toLowerCase(),
      ),
    );

    const studentInterests = profile.interests || [];

    const projectInterests = project.interests || [];

    const matchingInterests = projectInterests.filter((projectInterest) =>
      studentInterests.some(
        (studentInterest) =>
          studentInterest.toLowerCase() === projectInterest.toLowerCase(),
      ),
    );

    const studentRoles = profile.preferred_roles || [];

    const requiredRoles = project.required_roles || [];

    const matchingRole = requiredRoles.find((requiredRole) =>
      studentRoles.some(
        (studentRole) =>
          studentRole.toLowerCase() === requiredRole.toLowerCase(),
      ),
    );

    const availabilityMatch =
      project.availability_required &&
      profile.availability &&
      project.availability_required.toLowerCase() ===
        profile.availability.toLowerCase();

    const matchReasons =
      recommendation.reasons.length > 0
        ? recommendation.reasons
            .map(
              (reason) =>
                `<div class="match-reason">${escapeHtml(reason)}</div>`,
            )
            .join("")
        : `<div class="match-reason">No strong matches yet</div>`;

    // ======================================================
    // CARD
    // ======================================================

    card.innerHTML = `
      <div class="teammate-info">

        <h3>
          ${escapeHtml(profile.full_name || "Student")}
        </h3>

        <p>
          ${escapeHtml(profile.bio || "No bio available.")}
        </p>

        <small>
          Skills:
          ${escapeHtml((profile.skills || []).join(", ") || "Not specified")}
        </small>

      </div>

      <div class="match-score">

        <div class="match-score-header">

          <div class="match-score-circle">
            <span>
              ${recommendation.score}%
            </span>
          </div>

          <div class="match-score-label">

            <span>
              TEAM MATCH
            </span>

            <strong>
              ${
                recommendation.score >= 70
                  ? "Strong match"
                  : recommendation.score >= 40
                    ? "Good potential"
                    : "Some overlap"
              }
            </strong>

          </div>

        </div>

        <div class="match-breakdown">

          <div class="breakdown-header">
            <span>
              Why this match?
            </span>
          </div>

          <div class="breakdown-item">
            <span>Skills</span>

            <strong>
              ${matchingSkills.length}/${requiredSkills.length || 0}
            </strong>
          </div>

          <div class="breakdown-item">
            <span>Interests</span>

            <strong>
              ${matchingInterests.length}/${projectInterests.length || 0}
            </strong>
          </div>

          <div class="breakdown-item">
            <span>Role</span>

            <strong>
              ${matchingRole ? "✓" : "—"}
            </strong>
          </div>

          <div class="breakdown-item">
            <span>Availability</span>

            <strong>
              ${availabilityMatch ? "✓" : "—"}
            </strong>
          </div>

        </div>

        <div class="match-reasons">
          ${matchReasons}
        </div>

      </div>

      <div class="invite-section">

        <select class="role-select">
          ${roleOptions}
        </select>

        <button
          class="invite-button"
          type="button"
        >
          Send Invitation
        </button>

      </div>
    `;

    const inviteButton = card.querySelector(".invite-button");

    const roleSelect = card.querySelector(".role-select");

    inviteButton.addEventListener("click", async () => {
      await window.sendInvitation(
        userId,
        project.id,
        profile.id,
        inviteButton,
        roleSelect.value,
      );
    });

    teammatesList.appendChild(card);
  });
}

// ======================================================
// INVITATIONS
// ======================================================

async function loadInvitations(userId) {
  const list = document.getElementById("invitationsList");

  if (!list) return;

  const { data: invitations, error } = await supabaseClient
    .from("invitations")
    .select(
      `
        *,
        sender:profiles!invitations_sender_id_fkey (
          full_name
        ),
        receiver:profiles!invitations_receiver_id_fkey (
          full_name
        ),
        project:projects (
          title
        )
      `,
    )
    .eq("receiver_id", userId)
    .eq("status", "pending")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error("Invitations loading error:", error);

    list.innerHTML = '<p class="empty-state">Could not load invitations.</p>';

    setText("invitationCount", 0);

    return;
  }

  setText("invitationCount", invitations?.length || 0);

  if (!invitations?.length) {
    list.innerHTML = `
      <div class="invitation-empty">

        <div class="invitation-empty-icon">
          ✉
        </div>

        <h3>
          No pending invitations
        </h3>

        <p>
          When someone invites you or requests to join
          your project, it will appear here.
        </p>

      </div>
    `;

    return;
  }

  list.innerHTML = "";

  invitations.forEach((invitation) => {
    const element = document.createElement("div");

    element.className = "invitation-item";

    const senderName = invitation.sender?.full_name || "A student";

    const projectTitle = invitation.project?.title || "Untitled Project";

    const senderInitial = escapeHtml(senderName.charAt(0).toUpperCase());

    const isJoinRequest = invitation.request_type === "join_request";

    const label = isJoinRequest ? "JOIN REQUEST" : "TEAM INVITATION";

    const message = isJoinRequest
      ? `
          <strong>
            ${escapeHtml(senderName)}
          </strong>
          wants to join this project.
        `
      : `
          <strong>
            ${escapeHtml(senderName)}
          </strong>
          invited you to join this project.
        `;

    const roleSection = invitation.role
      ? `
          <div class="invitation-role">

            <span>
              ROLE
            </span>

            <strong>
              ${escapeHtml(invitation.role)}
            </strong>

          </div>
        `
      : "";

    element.innerHTML = `
      <div class="invitation-main">

        <div class="invitation-avatar">
          ${senderInitial}
        </div>

        <div class="invitation-content">

          <span class="invitation-label">
            ${label}
          </span>

          <h3>
            ${escapeHtml(projectTitle)}
          </h3>

          <p>
            ${message}
          </p>

          ${roleSection}

        </div>

      </div>

      <div class="invitation-actions">

        <button
          class="accept-button"
          type="button"
        >
          Accept
        </button>

        <button
          class="decline-button"
          type="button"
        >
          Decline
        </button>

      </div>
    `;

    const accept = element.querySelector(".accept-button");
    const decline = element.querySelector(".decline-button");

    accept.addEventListener("click", () => {
      window.respondToInvitation(invitation.id, "accepted", accept, decline);
    });

    decline.addEventListener("click", () => {
      window.respondToInvitation(invitation.id, "declined", accept, decline);
    });

    list.appendChild(element);
  });
}

// ======================================================
// CLOSE PROJECT
// ======================================================

async function closeProject(projectId) {
  if (!projectId) return;

  const confirmed = confirm(
    "Are you sure you want to close this project? New students will no longer be able to join.",
  );

  if (!confirmed) return;

  const { error } = await supabaseClient
    .from("projects")
    .update({
      status: "closed",
    })
    .eq("id", projectId);

  if (error) {
    console.error("Close project error:", error);
    alert("Could not close the project. Please try again.");
    return;
  }

  // Update the page immediately
  const statusElement = document.getElementById("projectStatus");

  if (statusElement) {
    statusElement.textContent = "Closed";
    statusElement.classList.add("project-status-closed");
  }

  // Disable the join button
  const joinButton = document.getElementById("joinProjectBtn");

  if (joinButton) {
    joinButton.disabled = true;
    joinButton.textContent = "Project Closed";
  }

  // Hide management buttons
  const managementActions = document.getElementById("projectManagementActions");

  if (managementActions) {
    managementActions.style.display = "none";
  }

  alert("Project closed successfully.");
}
// ==================================================
// DELETE PROJECT
// ==================================================

async function deleteProject(projectId) {
  if (!projectId) return;

  const confirmed = confirm(
    "Are you sure you want to permanently delete this project?\n\n" +
      "This will remove the project, team memberships, and pending requests.\n\n" +
      "This action cannot be undone.",
  );

  if (!confirmed) {
    return;
  }

  const deleteButton = document.getElementById("deleteProjectBtn");

  if (deleteButton) {
    deleteButton.disabled = true;
    deleteButton.textContent = "Deleting...";
  }

  try {
    const { error } = await supabaseClient
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (error) {
      console.error("Delete project error:", error);

      if (deleteButton) {
        deleteButton.disabled = false;
        deleteButton.textContent = "🗑️ Delete Project";
      }

      alert(
        "Could not delete the project. Please make sure you are the project creator.",
      );

      return;
    }

    alert("Project deleted successfully.");

    // Return to dashboard
    window.location.href = "dashboard.html";
  } catch (error) {
    console.error("Unexpected delete project error:", error);

    if (deleteButton) {
      deleteButton.disabled = false;
      deleteButton.textContent = "🗑️ Delete Project";
    }

    alert("Something went wrong while deleting the project.");
  }
}
async function loadProjectDetails() {
  const titleElement = document.getElementById("projectTitle");

  if (!titleElement) return;

  const params = new URLSearchParams(window.location.search);
  const projectId = params.get("id");

  if (!projectId) {
    titleElement.textContent = "No project selected";

    setText("projectDescription", "Please open a project from your dashboard.");
    setText("projectSkills", "—");
    setText("projectTeamSize", "—");
    setText("projectProgress", "—");
    setText("projectStatus", "—");

    return;
  }

  // ==================================================
  // CURRENT USER
  // ==================================================

  const {
    data: { user },
    error: userError,
  } = await supabaseClient.auth.getUser();

  if (userError || !user) {
    window.location.href = "auth.html";
    return;
  }

  // ==================================================
  // LOAD PROJECT
  // ==================================================

  const { data: project, error: projectError } = await supabaseClient
    .from("projects")
    .select(
      `
        *,
        profiles (
          full_name,
          college,
          skills,
          experience_level
        )
      `,
    )
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    console.error("Project details error:", projectError);

    titleElement.textContent = "Could not load project";

    setText(
      "projectDescription",
      "Something went wrong while loading this project.",
    );

    return;
  }
  // ==================================================
  // DISPLAY PROJECT INFORMATION
  // ==================================================

  document.getElementById("projectTitle").textContent =
    project.title || "Untitled Project";

  document.getElementById("projectDescription").textContent =
    project.description || "No description available.";

  // ==================================================
  // PROJECT MANAGEMENT CONTROLS
  // ==================================================

  const managementActions = document.getElementById("projectManagementActions");

  const editProjectBtn = document.getElementById("editProjectBtn");
  const closeProjectBtn = document.getElementById("closeProjectBtn");
  const deleteProjectBtn = document.getElementById("deleteProjectBtn");

  const isCreator = user.id === project.creator_id;
  const isClosed = project.status === "closed";

  // Creator can always see the management area
  // because Delete Project should also work on closed projects.
  if (managementActions) {
    managementActions.style.display = isCreator ? "flex" : "none";
  }

  // --------------------------------------------------
  // EDIT PROJECT
  // --------------------------------------------------

  // Editing is allowed only while the project is not closed.
  if (editProjectBtn) {
    editProjectBtn.style.display =
      isCreator && !isClosed ? "inline-flex" : "none";
  }

  if (editProjectBtn && isCreator && !isClosed) {
    editProjectBtn.addEventListener("click", () => {
      window.location.href = `create-project.html?edit=${projectId}`;
    });
  }

  // --------------------------------------------------
  // CLOSE PROJECT
  // --------------------------------------------------

  // Closing is allowed only while the project is not already closed.
  if (closeProjectBtn) {
    closeProjectBtn.style.display =
      isCreator && !isClosed ? "inline-flex" : "none";
  }

  if (closeProjectBtn && isCreator && !isClosed) {
    closeProjectBtn.addEventListener("click", () => {
      closeProject(projectId);
    });
  }

  // --------------------------------------------------
  // DELETE PROJECT
  // --------------------------------------------------

  if (deleteProjectBtn) {
    deleteProjectBtn.style.display = isCreator ? "inline-flex" : "none";
  }

  if (deleteProjectBtn && isCreator) {
    deleteProjectBtn.addEventListener("click", () => {
      deleteProject(projectId);
    });
  }

  // ==================================================
  // JOIN PROJECT
  // ==================================================

  const joinButton = document.getElementById("joinProjectBtn");

  if (joinButton) {
    if (isCreator) {
      joinButton.style.display = "none";
    } else if (project.status === "closed") {
      joinButton.disabled = true;
      joinButton.textContent = "Project Closed";
    } else if (project.status === "full") {
      joinButton.disabled = true;
      joinButton.textContent = "Team Full";
    } else {
      joinButton.addEventListener("click", () => {
        requestToJoinProject(projectId);
      });
    }
  }

  // ==================================================
  // COPY PROJECT LINK
  // ==================================================

  const copyButton = document.getElementById("copyProjectLinkBtn");

  if (copyButton) {
    copyButton.addEventListener("click", copyProjectLink);
  }

  // ==================================================
  // BASIC PROJECT INFORMATION
  // ==================================================

  titleElement.textContent = project.title;

  setText(
    "projectDescription",
    project.description || "No description available.",
  );
  const descriptionElement = document.getElementById("projectDescription");

  if (descriptionElement) {
    descriptionElement.textContent =
      project.description || "No description available.";
  }

  setText(
    "projectSkills",
    (project.required_skills || []).join(", ") || "Not specified",
  );

  setText("projectTeamSize", project.team_size);

  // ==================================================
  // LOAD TEAM MEMBERS
  // ==================================================

  const { data: members, error: membersError } = await supabaseClient
    .from("project_members")
    .select(
      `
        *,
        profiles (
          full_name,
          college,
          skills,
          experience_level
        )
      `,
    )
    .eq("project_id", project.id);

  if (membersError) {
    console.error("Team members loading error:", membersError);

    setText("projectProgress", "Could not load");
    setText("projectStatus", "Unknown");

    return;
  }

  const memberCount = members?.length || 0;

  // Creator counts as one team member
  const totalMembers = memberCount + 1;

  const teamSize = Number(project.team_size) || 2;

  const remaining = Math.max(teamSize - totalMembers, 0);

  const progressPercent = Math.min(
    Math.round((totalMembers / teamSize) * 100),
    100,
  );

  const isFull = totalMembers >= teamSize;

  // ==================================================
  // UPDATE PROJECT STATS
  // ==================================================

  setText("projectProgress", `${totalMembers} / ${teamSize} members`);

  // IMPORTANT:
  // Use the actual database status instead of assuming Open.
  let displayStatus = "Open";

  if (project.status === "closed") {
    displayStatus = "Closed";
  } else if (project.status === "full" || isFull) {
    displayStatus = "Full";
  } else if (project.status === "open") {
    displayStatus = "Open";
  }

  const statusElement = document.getElementById("projectStatus");

  if (statusElement) {
    statusElement.textContent = displayStatus;

    statusElement.classList.toggle(
      "project-status-closed",
      project.status === "closed",
    );
  }

  const progressBar = document.getElementById("projectProgressBar");

  if (progressBar) {
    progressBar.style.width = `${progressPercent}%`;
  }

  // ==================================================
  // TEAM CONTAINER
  // ==================================================

  const container = document.getElementById("projectMembers");

  if (!container) return;

  container.innerHTML = "";

  // ==================================================
  // PROJECT CREATOR
  // ==================================================

  const creatorProfile = project.profiles || {};

  const creatorName = creatorProfile.full_name || "Unknown Student";

  const creatorInitial = escapeHtml(creatorName.charAt(0).toUpperCase());

  const creatorSkills = creatorProfile.skills || [];

  const creatorElement = document.createElement("div");

  creatorElement.className = "project-member-card project-owner-card";

  creatorElement.innerHTML = `
    <div class="project-member-info">

      <div class="project-member-avatar">
        ${creatorInitial}
      </div>

      <div class="project-member-main">

        <p class="project-member-name">
          ${escapeHtml(creatorName)}
        </p>

        <span class="project-member-role">
          Project Creator
        </span>

        ${
          creatorProfile.college
            ? `
              <small class="member-college">
                ${escapeHtml(creatorProfile.college)}
              </small>
            `
            : ""
        }

        ${
          creatorSkills.length
            ? `
              <div class="member-skill-tags">

                ${creatorSkills
                  .slice(0, 5)
                  .map(
                    (skill) =>
                      `<span class="member-skill-tag">
                        ${escapeHtml(skill)}
                      </span>`,
                  )
                  .join("")}

                ${
                  creatorSkills.length > 5
                    ? `
                      <span class="member-skill-tag more">
                        +${creatorSkills.length - 5}
                      </span>
                    `
                    : ""
                }

              </dtml
            `
            : ""
        }

      </div>

    </div>

    <span class="project-member-badge owner-badge">
      OWNER
    </span>
  `;

  container.appendChild(creatorElement);
  const teamMemberCountElement = document.getElementById("teamMemberCount");

  if (teamMemberCountElement) {
    teamMemberCountElement.textContent = `${totalMembers} / ${teamSize} members`;
  }

  // ==================================================
  // TEAM MEMBERS
  // ==================================================

  (members || []).forEach((member) => {
    const element = document.createElement("div");

    element.className = "project-member-card";

    const profile = member.profiles || {};

    const memberName = profile.full_name || "Unknown Student";

    const memberInitial = escapeHtml(memberName.charAt(0).toUpperCase());

    const memberSkills = profile.skills || [];

    const roles = project.required_roles || [];

    const options = ["Team Member", ...roles]
      .filter((role, index, array) => array.indexOf(role) === index)
      .map(
        (role) => `
          <option
            value="${escapeHtml(role)}"
            ${member.role === role ? "selected" : ""}
          >
            ${escapeHtml(role)}
          </option>
        `,
      )
      .join("");

    element.innerHTML = `
      <div class="project-member-info">

        <div class="project-member-avatar">
          ${memberInitial}
        </div>

        <div class="project-member-main">

          <p class="project-member-name">
            ${escapeHtml(memberName)}
          </p>

          <span class="project-member-role">
            ${escapeHtml(member.role || "Team Member")}
          </span>

          ${
            profile.college
              ? `
                <small class="member-college">
                  ${escapeHtml(profile.college)}
                </small>
              `
              : ""
          }

          ${
            profile.experience_level
              ? `
                <small class="member-experience">
                  ${escapeHtml(profile.experience_level)} level
                </small>
              `
              : ""
          }

          ${
            memberSkills.length
              ? `
                <div class="member-skill-tags">

                  ${memberSkills
                    .slice(0, 5)
                    .map(
                      (skill) =>
                        `<span class="member-skill-tag">
                          ${escapeHtml(skill)}
                        </span>`,
                    )
                    .join("")}

                  ${
                    memberSkills.length > 5
                      ? `
                        <span class="member-skill-tag more">
                          +${memberSkills.length - 5}
                        </span>
                      `
                      : ""
                  }

                </div>
              `
              : ""
          }

        </div>

      </div>

      ${
        isCreator
          ? `
            <div class="member-management">

              <select class="member-role-select">
                ${options}
              </select>

              <button
                class="remove-member-button"
                type="button"
              >
                Remove
              </button>

            </div>
          `
          : `
            <span class="project-member-badge">
              ${escapeHtml(member.role || "MEMBER")}
            </span>
          `
      }
    `;

    if (isCreator) {
      const roleSelect = element.querySelector(".member-role-select");

      if (roleSelect) {
        roleSelect.addEventListener("change", async () => {
          await updateMemberRole(member.id, project.id, roleSelect.value);
        });
      }

      const removeButton = element.querySelector(".remove-member-button");

      if (removeButton) {
        removeButton.addEventListener("click", async () => {
          await removeProjectMember(member.id, project.id);
        });
      }
    }

    container.appendChild(element);
  });

  // ==================================================
  // TEAM PROGRESS
  // ==================================================

  const progressElement = document.getElementById("projectProgress");

  if (progressElement) {
    progressElement.innerHTML = `
      <div class="project-detail-progress">

        <div class="project-detail-progress-top">

          <strong>
            ${totalMembers} / ${teamSize}
          </strong>

          <span>
            ${progressPercent}%
          </span>

        </div>

        <div class="project-detail-progress-bar">

          <div
            class="project-detail-progress-fill"
            style="width: ${progressPercent}%"
          ></div>

        </div>

        <small>
          ${
            remaining === 0
              ? "🎉 Team is complete"
              : `${remaining} spot${remaining === 1 ? "" : "s"} remaining`
          }
        </small>

      </div>
    `;
  }
}

// ======================================================
// UPDATE MEMBER ROLE
// ======================================================

async function updateMemberRole(memberId, projectId, newRole) {
  const { error } = await supabaseClient
    .from("project_members")
    .update({
      role: newRole,
    })
    .eq("id", memberId)
    .eq("project_id", projectId);

  if (error) {
    console.error("Update role error:", error);

    alert("Could not update the member role.");

    return;
  }

  await loadProjectDetails();
}

// ======================================================
// REMOVE PROJECT MEMBER
// ======================================================

async function removeProjectMember(memberId, projectId) {
  if (!confirm("Are you sure you want to remove this team member?")) {
    return;
  }

  // ========================================
  // GET CURRENT PROJECT STATUS
  // ========================================

  const { data: project, error: projectError } = await supabaseClient
    .from("projects")
    .select("status")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    console.error("Project loading error:", projectError);

    alert("Could not check the project status.");

    return;
  }

  // ========================================
  // REMOVE MEMBER
  // ========================================

  const { error } = await supabaseClient
    .from("project_members")
    .delete()
    .eq("id", memberId)
    .eq("project_id", projectId);

  if (error) {
    console.error("Remove member error:", error);

    alert("Could not remove the team member.");

    return;
  }

  // ========================================
  // REOPEN ONLY IF PROJECT WAS FULL
  // ========================================

  if (project.status === "full") {
    const { error: updateError } = await supabaseClient
      .from("projects")
      .update({
        status: "open",
      })
      .eq("id", projectId);

    if (updateError) {
      console.error("Project status update error:", updateError);
    }
  }

  // ========================================
  // REFRESH PROJECT
  // ========================================

  await loadProjectDetails();
}

// ======================================================
// DASHBOARD BUTTONS
// ======================================================

function setupDashboardActions() {
  const logout = document.getElementById("logoutBtn");

  if (logout) {
    logout.addEventListener("click", async () => {
      logout.disabled = true;
      logout.textContent = "Logging out...";

      const { error } = await supabaseClient.auth.signOut();

      if (error) {
        console.error(error);

        logout.disabled = false;
        logout.textContent = "Logout";

        return;
      }

      window.location.href = "index.html";
    });
  }

  const createButtons = [
    "dashboardCreateProjectBtn",
    "dashboardCreateProjectBtnSecondary",

    "createProjectBtn",
    "projectsCreateBtn",
    "emptyCreateProjectBtn",
  ];

  createButtons.forEach((id) => {
    const button = document.getElementById(id);

    if (button) {
      button.addEventListener("click", () => {
        window.location.href = "create-project.html";
      });
    }
  });
}

// ======================================================
// CREATE PROJECT
// ======================================================
function setupCreateProjectPage() {
  const form = document.getElementById("projectForm");

  if (!form) return;

  const backButton = document.getElementById("backToDashboardBtn");

  if (backButton) {
    backButton.addEventListener("click", () => {
      window.location.href = "dashboard.html";
    });
  }

  // ==================================================
  // EDIT MODE
  // ==================================================

  const params = new URLSearchParams(window.location.search);
  const editProjectId = params.get("edit");

  const titleElement = document.getElementById("projectFormTitle");
  const subtitleElement = document.getElementById("projectFormSubtitle");
  const submitButton = document.getElementById("createProjectSubmit");

  if (editProjectId) {
    if (titleElement) {
      titleElement.textContent = "Edit Project";
    }

    if (subtitleElement) {
      subtitleElement.textContent =
        "Update your project details and keep your team requirements up to date.";
    }

    if (submitButton) {
      submitButton.textContent = "Save Changes";
    }

    loadProjectForEditing(editProjectId);
  }

  // ==================================================
  // FORM SUBMIT
  // ==================================================

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = document.getElementById("projectMessage");
    const submit = document.getElementById("createProjectSubmit");

    if (!message || !submit) return;

    submit.disabled = true;
    submit.textContent = editProjectId ? "Saving..." : "Creating...";

    // ==================================================
    // CURRENT USER
    // ==================================================

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      message.textContent = "You are not logged in. Please log in again.";

      message.className = "profile-message error";

      submit.disabled = false;
      submit.textContent = editProjectId ? "Save Changes" : "Create Project";

      return;
    }

    // ==================================================
    // FORM VALUES
    // ==================================================

    const title = document.getElementById("projectTitle")?.value.trim() || "";

    const description =
      document.getElementById("projectDescription")?.value.trim() || "";

    const requiredSkills = getCommaSeparatedValues("requiredSkills");

    const projectInterests = getCommaSeparatedValues("projectInterests");

    const requiredRoles = Array.from(
      document.querySelectorAll('input[name="projectRoles"]:checked'),
    ).map((input) => input.value);

    const teamSize = Number(document.getElementById("teamSize")?.value);

    const availability =
      document.getElementById("projectAvailability")?.value || "";

    // ==================================================
    // VALIDATION
    // ==================================================

    if (!title || !description) {
      message.textContent = "Please enter a project name and description.";

      message.className = "profile-message error";

      submit.disabled = false;
      submit.textContent = editProjectId ? "Save Changes" : "Create Project";

      return;
    }

    if (!requiredSkills.length) {
      message.textContent = "Please enter at least one required skill.";

      message.className = "profile-message error";

      submit.disabled = false;
      submit.textContent = editProjectId ? "Save Changes" : "Create Project";

      return;
    }

    if (!requiredRoles.length) {
      message.textContent = "Please select at least one required role.";

      message.className = "profile-message error";

      submit.disabled = false;
      submit.textContent = editProjectId ? "Save Changes" : "Create Project";

      return;
    }

    if (!teamSize || teamSize < 2 || teamSize > 20) {
      message.textContent = "Team size must be between 2 and 20.";

      message.className = "profile-message error";

      submit.disabled = false;
      submit.textContent = editProjectId ? "Save Changes" : "Create Project";

      return;
    }

    if (!availability) {
      message.textContent = "Please select an availability.";

      message.className = "profile-message error";

      submit.disabled = false;
      submit.textContent = editProjectId ? "Save Changes" : "Create Project";

      return;
    }

    // ==================================================
    // EDIT EXISTING PROJECT
    // ==================================================

    if (editProjectId) {
      message.textContent = "Saving your changes...";
      message.className = "profile-message loading";

      const { error } = await supabaseClient
        .from("projects")
        .update({
          title,
          description,
          required_skills: requiredSkills,
          interests: projectInterests,
          required_roles: requiredRoles,
          team_size: teamSize,
          availability_required: availability,
        })
        .eq("id", editProjectId)
        .eq("creator_id", user.id);

      if (error) {
        console.error("Project update error:", error);

        message.textContent = "Could not update project: " + error.message;

        message.className = "profile-message error";

        submit.disabled = false;
        submit.textContent = "Save Changes";

        return;
      }

      message.textContent = "Project updated successfully! 🎉";

      message.className = "profile-message success";

      setTimeout(() => {
        window.location.href = `project.html?id=${editProjectId}`;
      }, 800);

      return;
    }

    // ==================================================
    // CREATE NEW PROJECT
    // ==================================================

    message.textContent = "Creating your project...";
    message.className = "profile-message loading";

    const { error } = await supabaseClient.from("projects").insert({
      creator_id: user.id,
      title,
      description,
      required_skills: requiredSkills,
      interests: projectInterests,
      required_roles: requiredRoles,
      team_size: teamSize,
      availability_required: availability,
      status: "open",
    });

    if (error) {
      console.error("Project creation error:", error);

      message.textContent = "Could not create project: " + error.message;

      message.className = "profile-message error";

      submit.disabled = false;
      submit.textContent = "Create Project";

      return;
    }

    message.textContent = "Project created successfully! 🎉";

    message.className = "profile-message success";

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 800);
  });
}
// ======================================================
// LOAD PROJECT FOR EDITING
// ======================================================

async function loadProjectForEditing(projectId) {
  const message = document.getElementById("projectMessage");

  const {
    data: { user },
    error: userError,
  } = await supabaseClient.auth.getUser();

  if (userError || !user) {
    window.location.href = "auth.html";
    return;
  }

  const { data: project, error } = await supabaseClient
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("creator_id", user.id)
    .single();

  if (error || !project) {
    console.error("Load project for editing error:", error);

    if (message) {
      message.textContent = "Could not load this project for editing.";

      message.className = "profile-message error";
    }

    return;
  }

  // ==================================================
  // FILL FORM
  // ==================================================

  const titleInput = document.getElementById("projectTitle");
  const descriptionInput = document.getElementById("projectDescription");
  const skillsInput = document.getElementById("requiredSkills");
  const interestsInput = document.getElementById("projectInterests");
  const teamSizeInput = document.getElementById("teamSize");
  const availabilityInput = document.getElementById("projectAvailability");

  if (titleInput) {
    titleInput.value = project.title || "";
  }

  if (descriptionInput) {
    descriptionInput.value = project.description || "";
  }

  if (skillsInput) {
    skillsInput.value = (project.required_skills || []).join(", ");
  }

  if (interestsInput) {
    interestsInput.value = (project.interests || []).join(", ");
  }

  if (teamSizeInput) {
    teamSizeInput.value = project.team_size || 2;
  }

  if (availabilityInput) {
    availabilityInput.value = project.availability_required || "Any";
  }

  // ==================================================
  // SELECT REQUIRED ROLES
  // ==================================================

  const requiredRoles = project.required_roles || [];

  document
    .querySelectorAll('input[name="projectRoles"]')
    .forEach((checkbox) => {
      checkbox.checked = requiredRoles.includes(checkbox.value);
    });
}
// ======================================================
// HELPERS
// ======================================================

function getCommaSeparatedValues(elementId) {
  const element = document.getElementById(elementId);

  if (!element) return [];

  return element.value
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function setText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value ?? "";
  }
}

function setInputValue(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.value = value ?? "";
  }
}

// ======================================================
// COPY PROJECT LINK
// ======================================================

async function copyProjectLink() {
  const button = document.getElementById("copyProjectLinkBtn");

  if (!button) return;

  const projectId = new URLSearchParams(window.location.search).get("id");

  if (!projectId) return;

  const projectUrl = `${window.location.origin}${window.location.pathname}?id=${projectId}`;

  try {
    await navigator.clipboard.writeText(projectUrl);

    button.textContent = "✓ Link Copied!";

    button.classList.add("copied");

    setTimeout(() => {
      button.textContent = "🔗 Copy Project Link";

      button.classList.remove("copied");
    }, 2000);
  } catch (error) {
    console.error("Could not copy project link:", error);

    button.textContent = "Copy failed";

    setTimeout(() => {
      button.textContent = "🔗 Copy Project Link";
    }, 2000);
  }
}
// ======================================================
// GLOBAL INVITATION FUNCTIONS
// ======================================================

window.sendInvitation = async function (
  senderId,
  projectId,
  receiverId,
  button,
  selectedRole,
) {
  button.disabled = true;
  button.textContent = "Checking...";

  try {
    // Check project
    const { data: project, error: projectError } = await supabaseClient
      .from("projects")
      .select("team_size, status")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      console.error("Project loading error:", projectError);
      throw new Error("Could not check the project.");
    }

    if ((project.status || "open").toLowerCase() === "closed") {
      throw new Error("This project is closed.");
    }

    if ((project.status || "open").toLowerCase() === "full") {
      throw new Error("This project is already full.");
    }

    // Check current members
    const { data: currentMembers, error: membersError } = await supabaseClient
      .from("project_members")
      .select("id, user_id")
      .eq("project_id", projectId);

    if (membersError) {
      throw membersError;
    }

    const currentTeamSize = (currentMembers?.length || 0) + 1;

    if (currentTeamSize >= Number(project.team_size)) {
      throw new Error("This project is already full.");
    }

    // Prevent inviting someone already in the team
    const alreadyMember = (currentMembers || []).some(
      (member) => member.user_id === receiverId,
    );

    if (alreadyMember) {
      throw new Error("This student is already a team member.");
    }

    // Prevent duplicate pending invitation
    const { data: existingInvitation, error: existingError } =
      await supabaseClient
        .from("invitations")
        .select("id")
        .eq("project_id", projectId)
        .eq("receiver_id", receiverId)
        .eq("status", "pending")
        .limit(1);

    if (existingError) {
      throw existingError;
    }

    if (existingInvitation && existingInvitation.length > 0) {
      throw new Error("An invitation has already been sent.");
    }

    // Send invitation
    const { error: insertError } = await supabaseClient
      .from("invitations")
      .insert({
        project_id: Number(projectId),
        sender_id: senderId,
        receiver_id: receiverId,
        status: "pending",
        role: selectedRole || "Team Member",
        request_type: "invitation",
      });

    if (insertError) {
      throw insertError;
    }

    button.textContent = "Invitation Sent";
    button.disabled = true;

    alert("Invitation sent successfully! 🎉");
  } catch (error) {
    console.error("Send invitation error:", error);

    button.disabled = false;
    button.textContent = "Send Invitation";

    alert(error.message || "Could not send invitation.");
  }
};

// ======================================================
// RESPOND TO INVITATION
// ======================================================

window.respondToInvitation = async function (
  invitationId,
  response,
  acceptButton,
  declineButton,
) {
  if (!invitationId) return;

  acceptButton.disabled = true;
  declineButton.disabled = true;

  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error("Please log in again.");
    }

    // Load invitation
    const { data: invitation, error: invitationError } = await supabaseClient
      .from("invitations")
      .select(
        `
          *,
          project:projects (
            id,
            title,
            team_size,
            status,
            creator_id
          )
        `,
      )
      .eq("id", invitationId)
      .single();

    if (invitationError || !invitation) {
      throw invitationError || new Error("Invitation not found.");
    }

    // Make sure current user is the receiver
    if (invitation.receiver_id !== user.id) {
      throw new Error("You cannot respond to this invitation.");
    }

    // ==============================
    // DECLINE
    // ==============================

    if (response === "declined") {
      const { error } = await supabaseClient
        .from("invitations")
        .update({
          status: "declined",
          responded_at: new Date().toISOString(),
        })
        .eq("id", invitationId)
        .eq("receiver_id", user.id);

      if (error) {
        throw error;
      }

      alert("Invitation declined.");

      await loadInvitations(user.id);

      return;
    }

    // ==============================
    // ACCEPT
    // ==============================

    const project = invitation.project;

    if (!project) {
      throw new Error("Project could not be found.");
    }

    if ((project.status || "open").toLowerCase() === "closed") {
      throw new Error("This project is closed.");
    }

    // Load members
    const { data: members, error: membersError } = await supabaseClient
      .from("project_members")
      .select("id, user_id")
      .eq("project_id", project.id);

    if (membersError) {
      throw membersError;
    }

    const existingMember = (members || []).some(
      (member) => member.user_id === user.id,
    );

    if (existingMember) {
      throw new Error("You are already a member of this project.");
    }

    const currentTeamSize = (members?.length || 0) + 1;

    if (currentTeamSize > Number(project.team_size)) {
      throw new Error("This project is already full.");
    }

    // Add user to project
    const { error: memberError } = await supabaseClient
      .from("project_members")
      .insert({
        project_id: project.id,
        user_id: user.id,
        role: invitation.role || "Team Member",
      });

    if (memberError) {
      throw memberError;
    }

    // Mark invitation accepted
    const { error: updateError } = await supabaseClient
      .from("invitations")
      .update({
        status: "accepted",
        responded_at: new Date().toISOString(),
      })
      .eq("id", invitationId)
      .eq("receiver_id", user.id);

    if (updateError) {
      throw updateError;
    }

    // Update project status if team is now full
    if (currentTeamSize >= Number(project.team_size)) {
      const { error: statusError } = await supabaseClient
        .from("projects")
        .update({
          status: "full",
        })
        .eq("id", project.id);

      if (statusError) {
        console.error("Project status update error:", statusError);
      }
    }

    alert("Invitation accepted! 🎉");

    await loadInvitations(user.id);
    await loadDashboard();
  } catch (error) {
    console.error("Invitation response error:", error);

    acceptButton.disabled = false;
    declineButton.disabled = false;

    alert(error.message || "Could not respond to invitation.");
  }
};
