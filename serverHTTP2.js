logSys('-----------------------------------------------')
logSys('---------------- SERVER STARTS ----------------')

import http2 from 'http2'
import fs from 'fs'
import path from 'path'
import logSys from './server/msgSystem.js'
import Token from './server/token.js'
import Prod from './server/products.js'

let token = new Token
import User from './server/user.js'
import Shop from './server/shop.js'
// import Payment      from './server/payment.js'
import Database from './server/database.js'

let db = new Database()
const port = '3002'
const mimeTypes = {
    'html': 'text/html',
    'js': 'text/javascript',
    'css': 'text/css',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'wav': 'audio/wav',
    'mp4': 'video/mp4',
    'woff': 'application/font-woff',
    'ttf': 'application/font-ttf',
    'eot': 'application/vnd.ms-fontobject',
    'otf': 'application/font-otf',
    'wasm': 'application/wasm'
}
const enableCollection = ['products', 'pages']

async function parseRequest(stream, headers, req) {
    req.url = new URL(headers[':path'], `https://localhost:${port}`)
    req.param = await Object.fromEntries(req.url.searchParams.entries())
    req.path = req.url.pathname.split('/')
    req.path.shift()
    stream.setEncoding('utf8')
    req.body = ''
    for await (const chunk of stream)
        req.body += chunk
}

async function readFile(req, res) {
    const fileName = req.path.join(path.sep)
    let filePath = 'public/' + (fileName === '' ? 'index.html' : fileName)
    const ext = path.extname(filePath).substring(1)
    //if (this.conf.typeAllowed instanceof Array && !this.conf.typeAllowed.includes(ext)) { throw new Error('403 Forbidden, file type not allowed') }
    res.headers['content-type'] = (ext in mimeTypes) ? mimeTypes[ext] : 'text/plain'
    try {
        res.data = await fs.promises.readFile(filePath)
    } catch (e) {
        if (e.code === 'ENOENT')
            throw new Error('404 Not Found')
        throw e
    }
}

async function prepareResponse(res, resp) {
    res.headers['content-type'] = 'application/json'
    res.data = JSON.stringify(resp)
}

async function handleRequest(req, res) {
    if (req.url.pathname.startsWith('/api')) {
        if (req.param.action === 'get' && enableCollection.some(elt => elt === req.param.name)) {
            if(req.param.name === 'products'){
                let prod = new Prod
                await prepareResponse(res, prod.calc(await db.getCollection(req.param.name)))
            } else {
                await prepareResponse(res, await db.getCollection(req.param.name))
            }
        } else if (req.param.action === 'token') {
            if (req.param.state === 'verify')
                await prepareResponse(res, await token.check(req.param.token))
            else if (req.param.state === 'remove')
                token.del(req.param.token)
        } else if (req.param.action === 'login') {
            let user = new User()
            let resp = await user.login(req.param)
            typeof resp === 'object' ? resp.token = await token.add() : null
            await prepareResponse(res, resp)
        } else if (req.param.action === 'register') {
            let user = new User()
            await prepareResponse(res, await user.createUser(req.param))
        } else if (req.param.action === 'updateUser') {
            if (await token.check(req.param.token)) {
                let user = new User()
                const resp = await user.editUser(JSON.parse(req.body))
                typeof resp === 'object' ? resp.token = req.param.token : null
                await prepareResponse(res, resp)
            } else
                await prepareResponse(res, false)
        } else if (req.param.action === 'updatePwd') {
            if (await token.check(req.param.token)) {
                let user = new User()
                await prepareResponse(res, await user.user.editPwd(await user.editPwd(req.param)))
            } else {
                await prepareResponse(res, false)
            }
        } else if (req.param.action === 'cart') {
            if (await token.check(req.param.token)) {
                let shop = new Shop()
                await prepareResponse(res, await shop.cart(req.param.state, {email: req.param.email}, JSON.parse(req.body)))
            } else {
                await prepareResponse(res, false)
            }
        } else if (req.param.action === 'orders') {
            if (await token.check(req.param.token)) {
                let shop = new Shop()
                await prepareResponse(res, await shop.order({email: req.param.email}))
            } else {
                await prepareResponse(res, false)
            }
        }
    } else if (path.extname(String(req.url)) === '' && String(req.url.pathname) !== '/') {
        res.headers['Location'] = '/#' + String(req.url.pathname).replace('/', '')
        res.headers[':status'] = 302
    } else {
        await readFile(req, res)
    }

    // PAYMENT Not ready yet
    // } else if ( req.url.pathname.startsWith('/api/payment') ) {
    //     const tokenResp = await token.check( req.param.token )
    //     if (tokenResp === true) {
    //         let payment = new Payment()
    //         const resp = payment.checkOrder( req.body, req.param.email )
    //         res.headers['content-type'] = 'application/json'
    //         res.data = JSON.stringify( resp )
    //     } else {
    //         res.headers['content-type'] = 'application/json'
    //         res.data = JSON.stringify(false)
    //     }

}

async function executeRequest(stream, headers) {
    // logSys( JSON.stringify(stream.session.socket.remoteAddress), 'debug' )
    stream.on('error', err => logSys(err, 'error'))
    const req = {
        headers: headers
    }
    let res = {
        data: '',
        compress: false,
        headers: {
            'server': 'Made with NodeJS by aleclercq',
            ':status': 200
        }
    }
    try {
        await parseRequest(stream, headers, req, res)
        await handleRequest(req, res, headers)
    } catch (err) {
        let error = err.message.match(/^(\d{3}) (.+)$/)
        if (error)
            error.shift()
        else
            error = ['500', 'Internal Server Error']
        res.headers[':status'] = error[0]
        res.headers['content-type'] = 'text/html'
        res.data = `<h1>${error[0]} ${error[1]}</h1><pre>${err.stack}</pre>\n<pre>Request : ${JSON.stringify(req, null, 2)}</pre>`
    } finally {
        stream.respond(res.headers)
        stream.end(res.data)
    }
}

const server = http2.createSecureServer({
    key: fs.readFileSync('./localhost-privkey.pem'),
    cert: fs.readFileSync('./localhost-cert.pem')
})

// const server = http2.createSecureServer( {
//     key: fs.readFileSync( '/etc/letsencrypt/live/ovh.coprometal.com/privkey.pem' ),
//     cert: fs.readFileSync( '/etc/letsencrypt/live/ovh.coprometal.com/fullchain.pem' )
// } )

server.on('error', err => logSys(err, 'error'))
server.on('stream', executeRequest)
server.listen(port);

logSys(`Server READY at https://localhost:${port}`, 'success')
logSys('-----------------------------------------------')