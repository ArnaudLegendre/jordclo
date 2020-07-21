import argon2       from 'argon2'
import logSys       from '../server/msgSystem.js'
import Token        from '../server/token.js'
import Database     from './database.js'
import { config }   from '../public/assets/config.js'
let db =            new Database( config.db.userRW, config.db.pwdRW, config.db.name )

/**
 * Manage User
 * @class
 */
export default class User {
    /**
     * Create new user
     * @method
     * @param {object} [data] to insert into database
     * @returns {Promise<object>} created data
     */
    async createUser( data ) {
        try {
            await db.connection()
            data.password = await argon2.hash( data.password )
            await db.createDocument('users', { email: data.email }, data )
        } catch ( error ) {
            await logSys( error, 'error' )
            return error
        } finally {
            await db.closeConnect()
        }
    }

    /**
     * Edit user infos
     * @method
     * @param {object} [data] to edit into database
     * @param {string} [tokenUser] security check
     * @returns {Promise<object>} edited data
     */
    async editUser( data, tokenUser ) {
        try {
            await db.connection()
            let token = new Token
            await token.check( tokenUser )
                ? await db.editDocument( 'users', { email: data.email }, data )
                : 'token invalid'
        } catch ( error ) {
            await logSys( error, 'error' )
            return error
        } finally {
            await db.closeConnect()
        }
    }

    /**
     * Edit & hash password
     * @method
     * @param {object} [data] email, old and new password
     * @param {string} [tokenUser] security check
     * @returns {Promise<string|*>} success or error message
     */
    async editPwd( data, tokenUser ) {
        try {
            await db.connection()
            let token = new Token
            if( await token.check( tokenUser ) ) {
                this.document = await db.getDocument( 'users', { email: data.email } )
                await argon2.verify( this.document[0].password, data.oldPassword )
                    ? await db.editDocument( 'users', { email: data.email }, { password: await argon2.hash( data.newPassword ) } )
                    : 'old password invalid'
            } else {
                return 'token invalid'
            }
        } catch ( error ) {
            await logSys( error, 'error' )
            return error
        } finally {
            await db.closeConnect()
        }
    }

    /**
     * Login user and return token auth
     * @method
     * @param {object} [data] email & password
     * @returns {Promise<string|*>} token or error message
     */
    async login( data ) {
        try {
            await db.connection()
            this.document = await db.getDocument( 'users', { email: data.email } )
            if( await argon2.verify( this.document[0].password, data.password ) ) {
                let token = new Token
                this.token = token.add()
                return this.token
            } else {
                return 'password incorrect'
            }
        } catch ( error ) {
            await logSys( error, 'error' )
            return error
        } finally {
            await db.closeConnect()
        }
    }


}