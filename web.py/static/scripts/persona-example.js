var signin = document.getElementById('sign-in');
var signout = document.getElementById('sign-out');

signin.onclick = function() {
  navigator.id.request();
};

signout.onclick = function() {
  navigator.id.logout();
};

/*
1. Figure out who we think is logged in.
2. Update our UI accordingly.
3. Start listening to Persona events.
*/
var currentUser = getCurrentUser();
updateUI(currentUser);
watchPersona(currentUser);

/*
If someone is logged in, show the logout button,
hide the login button, and display the logged-in
user's email address.
If noone is logged in, hide the logout button,
show the login button, and display nothing else.
*/
function updateUI(currentUser) {
  var welcome = document.getElementById('welcome');
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

/*
POST to the backend to clear the user's cookie.
*/
function logoutUser() {
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "/logout", true);
  xhr.send();
}

/*
Figure out who we think is logged in,
based on the "currentUser" cookie.
This function assumes we have either no
cookies, or the single "currentUser" cookie.
*/
function getCurrentUser() {
  if (document.cookie.length > 0) {
    var nameValue = document.cookie.split("=");
    return unescape(nameValue[1]);
  }
}

/*
Update the UI with the new user 
if someone has been successfully
logged in on the backend.
Otherwise call navigator.id.logout() to sync
state with Persona.
*/
function handleVerificationResponse(xhr) {
  return function() {
    if (xhr.status == 200) {
        if (xhr.responseText.substring(0, "Verification error".length) == "Verification error") {
            navigator.id.logout();
            alert(xhr.responseText);
        }
        else {
            updateUI(xhr.responseText);
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

/*
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

function getCurrentUser() {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "/user", true);
  xhr.send();
  xhr.onload = handleGetCurrentUser(xhr);
}
*/

/*
  var cookies = document.cookie.split(";");
  var currentUser = null;
  cookies.forEach(function(cookie) {
    window.console.log(cookie);
    var nameValue = cookie.split("=");
    if (nameValue[0] == "currentUser") {
      console.log(unescape(nameValue[1]));
      currentUser = unescape(nameValue[1]);
    }
  });
  return currentUser;
}
*/