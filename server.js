import http2        from 'http2'
import fs           from 'fs'
import path         from 'path'
import logSys       from './server/msgSystem.js'
import Token        from './server/token.js'
let token =         new Token
import User         from './server/user.js'
import Shop         from './server/shop.js'
// import Payment      from './server/payment.js'
import Database     from './server/database.js'
let db =            new Database( config.db.userRW, config.db.pwdRW, config.db.name )
import { config }   from './public/assets/config.js'

/**
 * Manage Server & Request
 * @class
 */
class Server {
    /**
     * Prepare Server
     * @constructor
     */
    constructor() {
        this.port = '3002'
        this.mimeTypes = {
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
        this.enableCollection = ['products', 'pages']
        this.server = http2.createSecureServer( {
            key: fs.readFileSync( './localhost-privkey.pem' ),
            cert: fs.readFileSync( './localhost-cert.pem' )
        } )
        this.server.on( 'error', error => logSys( error, 'error' ) )
        this.server.on( 'stream', this.execRequest.bind(this) )
        this.server.listen( this.port )
        logSys( `Server is launch at https://localhost:${ this.port }`, 'success' )
        logSys( '------------------------------------' )
    }
    /**
     * Start the server
     * @method
     */
    start() {

    }
    /**
     * Execute the Request
     * @method
     * @param [stream]
     * @param [headers]
     * @returns {Promise<void>}
     */
    async execRequest( stream, headers ) {
        // await logSys(`exec => ${JSON.stringify(stream)} || ${JSON.stringify(headers)}`, 'debug')
        this.req = { headers: headers }
        this.res = {
            data: '',
            compress: false,
            headers: {
                'server': 'FRIGG - Server made with NodeJS Vanilla by a.Leclercq',
                ':status': 200
            }
        }

        this.prepareResponse = async ( resp ) => {
            this.res.headers[ 'content-type' ] = 'application/json'
            this.res.data = JSON.stringify( resp )
        }

        this.readFile = async ( req, res ) => {
            this.fileName = req.path.join( path.sep )
            this.filePath = 'public/' + ( this.fileName === '' ? 'index.html' : this.fileName )
            logSys(this.filePath, 'debug')
            this.ext = path.extname( this.filePath ).substring( 1 )
            //if (this.conf.typeAllowed instanceof Array && !this.conf.typeAllowed.includes(ext)) { throw new Error('403 Forbidden, file type not allowed') }
            res.headers[ 'content-type' ] = ( this.ext in this.mimeTypes ) ? this.mimeTypes[ this.ext ] : 'text/plain'
            try {
                res.data = await fs.promises.readFile( this.filePath )
            } catch ( error ) {
                if ( error.code === 'ENOENT' )
                    throw new Error( '404 Not Found' )
                throw error
            }
        }

        this.parseRequest = async ( stream, headers, req ) => {
            req.url = new URL( headers[':path'], `https://localhost:${ this.port }` )
            req.param = Object.fromEntries( req.url.searchParams.entries() )
            req.path = req.url.pathname.split('/' )
            req.path.shift( )

            stream.setEncoding('utf8' )
            req.body = ''
            for ( const chunk of JSON.stringify( stream ) )
                req.body += chunk
        }

        this.handleRequest = async ( req, res, headers ) => {
            if( req.url.pathname.startsWith('/api') ){
                if ( req.param.action === 'get' && this.enableCollection.some( req.param.name ) ) {
                    await this.prepareResponse( await db.getCollection( req.param.name ) )
                } else if ( req.param.action === 'token' ) {
                    if( req.param.state === 'verify' )
                        await this.prepareResponse( await token.check( req.param.token ) )
                    else if ( req.param.state === 'remove' )
                        token.del( req.param.token )
                } else if ( req.param.action === 'login' ) {
                    let user = new User()
                    let resp = await user.login( req.param )
                    typeof resp === 'object' ? resp.token = await token.add() : null
                    await this.prepareResponse( resp )
                } else if ( req.param.action === 'register' ) {
                    let user = new User()
                    await this.prepareResponse( await user.createUser( req.param ) )
                } else if ( req.param.action === 'updateUser' ) {
                    if( await token.check( req.param.token ) ){
                        let user = new User()
                        const resp = await user.editUser( JSON.parse( req.body ) )
                        typeof resp === 'object' ? resp.token = req.param.token : null
                        await this.prepareResponse( resp )
                    } else
                        await this.prepareResponse( false )
                } else if ( req.param.action === 'updatePwd' ) {
                    if( await token.check( req.param.token ) ) {
                        let user = new User()
                        await this.prepareResponse( await user.user.editPwd( await user.editPwd( req.param ) ) )
                    } else {
                        await this.prepareResponse( false )
                    }
                } else if ( req.param.action === 'cart' ) {
                    if( await token.check( req.param.token ) ){
                        let shop = new Shop()
                        await this.prepareResponse( await shop.cart( req.param.action, {email: req.param.email}, JSON.parse( req.body ) ) )
                    } else {
                        await this.prepareResponse( false )
                    }
                } else if ( req.param.action === 'orders' ) {
                    if ( await token.check( req.param.token ) ) {
                        let shop = new Shop()
                        await this.prepareResponse( await shop.order( { email: req.param.email } ) )
                    } else {
                        await this.prepareResponse( false )
                    }
                }
            } else if ( path.extname( String( req.url ) ) === '' && String( req.url.pathname ) !== '/' ) {
                this.res.headers['Location'] = '/#' + String(req.url.pathname).replace('/', '')
                this.res.headers[':status'] = 302
            }  else {
                await this.readFile( req, res )
            }
        }

        try {
            await this.parseRequest( stream, headers, this.req )
            await this.handleRequest( this.req, this.res, headers )
        } catch ( error ) {
            logSys( error, 'error' )
            this.error = error.message.match( /^(\d{3}) (.+)$/ )
            this.error
                ? this.error.shift()
                : this.error = [ '500', 'Internal Server Error' ]
            this.res.headers[ ':status' ] = error[0]
            this.res.headers[ 'content-type' ] = 'text/html'
            this.res.data = `<h1>${ this.error[0] } ${ this.error[1] }</h1><pre>${ error.stack }</pre>\n<pre>Request : ${ JSON.stringify( this.req, null, 2 ) }</pre>`
        } finally {
            stream.respond( this.res.headers )
            stream.end( this.res.data )
        }
    }



    /**
     * Parse the Request
     * @method
     * @param [stream]
     * @param [headers]
     * @returns {Promise<void>}
     */
    // async parseRequest( stream, headers ){
    //
    //     logSys('parse', 'debug')
    //     this.req.url = new URL( headers[':path'], `https://localhost:${ this.port }` )
    //     this.req.param = Object.fromEntries( this.req.url.searchParams.entries() )
    //     this.req.path = this.req.url.pathname.split('/' )
    //     this.req.path.shift( )
    //
    //     stream.setEncoding('utf8' )
    //     this.req.body = ''
    //     for ( const chunk of stream )
    //         this.req.body += chunk
    //
    // }

    /**
     * Handle the Request
     * @method
     * @param [headers]
     * @returns {Promise<void>}
     */
    // async handleRequest( headers ) {
    //     await logSys('handle', 'debug')
    //     if( this.req.url.pathname.startsWith('/api') ){
    //         if ( this.req.param.action === 'get' && this.enableCollection.some( this.req.param.name ) ) {
    //             logSys('det', 'debug')
    //             this.prepareRequest( await db.getCollection( this.req.param.name ) )
    //         } else if ( this.req.param.action === 'token' ) {
    //             if( this.req.param.state === 'verify' )
    //                 this.prepareRequest( await token.check( this.req.param.token ) )
    //             else if ( this.req.param.state === 'remove' )
    //                 token.del( this.req.param.token )
    //         } else if ( this.req.param.action === 'login' ) {
    //             let user = new User()
    //             let resp = await user.login( this.req.param )
    //             typeof resp === 'object' ? resp.token = await token.add() : null
    //             this.prepareRequest( resp )
    //         } else if ( this.req.param.action === 'register' ) {
    //             let user = new User()
    //             this.prepareRequest( await user.createUser( this.req.param ) )
    //         } else if ( this.req.param.action === 'updateUser' ) {
    //             if( await token.check( this.req.param.token ) ){
    //                 let user = new User()
    //                 const resp = await user.editUser( JSON.parse( this.req.body ) )
    //                 typeof resp === 'object' ? resp.token = this.req.param.token : null
    //                 this.prepareRequest( resp )
    //             } else
    //                 this.prepareRequest( false )
    //         } else if ( this.req.param.action === 'updatePwd' ) {
    //             if( await token.check( this.req.param.token ) ) {
    //                 let user = new User()
    //                 this.prepareRequest( await user.user.editPwd( await user.editPwd( this.req.param ) ) )
    //             } else {
    //                 this.prepareRequest( false )
    //             }
    //         } else if ( this.req.param.action === 'cart' ) {
    //             if( await token.check( this.req.param.token ) ){
    //                 let shop = new Shop()
    //                 this.prepareRequest( await shop.cart( this.req.param.action, {email: this.req.param.email}, JSON.parse( this.req.body ) ) )
    //             } else {
    //                 this.prepareRequest( false )
    //             }
    //         } else if ( this.req.param.action === 'orders' ) {
    //             if ( await token.check( this.req.param.token ) ) {
    //                 let shop = new Shop()
    //                 this.prepareRequest( await shop.order( { email: this.req.param.email } ) )
    //             } else {
    //                 this.prepareRequest( false )
    //             }
    //         }
    //     } else if ( path.extname( String( this.req.url ) ) === '' && String( this.req.url.pathname ) !== '/' ) {
    //         this.res.headers['Location'] = '/#' + String(this.req.url.pathname).replace('/', '')
    //         this.res.headers[':status'] = 302
    //     }  else {
    //         await this.readFile
    //     }
    //
    // }

    /**
     * Prepare response
     * @method
     * @param {object} [resp]
     */
    // prepareRequest( resp ){
    //     this.res.headers[ 'content-type' ] = 'application/json'
    //     this.res.data = JSON.stringify( resp )
    // }

    /**
     * Read file
     * @method
     * @returns {Promise<void>}
     */
    // async readFile( ) {
    //     await logSys('read', 'debug' )
    //     this.fileName = this.req.path.join( path.sep )
    //     this.filePath = 'public/' + ( this.fileName === '' ? 'index.html' : this.fileName )
    //     this.ext = path.extname( this.filePath ).substring( 1 )
    //     //if (this.conf.typeAllowed instanceof Array && !this.conf.typeAllowed.includes(ext)) { throw new Error('403 Forbidden, file type not allowed') }
    //     this.res.headers[ 'content-type' ] = ( this.ext in this.mimeTypes ) ? this.mimeTypes[ this.ext ] : 'text/plain'
    //     try {
    //         this.res.data = await fs.promises.readFile( this.filePath )
    //     } catch ( error ) {
    //         if ( error.code === 'ENOENT' )
    //             throw new Error( '404 Not Found' )
    //         throw error
    //     }
    // }
}

let frigg = new Server()
// frigg.start()
