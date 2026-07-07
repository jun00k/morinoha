const todoInput = document.getElementById("todoInput");
const categorySelect = document.getElementById("categorySelect");
const addButton = document.getElementById("addButton");
const todoList = document.getElementById("todoList");

const villagersText = document.getElementById("villagers");
const comfortText = document.getElementById("comfort");
const harvestText = document.getElementById("harvest");
const chickenEnergyText = document.getElementById("chickenEnergy");
const wisdomText = document.getElementById("wisdom");
const staminaText = document.getElementById("stamina");
const officePowerText = document.getElementById("officePower");
const developmentText = document.getElementById("development");
const pointsText = document.getElementById("points");
const message = document.getElementById("message");

let villagers = 3;
let comfort = 0;
let harvest = 0;
let chickenEnergy = 0;
let wisdom = 0;
let stamina = 0;
let officePower = 0;
let development = 0;
let points = 0;

let todos = [];

const categories = ["家事", "畑", "鶏", "勉強", "運動", "事務", "活動"];

// Google側の設定（OAuthクライアントID）が済んだら、ここに貼り替える
const GOOGLE_CLIENT_ID = "1001429419806-vvgqe3kf699o96iqfbv09m9s2a8dk7gp.apps.googleusercontent.com";

const importCalendarButton = document.getElementById("importCalendarButton");
let tokenClient = null;

loadData();
render();

addButton.addEventListener("click", addTodo);
importCalendarButton.addEventListener("click", importWeekEvents);

todoInput.addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
    addTodo();
  }
});

function addTodo() {
  const text = todoInput.value.trim();
  const category = categorySelect.value;

  if (text === "") {
    message.textContent = "やることを入力してください。";
    return;
  }

  const todo = {
    text: text,
    category: category
  };

  todos.push(todo);
  todoInput.value = "";

  message.textContent = `「${text}」を${category}として追加しました。`;

  saveData();
  render();
}

function completeTodo(index) {
  const completedTodo = todos[index];

  todos.splice(index, 1);

  points += 1;

  let rewardMessage = "";

  if (completedTodo.category === "家事") {
    comfort += 1;
    rewardMessage = "家の快適度が1増えました。";
  }

  if (completedTodo.category === "畑") {
    harvest += 2;
    rewardMessage = "収穫物が2個増えました。";
  }

  if (completedTodo.category === "鶏") {
    chickenEnergy += 2;
    rewardMessage = "鶏の元気が2増えました。";
  }

  if (completedTodo.category === "勉強") {
    wisdom += 1;
    rewardMessage = "知恵が1増えました。";
  }

  if (completedTodo.category === "運動") {
    stamina += 1;
    rewardMessage = "体力が1増えました。";
  }

  if (completedTodo.category === "事務") {
    officePower += 1;
    rewardMessage = "整理力が1増えました。";
  }

  if (completedTodo.category === "活動") {
    development += 2;
    rewardMessage = "村の発展が2増えました。";
  }

  if (points % 5 === 0) {
    villagers += 1;
    rewardMessage += " 村人が1人増えました。";
  }

  message.textContent = `「${completedTodo.text}」を完了。${rewardMessage}`;

  saveData();
  render();
}

function importWeekEvents() {
  if (!window.google || !google.accounts) {
    message.textContent = "Google連携の準備中です。少し待ってからもう一度押してください。";
    return;
  }

  if (!tokenClient) {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: "https://www.googleapis.com/auth/calendar.readonly",
      callback: fetchWeekEvents
    });
  }

  tokenClient.requestAccessToken();
}

function fetchWeekEvents(tokenResponse) {
  if (!tokenResponse || !tokenResponse.access_token) {
    message.textContent = "Googleへのログインがキャンセルされました。";
    return;
  }

  // 今日の0時から7日後の0時まで（今日を含めて1週間分）
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const url = "https://www.googleapis.com/calendar/v3/calendars/primary/events" +
    "?timeMin=" + encodeURIComponent(start.toISOString()) +
    "&timeMax=" + encodeURIComponent(end.toISOString()) +
    "&singleEvents=true&orderBy=startTime";

  fetch(url, {
    headers: { "Authorization": "Bearer " + tokenResponse.access_token }
  })
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {
      addEventsAsTodos(data.items || []);
    })
    .catch(function() {
      message.textContent = "予定の取得に失敗しました。通信状態を確認してください。";
    });
}

