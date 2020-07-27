import http         from 'http'
import fs           from 'fs'
import path         from 'path'
import logSys       from './server/msgSystem.js'
import { dbLoad,
    dbLogin,
    dbRegister,
    dbUpdateUser,
    dbUpdatePassword,
    dbCart,
    dbOrders }      from './api/database.js'
import Token        from './server/token.js'
let token =         new Token
import User         from './server/user.js'
import Database     from './server/database.js'
let db =            new Database( config.db.userRW, config.db.pwdRW, config.db.name )
import { config }   from './public/assets/config.js'

const port = '3002'
const mimeTypes = {
    'html' : 'text/html',
    'js'   : 'text/javascript',
    'css'  : 'text/css',
    'json' : 'application/json',
    'png'  : 'image/png',
    'jpg'  : 'image/jpg',
    'gif'  : 'image/gif',
    'svg'  : 'image/svg+xml',
    'wav'  : 'audio/wav',
    'mp4'  : 'video/mp4',
    'woff' : 'application/font-woff',
    'ttf'  : 'application/font-ttf',
    'eot'  : 'application/vnd.ms-fontobject',
    'otf'  : 'application/font-otf',
    'wasm' : 'application/wasm'
}

async function parseRequest( req, res ) {

    req.url = new URL( req.url, `http://localhost:${ port }` )
    req.param = await Object.fromEntries( req.url.searchParams.entries() )
    req.path = req.url.pathname.split('/' )
    req.path.shift( )

    req.setEncoding('utf8' )
    req.body = ''
    for await ( const chunk of req )
        req.body += chunk

}

async function readFile( req, res ) {

    const fileName = req.path.join( path.sep )
    let filePath = 'public/' + ( fileName === '' ? 'index.html' : fileName )

    const ext = path.extname( filePath ).substring( 1 )

    //if (this.conf.typeAllowed instanceof Array && !this.conf.typeAllowed.includes(ext)) { throw new Error('403 Forbidden, file type not allowed') }

    res.headers[ 'content-type' ] = ( ext in mimeTypes ) ? mimeTypes[ ext ] : 'text/plain'

    try {
        res.data = await fs.promises.readFile( filePath )
    } catch ( e ) {
        if ( e.code === 'ENOENT' )
            throw new Error( '404 Not Found' )
        throw e
    }
}

