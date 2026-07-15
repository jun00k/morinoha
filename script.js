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
const careText = document.getElementById("care");
const wealthText = document.getElementById("wealth");
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
let care = 0;
let wealth = 0;
let points = 0;

let todos = [];
let importedTitles = [];

const categories = ["家事", "畑", "鶏", "勉強", "運動", "事務", "活動", "介護", "仕事"];

// 村人たち：カテゴリごとの担当と、完了したときのセリフ
const villagerVoices = {
  "家事": {
    name: "りょうこさん",
    lines: [
      "家がぴかぴかだと、心もすっきりするわね",
      "いい香りがしてきた。今日のごはんが楽しみね",
      "片付いた部屋には、いい風が通るのよ",
      "おつかれさま。お茶でも淹れましょうか"
    ]
  },
  "畑": {
    name: "菌ちゃん",
    lines: [
      "土の中、今日もいい仕事してるよ〜",
      "落ち葉も草も、ぼくたちにはごちそうなんだ",
      "ふかふかの土になってきた！根っこが喜んでる",
      "ぼくたち菌が元気だと、野菜は甘くなるんだよ"
    ]
  },
  "鶏": {
    name: "コッコ",
    lines: [
      "コッコッ！今日も卵を産んだよ！",
      "小屋がきれいだと、みんなよく眠れるの",
      "ごはんありがとう！羽づくろいしてお返しするね",
      "戸締まりよし！これで今夜も安心だね"
    ]
  },
  "勉強": {
    name: "森の長老",
    lines: [
      "学びは一日にして成らず。じゃが今日も一歩進んだのう",
      "その知恵、村の書庫に記しておこう",
      "知れば知るほど、森は深くなるものじゃ",
      "よい問いを持つ者は、よい旅をするのじゃ"
    ]
  },
  "運動": {
    name: "修行者",
    lines: [
      "今日の一歩が、明日の千歩になる",
      "滝の音は、体で聴くものだ",
      "体を動かせば、心の霧も晴れる",
      "無理せず、休まず。それが修行の心得"
    ]
  },
  "事務": {
    name: "てきぱきうさぎ",
    lines: [
      "書類よし、記録よし！次いってみよう！",
      "たまる前に片付ける、これがコツだよ",
      "今日のうちにやると、明日の自分が助かるんだよね",
      "よーし、机の上がすっきりした！"
    ]
  },
  "活動": {
    name: "森の精霊らら",
    lines: [
      "村の外に、いい風が吹いたわ",
      "人と人がつながると、森がざわめいて喜ぶの",
      "あなたの蒔いた種、どこかで芽を出しているわ",
      "今日の出会いも、村の宝物ね"
    ]
  },
  "介護": {
    name: "わこちゃん",
    lines: [
      "やさしさは、ちゃんと伝わってるよ",
      "そばにいてくれるだけで、安心するんだって",
      "今日もおつかれさま。あなたも休んでね",
      "小さな気づかいが、いちばんのお薬なんだよ"
    ]
  },
  "仕事": {
    name: "ダニエル",
    lines: [
      "グッジョブ！学校のみんなも喜んでるよ",
      "君の仕事ぶり、村でも評判だよ",
      "いい仕事のあとのコーヒーは最高だね",
      "今日の働きで、村がまた少し豊かになったな"
    ]
  }
};

// Google側の設定（OAuthクライアントID）が済んだら、ここに貼り替える
const GOOGLE_CLIENT_ID = "1001429419806-vvgqe3kf699o96iqfbv09m9s2a8dk7gp.apps.googleusercontent.com";

// 予定を取り込みたいカレンダーの名前（ここに書いたものだけが対象）
const IMPORT_CALENDAR_NAMES = ["0_junkawamoto", "1_仕事"];

const importCalendarButton = document.getElementById("importCalendarButton");
let tokenClient = null;
let consentRetried = false;
let needTasksConsent = false;

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

