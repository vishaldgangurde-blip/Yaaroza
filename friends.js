/* =========================================================
   YAAROZA FRIENDS SYSTEM
   File: friends.js
   ========================================================= */

(function () {
  "use strict";

  const SUPABASE_URL =
    "https://qkpljuksfgyyooythbjg.supabase.co";

  const SUPABASE_KEY =
    "sb_publishable_GQ4XSSgd7_eBOe18DkkMA_7PBuNZId";

  let supabaseClient = null;
  let currentUser = null;
  let initialized = false;

  /* =========================================================
     SUPABASE LOADER
     ========================================================= */

  function loadSupabase() {
    return new Promise((resolve, reject) => {
      if (
        window.supabase &&
        typeof window.supabase.createClient === "function"
      ) {
        resolve();
        return;
      }

      const existing = document.querySelector(
        'script[src*="supabase-js"]'
      );

      if (existing) {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }

      const script = document.createElement("script");

      script.src =
        "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

      script.onload = resolve;
      script.onerror = () =>
        reject(new Error("Supabase library could not load."));

      document.head.appendChild(script);
    });
  }

  /* =========================================================
     HELPERS
     ========================================================= */

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function fallbackAvatar(name) {
    return (
      "https://ui-avatars.com/api/?name=" +
      encodeURIComponent(name || "User")
    );
  }

  function getContainer() {
    return (
      document.querySelector("main") ||
      document.querySelector(".container") ||
      document.body
    );
  }

  /* =========================================================
     CURRENT USER
     ========================================================= */

  async function getCurrentUser() {
    const { data, error } =
      await supabaseClient.auth.getUser();

    if (error || !data || !data.user) {
      currentUser = null;
      return null;
    }

    currentUser = data.user;
    return currentUser;
  }

  /* =========================================================
     UI
     ========================================================= */

  function addStyles() {
    if (document.getElementById("yaarozaFriendsStyles")) {
      return;
    }

    const style = document.createElement("style");

    style.id = "yaarozaFriendsStyles";

    style.textContent = `
      #yaarozaFriendsSystem {
        width: 100%;
        max-width: 620px;
        margin: 20px auto;
        font-family: Arial, sans-serif;
        box-sizing: border-box;
      }

      #yaarozaFriendsSystem *,
      #yaarozaFriendsSystem *::before,
      #yaarozaFriendsSystem *::after {
        box-sizing: border-box;
      }

      .yz-friends-card {
        background: #ffffff;
        border-radius: 18px;
        padding: 20px;
        box-shadow: 0 6px 25px rgba(0,0,0,0.10);
      }

      .yz-friends-title {
        text-align: center;
        margin: 0 0 18px;
      }

      .yz-friends-tabs {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
      }

      .yz-friends-tabs button {
        flex: 1;
        border: 0;
        padding: 11px 8px;
        border-radius: 10px;
        cursor: pointer;
        background: #eeeeee;
        font-weight: 600;
      }

      .yz-friends-search {
        display: flex;
        gap: 8px;
        margin-bottom: 15px;
      }

      #yzFriendsSearchInput {
        flex: 1;
        min-width: 0;
        padding: 12px;
        border: 1px solid #dddddd;
        border-radius: 10px;
        outline: none;
      }

      #yzFriendsSearchButton {
        border: 0;
        padding: 12px 16px;
        border-radius: 10px;
        background: #111111;
        color: #ffffff;
        cursor: pointer;
      }

      .yz-friend-user {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 0;
        border-bottom: 1px solid #eeeeee;
      }

      .yz-friend-user:last-child {
        border-bottom: 0;
      }

      .yz-friend-user img {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        object-fit: cover;
        background: #dddddd;
        flex-shrink: 0;
      }

      .yz-friend-info {
        flex: 1;
        min-width: 0;
      }

      .yz-friend-name {
        font-weight: 700;
        word-break: break-word;
      }

      .yz-friend-username {
        color: #777777;
        font-size: 13px;
        margin-top: 3px;
      }

      .yz-friend-button {
        border: 0;
        border-radius: 9px;
        padding: 9px 12px;
        cursor: pointer;
        background: #111111;
        color: #ffffff;
        white-space: nowrap;
      }

      .yz-friend-button.accept {
        background: #16803c;
      }

      .yz-friend-button.reject {
        background: #777777;
      }

      .yz-friend-button.remove {
        background: #b3261e;
      }

      .yz-friend-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .yz-friend-actions {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
        justify-content: flex-end;
      }

      .yz-empty {
        text-align: center;
        color: #777777;
        padding: 20px 10px;
      }

      .yz-status {
        text-align: center;
        color: #777777;
        padding: 12px;
      }

      @media (max-width: 480px) {
        .yz-friends-search {
          flex-direction: column;
        }

        #yzFriendsSearchButton {
          width: 100%;
        }

        .yz-friend-user {
          align-items: flex-start;
        }

        .yz-friend-actions {
          flex-direction: column;
        }

        .yz-friend-button {
          width: 100%;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function createUI() {
    if (document.getElementById("yaarozaFriendsSystem")) {
      return;
    }

    const container = getContainer();

    const section = document.createElement("section");

    section.id = "yaarozaFriendsSystem";

    section.innerHTML = `
      <div class="yz-friends-card">

        <h2 class="yz-friends-title">
          👥 Friends
        </h2>

        <div class="yz-friends-tabs">

          <button id="yzSearchTab">
            Find People
          </button>

          <button id="yzRequestsTab">
            Requests
          </button>

          <button id="yzFriendsTab">
            My Friends
          </button>

        </div>

        <div id="yzSearchArea">

          <div class="yz-friends-search">

            <input
              id="yzFriendsSearchInput"
              type="text"
              placeholder="Search username or name..."
              autocomplete="off"
            />

            <button id="yzFriendsSearchButton">
              Search
            </button>

          </div>

          <div id="yzFriendsSearchResults"></div>

        </div>

        <div
          id="yzRequestsArea"
          style="display:none;"
        >
          <div id="yzRequestsList">
            <div class="yz-status">
              Loading...
            </div>
          </div>
        </div>

        <div
          id="yzFriendsArea"
          style="display:none;"
        >
          <div id="yzFriendsList">
            <div class="yz-status">
              Loading...
            </div>
          </div>
        </div>

      </div>
    `;

    container.appendChild(section);

    addStyles();

    document
      .getElementById("yzFriendsSearchButton")
      .addEventListener("click", searchPeople);

    document
      .getElementById("yzFriendsSearchInput")
      .addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          searchPeople();
        }
      });

    document
      .getElementById("yzSearchTab")
      .addEventListener("click", showSearch);

    document
      .getElementById("yzRequestsTab")
      .addEventListener("click", showRequests);

    document
      .getElementById("yzFriendsTab")
      .addEventListener("click", showFriends);
  }

  /* =========================================================
     SEARCH PEOPLE
     ========================================================= */

  async function searchPeople() {
    const input =
      document.getElementById("yzFriendsSearchInput");

    const results =
      document.getElementById("yzFriendsSearchResults");

    if (!input || !results || !currentUser) {
      return;
    }

    const searchText = input.value.trim();

    if (!searchText) {
      results.innerHTML =
        '<div class="yz-empty">Search for a person.</div>';
      return;
    }

    results.innerHTML =
      '<div class="yz-status">Searching...</div>';

    const safeSearch =
      searchText.replace(/[%_]/g, "");

    const { data, error } = await supabaseClient
      .from("profiles")
      .select(
        "id, display_name, username, avatar_url, bio"
      )
      .or(
        `username.ilike.%${safeSearch}%,display_name.ilike.%${safeSearch}%`
      )
      .limit(20);

    if (error) {
      console.error("Yaaroza search error:", error);

      results.innerHTML =
        '<div class="yz-empty">Search failed.</div>';

      return;
    }

    const people = (data || []).filter(
      person => person.id !== currentUser.id
    );

    if (!people.length) {
      results.innerHTML =
        '<div class="yz-empty">No people found.</div>';
      return;
    }

    results.innerHTML = "";

    for (const person of people) {
      const row = await createPersonRow(person);
      results.appendChild(row);
    }
  }

  /* =========================================================
     PERSON ROW
     ========================================================= */

  async function createPersonRow(person) {
    const row = document.createElement("div");

    row.className = "yz-friend-user";

    const avatar =
      person.avatar_url ||
      fallbackAvatar(person.display_name);

    const alreadyFriend =
      await isFriend(person.id);

    const sent =
      await hasSentRequest(person.id);

    const received =
      await hasReceivedRequest(person.id);

    let actionHTML = "";

    if (alreadyFriend) {
      actionHTML = `
        <button
          class="yz-friend-button remove"
          data-action="remove"
          data-user-id="${escapeHTML(person.id)}">
          Remove Friend
        </button>
      `;
    } else if (sent) {
      actionHTML = `
        <button
          class="yz-friend-button"
          disabled>
          Request Sent
        </button>
      `;
    } else if (received) {
      actionHTML = `
        <button
          class="yz-friend-button accept"
          data-action="accept-user"
          data-user-id="${escapeHTML(person.id)}">
          Accept
        </button>
      `;
    } else {
      actionHTML = `
        <button
          class="yz-friend-button"
          data-action="add"
          data-user-id="${escapeHTML(person.id)}">
          Add Friend
        </button>
      `;
    }

    row.innerHTML = `
      <img
        src="${escapeHTML(avatar)}"
        alt="Profile"
      >

      <div class="yz-friend-info">

        <div class="yz-friend-name">
          ${escapeHTML(
            person.display_name || "Yaaroza User"
          )}
        </div>

        <div class="yz-friend-username">
          ${
            person.username
              ? "@" + escapeHTML(person.username)
              : ""
          }
        </div>

      </div>

      <div class="yz-friend-actions">
        ${actionHTML}
      </div>
    `;

    const button = row.querySelector("button");

    if (button) {
      button.addEventListener("click", async function () {
        const action = button.dataset.action;
        const userId = button.dataset.userId;

        if (action === "add") {
          await sendFriendRequest(userId);
        }

        if (action === "remove") {
          await removeFriend(userId);
        }

        if (action === "accept-user") {
          await acceptReceivedRequest(userId);
        }
      });
    }

    return row;
  }

  /* =========================================================
     FRIEND REQUEST CHECKS
     ========================================================= */

  async function hasSentRequest(userId) {
    const { data, error } =
      await supabaseClient
        .from("friend_requests")
        .select("id")
        .eq("sender_id", currentUser.id)
        .eq("receiver_id", userId)
        .eq("status", "pending")
        .maybeSingle();

    if (error) {
      console.error(error);
      return false;
    }

    return !!data;
  }

  async function hasReceivedRequest(userId) {
    const { data, error } =
      await supabaseClient
        .from("friend_requests")
        .select("id")
        .eq("sender_id", userId)
        .eq("receiver_id", currentUser.id)
        .eq("status", "pending")
        .maybeSingle();

    if (error) {
      console.error(error);
      return false;
    }

    return !!data;
  }

  /* =========================================================
     CHECK FRIENDSHIP
     ========================================================= */

  async function isFriend(userId) {
    const { data, error } =
      await supabaseClient
        .from("friends")
        .select("id")
        .eq("user_id", currentUser.id)
        .eq("friend_id", userId)
        .maybeSingle();

    if (error) {
      console.error(error);
      return false;
    }

    return !!data;
  }

  /* =========================================================
     SEND REQUEST
     ========================================================= */

  async function sendFriendRequest(userId) {
    if (!currentUser || !userId) {
      return;
    }

    if (userId === currentUser.id) {
      return;
    }

    if (await isFriend(userId)) {
      alert("You are already friends.");
      return;
    }

    if (await hasSentRequest(userId)) {
      alert("Friend request already sent.");
      return;
    }

    const received =
      await hasReceivedRequest(userId);

    if (received) {
      alert(
        "This person has already sent you a request. Open Requests."
      );
      return;
    }

    const { error } =
      await supabaseClient
        .from("friend_requests")
        .insert({
          id: crypto.randomUUID(),
          sender_id: currentUser.id,
          receiver_id: userId,
          status: "pending"
        });

    if (error) {
      console.error(
        "Send friend request error:",
        error
      );

      alert("Could not send friend request.");
      return;
    }

    alert("Friend request sent.");

    await searchPeople();
  }

  /* =========================================================
     LOAD REQUESTS
     ========================================================= */

  async function loadRequests() {
    const area =
      document.getElementById("yzRequestsList");

    if (!area || !currentUser) {
      return;
    }

    area.innerHTML =
      '<div class="yz-status">Loading...</div>';

    const { data, error } =
      await supabaseClient
        .from("friend_requests")
        .select(
          "id, sender_id, status, created_at"
        )
        .eq("receiver_id", currentUser.id)
        .eq("status", "pending")
        .order("created_at", {
          ascending: false
        });

    if (error) {
      console.error(
        "Load requests error:",
        error
      );

      area.innerHTML =
        '<div class="yz-empty">Could not load requests.</div>';

      return;
    }

    if (!data || !data.length) {
      area.innerHTML =
        '<div class="yz-empty">No friend requests.</div>';

      return;
    }

    area.innerHTML = "";

    for (const request of data) {
      const profile =
        await getProfile(request.sender_id);

      const row =
        createRequestRow(request, profile);

      area.appendChild(row);
    }
  }

  /* =========================================================
     PROFILE LOADER
     ========================================================= */

  async function getProfile(userId) {
    const { data, error } =
      await supabaseClient
        .from("profiles")
        .select(
          "id, display_name, username, avatar_url, bio"
        )
        .eq("id", userId)
        .maybeSingle();

    if (error) {
      console.error(error);
      return null;
    }

    return data;
  }

  /* =========================================================
     REQUEST ROW
     ========================================================= */

  function createRequestRow(request, profile) {
    const row = document.createElement("div");

    row.className = "yz-friend-user";

    const avatar =
      profile?.avatar_url ||
      fallbackAvatar(profile?.display_name);

    row.innerHTML = `
      <img
        src="${escapeHTML(avatar)}"
        alt="Profile"
      >

      <div class="yz-friend-info">

        <div class="yz-friend-name">
          ${escapeHTML(
            profile?.display_name ||
            "Yaaroza User"
          )}
        </div>

        <div class="yz-friend-username">
          ${
            profile?.username
              ? "@" + escapeHTML(profile.username)
              : ""
          }
        </div>

      </div>

      <div class="yz-friend-actions">

        <button
          class="yz-friend-button accept">
          Accept
        </button>

        <button
          class="yz-friend-button reject">
          Reject
        </button>

      </div>
    `;

    const buttons =
      row.querySelectorAll("button");

    buttons[0].addEventListener(
      "click",
      () => acceptFriendRequest(request.id)
    );

    buttons[1].addEventListener(
      "click",
      () => rejectFriendRequest(request.id)
    );

    return row;
  }

  /* =========================================================
     ACCEPT REQUEST
     ========================================================= */

  async function acceptFriendRequest(requestId) {
    if (!requestId) {
      return;
    }

    const { error } =
      await supabaseClient.rpc(
        "accept_friend_request",
        {
          request_id: requestId
        }
      );

    if (error) {
      console.error(
        "Accept friend request error:",
        error
      );

      alert(
        "Could not accept friend request."
      );

      return;
    }

    alert("Friend request accepted.");

    await loadRequests();
    await loadFriends();
  }

  /* =========================================================
     ACCEPT FROM SEARCH
     ========================================================= */

  async function acceptReceivedRequest(userId) {
    const { data, error } =
      await supabaseClient
        .from("friend_requests")
        .select("id")
        .eq("sender_id", userId)
        .eq("receiver_id", currentUser.id)
        .eq("status", "pending")
        .maybeSingle();

    if (error || !data) {
      alert("Friend request not found.");
      return;
    }

    await acceptFriendRequest(data.id);

    await searchPeople();
  }

  /* =========================================================
     REJECT REQUEST
     ========================================================= */

  async function rejectFriendRequest(requestId) {
    const { error } =
      await supabaseClient
        .from("friend_requests")
        .update({
          status: "rejected"
        })
        .eq("id", requestId)
        .eq("receiver_id", currentUser.id);

    if (error) {
      console.error(
        "Reject request error:",
        error
      );

      alert("Could not reject request.");
      return;
    }

    await loadRequests();
  }

  /* =========================================================
     LOAD FRIENDS
     ========================================================= */

  async function loadFriends() {
    const area =
      document.getElementById("yzFriendsList");

    if (!area || !currentUser) {
      return;
    }

    area.innerHTML =
      '<div class="yz-status">Loading...</div>';

    const { data, error } =
      await supabaseClient
        .from("friends")
        .select(
          "id, friend_id, created_at"
        )
        .eq("user_id", currentUser.id)
        .order("created_at", {
          ascending: false
        });

    if (error) {
      console.error(
        "Load friends error:",
        error
      );

      area.innerHTML =
        '<div class="yz-empty">Could not load friends.</div>';

      return;
    }

    if (!data || !data.length) {
      area.innerHTML =
        '<div class="yz-empty">You have no friends yet.</div>';

      return;
    }

    area.innerHTML = "";

    for (const friendship of data) {
      const profile =
        await getProfile(friendship.friend_id);

      const row =
        createFriendRow(
          friendship.friend_id,
          profile
        );

      area.appendChild(row);
    }
  }

  /* =========================================================
     FRIEND ROW
     ========================================================= */

  function createFriendRow(friendId, profile) {
    const row = document.createElement("div");

    row.className = "yz-friend-user";

    const avatar =
      profile?.avatar_url ||
      fallbackAvatar(profile?.display_name);

    row.innerHTML = `
      <img
        src="${escapeHTML(avatar)}"
        alt="Profile"
      >

      <div class="yz-friend-info">

        <div class="yz-friend-name">
          ${escapeHTML(
            profile?.display_name ||
            "Yaaroza User"
          )}
        </div>

        <div class="yz-friend-username">
          ${
            profile?.username
              ? "@" + escapeHTML(profile.username)
              : ""
          }
        </div>

      </div>

      <button
        class="yz-friend-button remove">
        Remove
      </button>
    `;

    const button =
      row.querySelector("button");

    button.addEventListener(
      "click",
      () => removeFriend(friendId)
    );

    return row;
  }

  /* =========================================================
     REMOVE FRIEND
     ========================================================= */

  async function removeFriend(friendId) {
    if (!currentUser || !friendId) {
      return;
    }

    const confirmed =
      window.confirm(
        "Remove this person from your friends?"
      );

    if (!confirmed) {
      return;
    }

    /*
      Delete both reciprocal friendship rows.
      Our RLS policy allows either participant
      to delete the friendship row.
    */

    const { error } =
      await supabaseClient
        .from("friends")
        .delete()
        .or(
          `and(user_id.eq.${currentUser.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${currentUser.id})`
        );

    if (error) {
      console.error(
        "Remove friend error:",
        error
      );

      alert("Could not remove friend.");
      return;
    }

    alert("Friend removed.");

    await loadFriends();
  }

  /* =========================================================
     TABS
     ========================================================= */

  function showSearch() {
    document.getElementById(
      "yzSearchArea"
    ).style.display = "block";

    document.getElementById(
      "yzRequestsArea"
    ).style.display = "none";

    document.getElementById(
      "yzFriendsArea"
    ).style.display = "none";
  }

  function showRequests() {
    document.getElementById(
      "yzSearchArea"
    ).style.display = "none";

    document.getElementById(
      "yzRequestsArea"
    ).style.display = "block";

    document.getElementById(
      "yzFriendsArea"
    ).style.display = "none";

    loadRequests();
  }

  function showFriends() {
    document.getElementById(
      "yzSearchArea"
    ).style.display = "none";

    document.getElementById(
      "yzRequestsArea"
    ).style.display = "none";

    document.getElementById(
      "yzFriendsArea"
    ).style.display = "block";

    loadFriends();
  }

  /* =========================================================
     INITIALIZE
     ========================================================= */

  async function init() {
    if (initialized) {
      return;
    }

    initialized = true;

    try {
      await loadSupabase();

      supabaseClient =
        window.supabase.createClient(
          SUPABASE_URL,
          SUPABASE_KEY
        );

      const user =
        await getCurrentUser();

      if (!user) {
        console.log(
          "Yaaroza Friends: User not logged in."
        );

        return;
      }

      createUI();

      await loadRequests();
      await loadFriends();

    } catch (error) {
      console.error(
        "Yaaroza Friends initialization error:",
        error
      );
    }
  }

  /* =========================================================
     PUBLIC API
     ========================================================= */

  window.YaarozaFriends = {
    searchPeople,
    sendFriendRequest,
    acceptFriendRequest,
    acceptReceivedRequest,
    rejectFriendRequest,
    removeFriend,
    loadRequests,
    loadFriends,
    showSearch,
    showRequests,
    showFriends
  };

  /* =========================================================
     START
     ========================================================= */

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      init,
      { once: true }
    );
  } else {
    init();
  }

})();
