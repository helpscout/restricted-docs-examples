const express = require('express')
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken')

const app = express()
const port = 3000

app.use(cookieParser())

const docsSiteUrl = 'ENTER BASE URL FOR YOUR RESTRICTED DOCS SITE'
const sharedSecret = 'ENTER SHARED SECRET HERE'

const defaultEmail = "john@example.com"

const resolveExistingAuthentication = req => {
    // Here you can resolve your existing authentication, whether you take that
    // from a session, cookie, or other storage forms
    // In this example we have a very simple cookie, if set means the visitor is
    // already authenticated
    const email = req.cookies?.loggedInEmail

    return {
        email,
        valid: !!email,
    }
}

const createToken = existingAuthentication => {
    const tokenPayload = {
        // Expires in 1 minute, resulting in a new call to /signin
        // In real life you probably want to have longer expiration
        exp: Math.floor(Date.now() / 1000) + (60),
        sub: existingAuthentication.email,
    }

    // Create signed JSON Web Token
    return jwt.sign(tokenPayload,
                    sharedSecret,
                    {algorithm: 'HS512'})
}

app.get("/", (req, res) => {
    const email = req.cookies?.loggedInEmail
    console.log(req.cookies)

    const signedInTemplate = `
        <p>
            You are signed in as <code>${email}</code> and can continue to the restricted Docs site directly:
        </p>
        <p>
            <a href="${docsSiteUrl}">${docsSiteUrl}</a>
        </p>
        <p>
            You can also sign out again by clicking <a href="/setcookie?clear=true">here</a>
        </p>
    `

    const signedOutTemplate = `
        <p>
            To simulate that you are already logged in this app, click the link below
        </p>
        <p>
            <a href="/setcookie">Sign in as ${defaultEmail}</a>
        </p>
    `

    res.send(`
        <html>
            <body>
                ${email ? signedInTemplate : signedOutTemplate}
            </body>
        </html>
    `)
})

app.get("/setcookie", (req, res) => {

    const clearCookie = req.query.clear

    if (clearCookie) {
        res.clearCookie("loggedInEmail")
    } else {
        res.cookie("loggedInEmail", defaultEmail)
    }

    res.redirect("/")
})

app.get('/signin', (req, res) => {
    // Help Scout will always include the path that the visitor was requesting
    // as a query parameter
    const returnTo = req.query.returnTo

    const existingAuthentication = resolveExistingAuthentication(req)

    if (existingAuthentication.valid) {
        const token = createToken(existingAuthentication)

        const redirectUrl = `${docsSiteUrl.replace(/\/+$/, '')}/authcallback?token=${token}&returnTo=${returnTo}`
        res.redirect(redirectUrl)
    } else {

        res.send(`
            <html>
                <body>
                    <h1>You are not authenticated</h1>
                    <p>
                        Go back to the <a href="/">front page</a> and click "sign in"
                        before going to <a href="${docsSiteUrl}">the site</a>
                    </p>
                </body>
            </html>
        `)
    }
})

app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
})
