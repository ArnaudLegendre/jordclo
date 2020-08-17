let dbReady = new CustomEvent('dbReady', {bubbles: true})
let pageReady = new CustomEvent('pageReady', {bubbles: true})
let pageChange = new CustomEvent('pageChange', {bubbles: true})
let initWebsite = new CustomEvent('initWebsite', {bubbles: true})
let routeList = []
let routes = {}
let productsData = []
let route, userData, pushNotificationHTML, userMenuHTML, loginLogoutFormHTML, cartHTML, cartRowHTML, userProfilHTML, productsOptionsHTML, productCardHTML, shippingHTML, paymentHTML
let htmlData = document.createElement('html')

/**
 * Init website
 * @type {HTMLDivElement}
 */
;(async () => {

    // TODO: create loop to generate variable with html structure
    let getHtmlData = await fetch('assets/structures.html')
    htmlData.innerHTML = await getHtmlData.text()
    document.body.insertBefore(htmlData.querySelector('[data-id=navbar]').firstChild, document.getElementById('wrapper'))
    document.body.appendChild(htmlData.querySelector('[data-id=footer]').firstChild)
    pushNotificationHTML = htmlData.querySelector('[data-id=pushNotification]').innerHTML
    userMenuHTML = htmlData.querySelector('[data-id=userMenu]').innerHTML
    loginLogoutFormHTML = htmlData.querySelector('[data-id=loginLogoutForm]').innerHTML
    cartHTML = htmlData.querySelector('[data-id=cartModal]').innerHTML
    cartRowHTML = htmlData.querySelector('[data-id=cartRow]').innerHTML
    userProfilHTML = htmlData.querySelector('[data-id=userProfil]').innerHTML
    productsOptionsHTML = htmlData.querySelector('[data-id=productsOptions]').innerHTML
    productCardHTML = htmlData.querySelector('[data-id=productCard]').innerHTML
    shippingHTML = htmlData.querySelector('[data-id=shipping]').innerHTML
    paymentHTML = htmlData.querySelector('[data-id=payment]').innerHTML

    let collections = ['pages', 'products']
    for (let i = 0; i < collections.length; i++) {
        let fetchRes = await fetch(`/api?action=get&name=${collections[i]}`)
        let routes = await fetchRes.json()
        routes.forEach(e => {
            let fileName = e.fileName === undefined ? 'product' : e.fileName
            let title = e.title === undefined ? e.name : e.title
            let newPage = {
                'slug': e.slug,
                'fileName': fileName,
                'title': title,
                'access': e.access,
            }
            collections[i] === 'products' ? productsData.push(e) : null
            routeList.push(newPage)
        })
    }
    Object.assign(routes, routeList)
    document.dispatchEvent(dbReady)

})();

/**
 * Manage history and back to prev page
 */
window.onpopstate = () => {
    let dataID = ''
    routeList.forEach(p => { p.slug === document.location.pathname.replace( '/', '' ) ? dataID = p.fileName : null } )
    document.getElementById('content').innerHTML = htmlData.querySelector(`[data-id='${dataID}']`).innerHTML
    setTimeout(() => { document.dispatchEvent(pageChange) }, 100 )
}

/**
 * Router to manage pages
 * @class
 */
class Router {

    constructor(routes) {
        this.routes = routes
        window.addEventListener('hashchange', this.loadPage.bind(this))
        document.addEventListener('dbReady', this.loadPage.bind(this))
    }

    /**
     * Load Page before showing
     * @method
     * @param {string} [event] Event trigger
     * @returns {Promise<void>}
     */
    async loadPage(event) {

        this.event = event
        route = location.hash || '#'
        this.currentPage = await Object.values(this.routes).find(elt => route === `#${elt.slug}`)

        if (this.currentPage === undefined) {
            route = '#404'
            this.currentPage = Object.values(this.routes).find(elt => `#${elt.slug}` === '#404')
            await this.showPage()
        } else {
            if (this.currentPage.access === '1') {
                userData = localStorage.getItem('userLocal')
                if (userData != null) {
                    userData = JSON.parse(userData)
                    let userToken = userData.token
                    await (async () => {
                        let fetchRes = fetch(`/api?action=token&token=${userToken}&state=verify`)
                        let token = await fetchRes.json()
                        token !== true
                            ? (route = '#401',
                                this.currentPage = Object.values(this.routes).find(elt => `#${elt.slug}` === '#401'),
                                await this.showPage,
                                localStorage.removeItem('userLocal'))
                            : (userData = localStorage.getItem('userLocal'),
                                await this.showPage)
                    })()
                } else {
                    route = '#401'
                    this.currentPage = Object.values(this.routes).find(elt => `#${elt.slug}` === '#401')
                    await this.showPage()
                }
            } else
                await this.showPage()
        }

    }

    /**
     * Show page
     * @method
     * @returns {Promise<void>}
     */
    async showPage() {
        this.currentHTML = htmlData.querySelector(`[data-id='${this.currentPage.fileName}']`).innerHTML
        history.replaceState(this.currentHTML, this.currentPage.title, route.replace('#', '/'))
        document.getElementById('content').innerHTML = this.currentHTML
        document.querySelector('title').innerHTML = this.currentPage.title
        if (this.event.type === 'dbReady')
            document.dispatchEvent(pageReady)
    }
}

let pagesRoutes = new Router(routes)