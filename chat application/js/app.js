const navSlide = () => {
  const burger = document.querySelector(".burger");
  const nav = document.querySelector(".nav-links");

  burger.addEventListener("click", () => {
    nav.classList.toggle("nav-active");
  });
};
var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
var apiClient = apigClientFactory.newClient();
var token = null;

const app = () => {
  console.log('initializing...');
  navSlide();
  initialize();
};

const initialize = ()=>{
  var cognitoUser = userPool.getCurrentUser();
  if (cognitoUser != null) {
    const userBtn = document.querySelector(".user");
    userBtn.innerHTML += cognitoUser.username;
  }
}

const checkLogin = () => {
  console.log("checking login..");
  const login = false;
  const userBtn = document.querySelector(".user");
  const leftBtn = document.querySelector(".left");
  const rightBtn = document.querySelector(".right");
  var cognitoUser = userPool.getCurrentUser();
  if (cognitoUser != null) {
    rightBtn.classList.toggle("hide");
  } else {
    leftBtn.innerHTML = "Sign In";
    rightBtn.innerHTML = "Register";
  }
};

const navTosignUp = () => {
  console.log("sign up");
  location.href = "signup.html";
};

const navTosignIn = () => {
  console.log("sign in");
  var cognitoUser = userPool.getCurrentUser();
  if (cognitoUser !== null) {
    location.href = "users.html";
  } else {
    location.href = "signin.html";
  }
};

const signIn = () => {
  event.preventDefault();
  const username = document.querySelector("#username").value;
  const password = document.querySelector("#password").value;

  let authenticationData = {
    Username: username,
    Password: password,
  };

  var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(
    authenticationData
  );
  var userData = {
    Username: username,
    Pool: userPool,
  };

  var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
  cognitoUser.authenticateUser(authenticationDetails, {
    onSuccess: function () {
      console.log("login success");
      location.href = "index.html";
    },
    onFailure: function (err) {
      alert(JSON.stringify(err));
    },
  });
};

const signOut = () => {
  console.log("sign out");
  var cognitoUser = userPool.getCurrentUser();
  if (cognitoUser) cognitoUser.signOut();
  location.href = "index.html";
  // if(location.pathname != '/index.html')
  //   location.href = "index.html";
};

const signUp = () => {
  event.preventDefault();
  console.log("signup");
  const username = document.querySelector("#username").value;
  const emailadd = document.querySelector("#email").value;
  const password = document.querySelector("#password").value;

  var email = new AmazonCognitoIdentity.CognitoUserAttribute({
    Name: "email",
    Value: emailadd,
  });

  userPool.signUp(username, password, [email], null, function (err, result) {
    if (err) {
      alert(err);
    } else {
      location.href = "confirm.html#" + username;
    }
  });
};

const confirmCode = () => {
  event.preventDefault();
  var username = location.hash.substring(1);
  var cognitoUser = new AmazonCognitoIdentity.CognitoUser({
    Username: username,
    Pool: userPool,
  });
  const code = document.querySelector("#confirm").value;
  console.log("code =" + code);
  cognitoUser.confirmRegistration(code, true, function (err, results) {
    if (err) {
      alert(err);
    } else {
      console.log("confirmed");
      location.href = "users.html";
    }
  });
};

const resendCode = () => {
  var username = location.hash.substring(1);
  var cognitoUser = new AmazonCognitoIdentity.CognitoUser({
    Username: username,
    Pool: userPool,
  });
  cognitoUser.resendConfirmationCode(function (err) {
    if (err) {
      alert(err);
    }
  });
};

const start = () => {
  console.log("start");
};

function loadChats() {
  getJWTToken(function (token) {
    apiClient
      .conversationsGet({}, null, { headers: { Authorization: token } })
      .then(function (result) {
        console.log(result);
        //displayChats(result.data);
      })
      .catch((err) => console.log(err));
  });
}

const loadUsers = () => {
  getJWTToken(function (token) {
    apiClient
      .usersGet({}, null, { headers: { Authorization: token } })
      .then(function (result) {
        console.log(result);
        displayUsers(result.data);
      })
      .catch((err) => console.log(err));
  });
};

