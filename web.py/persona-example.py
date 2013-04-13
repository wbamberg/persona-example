#!/usr/bin/python2

import web
import requests

urls = (
    '/', 'index',
    '/verify', 'verify',
    '/user', 'user'
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
            web.setcookie('user', data['email'], 3600)
            message = "Logged in as: %s" % data['email']
        else:
            message = "Verification error: %s" % data['reason']

        return message

class user:
    def GET(self):
        user = web.cookies().get('user')
        if user:
            return user
        return "no user"

if __name__ == '__main__':
    app.run()
