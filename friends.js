/* =========================================================
   YAAROZA - FRIENDS SYSTEM
   Add Friend
   Friend Requests
   Accept / Reject
   Friends List
   Remove Friend
   Friend Count
   ========================================================= */

(function () {
  "use strict";

  const SUPABASE_URL =
    "https://qkpljuksfgyyooythbjg.supabase.co";

  const SUPABASE_KEY =
    "sb_publishable_GQ4XSSgd7_eBOe18DkkMA_7PBuNZId";

  let supabaseClient = null;
  let currentUser = null;

  /* ---------------------------------------------------------
     Load Supabase
     --------------------------------------------------------- */

  function loadSupabase() {
    return new Promise(function (resolve, reject) {

      if (
        window.supabase &&
        typeof window.supabase.createClient === "function"
      ) {
        resolve();
        return;
      }

      const script = document.createElement("script");

      script.src =
        "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

      script.onload = function () {
        resolve();
      };

      script.onerror = function () {
        reject(new Error("Supabase library could not load."));
      };

      document.head.appendChild(script);
    });
  }

  /* ---------------------------------------------------------
     Start
     --------------------------------------------------------- */

  async function startFriendsSystem() {
    try {

      await loadSupabase();

      supabaseClient =
        window.supabase.createClient(
          SUPABASE_URL,
          SUPABASE_KEY
        );

      const sessionResponse =
        await supabaseClient.auth.getSession();

      currentUser =
        sessionResponse &&
        sessionResponse.data &&
        sessionResponse.data.session
          ? sessionResponse.data.session.user
          : null;

      if (!currentUser) {
        return;
      }

      createFriendsInterface();

      await refreshFriendsData();

      supabaseClient.auth.onAuthStateChange(
        async function (_event, session) {

          currentUser =
            session && session.user
              ? session.user
              : null;

          if (currentUser) {
            createFriendsInterface();
            await refreshFriendsData();
          }
        }
      );

    } catch (error) {

      console.error(
        "Yaaroza Friends System Error:",
        error
      );
    }
  }

  /* ---------------------------------------------------------
     Create UI
     --------------------------------------------------------- */

  function createFriendsInterface() {

    if (
      document.getElementById(
        "yaarozaFriendsSystem"
      )
    ) {
      return;
    }

    const wrapper =
      document.createElement("div");

    wrapper.id =
      "yaarozaFriendsSystem";

    wrapper.innerHTML = `

      <style>

        #yaarozaFriendsSystem {
          width: 100%;
          margin-top: 20px;
          font-family: Arial, sans-serif;
        }

        #yaarozaFriendsSystem *,
        #yaarozaFriendsSystem *::before,
        #yaarozaFriendsSystem *::after {
          box-sizing: border-box;
        }

        .yz-friends-box {
          background: #ffffff;
          border-radius: 18px;
          padding: 16px;
          margin-bottom: 16px;
          box-shadow: 0 4px 18px rgba(0,0,0,0.08);
        }

        .yz-friends-title {
          font-size: 21px;
          font-weight: 700;
          margin-bottom: 5px;
        }

        .yz-friends-subtitle {
          color: #777;
          font-size: 13px;
          margin-bottom: 14px;
        }

        .yz-search {
          width: 100%;
          padding: 13px 14px;
          border: 1px solid #ddd;
          border-radius: 12px;
          font-size: 15px;
          outline: none;
        }

        .yz-search:focus {
          border-color: #7c4dff;
        }

        .yz-results {
          margin-top: 10px;
        }

        .yz-person {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 12px 0;
          border-bottom: 1px solid #eeeeee;
        }

        .yz-person:last-child {
          border-bottom: none;
        }

        .yz-avatar {
          width: 48px;
          height: 48px;
          min-width: 48px;
          border-radius: 50%;
          object-fit: cover;
          background: #eeeeee;
        }

        .yz-person-info {
          flex: 1;
          min-width: 0;
        }

        .yz-name {
          font-size: 15px;
          font-weight: 700;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .yz-username {
          color: #777;
          font-size: 13px;
          margin-top: 3px;
        }

        .yz-btn {
          border: none;
          border-radius: 10px;
          padding: 9px 12px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
        }

        .yz-add {
          background: #7c4dff;
          color: #ffffff;
        }

        .yz-accept {
          background: #19a463;
          color: #ffffff;
        }

        .yz-reject,
        .yz-remove {
          background: #eeeeee;
          color: #333333;
        }

        .yz-pending {
          background: #eeeeee;
          color: #666666;
          cursor: default;
        }

        .yz-section-title {
          font-size: 17px;
          font-weight: 700;
          margin-bottom: 10px;
        }

        .yz-count {
          color: #7c4dff;
          font-weight: 700;
        }

        .yz-empty {
          color: #888888;
          font-size: 14px;
          padding: 10px 0;
        }

        .yz-actions {
          display: flex;
          gap: 5px;
          align-items: center;
        }

        @media (max-width: 420px) {

          .yz-person {
            gap: 8px;
          }

          .yz-btn {
            padding: 8px 9px;
            font-size: 12px;
          }
        }

      </style>

      <div class="yz-friends-box">

        <div class="yz-friends-title">
          👥 Friends
          <span
            id="yzFriendCount"
            class="yz-count"
          >0</span>
        </div>

        <div class="yz-friends-subtitle">
          Find people and make friends on Yaaroza.
        </div>

        <input
          id="yzPeopleSearch"
          class="yz-search"
          type="text"
          placeholder="Search by username or name..."
          autocomplete="off"
        />

        <div
          id="yzSearchResults"
          class="yz-results"
        >
          <div class="yz-empty">
            Search for people to add as friends.
          </div>
        </div>

      </div>

      <div class="yz-friends-box">

        <div class="yz-section-title">
          🔔 Friend Requests
          <span
            id="yzRequestCount"
            class="yz-count"
          >0</span>
        </div>

        <div id="yzFriendRequests">
          <div class="yz-empty">
            Loading...
          </div>
        </div>

      </div>

      <div class="yz-friends-box">

        <div class="yz-section-title">
          ❤️ My Friends
        </div>

        <div id="yzFriendsList">
          <div class="yz-empty">
            Loading...
          </div>
        </div>

      </div>
    `;

    const target =
      document.querySelector("main") ||
      document.querySelector(".container") ||
      document.body;

    target.appendChild(wrapper);

    const searchBox =
      document.getElementById(
        "yzPeopleSearch"
      );

    if (searchBox) {

      searchBox.addEventListener(
        "input",
        debounce(
          searchPeople,
          400
        )
      );
    }
  }

  /* ---------------------------------------------------------
     Refresh everything
     --------------------------------------------------------- */

  async function refreshFriendsData() {

    if (!currentUser) {
      return;
    }

    await Promise.all([
      loadFriendCount(),
      loadFriendRequests(),
      loadFriendsList()
    ]);
  }

  /* ---------------------------------------------------------
     Friend Count
     --------------------------------------------------------- */

  async function loadFriendCount() {

    const element =
      document.getElementById(
        "yzFriendCount"
      );

    if (!element) {
      return;
    }

    const response =
      await supabaseClient
        .from("friends")
        .select("id", {
          count: "exact",
          head: true
        })
        .eq(
          "user_id",
          currentUser.id
        );

    if (response.error) {

      console.error(
        "Friend count error:",
        response.error
      );

      return;
    }

    element.textContent =
      response.count || 0;
  }

  /* ---------------------------------------------------------
     Search People
     --------------------------------------------------------- */

  async function searchPeople() {

    const input =
      document.getElementById(
        "yzPeopleSearch"
      );

    const container =
      document.getElementById(
        "yzSearchResults"
      );

    if (!input || !container) {
      return;
    }

    const searchText =
      input.value.trim();

    if (!searchText) {

      container.innerHTML =
        `<div class="yz-empty">
          Search for people to add as friends.
        </div>`;

      return;
    }

    container.innerHTML =
      `<div class="yz-empty">
        Searching...
      </div>`;

    const safeText =
      searchText
        .replace(/[%_]/g, "");

    if (!safeText) {

      container.innerHTML =
        `<div class="yz-empty">
          Enter a name or username.
        </div>`;

      return;
    }

    const response =
      await supabaseClient
        .from("profiles")
        .select(
          "id,username,display_name,avatar_url"
        )
        .or(
          "username.ilike.%" +
          safeText +
          "%,display_name.ilike.%" +
          safeText +
          "%"
        )
        .neq(
          "id",
          currentUser.id
        )
        .limit(20);

    if (response.error) {

      console.error(
        "People search error:",
        response.error
      );

      container.innerHTML =
        `<div class="yz-empty">
          Unable to search right now.
        </div>`;

      return;
    }

    const people =
      response.data || [];

    if (people.length === 0) {

      container.innerHTML =
        `<div class="yz-empty">
          No people found.
        </div>`;

      return;
    }

    const html = [];

    for (const person of people) {

      const relation =
        await getRelation(
          person.id
        );

      html.push(
        createPersonHTML(
          person,
          relation
        )
      );
    }

    container.innerHTML =
      html.join("");
  }

  /* ---------------------------------------------------------
     Get relationship
     --------------------------------------------------------- */

  async function getRelation(otherUserId) {

    const friendResponse =
      await supabaseClient
        .from("friends")
        .select("id")
        .eq(
          "user_id",
          currentUser.id
        )
        .eq(
          "friend_id",
          otherUserId
        )
        .limit(1);

    if (
      friendResponse.data &&
      friendResponse.data.length > 0
    ) {
      return "friend";
    }

    const outgoingResponse =
      await supabaseClient
        .from("friend_requests")
        .select("id")
        .eq(
          "sender_id",
          currentUser.id
        )
        .eq(
          "receiver_id",
          otherUserId
        )
        .eq(
          "status",
          "pending"
        )
        .limit(1);

    if (
      outgoingResponse.data &&
      outgoingResponse.data.length > 0
    ) {
      return "sent";
    }

    const incomingResponse =
      await supabaseClient
        .from("friend_requests")
        .select("id")
        .eq(
          "sender_id",
          otherUserId
        )
        .eq(
          "receiver_id",
          currentUser.id
        )
        .eq(
          "status",
          "pending"
        )
        .limit(1);

    if (
      incomingResponse.data &&
      incomingResponse.data.length > 0
    ) {
      return "incoming";
    }

    return "none";
  }

  /* ---------------------------------------------------------
     Person HTML
     --------------------------------------------------------- */

  function createPersonHTML(
    person,
    relation
  ) {

    const name =
      person.display_name ||
      person.username ||
      "Yaaroza User";

    const username =
      person.username
        ? "@" + person.username
        : "";

    const avatar =
      person.avatar_url ||
      "https://ui-avatars.com/api/?name=" +
      encodeURIComponent(name) +
      "&background=random";

    let button = "";

    if (relation === "friend") {

      button =
        `<button
          class="yz-btn yz-pending"
          disabled>
          Friends ✓
        </button>`;
    }

    else if (relation === "sent") {

      button =
        `<button
          class="yz-btn yz-pending"
          disabled>
          Request Sent
        </button>`;
    }

    else if (relation === "incoming") {

      button = `
        <div class="yz-actions">

          <button
            class="yz-btn yz-accept"
            onclick="YaarozaFriends.acceptFromSearch('${person.id}')">
            Accept
          </button>

          <button
            class="yz-btn yz-reject"
            onclick="YaarozaFriends.rejectFromSearch('${person.id}')">
            Reject
          </button>

        </div>
      `;
    }

    else {

      button =
        `<button
          class="yz-btn yz-add"
          onclick="YaarozaFriends.send('${person.id}')">
          Add Friend
        </button>`;
    }

    return `
      <div class="yz-person">

        <img
          class="yz-avatar"
          src="${escapeHTML(avatar)}"
          alt="Profile">

        <div class="yz-person-info">

          <div class="yz-name">
            ${escapeHTML(name)}
          </div>

          <div class="yz-username">
            ${escapeHTML(username)}
          </div>

        </div>

        ${button}

      </div>
    `;
  }

  /* ---------------------------------------------------------
     Send Friend Request
     --------------------------------------------------------- */

  async function sendFriendRequest(
    receiverId
  ) {

    if (
      !currentUser ||
      receiverId === currentUser.id
    ) {
      return;
    }

    const relation =
      await getRelation(
        receiverId
      );

    if (relation === "friend") {

      alert(
        "You are already friends."
      );

      return;
    }

    if (relation === "sent") {

      alert(
        "Friend request already sent."
      );

      return;
    }

    if (relation === "incoming") {

      alert(
        "This person has already sent you a request."
      );

      return;
    }

    const response =
      await supabaseClient
        .from("friend_requests")
        .insert({
          id: crypto.randomUUID(),
          sender_id: currentUser.id,
          receiver_id: receiverId,
          status: "pending"
        });

    if (response.error) {

      console.error(
        "Send friend request error:",
        response.error
      );

      alert(
        "Friend request could not be sent."
      );

      return;
    }

    alert(
      "Friend request sent!"
    );

    await refreshFriendsData();
    await searchPeople();
  }

  /* ---------------------------------------------------------
     Accept Friend Request
     --------------------------------------------------------- */

  async function acceptFriendRequest(
    requestId
  ) {

    if (!currentUser) {
      return;
    }

    const response =
      await supabaseClient.rpc(
        "accept_friend_request",
        {
          request_id: requestId
        }
      );

    if (response.error) {

      console.error(
        "Accept friend request error:",
        response.error
      );

      alert(
        "Could not accept friend request."
      );

      return;
    }

    alert(
      "Friend request accepted!"
    );

    await refreshFriendsData();
    await searchPeople();
  }

  /* ---------------------------------------------------------
     Reject Friend Request
     --------------------------------------------------------- */

  async function rejectFriendRequest(
    requestId
  ) {

    if (!currentUser) {
      return;
    }

    const response =
      await supabaseClient
        .from("friend_requests")
        .update({
          status: "rejected"
        })
        .eq(
          "id",
          requestId
        )
        .eq(
          "receiver_id",
          currentUser.id
        )
        .eq(
          "status",
          "pending"
        );

    if (response.error) {

      console.error(
        "Reject friend request error:",
        response.error
      );

      alert(
        "Could not reject friend request."
      );

      return;
    }

    await refreshFriendsData();
    await searchPeople();
  }

  /* ---------------------------------------------------------
     Load Friend Requests
     --------------------------------------------------------- */

  async function loadFriendRequests() {

    const container =
      document.getElementById(
        "yzFriendRequests"
      );

    const countElement =
      document.getElementById(
        "yzRequestCount"
      );

    if (!container) {
      return;
    }

    const response =
      await supabaseClient
        .from("friend_requests")
        .select(
          "id,sender_id,created_at"
        )
        .eq(
          "receiver_id",
          currentUser.id
        )
        .eq(
          "status",
          "pending"
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        );

    if (response.error) {

      console.error(
        "Friend requests error:",
        response.error
      );

      container.innerHTML =
        `<div class="yz-empty">
          Could not load requests.
        </div>`;

      return;
    }

    const requests =
      response.data || [];

    if (countElement) {
      countElement.textContent =
        requests.length;
    }

    if (requests.length === 0) {

      container.innerHTML =
        `<div class="yz-empty">
          No new friend requests.
        </div>`;

      return;
    }

    const html = [];

    for (const request of requests) {

      const profile =
        await getProfile(
          request.sender_id
        );

      if (!profile) {
        continue;
      }

      const name =
        profile.display_name ||
        profile.username ||
        "Yaaroza User";

      const username =
        profile.username
          ? "@" + profile.username
          : "";

      const avatar =
        profile.avatar_url ||
        "https://ui-avatars.com/api/?name=" +
        encodeURIComponent(name) +
        "&background=random";

      html.push(`

        <div class="yz-person">

          <img
            class="yz-avatar"
            src="${escapeHTML(avatar)}"
            alt="Profile">

          <div class="yz-person-info">

            <div class="yz-name">
              ${escapeHTML(name)}
            </div>

            <div class="yz-username">
              ${escapeHTML(username)}
            </div>

          </div>

          <div class="yz-actions">

            <button
              class="yz-btn yz-accept"
              onclick="YaarozaFriends.accept('${request.id}')">
              Accept
            </button>

            <button
              class="yz-btn yz-reject"
              onclick="YaarozaFriends.reject('${request.id}')">
              Reject
            </button>

          </div>

        </div>
      `);
    }

    container.innerHTML =
      html.join("") ||
      `<div class="yz-empty">
        No new friend requests.
      </div>`;
  }

  /* ---------------------------------------------------------
     Get Profile
     --------------------------------------------------------- */

  async function getProfile(
    userId
  ) {

    const response =
      await supabaseClient
        .from("profiles")
        .select(
          "id,username,display_name,avatar_url"
        )
        .eq(
          "id",
          userId
        )
        .single();

    if (response.error) {

      console.error(
        "Profile error:",
        response.error
      );

      return null;
    }

    return response.data;
  }

  /* ---------------------------------------------------------
     Load Friends
     --------------------------------------------------------- */

  async function loadFriendsList() {

    const container =
      document.getElementById(
        "yzFriendsList"
      );

    if (!container) {
      return;
    }

    const response =
      await supabaseClient
        .from("friends")
        .select(
          "id,user_id,friend_id,created_at"
        )
        .eq(
          "user_id",
          currentUser.id
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        );

    if (response.error) {

      console.error(
        "Friends list error:",
        response.error
      );

      container.innerHTML =
        `<div class="yz-empty">
          Could not load friends.
        </div>`;

      return;
    }

    const friendships =
      response.data || [];

    if (friendships.length === 0) {

      container.innerHTML =
        `<div class="yz-empty">
          You don't have any friends yet.
        </div>`;

      return;
    }

    const html = [];

    for (const friendship of friendships) {

      const profile =
        await getProfile(
          friendship.friend_id
        );

      if (!profile) {
        continue;
      }

      const name =
        profile.display_name ||
        profile.username ||
        "Yaaroza User";

      const username =
        profile.username
          ? "@" + profile.username
          : "";

      const avatar =
        profile.avatar_url ||
        "https://ui-avatars.com/api/?name=" +
        encodeURIComponent(name) +
        "&background=random";

      html.push(`

        <div class="yz-person">

          <img
            class="yz-avatar"
            src="${escapeHTML(avatar)}"
            alt="Profile">

          <div class="yz-person-info">

            <div class="yz-name">
              ${escapeHTML(name)}
            </div>

            <div class="yz-username">
              ${escapeHTML(username)}
            </div>

          </div>

          <button
            class="yz-btn yz-remove"
            onclick="YaarozaFriends.remove('${friendship.id}')">
            Remove
          </button>

        </div>
      `);
    }

    container.innerHTML =
      html.join("") ||
      `<div class="yz-empty">
        You don't have any friends yet.
      </div>`;
  }

  /* ---------------------------------------------------------
     Remove Friend
     --------------------------------------------------------- */

  async function removeFriend(
    friendshipId
  ) {

    if (!currentUser) {
      return;
    }

    const confirmed =
      confirm(
        "Remove this person from your friends?"
      );

    if (!confirmed) {
      return;
    }

    const response =
      await supabaseClient
        .from("friends")
        .delete()
        .eq(
          "id",
          friendshipId
        )
        .eq(
          "user_id",
          currentUser.id
        );

    if (response.error) {

      console.error(
        "Remove friend error:",
        response.error
      );

      alert(
        "Could not remove friend."
      );

      return;
    }

    await refreshFriendsData();
    await searchPeople();
  }

  /* ---------------------------------------------------------
     Accept from Search
     --------------------------------------------------------- */

  async function acceptFromSearch(
    otherUserId
  ) {

    const response =
      await supabaseClient
        .from("friend_requests")
        .select("id")
        .eq(
          "sender_id",
          otherUserId
        )
        .eq(
          "receiver_id",
          currentUser.id
        )
        .eq(
          "status",
          "pending"
        )
        .limit(1);

    if (
      response.data &&
      response.data.length > 0
    ) {

      await acceptFriendRequest(
        response.data[0].id
      );
    }
  }

  /* ---------------------------------------------------------
     Reject from Search
     --------------------------------------------------------- */

  async function rejectFromSearch(
    otherUserId
  ) {

    const response =
      await supabaseClient
        .from("friend_requests")
        .select("id")
        .eq(
          "sender_id",
          otherUserId
        )
        .eq(
          "receiver_id",
          currentUser.id
        )
        .eq(
          "status",
          "pending"
        )
        .limit(1);

    if (
      response.data &&
      response.data.length > 0
    ) {

      await rejectFriendRequest(
        response.data[0].id
      );
    }
  }

  /* ---------------------------------------------------------
     Debounce
     --------------------------------------------------------- */

  function debounce(
    callback,
    delay
  ) {

    let timer;

    return function () {

      clearTimeout(timer);

      const args =
        arguments;

      timer =
        setTimeout(
          function () {
            callback.apply(
              null,
              args
            );
          },
          delay
        );
    };
  }

  /* ---------------------------------------------------------
     Escape HTML
     --------------------------------------------------------- */

  function escapeHTML(
    value
  ) {

    return String(
      value || ""
    )
      .replace(
        /&/g,
        "&amp;"
      )
      .replace(
        /</g,
        "&lt;"
      )
      .replace(
        />/g,
        "&gt;"
      )
      .replace(
        /"/g,
        "&quot;"
      )
      .replace(
        /'/g,
        "&#039;"
      );
  }

  /* ---------------------------------------------------------
     Public API
     --------------------------------------------------------- */

  window.YaarozaFriends = {

    send:
      sendFriendRequest,

    accept:
      acceptFriendRequest,

    reject:
      rejectFriendRequest,

    remove:
      removeFriend,

    acceptFromSearch:
      acceptFromSearch,

    rejectFromSearch:
      rejectFromSearch

  };

  /* ---------------------------------------------------------
     Start
     --------------------------------------------------------- */

  startFriendsSystem();

})();
