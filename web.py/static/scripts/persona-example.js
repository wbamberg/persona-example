var welcome = document.getElementById('welcome');
var signin = document.getElementById('sign-in');
var signout = document.getElementById('sign-out');
var currentUser = null;

signin.onclick = function() {
  navigator.id.request();
};

signout.onclick = function() {
  navigator.id.logout();
};

function logoutUser() {
  currentUser = null;
  signin.style.display = "block";
  signout.style.display = "none";
  welcome.innerHTML = "";
}

function handleUserResponse(xhr) {
  return function() {
    if (xhr.status == 200) {
        if (xhr.responseText == "no user") {
            logoutUser();
        }
        else {
            loginUser(xhr.responseText);
        }
      navigator.id.watch({
        loggedInUser: currentUser,
        onlogin: function(assertion) {
          verifyAssertion(assertion);
        },
        onlogout: function() {
          logoutUser();
        }
      });
    }
    else {
        navigator.id.logout();
        alert("XMLHttpRequest error: " + xhr.status);
    }
  }
}

function checkCurrentUser(assertion) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "/user", true);
  xhr.send();
  xhr.onload = handleUserResponse(xhr);
}

checkCurrentUser();

function loginUser(loggedInUser) {
  currentUser = loggedInUser;
  signin.style.display = "none";
  signout.style.display = "block";
  welcome.innerHTML = "Current user: " + currentUser;
}

function handleVerificationResponse(xhr) {
  return function() {
    if (xhr.status == 200) {
        if (xhr.responseText.substring(0, 13) == "Logged in as:") {
            loginUser(xhr.responseText.substr(14));
        }
        else {
            navigator.id.logout();
            alert(xhr.responseText);
        }
    }
    else {
        navigator.id.logout();
        alert("XMLHttpRequest error: " + xhr.status);
    }
  }
}

function verifyAssertion(assertion) {
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "/verify", true);
  var param = "assertion="+assertion;
  xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  xhr.setRequestHeader("Content-length", param.length);
  xhr.setRequestHeader("Connection", "close");
  xhr.send(param);
  xhr.onload = handleVerificationResponse(xhr);
}