async function handleRequest( req, res ) {

    // GET COLLECTION
    if ( req.url.pathname.startsWith( '/api/get' ) ) {

        if ( req.param.name === 'products' || req.param.name === 'pages' ) {

            const resp = await dbLoad( config.db.userR, config.db.pwdR, config.db.name, req.param )
            res.headers[ 'content-type' ] = 'application/json'
            res.data = JSON.stringify( resp )

        }

        // TOKEN
    }  else if ( req.url.pathname.startsWith( '/api/token' ) ) {

        if( req.param.action === 'verify' ){

            const resp = await token.check( req.param.token )
            res.headers[ 'content-type' ] = 'application/json'
            res.data = JSON.stringify( resp )

        } else if ( req.param.action === 'remove' ){
            token.del( req.param.token )
        }

        // LOGIN
    } else if ( req.url.pathname.startsWith( '/api/login' ) ) {

        const resp = await dbLogin( config.db.userR, config.db.pwdR, config.db.name, 'users', req.param )
        resp.token = token.add()
        res.headers[ 'content-type' ] = 'application/json'
        res.data = JSON.stringify( resp )

        // REGISTER
    } else if ( req.url.pathname.startsWith( '/api/register' ) ) {

        const resp = await dbRegister( config.db.userRW, config.db.pwdRW, config.db.name, 'users', req.param )
        res.headers[ 'content-type' ] = 'application/json'
        res.data = JSON.stringify( resp )

        // UPDATE USER
    } else if ( req.url.pathname.startsWith( '/api/updateUser' ) ) {

        const tokenResp = await token.check( req.param.token )

        if( tokenResp === true ){

            const resp = await dbUpdateUser( config.db.userRW, config.db.pwdRW, config.db.name, 'users', req.body )
            resp.token = req.param.token
            res.headers[ 'content-type' ] = 'application/json'
            res.data = JSON.stringify( resp )

        } else {
            res.headers[ 'content-type' ] = 'application/json'
            res.data = JSON.stringify( false )
        }

        // UPDATE PASSWORD
    } else if ( req.url.pathname.startsWith( '/api/updatePwd' ) ) {

        const resp = await dbUpdatePassword( config.db.userRW, config.db.pwdRW, config.db.name, 'users', req.param )
        res.headers[ 'content-type' ] = 'application/json'
        res.data = JSON.stringify( resp )

        // CART
    } else if ( req.url.pathname.startsWith( '/api/cart' ) ) {

        const tokenResp = await token.check( req.param.token )

        if( tokenResp === true ){

            const resp = await dbCart( config.db.userRW, config.db.pwdRW, config.db.name, 'users',req.param.action ,req.param.email , req.body )
            res.headers[ 'content-type' ] = 'application/json'
            res.data = JSON.stringify( resp )

        } else {
            res.headers[ 'content-type' ] = 'application/json'
            res.data = JSON.stringify( false )
        }

        // ORDER
    } else if ( req.url.pathname.startsWith( '/api/orders' ) ) {

        const tokenResp = await token.check( req.param.token )
        if( tokenResp === true ){
            const resp = await dbOrders( config.db.userRW, config.db.pwdRW, config.db.name, 'orders',req.param.action , req.param.email )
            res.headers[ 'content-type' ] = 'application/json'
            res.data = JSON.stringify( resp )
        } else {
            res.headers[ 'content-type' ] = 'application/json'
            res.data = JSON.stringify( false )
        }

    } else if ( path.extname( String( req.url ) ) === '' && String( req.url.pathname ) !== '/' ) {

        res.headers['Location'] = '/#' + String(req.url.pathname).replace('/', '')
        res.headers[':status'] = 302

    }  else {
        await readFile( req, res )
    }
}

async function executeRequest( req, stream ) {

    // logSys( JSON.stringify(stream.session.socket.remoteAddress), 'debug' )

    req.on('error', err => logSys( err, 'error' ) )

    let res = {
        data: '',
        compress: false,
        headers: {
            'server': 'Made with NodeJS by atrepp & aleclercq',
            ':status': 200
        }
    }

    try {

        // Build request object
        await parseRequest(req, res)

        await handleRequest(req, res)

    } catch ( err ) {

        let error = err.message.match( /^(\d{3}) (.+)$/ )

        if ( error )
            error.shift( )
        else
            error = [ '500', 'Internal Server Error' ]

        res.headers[ ':status' ] = error[ 0 ]
        res.headers[ 'content-type' ] = 'text/html'
        res.data = `<h1>${error[0]} ${error[1]}</h1><pre>${err.stack}</pre>\n<pre>Request : ${JSON.stringify(req.param, null, 2)}</pre>`

    } finally {
        /* if(!res.cached) {
             // Compress the response using Brotli
             const paramCompress = this.conf.compression
             if(paramCompress && paramCompress.enable && req.headers['accept-encoding'].includes('br')
                 && paramCompress.mimeType.includes(res.headers['content-type']) && (paramCompress.minSize < res.data.length)) {

                 res.headers['content-encoding'] = 'br'
                 res.data = await compress(res.data, {
                     params: {
                         [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
                         [zlib.constants.BROTLI_PARAM_QUALITY]: zlib.constants.Z_BEST_SPEED
                     }
                 })
             }

             if(this.conf.cache?.enable && (!this.conf.cache.maxSize || (this.conf.cache.maxSize && (this.conf.cache.maxSize > res.data.length)))) {
                 res.cached = true
                 this.cache[key] = {timestamp: Date.now(), res: res}
             }
         }
 */
        const statusCode = res.headers[ ':status' ]
        delete res.headers[ ':status' ]
        stream.writeHead(statusCode, res.headers)
        stream.end( res.data )

    }
}

const server = http.createServer()


server.on( 'error', err => logSys( err, 'error' ) )
server.on( 'request', executeRequest )

server.listen( port );

logSys( `Server is launch at http://localhost:${port}`, 'success' )
logSys( '------------------------------------' )