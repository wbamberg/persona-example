var welcome = document.getElementById('welcome');
var signin = document.getElementById('sign-in');
var signout = document.getElementById('sign-out');

signin.onclick = function() {
  navigator.id.request();
};

signout.onclick = function() {
  navigator.id.logout();
};

getCurrentUser();

function updateUI(currentUser) {
  if (currentUser) {
    signin.style.display = "none";
    signout.style.display = "block";
    welcome.innerHTML = "Current user: " + currentUser;
  }
  else {
    signin.style.display = "block";
    signout.style.display = "none";
    welcome.innerHTML = "";
  }
}

function watchPersona(currentUser) {
  navigator.id.watch({
    loggedInUser: currentUser,
    onlogin: function(assertion) {
      verifyAssertion(assertion);
    },
    onlogout: function() {
      logoutUser();
      updateUI(null);
    }
  });
}

function logoutUser() {
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "/logout", true);
  xhr.send();
}

function handleGetCurrentUser(xhr) {
  return function() {
    var currentUser = null;
    if (xhr.status == 200) {
        if (xhr.responseText != "no user") {
          currentUser = xhr.responseText;
        }
      updateUI(currentUser);
      watchPersona(currentUser);
    }
    else {
        alert("XMLHttpRequest error: " + xhr.status);
    }
  }
}

function getCurrentUser(assertion) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "/user", true);
  xhr.send();
  xhr.onload = handleGetCurrentUser(xhr);
}

function handleVerificationResponse(xhr) {
  return function() {
    if (xhr.status == 200) {
        if (xhr.responseText.substring(0, 13) == "Logged in as:") {
            updateUI(xhr.responseText.substr(14));
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
