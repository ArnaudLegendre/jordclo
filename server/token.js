/**
 * Manage token auth, reset at server restart
 * @class
 */
export default class Token {

    constructor() {
        this.tokenUserList = []
    }

    /**
     * Add new token to tokenList for auth
     * @method
     * @returns {string} [token] Return the new token
     */
    add() {
        let randomString = () => Math.random().toString(36).substr(2)
        let newToken = randomString() + randomString() + randomString()
        this.tokenUserList.push(newToken)
        return newToken
    }

    /**
     * Delete token passed in parameter
     * @method
     * @param {string} [token] To delete
     */
    del(token) {
        let tokenUser = this.tokenUserList.indexOf(token)
        if (tokenUser > -1)
            this.tokenUserList.splice(tokenUser, 1)
    }

    /**
     * Compare token passed in parameter with the token list
     * @method
     * @param {string} [token] to compare
     * @returns {boolean} [true/false] True if in the list, false if not
     * TODO: Check the syntax of !! line 44
     */
    check(token) {
        return !!this.tokenUserList.find(e => e === token)
    }

}