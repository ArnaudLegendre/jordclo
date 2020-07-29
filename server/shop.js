import logSys       from './msgSystem.js'
import Database     from './database.js'
import { config }   from '../public/assets/config.js'
import dateTime     from "./dateTime.js";
let db =            new Database( config.db.userRW, config.db.pwdRW, config.db.name )

/**
 * Manage Shop features
 * @class
 */
export default class Shop {

    /**
     * Manage cart
     * @method
     * @param [action] {string} saveCart or getCart
     * @param [primaryKey] {object} key: value
     * @param [data] {object} object with cart
     * @returns {Promise<*>}
     */
    async cart( action, primaryKey, data ) {
        try {
            let resp = action === 'saveCart'
                ? await db.editDocument( 'users', primaryKey, data[0] )
                : action === 'getCart'
                    ? await db.getDocument( 'users', primaryKey )
                    : null
            return typeof resp === 'object' ? resp.cart : resp
        }catch (e) {
            logSys( e, 'error')
        }
    }

    /**
     * Manage Order
     * @method
     * @param [primaryKey] {object} key: value
     * @returns {Promise<string>}
     */
    async order( primaryKey ) {
        try {
            let userInfo = await db.getDocument('users', primaryKey)
            let infos = {}
            for (let [k, v] of Object.entries(userInfo))
                k !== 'password' && k !== 'cart' ? infos[k] = v : null

            let order = {
                'status': 'paid',
                'cart': userInfo.cart,
                'infos': infos,
                'dateCreate': await dateTime()
            }
            return await db.createDocument('orders', {_id: '000'}, order)
        } catch ( e ) {
            logSys( e, 'error' )
        }
    }
}