function completeTodo(index, liElement) {
  const completedTodo = todos[index];

  // 吹き出しを出す位置（完了ボタンを押した行のあたり）を覚えておく
  let bubbleTop = 0;
  const todoArea = document.querySelector(".todo-area");
  if (liElement && todoArea) {
    bubbleTop = liElement.getBoundingClientRect().top - todoArea.getBoundingClientRect().top;
  }

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

  if (completedTodo.category === "介護") {
    care += 2;
    rewardMessage = "思いやりが2増えました。";
  }

  if (completedTodo.category === "仕事") {
    wealth += 2;
    rewardMessage = "村の豊かさが2増えました。";
  }

  if (points % 5 === 0) {
    villagers += 1;
    rewardMessage += " 村人が1人増えました。";
  }

  // 担当の村人がランダムに一言かけてくれる
  let villagerLine = "";
  const villager = villagerVoices[completedTodo.category];
  if (villager) {
    const line = villager.lines[Math.floor(Math.random() * villager.lines.length)];
    villagerLine = ` ${villager.name}「${line}」`;
  }

  message.textContent = `「${completedTodo.text}」を完了。${rewardMessage}${villagerLine}`;

  saveData();
  render();

  if (villagerLine) {
    showSpeechBubble(`💬${villagerLine}`, bubbleTop);
  }
}

function showSpeechBubble(text, top) {
  const todoArea = document.querySelector(".todo-area");
  if (!todoArea) {
    return;
  }

  // 前の吹き出しが残っていたら消す
  const oldBubbles = document.querySelectorAll(".speech-bubble");
  oldBubbles.forEach(function(bubble) {
    bubble.remove();
  });

  const bubble = document.createElement("div");
  bubble.className = "speech-bubble";
  bubble.textContent = text;
  bubble.style.top = top + "px";
  todoArea.appendChild(bubble);

  // 4秒たったら、ゆっくり消える
  setTimeout(function() {
    bubble.classList.add("fade-out");
    setTimeout(function() {
      bubble.remove();
    }, 700);
  }, 4000);
}

function importWeekEvents() {
  if (!window.google || !google.accounts) {
    message.textContent = "Google連携の準備中です。少し待ってからもう一度押してください。";
    return;
  }

  if (!tokenClient) {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/tasks.readonly",
      callback: fetchWeekEvents
    });
  }

  // ToDoリストの許可が足りないと分かっている場合は、
  // ボタンが押されたこのタイミングで許可画面を開く（自動で開くとブロックされるため）
  if (needTasksConsent) {
    needTasksConsent = false;
    tokenClient.requestAccessToken({ prompt: "consent" });
    return;
  }

  tokenClient.requestAccessToken();
}

function fetchWeekEvents(tokenResponse) {
  if (!tokenResponse || !tokenResponse.access_token) {
    message.textContent = "Googleへのログインがキャンセルされました。";
    return;
  }

  // ToDoリストを読む許可がまだ付いていない場合は、一度だけ許可画面を出し直す
  const hasTasksScope = google.accounts.oauth2.hasGrantedAllScopes(
    tokenResponse,
    "https://www.googleapis.com/auth/tasks.readonly"
  );

  if (!hasTasksScope && !consentRetried) {
    consentRetried = true;
    needTasksConsent = true;
    message.textContent = "ToDoリストを読む許可がまだ付いていません。もう一度「📅 1週間分の予定を取り込む」ボタンを押すとGoogleの許可画面が出るので、項目にチェックを付けて「続行」してください。";
    return;
  }

  // 今日の0時から7日後の0時まで（今日を含めて1週間分）
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const accessToken = tokenResponse.access_token;
  const headers = { "Authorization": "Bearer " + accessToken };
  let tasksFailed = false;

  // IMPORT_CALENDAR_NAMES に書いたカレンダーだけから予定を集める
  fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", { headers: headers })
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {
      const myCalendars = (data.items || []).filter(function(cal) {
        // メインカレンダー（0_junkawamoto）は常に対象。それ以外は名前で選ぶ
        return cal.primary === true || IMPORT_CALENDAR_NAMES.indexOf(cal.summary) !== -1;
      });

      const requests = myCalendars.map(function(cal) {
        const url = "https://www.googleapis.com/calendar/v3/calendars/" + encodeURIComponent(cal.id) + "/events" +
          "?timeMin=" + encodeURIComponent(start.toISOString()) +
          "&timeMax=" + encodeURIComponent(end.toISOString()) +
          "&singleEvents=true&orderBy=startTime";

        return fetch(url, { headers: headers })
          .then(function(response) { return response.json(); })
          .then(function(data) { return data.items || []; });
      });

      // GoogleのToDoリスト（タスク）も集める。失敗しても予定の取り込みは続ける
      requests.push(
        fetchGoogleTasks(headers, end).catch(function() {
          tasksFailed = true;
          return [];
        })
      );

      return Promise.all(requests);
    })
    .then(function(lists) {
      const allEvents = [].concat.apply([], lists);

      // 日時順に並べる（日付のないタスクは一番うしろ）
      allEvents.sort(function(a, b) {
        const aTime = (a.start && (a.start.dateTime || a.start.date)) || "9999";
        const bTime = (b.start && (b.start.dateTime || b.start.date)) || "9999";
        return aTime < bTime ? -1 : 1;
      });

      addEventsAsTodos(allEvents);

      if (tasksFailed) {
        message.textContent += "⚠️ ToDoリストは取得できませんでした。許可を付けても続く場合は、Google CloudでGoogle Tasks APIが有効になっているか確認が必要です。";
      }
    })
    .catch(function() {
      message.textContent = "予定の取得に失敗しました。通信状態を確認してください。";
    });
}

