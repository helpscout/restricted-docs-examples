const express = require('express')
const jwt = require('jsonwebtoken')

const app = express()
const port = 3000

const docsSiteUrl = 'https://company-2-site-1.sites.local.hsenv.io'
const sharedSecret = '22XG7xMXjnxOG+HeLjvTuKLelYMdH7vkmUwL8dVIId0='

const isValidCredentials = (email, password) => {
    // Here you can integrate into your user backend to validate the credentials
    // For now we just do a simple implementation to show the flow
    return email === 'john@example.com' && password === '12345678'
}

app.use(express.urlencoded({extended: true}))

app.get('/signin', (req, res) => {
    // Help Scout will always include the path that the visitor was requesting
    // as a query parameter
    const returnTo = req.query.returnTo

    // This could be a redirect to your already existing login page
    // In this example we render a simple HTML sign in page
    res.send(`
        <html>
            <head><title>Sign in</title></head>
            <body>
                <form method="post" action="/signin">
                    <input type="hidden" name="returnTo" value="${returnTo}" />
                    <p>
                        Email:<br />
                        <input type="text" name="email" required />
                    </p>
                    <p>
                        Password:<br />
                        <input type="password" name="password" required />
                    </p>
                    <p>
                        <input type="submit" value="Sign in" />
                    </p>
                </form>
            </body>
        </html>
    `)
})

app.post('/signin', (req, res) => {

    const returnTo = req.body.returnTo
    const email = req.body.email
    const password = req.body.password

    if (isValidCredentials(email, password)) {

        const tokenPayload = {
            // Expires in 1 minute, resulting in a new call to /signin
            // In real life you probably want to have longer expiration
            exp: Math.floor(Date.now() / 1000) + (60),
            sub: email,
        }

        // Create signed JSON Web Token
        const token = jwt.sign(tokenPayload,
                               sharedSecret,
                               {algorithm: 'HS512'})

        const redirectUrl = `${docsSiteUrl.replace(/\/+$/, '')}/authcallback?token=${token}&returnTo=${returnTo}`
        res.redirect(redirectUrl)
    } else {

        res.send(`
            <html>
                <body><p>Invalid email and password, got back and try again. (Psst, it's actually "john@example.com" and "12345678" but don't tell anyone!)</p></body>
            </html>
        `)
    }
})

app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
})
