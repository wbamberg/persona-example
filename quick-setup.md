# Quick setup #

To show how to add support for Persona, we'll walk through a minimal Persona integration.

The basic Persona sign-in flow is this:

1. the user clicks a "sign in" button in your page
2. a JavaScript function you have bound to the button's click handler calls the Persona library function `navigator.id.request()`
3. this function displays a popup dialog to the user, which guides them through sign in
4. the outcome of this is an object called an **assertion**: this object is delivered back to your page in the listener function you have assigned to the `onlogin` option in the Persona library function `navigator.id.watch()`
5. this listener function sends the assertion to your server using a XHR POST request
6. your server code verifies the assertion by making an XHR POST request to the Persona verifier service
7. if the assertion is verified properly, you can log the user in (for example, by setting a session cookie)

Our example website simply displays a button asking the user to sign in. When the user clicks the button, the site invokes Persona, which asks the user to sign in. The website verifies the sign-in attempt, and if it is correct, updates the page to display the user's email address and a "sign out" button.

To simplify the code as much as possible, the example website doesn't even set sessions for users, although any real website will want to do that.

## Client-side ##

On the client-side we'll have an HTML file for our one-page website and a JavaScript file that interacts with the Persona service.

### The HTML ###

The HTML is just this:

    <!DOCTYPE html>
    <html>

      <head>

        <meta http-equiv="X-UA-Compatible" content="IE=edge">

      </head>

      <body>

        <button id ="sign-in" style="float: right"><img alt="Sign in with Persona" src="static/img/persona-login.png"/></button>
        <button id ="sign-out" style="display: none; float: right">Sign out</button>
        <div id="welcome"></div>

        <script src="https://login.persona.org/include.js"></script>
        <script src="static/scripts/persona-example.js"></script>

      </body>

    </html>

In the `<head>` element we're using `http-equiv` to set the `"X-UA-Compatible"` header to `"IE=edge"`. This prevents Internet Explorer from using Compatibility Mode, which breaks Persona.

In the `<body>`, we include three elements: one button to sign in, one to sign out, and a `<div>` which will just display a message when a user is signed in.

The `sign-in` button uses a customized image: you don't have to use this, but if you choose to, you can copy it from here:

[link to persona-login image]

You can find more sign-in buttons at our [Branding Resources] page.

Because noone is logged in when we first visit the page, the `sign-out` button is initially hidden.

Finally, we're including two scripts:

* the script from "https://login.persona.org/include.js" implements the client-side part of Persona. This is needed because Persona isn't yet supported natively by browsers. Because Persona is still in development, you should not self-host this file.
* our own local script "persona-example.js", where we'll implement the client-side integration

### The JavaScript ###

The JavaScript interacts with the Persona library to request sign-in attempts and to respond to them, interacts with the server to verify sign-in requests, and manipulates the page in response to users signing in and out.

The first part of the file adds listeners to the `sign-in` and `sign-out` buttons:

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

When a user clicks `sign-out`, we call `navigator.id.logout()` to let Persona know that the user has logged out.

When a user clicks `sign-in` we call the `navigator.id.request()` function: this asks the user to sign in using Persona. The result of that operation is an **assertion** object which Persona will pass back to us asynchronously.

To listen for the assertion object we need to call `navigator.id.watch()`:

    navigator.id.watch({
      loggedInUser: currentUser,
      onlogin: function(assertion) {
        verifyAssertion(assertion);
      },
      onlogout: function() {
        logoutUser();
      }
    });

    function logoutUser() {
      currentUser = null;
      signin.style.display = "block";
      signout.style.display = "none";
      welcome.innerHTML = "";
    }

Here, we're supplying three options to `navigator.id.watch()`:

* `loggedInUser`: this is the email address of the user we think is currently logged in. In this minimal example we've just initialized it to `null`, although in a real example we would probably check for a session cookie.
* `onlogin`: this function is called when Persona has an assertion for us to verify, in response to a previous call to `navigator.id.request()`. When we receive an assertion, we have to verify it before we can log the user in.
* `onlogout`: this function is called when the user logs out of Persona. It will be called in response to our call to `navigator.id.logout()`, and also if the user logs out of the Persona service globally, outside our website. We need to handle it by then updating out site's internal state: we clear the variable used to store the user's email address, and update the UI to hide the `sign-out` button and to show the `sign-in` button. In a real website, we would probably destroy the users's session by clearing their session cookie.

Finally, we need some code to verify the assertion:

    function loginUser(loggedInUser) {
      currentUser = loggedInUser;
      signin.style.display = "none";
      signout.style.display = "block";
      welcome.innerHTML = currentUser;
    }

    function handleVerificationResponse(xhr) {
      return function() {
        if (xhr.status == 200) {
            if (xhr.responseText.substring(0, 13) == "Logged in as:") {
                loginUser(xhr.responseText);
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

It’s extremely important that you verify the assertion on your server, and not in JavaScript running on the user’s browser, since that would be easy to forge. In the code above we're sending a POST request to the server: if the assertion can be verified, the server responds with "Logged in as: user@domain.org", with "user@domain.org" replaced with the user's actual email address. If this is the response, we log the user in by calling `loginUser()`: this updates the page UI.

## Server-side ##

#### Handling user actions ####

The JavaScript has


## Step 1:

## Step 1: Include the Persona library ##

Persona is designed to be browser-neutral and works well on all major desktop and mobile browsers.

But because Persona isn't yet natively supported by any browsers, you'll have to include the Persona JavaScript library that implements the client-side part of the protocol. To include the Persona JavaScript library, you can place this script tag at the bottom of the page body:

<script src="https://login.persona.org/include.js"></script>

Once this library is loaded, the functions you need will be available in the global navigator.id object.

You must include this on every page which uses navigator.id functions. Because Persona is still in development, you should not self-host the include.js file.

### Suppressing Compatibility Mode ###

You should ensure that Internet Explorer users don't use Compatibility Mode, as this will break Persona. To do this:

    either include <meta http-equiv="X-UA-Compatible" content="IE=Edge"> on your page, before any script elements
    or set the following HTTP header on your page: X-UA-Compatible: IE=Edge.

For more information, see the notes on IE Compatibility Mode and "IE8 and IE9 Complications".

## Step 2: Add login and logout buttons ##

To prompt the user to log in, add "login" and "logout" buttons to the page:

    <button><img alt="Sign in with Persona" src="img/persona-login.png"></img></button>
    <a href="#" style="display: none;">logout</a>




 call navigator.id.request() in the login button's click handler:

    var signinLink = document.getElementById('signin');
    if (signinLink) {
      signinLink.onclick = function() { navigator.id.request(); };
    }

To log the user out, call navigator.id.logout() in the click handler of the logout button:

    var signoutLink = document.getElementById('signout');
    if (signoutLink) {
      signoutLink.onclick = function() { navigator.id.logout(); };
    }

What should those buttons look like? Check out our Branding Resources page for premade images and CSS-based buttons!
Step 3: Watch for login and logout actions

For Persona to function, you need to tell it what to do when a user logs in or out. This is done by calling the navigator.id.watch() function and supplying three parameters:

    The email address of the user currently logged into your site from this computer, or null if no one is logged in. For example, you might examine the browser's cookies to determine who is signed in.

    A function to invoke when an onlogin action is triggered. This function is passed a single parameter, an “identity assertion,” which must be verified.

    A function to invoke when an onlogout action is triggered. This function is not passed any parameters.

Note: You must always include both onlogin and onlogout when you call navigator.id.watch().

For example, if you currently think Bob is logged into your site, you might do this:
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
31
32
	
var currentUser = 'bob@example.com';
 
navigator.id.watch({
  loggedInUser: currentUser,
  onlogin: function(assertion) {
    // A user has logged in! Here you need to:
    // 1. Send the assertion to your backend for verification and to create a session.
    // 2. Update your UI.
    $.ajax({ /* <-- This example uses jQuery, but you can use whatever you'd like */
      type: 'POST',
      url: '/auth/login', // This is a URL on your website.
      data: {assertion: assertion},
      success: function(res, status, xhr) { window.location.reload(); },
      error: function(xhr, status, err) {
        navigator.id.logout();
        alert("Login failure: " + err);
      }
    });
  },
  onlogout: function() {
    // A user has logged out! Here you need to:
    // Tear down the user's session by redirecting the user or making a call to your backend.
    // Also, make sure loggedInUser will get set to null on the next page load.
    // (That's a literal JavaScript null. Not false, 0, or undefined. null.)
    $.ajax({
      type: 'POST',
      url: '/auth/logout', // This is a URL on your website.
      success: function(res, status, xhr) { window.location.reload(); },
      error: function(xhr, status, err) { alert("Logout failure: " + err); }
    });
  }
});

In this example, both onlogin and onlogout are implemented by making an asynchronous POST request to your site’s backend. The backend then logs the user in or out, usually by setting or deleting information in a session cookie. Then, if everything checks out, the page reloads to take into account the new login state.

Note that if the identity assertion can't be verified, we call navigator.id.logout(): this has the effect of telling Persona that noone is currently logged in. If you don't do this, then Persona may immediately call onlogin again with the same assertion, and this can lead to an endless loop of failed logins.

You can, of course, use AJAX to implement this without reloading or redirecting, but that’s beyond the scope of this tutorial.

Here is another example, this time not using jQuery.
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
31
32
33
34
35
36
37
38
39
40
41
42
43
44
45
	
function simpleXhrSentinel(xhr) {
    return function() {
        if (xhr.readyState == 4) {
            if (xhr.status == 200){
                // reload page to reflect new login state
                window.location.reload();
              }
            else {
                navigator.id.logout();
                alert("XMLHttpRequest error: " + xhr.status);
              }
            }
          }
        }
 
function verifyAssertion(assertion) {
    // Your backend must return HTTP status code 200 to indicate successful
    // verification of user's email address and it must arrange for the binding
    // of currentUser to said address when the page is reloaded
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/xhr/sign-in", true);
    // see http://www.openjs.com/articles/ajax_xmlhttp_using_post.php
    var param = "assert="+assertion;
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.setRequestHeader("Content-length", param.length);
    xhr.setRequestHeader("Connection", "close");
    xhr.send(param); // for verification by your backend
 
    xhr.onreadystatechange = simpleXhrSentinel(xhr); }
 
function signoutUser() {
    // Your backend must return HTTP status code 200 to indicate successful
    // sign out (usually the resetting of one or more session variables) and
    // it must arrange for the binding of currentUser to 'null' when the page
    // is reloaded
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "/xhr/sign-out", true);
    xhr.send(null);
    xhr.onreadystatechange = simpleXhrSentinel(xhr); }
 
// Go!
navigator.id.watch( {
    loggedInUser: currentUser,
         onlogin: verifyAssertion,
        onlogout: signoutUser } );

You must call navigator.id.watch() on every page with a login or logout button. To support Persona enhancements like automatic login and global logout for your users, you should call this function on every page of your site.

Persona will compare the email address you've passed into loggedInUser with its own knowledge of whether a user is currently logged in, and who they are. If these don't match, it may automatically invoke onlogin or onlogout on page load.

 
Step 4: Verify the user’s credentials

Instead of passwords, Persona uses “identity assertions,” which are kind of like single-use, single-site passwords combined with the user’s email address. When a user wants to log in, your onlogin callback will be invoked with an assertion from that user. Before you can log them in, you must verify that the assertion is valid.

It’s extremely important that you verify the assertion on your server, and not in JavaScript running on the user’s browser, since that would be easy to forge. The example above handed off the assertion to the site’s backend by using jQuery’s $.ajax() helper to POST it to /auth/login.

Once your server has an assertion, how do you verify it? The easiest way is to use a helper service provided by Mozilla. Simply POST the assertion to https://verifier.login.persona.org/verify with two parameters:

    assertion: The identity assertion provided by the user.
    audience: The hostname and port of your website. You must hardcode this value in your backend; do not derive it from any data supplied by the user.

For example, if you’re example.com, you can use the command line to test an assertion with:
1
	
$ curl -d "assertion=<ASSERTION>&audience=https://example.com:443" "https://verifier.login.persona.org/verify"

If it’s valid, you’ll get a JSON response like this:
1
2
3
4
5
6
7
	
{
  "status": "okay",
  "email": "bob@eyedee.me",
  "audience": "https://example.com:443",
  "expires": 1308859352261,
  "issuer": "eyedee.me"
}

You can learn more about the verification service by reading The Verification Service API. An example /api/login implementation, using Python, the Flask web framework, and the Requests HTTP library might look like this:

	
@app.route('/auth/login', methods=['POST'])
def login():
    # The request has to have an assertion for us to verify
    if 'assertion' not in request.form:
        abort(400)
 
    # Send the assertion to Mozilla's verifier service.
    data = {'assertion': request.form['assertion'], 'audience': 'https://example.com:443'}
    resp = requests.post('https://verifier.login.persona.org/verify', data=data, verify=True)
 
    # Did the verifier respond?
    if resp.ok:
        # Parse the response
        verification_data = json.loads(resp.content)
 
        # Check if the assertion was valid
        if verification_data['status'] == 'okay':
            # Log the user in by setting a secure session cookie
            session.update({'email': verification_data['email']})
            return 'You are logged in'
 
    # Oops, something failed. Abort.
    abort(500)

For an example on how to use Persona in a C# ASP.Net MVC3 application, visit this application demo or see the Controller code below:

 
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
31
32
33
34
35
36
37
38
39
40
41
42
	
public class AuthController : Controller
{
    [HttpPost]
    public ActionResult Login(string assertion)
    {
        if (assertion == null)
        {
            // The 'assertion' key of the API wasn't POSTED. Redirect,
            // or whatever you'd like, to try again.
            return RedirectToAction("Index", "Home");
        }
 
        using (var web = new WebClient())
        {
            // Build the data we're going to POST.
            var data = new NameValueCollection();
            data["assertion"] = assertion;
            data["audience"] = "https://example.com:443"; // Use your website's URL here.
 
 
            // POST the data to the Persona provider (in this case Mozilla)
            var response = web.UploadValues("https://verifier.login.persona.org/verify", "POST", data);
            var buffer = Encoding.Convert(Encoding.GetEncoding("iso-8859-1"), Encoding.UTF8, response);
 
 
            // Convert the response to JSON.
            var tempString = Encoding.UTF8.GetString(buffer, 0, response.Length);
            var reader = new JsonReader();
            dynamic output = reader.Read(tempString);
 
            if (output.status == "okay")
            {
                string email = output.email; // Since this is dynamic, convert it to string.
                FormsAuthentication.SetAuthCookie(email, true);
                return RedirectToAction("Index", "Home");
            }
 
            // Could not log in, do something else.
            return RedirectToAction("Index", "Home");
        }
    }
}

The session management is probably very similar to your existing login system. The first big change is in verifying the user’s identity by checking an assertion instead of checking a password. The other big change is ensuring that the user’s email address is available for use as the loggedInEmail parameter to navigator.id.watch().

Logout is simple: you just need to remove the user’s session cookie.
Step 5: Review best practices

Once everything works and you’ve successfully logged into and out of your site, you should take a moment to review best practices for using Persona safely and securely.

If you're making a production site, have a look at the implementor's guide, where we've collected tips for adding the kind of features often needed in real-world login systems.

Lastly, don’t forget to sign up for the Persona notices mailing list so you’re notified of any security issues or backwards incompatible changes to the Persona API. The list is extremely low traffic: it’s only used to announce changes which may adversely impact your site.