function addEventsAsTodos(events) {
  let addedCount = 0;

  events.forEach(function(event) {
    if (event.status === "cancelled") {
      return;
    }

    let title = event.summary || "（無題の予定）";

    // 予定の先頭に「7/7 16:00」のように日付と時刻をつける（終日の予定は日付のみ）
    if (event.start && event.start.dateTime) {
      const startTime = new Date(event.start.dateTime);
      const datePart = (startTime.getMonth() + 1) + "/" + startTime.getDate();
      const hours = String(startTime.getHours());
      const minutes = String(startTime.getMinutes()).padStart(2, "0");
      title = datePart + " " + hours + ":" + minutes + " " + title;
    } else if (event.start && event.start.date) {
      const startDate = new Date(event.start.date + "T00:00:00");
      const datePart = (startDate.getMonth() + 1) + "/" + startDate.getDate();
      title = datePart + " " + title;
    }

    const alreadyExists = todos.some(function(todo) {
      return todo.text === title;
    });

    if (alreadyExists) {
      return;
    }

    todos.push({ text: title, category: "活動" });
    addedCount += 1;
  });

  if (addedCount === 0) {
    message.textContent = "1週間分の予定で新しく追加するものはありませんでした。";
  } else {
    message.textContent = `1週間分の予定を${addedCount}件追加しました。カテゴリはプルダウンで調整してください。`;
  }

  saveData();
  render();
}

function changeCategory(index, newCategory) {
  const oldCategory = todos[index].category;
  todos[index].category = newCategory;

  message.textContent = `「${todos[index].text}」を${oldCategory}から${newCategory}に変更しました。`;

  saveData();
  render();
}

function deleteTodo(index) {
  const deletedTodo = todos[index];

  todos.splice(index, 1);

  message.textContent = `「${deletedTodo.text}」を削除しました。（村への影響はありません）`;

  saveData();
  render();
}

function render() {
  todoList.innerHTML = "";

  todos.forEach(function(todo, index) {
    const li = document.createElement("li");

    const span = document.createElement("span");
    span.textContent = todo.text;

    const categoryChangeSelect = document.createElement("select");
    categoryChangeSelect.className = "category-select";

    categories.forEach(function(cat) {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      if (cat === todo.category) {
        option.selected = true;
      }
      categoryChangeSelect.appendChild(option);
    });

    categoryChangeSelect.addEventListener("change", function() {
      changeCategory(index, categoryChangeSelect.value);
    });

    const leftSide = document.createElement("div");
    leftSide.appendChild(span);
    leftSide.appendChild(categoryChangeSelect);

    const completeButton = document.createElement("button");
    completeButton.textContent = "完了";
    completeButton.className = "complete-button";

    completeButton.addEventListener("click", function() {
      completeTodo(index);
    });

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "削除";
    deleteButton.className = "delete-button";

    deleteButton.addEventListener("click", function() {
      deleteTodo(index);
    });

    const buttonArea = document.createElement("div");
    buttonArea.className = "button-area";
    buttonArea.appendChild(completeButton);
    buttonArea.appendChild(deleteButton);

    li.appendChild(leftSide);
    li.appendChild(buttonArea);
    todoList.appendChild(li);
  });

  villagersText.textContent = villagers;
  comfortText.textContent = comfort;
  harvestText.textContent = harvest;
  chickenEnergyText.textContent = chickenEnergy;
  wisdomText.textContent = wisdom;
  staminaText.textContent = stamina;
  officePowerText.textContent = officePower;
  developmentText.textContent = development;
  pointsText.textContent = points;
}

function saveData() {
  const data = {
    todos: todos,
    villagers: villagers,
    comfort: comfort,
    harvest: harvest,
    chickenEnergy: chickenEnergy,
    wisdom: wisdom,
    stamina: stamina,
    officePower: officePower,
    development: development,
    points: points
  };

  localStorage.setItem("morinoVillageTodo", JSON.stringify(data));
}

function loadData() {
  const savedData = localStorage.getItem("morinoVillageTodo");

  if (savedData) {
    const data = JSON.parse(savedData);

    todos = data.todos || [];
    villagers = data.villagers || 3;
    comfort = data.comfort || 0;
    harvest = data.harvest || 0;
    chickenEnergy = data.chickenEnergy || 0;
    wisdom = data.wisdom || 0;
    stamina = data.stamina || 0;
    officePower = data.officePower || 0;
    development = data.development || 0;
    points = data.points || 0;
  }
}
