#!/usr/bin/python2

import web
import requests

urls = (
    '/', 'index',
    '/verify', 'verify',
    '/logout', 'logout'
)

app = web.application(urls, globals())
render = web.template.render('templates/')

class index:
    def GET(self):
        return render.index()

class verify:
    def POST(self):
        audience = "http://0.0.0.0:8080"
        i = web.input()

        try:
            page = requests.post('https://verifier.login.persona.org/verify',
                                 verify=True,
                                 data={ "assertion": i.assertion,
                                        "audience": audience})
            data = page.json()
        except requests.exceptions.SSLError:
            data = { "status": "failed",
                     "reason": "Could not verify SSL certificate" }
        except requests.exceptions.ConnectionError:
            data = { "status": "failed",
                     "reason": "Could not connect to server" }

        if data['status'] == "okay":
            web.setcookie('currentUser', data['email'], 3600)
            message = data['email']
        else:
            message = "Verification error: %s" % data['reason']

        return message

class logout:
    def POST(self):
        web.setcookie('currentUser', '', expires = -1)

if __name__ == '__main__':
    app.run()