function getJWTToken(callback) {
  if (token == null) {
    var cognitoUser = userPool.getCurrentUser();
    if (cognitoUser != null) {
      cognitoUser.getSession(function (err, session) {
        if (err) {
          location.href = "index.html";
        }
        token = session.getIdToken().getJwtToken();
        callback(token);
      });
    }
  } else {
    callback(token);
  }
}

function displayUsers(data) {
  const chatContainer = document.querySelector(".container");
  data.forEach((user) => {
    // <div class="conv">
    //     <p class="conv-text">Student - frank</p>
    //     <button class="conv-btn">details</button>
    // </div>
    const div = document.createElement("div");
    div.classList.add("conv");

    const p = document.createElement("p");
    p.classList.add("conv-text");
    p.innerText = user.Username;
    div.appendChild(p);

    const t = document.createElement("p");
    t.classList.add("time");
    t.innerText = 'today';
    div.appendChild(t);

    const btn = document.createElement("button");
    btn.classList.add("conv-btn");
    //btn.innerHTML = '<i class="fas fa-comment"></i>';
    btn.innerText = "Start Chat";
    btn.addEventListener("click", () => startChat(user.Username));
    div.appendChild(btn);
    chatContainer.append(div);
  });
}

// This function inserts the users into the conversations table
// get the id of conversation and use it for inserting messages into
// messages table
function startChat(username) {
  console.log(username);
  let id = null;
  getJWTToken(function (token) {
    apiClient
      .conversationsGet({}, null, { headers: { Authorization: token } })
      .then(function (result) {
        if (result.data !== null) {
          result.data.forEach(function (conv) {
            if (conv.participants.includes(username)) {
              id = conv.id;
            }
          });
        }
        if (id === null) {
          apiClient
            .conversationsPost({}, [username], {
              headers: { Authorization: token },
            })
            .then(function (result) {
              id = result.data;
            })
            .catch(function (err) {
              console.log(err);
            });
        }
        if(id !== null){
          location.href = "chat.html#" + id;
        }
      })
      .catch(function (err) {
        console.log(err);
      });
  });
}

function loadChatDetails() {
  const id = location.hash.substring(1);
  getJWTToken(function (token) {
    apiClient
      .conversationsIdGet({ id: id }, null, {
        headers: { Authorization: token },
      })
      .then(function (result) {
        console.log(result);
        displayChatDetails(result.data);
      })
      .catch((err) => console.log("err = " + err));
  });
}

function displayChatDetails(conv) {
  const chatContainer = document.querySelector(".message-container");
  chatContainer.innerHTML = "";
  console.log("chats= " + conv.messages);
  const messages = conv.messages;
  const defaultUser = conv.participants[0];
  messages.forEach((msg) => {
    // <div class="message left">
    //      <p class="sender">sender</p>
    //      <p class="msg-text">This is a sample message</p>
    //      <p class="time">15 minutes ago</p>
    // </div>
    // div
    const direction = msg.sender === defaultUser ? "left" : "right";
    const div = document.createElement("div");
    div.classList.add("message");
    div.classList.add(direction);

    const pSender = document.createElement("p");
    pSender.classList.add("sender");
    pSender.innerText = msg.sender;
    div.appendChild(pSender);

    const pMessage = document.createElement("p");
    pMessage.classList.add("msg-text");
    pMessage.innerText = msg.message;
    div.appendChild(pMessage);

    const pTime = document.createElement("p");
    pTime.classList.add("time");
    console.log("time = " + msg.time);
    const d = new Date(Number(msg.time));
    console.log("date = " + d);
    pTime.innerText = moment(d).fromNow();
    div.appendChild(pTime);

    chatContainer.appendChild(div);
  });
}

// This method post a chat message to the messages table based
// on conversationId;
function postChat(event) {
  event.preventDefault();
  getJWTToken(function (token) {
    const msgInput = document.querySelector(".msg-input");
    var msg = msgInput.value;
    if (msg === "") return;
    msgInput.value = "";
    console.log("post chat !" + msg);
    const id = location.hash.substring(1);
    apiClient
      .conversationsIdPost({ id: id }, msg, {
        headers: { Authorization: token },
      })
      .then(function (data) {
        loadChatDetails();
      })
      .catch((err) => console.log("err = " + err));
  });
}

app();
