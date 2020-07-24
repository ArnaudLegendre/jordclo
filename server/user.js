import argon2       from 'argon2'
import logSys       from '../server/msgSystem.js'
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
            data.password = await argon2.hash( data.password )
            return await db.createDocument('users', { email: data.email }, data )
        } catch ( error ) {
            await logSys( error, 'error' )
            return error
        }
    }

    /**
     * Edit user infos
     * @method
     * @param {object} [data] to edit into database
     * @returns {Promise<object>} edited data
     */
    async editUser( data ) {
        try {
            return await db.editDocument( 'users', { email: data.email }, data )
        } catch ( error ) {
            await logSys( error, 'error' )
            return error
        }
    }

    /**
     * Edit & hash password
     * @method
     * @param {object} [data] email, old and new password
     * @returns {Promise<string|*>} success or error message
     */
    async editPwd( data ) {
        try {
            this.document = await db.getDocument( 'users', { email: data.email } )
            return await argon2.verify( this.document[0].password, data.password )
                ? await db.editDocument( 'users', { email: data.email }, { password: await argon2.hash( data.newPassword ) } )
                : 'old password invalid'
        } catch ( error ) {
            await logSys( error, 'error' )
            return error
        }
    }

    /**
     * Login user and return token auth
     * @method
     * @param {object} [data] email & password
     * @returns {Promise<string|*>} token or error message
     */
    // TODO: Fix error at login with incorrect infos
    async login( data ) {
        try {
            this.document = await db.getDocument( 'users', { email: data.email } )
            if( typeof this.document === 'object' ){
                if( await argon2.verify( this.document[0].password, data.password ) ) {
                    logSys( `User login "${ this.document[0]._id }"` )
                    return {
                        'email': this.document[0].email,
                        'firstname': this.document[0].firstname,
                        'lastname': this.document[0].lastname,
                        'phone': this.document[0].phone,
                        'address': this.document[0].address,
                        'postalCode': this.document[0].postalCode,
                        'town': this.document[0].town,
                        'shipping_address': this.document[0].shipping_address,
                        'shipping_postalCode': this.document[0].shipping_postalCode,
                        'shipping_town': this.document[0].shipping_town,
                        'token': ''
                    }
                } else
                    return 'password incorrect'
            } else
                return this.document
        } catch ( error ) {
            await logSys( error, 'error' )
            return error
        }
    }


}