function fetchGoogleTasks(headers, end) {
  return fetch("https://tasks.googleapis.com/tasks/v1/users/@me/lists", { headers: headers })
    .then(function(response) {
      if (!response.ok) {
        throw new Error("Tasks APIが使えません");
      }
      return response.json();
    })
    .then(function(data) {
      const taskLists = data.items || [];

      return Promise.all(taskLists.map(function(list) {
        return fetch("https://tasks.googleapis.com/tasks/v1/lists/" + encodeURIComponent(list.id) + "/tasks?showCompleted=false&maxResults=100", { headers: headers })
          .then(function(response) { return response.json(); })
          .then(function(data) { return data.items || []; });
      }));
    })
    .then(function(lists) {
      const tasks = [].concat.apply([], lists);

      // 未完了のタスクは基本すべて取り込む（期限なし・期限切れも含む）。
      // 期限が8日以上先のものだけ、まだ取り込まない
      return tasks
        .filter(function(task) {
          if (!task.title) {
            return false;
          }
          if (task.due) {
            const due = new Date(task.due);
            if (due >= end) {
              return false;
            }
          }
          return true;
        })
        .map(function(task) {
          if (task.due) {
            return { summary: task.title, start: { date: task.due.substring(0, 10) } };
          }
          // 期限なしのタスクは日付なしでそのまま取り込む
          return { summary: task.title };
        });
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

    // 一度取り込んだ予定（完了・削除済みを含む）は二度と取り込まない
    if (importedTitles.includes(title)) {
      return;
    }

    const alreadyExists = todos.some(function(todo) {
      return todo.text === title;
    });

    if (alreadyExists) {
      importedTitles.push(title);
      return;
    }

    todos.push({ text: title, category: "活動" });
    importedTitles.push(title);
    addedCount += 1;
  });

  // 取り込み済みの記録が増えすぎないよう、直近1000件だけ残す
  if (importedTitles.length > 1000) {
    importedTitles = importedTitles.slice(-1000);
  }

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
      completeTodo(index, li);
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
  careText.textContent = care;
  wealthText.textContent = wealth;
  pointsText.textContent = points;
}

function saveData() {
  const data = {
    todos: todos,
    importedTitles: importedTitles,
    villagers: villagers,
    comfort: comfort,
    harvest: harvest,
    chickenEnergy: chickenEnergy,
    wisdom: wisdom,
    stamina: stamina,
    officePower: officePower,
    development: development,
    care: care,
    wealth: wealth,
    points: points
  };

  localStorage.setItem("morinoVillageTodo", JSON.stringify(data));
}

function loadData() {
  const savedData = localStorage.getItem("morinoVillageTodo");

  if (savedData) {
    const data = JSON.parse(savedData);

    todos = data.todos || [];
    importedTitles = data.importedTitles || [];
    villagers = data.villagers || 3;
    comfort = data.comfort || 0;
    harvest = data.harvest || 0;
    chickenEnergy = data.chickenEnergy || 0;
    wisdom = data.wisdom || 0;
    stamina = data.stamina || 0;
    officePower = data.officePower || 0;
    development = data.development || 0;
    care = data.care || 0;
    wealth = data.wealth || 0;
    points = data.points || 0;
  }
}
