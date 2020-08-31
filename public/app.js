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
document.addEventListener('pageReady', () => {
    buildProduct()
    productsPage()
    getProductsByCat()
    enableFilters()
    document.dispatchEvent(initWebsite)
})

window.addEventListener('pageChange', () => {
    buildProduct()
    productsPage()
    getProductsByCat()
    enableFilters()
})


let optionsList = {}
let productPrice

function buildProduct() {

    document.getElementById('qtyInput') ? document.getElementById('qtyInput').addEventListener('input', () => calcProductPrice()) : null

    let target = location.pathname.split('/').pop()

    productsData.forEach(elt => {

        if (elt.slug === target) {
            document.querySelector('h1').innerHTML = elt.name
            document.getElementById('ref').innerHTML = elt.ref
            document.getElementById('price').innerHTML = productPrice = elt.price

            let prodImg
            elt.images[0] ? prodImg = elt.images[0] : prodImg = 'assets/images/aucune-image.png'
            document.getElementById('productImg').src = prodImg

            let tableTech = document.getElementById('productTech').querySelector('tbody')
            elt.tech !== undefined ? tableTech.innerHTML = tableTech.innerHTML.concat(`<tr><td>${elt.tech}</td></tr>`) : null

            if (elt.variables) {
                for (const [key] of Object.entries(elt.variables)) {
                    productsData.forEach(prod => {
                        if (prod.ref === key) {
                            let rowHTML = `<tr><td>${prod.name} | ${prod.tech}</td></tr>`
                            tableTech.innerHTML = tableTech.innerHTML.concat(rowHTML)
                        }
                    })
                }
            }


            // Write desc
            let prodDesc = document.getElementById('productDesc')
            if (elt.desc) {
                prodDesc.querySelector('.desc').innerHTML = elt.desc
                prodDesc.hidden = false
            } else
                prodDesc.hidden = true

            //Show/Hide tech
            tableTech.childElementCount === 0 ? document.getElementById('productTech').hidden = true : document.getElementById('productTech').hidden = false

            // Define options
            if (elt.options) {

                Object.values(elt.options).forEach(grp => {

                    const groupValues = grp.values

                    if (grp.type === 'checkbox') {

                        let checkboxGrp = document.createElement('div')

                        checkboxGrp.innerHTML = productsOptionsHTML
                        checkboxGrp.innerHTML = checkboxGrp.querySelector('#checkbox').innerHTML

                        checkboxGrp.querySelector('.title').innerHTML = grp.name

                        let checkboxGrpHtml = checkboxGrp.querySelector('.checkboxGroup').innerHTML
                        checkboxGrp.querySelector('.checkboxGroup').innerHTML = ''

                        groupValues.forEach(e => {

                            let optPrice = e.price
                            productsData.forEach(prod => {
                                prod.ref === e.ref ? optPrice = prod.price : null
                            })

                            optionsList[e.ref] = optPrice

                            let checkboxElem = document.createElement('div')
                            checkboxElem.innerHTML = checkboxGrpHtml

                            let input = checkboxElem.querySelector('input')
                            let label = checkboxElem.querySelector('label')

                            input.id = input.value = e.ref
                            input.dataset.name = e.name
                            label.setAttribute('for', e.ref)
                            label.innerHTML = e.name

                            checkboxGrp.querySelector('.checkboxGroup').innerHTML = checkboxGrp.querySelector('.checkboxGroup').innerHTML.concat(checkboxElem.innerHTML)


                        })

                        document.getElementById('options').innerHTML = document.getElementById('options').innerHTML.concat(checkboxGrp.innerHTML)

                    } else if (grp.type === 'select') {

                        let selectGrp = document.createElement('div')

                        selectGrp.innerHTML = productsOptionsHTML
                        selectGrp.innerHTML = selectGrp.querySelector('#select').innerHTML

                        selectGrp.querySelector('.title').innerHTML = grp.name

                        let selectGrpHtml = selectGrp.querySelector('.selectGroup').innerHTML
                        selectGrp.querySelector('.selectGroup').id = grp.ref

                        groupValues.forEach(e => {

                            optionsList[e.ref] = e.price

                            let optSelect = document.createElement('div')
                            optSelect.innerHTML = selectGrpHtml
                            optSelect.querySelector('option').id = optSelect.querySelector('option').value = e.ref
                            optSelect.querySelector('option').innerHTML = e.name

                            selectGrp.querySelector('.selectGroup').innerHTML = selectGrp.querySelector('.selectGroup').innerHTML.concat(optSelect.innerHTML)

                        })

                        document.getElementById('options').innerHTML = document.getElementById('options').innerHTML.concat(selectGrp.innerHTML)

                    } else if (grp.type === 'radio') {

                        let radioGrp = document.createElement('div')
                        radioGrp.innerHTML = productsOptionsHTML
                        radioGrp.innerHTML = radioGrp.querySelector('#radio').innerHTML

                        radioGrp.querySelector('.title').innerHTML = grp.name

                        let radioGrpHtml = radioGrp.querySelector('.radioGroup').innerHTML
                        radioGrp.querySelector('.radioGroup').id = grp.ref

                        radioGrp.querySelector('.radioGroup').innerHTML = ''

                        groupValues.forEach(e => {

                            optionsList[e.ref] = e.price
                            let optRadio = document.createElement('div')
                            optRadio.innerHTML = radioGrpHtml
                            let label = optRadio.querySelector('label')
                            let input = label.querySelector('input')
                            input.value = e.ref
                            input.name = grp.ref
                            input.dataset.name = e.name
                            label.querySelector('.label-name').innerHTML = e.name

                            radioGrp.querySelector('.radioGroup').innerHTML = radioGrp.querySelector('.radioGroup').innerHTML.concat(optRadio.innerHTML)

                        })

                        radioGrp.querySelector('input').defaultChecked = true
                        document.getElementById('options').innerHTML = document.getElementById('options').innerHTML.concat(radioGrp.innerHTML)

                    }

                })

                document.getElementById('options').addEventListener('click', e => e.target.classList.contains('optProduct') ? calcProductPrice() : null)

            } else {

                document.getElementById('options').remove()

            }

        }

    })

}

function calcProductPrice() {

    let totalPrice = parseFloat(productPrice)

    document.getElementById('options').querySelectorAll('.optProduct').forEach(opt => {
        if ((opt.selected === true || opt.checked === true) && opt.value !== '')
            totalPrice += parseFloat(optionsList[opt.id])
    })

    document.getElementById('price').innerHTML = (totalPrice * document.getElementById('qtyInput').value).toFixed(2)

}

function productsPage(cat = 'all', count = -1) {

    let productsPage = document.getElementById('productsPage')
    if (productsPage) {

        let counter = 1

        productsData.forEach(prod => {

            let thisProd

            cat !== 'all' && prod.category === cat ? thisProd = prod : cat === 'all' ? thisProd = prod : null

            if (thisProd && (counter <= count || count === -1)) {
                counter++
                let prodCardHTML = document.createElement('span')
                prodCardHTML.innerHTML = productCardHTML
                prodCardHTML.querySelector('.productCard').href = `#${thisProd.slug}`
                prodCardHTML.querySelector('.productImg').src = thisProd.images[0]
                prodCardHTML.querySelector('.productName').innerHTML = thisProd.name
                prodCardHTML.querySelector('.productPrice').innerHTML = thisProd.price
                productsPage.querySelector('.productsList').insertAdjacentHTML('beforeend', prodCardHTML.innerHTML)
            }
        })

    }

}

function getProductsByCat() {
    let cats = document.querySelectorAll('[data-cat]')

    cats.forEach(catNode => {

        let counter = 1
        let count = parseInt(catNode.dataset.count)
        let cat = catNode.dataset.cat

        productsData.forEach(prod => {

            let thisProd

            cat !== 'all' && prod.category === cat && parseFloat(prod.access) === 0 ? thisProd = prod : cat === 'all' ? thisProd = prod : null

            if (thisProd && (counter <= count || count === -1)) {
                counter++
                let prodImg
                let prodCardHTML = document.createElement('span')
                prodCardHTML.innerHTML = productCardHTML
                prodCardHTML.querySelector('.productCard').href = `#${thisProd.slug}`
                prodCardHTML.querySelector('.productCard').dataset.filters = `[${JSON.stringify(thisProd.filters)}]`
                prodCardHTML.querySelector('.productName').innerHTML = thisProd.name
                thisProd.images[0] ? prodImg = thisProd.images[0] : prodImg = '/assets/images/aucune-image.png'
                prodCardHTML.querySelector('.productImg').src = prodImg
                prodCardHTML.querySelector('.productPrice').innerHTML = `${thisProd.price}€ TTC`
                catNode.insertAdjacentHTML('beforeend', prodCardHTML.innerHTML)
            }
        })
    })

}

function enableFilters() {

    if (document.querySelector('.filters')) {
        document.querySelector('.filters').addEventListener('click', (e) => {
            if (e.target.hasAttribute('data-filter')) {

                let products = document.querySelectorAll('[data-filters]')
                products.forEach(prod => prod.hidden = false)

                document.querySelectorAll('[data-filter]').forEach(filter => {
                    if (filter.checked === false) {
                        let filterGroup = filter.closest('[data-filter-group]').attributes['data-filter-group'].nodeValue
                        let filterValue = filter.attributes['data-filter'].nodeValue
                        products.forEach(prod => {
                            let filtersList = JSON.parse(prod.attributes['data-filters'].nodeValue)
                            if (filtersList[0][`${filterGroup}`] === filterValue)
                                prod.hidden = true
                        })
                    }
                })
            }
        })
    }
}
function showPushNotification(type, msg) {

    let notice = document.createElement('div')
    notice.innerHTML = pushNotificationHTML
    notice = notice.firstElementChild

    notice.classList.remove('show')
    notice.classList.add('hide')
    notice.classList.remove('info')
    notice.classList.remove('success')
    notice.classList.remove('error')

    switch (type) {
        case 'success':
            notice.classList.add('success')
            break
        case 'error':
            notice.classList.add('error')
            break
        case 'info':
            notice.classList.add('info')
            break
    }

    notice.querySelector('.msg').innerText = ''
    notice.querySelector('.msg').innerText = msg

    console.log(document.getElementById('wrapper').firstElementChild)
    !document.getElementById('notice') ? document.getElementById('wrapper').firstElementChild.appendChild(notice) : null

    notice.classList.toggle('hide')
    notice.classList.toggle('show')

    setTimeout(function () {
        if (notice.classList.contains('show')) {
            notice.classList.toggle('show')
            notice.classList.toggle('hide')
        }
    }, 5000)

}
document.addEventListener('click', e => {
    e.target.dataset.modaltarget != null ? showModal(e.target.dataset.modaltarget) : e.target.classList.contains('modal') || e.target.classList.contains('btn') ? hideModal() : null
})


window.addEventListener('hashchange', hideModal)

function showModal(e) {
    document.querySelectorAll(`[data-modal]`).forEach(elt => elt.classList.remove('active'))
    document.querySelector(`[data-modal=${e}]`).classList.add('active')
}

function hideModal() {
    document.querySelectorAll(`[data-modal]`).forEach(elt => elt.classList.remove('active'))
}
let cartLocal = null

document.addEventListener('pageChange', () => {

    document.getElementById('addCart') ? document.getElementById('addCart').addEventListener('click', e => addCartFromProductPage(e.target)) : null
    document.getElementById('cartModal').firstElementChild.innerHTML = cartHTML
    refreshCart()

})

document.addEventListener('pageReady', () => {

    document.getElementById('addCart') ? document.getElementById('addCart').addEventListener('click', e => addCartFromProductPage(e.target)) : null
    document.getElementById('cartModal').firstElementChild.innerHTML = cartHTML
    refreshCart()

})

document.addEventListener('click', e => {

    if (e.target.closest('.removeCart')) {
        let ref = e.target.closest('.removeCart').parentElement.parentElement.parentElement.querySelector('.refLabel > .value').innerHTML
        let opt = e.target.closest('.removeCart').parentElement.parentElement.parentElement.querySelector('.refLabel > .optionsList') ? e.target.closest('.removeCart').parentElement.parentElement.parentElement.querySelector('.refLabel > .optionsList').innerHTML : ''
        removeCart(ref, opt)
    }


    e.target.closest('.plusProduct') ? plusMinusProduct(e.target.closest('.plusProduct').closest('.qtyLabel'), 'plus') : null

    e.target.closest('.minusProduct') ? plusMinusProduct(e.target.closest('.minusProduct').closest('.qtyLabel'), 'minus') : null

})

function refreshCart() {

    cartLocal = localStorage.getItem('cartLocal') ? localStorage.getItem('cartLocal') : null

    const buttonCart = document.getElementById('buttonCart')
    const carts = document.querySelectorAll('.cart')

    carts.forEach(e => {
        const tbody = e.getElementsByTagName('tbody')[0]
        tbody.innerHTML = ''
        let totalPrice = 0
        buttonCart.classList.add('tooltip')
        buttonCart.classList.remove('buttonModal')
        buttonCart.removeAttribute('data-modaltarget')


        if (cartLocal != null) {

            buttonCart.classList.remove('tooltip')
            buttonCart.classList.add('buttonModal')
            buttonCart.dataset.modaltarget = 'cart'

            JSON.parse(cartLocal).forEach(e => {

                tbody.innerHTML += cartRowHTML

                let optsName = ''
                if (e.optName != undefined)
                    optsName = ` Options : ${e.optName}`

                tbody.lastElementChild.querySelector('.refLabel > .value').innerHTML = e.ref
                tbody.lastElementChild.querySelector('.productLabel > .value').innerHTML = `${e.name}. ${optsName}`
                tbody.lastElementChild.querySelector('.priceLabel > .value').innerHTML = Number(Math.round(e.price + 'e2') + 'e-2').toFixed(2)
                tbody.lastElementChild.querySelector('.qtyLabel > .value').innerHTML = e.qty
                tbody.lastElementChild.querySelector('.totalLabel > .value').innerHTML = Number(Math.round((e.price * e.qty) + 'e2') + 'e-2').toFixed(2)

                if (e.options.length > 0) {

                    let optionDiv = document.createElement('small')
                    optionDiv.innerHTML = e.options
                    optionDiv.classList.add('optionsList')
                    tbody.lastElementChild.querySelector('.refLabel > .value').after(optionDiv)

                }

                totalPrice += e.price * e.qty

            })

            document.querySelector('.cartPrice').innerHTML = Number(Math.round(totalPrice + 'e2') + 'e-2').toFixed(2)

            document.getElementById('buttonCart').querySelector('svg').setAttribute('data-modaltarget', 'cart')

        } else {

            document.getElementById('buttonCart').querySelector('svg').removeAttribute('data-modaltarget')

        }
    });

    localStorage.getItem('userLocal') ? saveCart() : null
    refreshCounter()

}

async function addCartFromProductPage(e) {

    let productElem = e.closest('.productElem')
    let productAdd = {}
    let data = []
    let optionsList = []
    let optionsName = []

    productAdd = {
        "ref": productElem.querySelector('#ref').innerHTML,
        "name": productElem.querySelector('#name').innerHTML,
        "price": parseFloat(productElem.querySelector('#price').innerHTML),
        "qty": parseFloat(productElem.querySelector('#qty').children['qtyInput'].value)
    }

    let prodVar = new Promise(resolve => {
        productsData.forEach(prod => {
            prod.ref === productElem.querySelector('#ref').innerHTML ? resolve(prod.variables) : null
        })
    })
    Object.getOwnPropertyNames(await prodVar).length > 0 ? productAdd.var = await prodVar : null

    if (productElem.querySelector('#options')) {
        productElem.querySelectorAll('input').forEach(opt => {
            if ((opt.selected === true || opt.checked === true) && opt.value !== '') {
                optionsList.push(opt.value)
                optionsName.push(opt.dataset.name)
            }
        })
        productAdd.options = optionsList
        productAdd.optName = optionsName
    }


    if (!cartLocal) {

        await data.push(productAdd)
        localStorage.setItem('cartLocal', JSON.stringify(data))
        refreshCart()

    } else {

        data = JSON.parse(localStorage.getItem('cartLocal'))
        let newItem = true

        data.forEach(e => {
            (productAdd.ref === e.ref && String(productAdd.options) === String(e.options)) ? (e.qty += productAdd.qty, newItem = false) : null;
        })
        newItem ? (data.push(productAdd), localStorage.setItem('cartLocal', JSON.stringify(data))) : localStorage.setItem('cartLocal', JSON.stringify(data))
        refreshCart()

    }
}

async function addCart(ref, qty, opt = '') {
    let productAdd = {}
    let data = []

    let prod = new Promise(resolve => {
        productsData.forEach(prod => {
            prod.ref === ref ? resolve(prod) : null
        })
    })

    let product = await prod

    productAdd = {
        "ref": ref,
        "qty": qty,
        "name": product.name,
        "price": product.price,
        "options": opt
    }

    if (!cartLocal) {

        await data.push(productAdd)
        localStorage.setItem('cartLocal', JSON.stringify(data))
        refreshCart()

    } else {

        data = JSON.parse(localStorage.getItem('cartLocal'))
        let newItem = true

        data.forEach(e => {
            (productAdd.ref === e.ref && String(productAdd.options) === String(e.options)) ? (e.qty += productAdd.qty, newItem = false) : null;
        })
        newItem ? (data.push(productAdd), localStorage.setItem('cartLocal', JSON.stringify(data))) : localStorage.setItem('cartLocal', JSON.stringify(data))
        refreshCart()

    }

}

function removeCart(ref, opt) {

    let newData = []
    JSON.parse(cartLocal).forEach(e => (e.ref === ref && String(e.options) === opt) ? null : newData.push(e))
    newData.length <= 0 ? (localStorage.removeItem('cartLocal'), refreshCart(), hideModal()) : (localStorage.setItem('cartLocal', JSON.stringify(newData)), refreshCart())

}

function refreshCounter() {

    let cartCount = document.getElementById('buttonCart')
    let modalCart = document.getElementById('cartModal')

    cartCount ? cartCount.dataset['badge'] = modalCart.querySelectorAll('.productLabel').length : null

}

function plusMinusProduct(e, type) {

    let refLabel = e.parentElement.querySelector('.refLabel').firstElementChild.innerHTML
    let refOptions = e.parentElement.querySelector('.optionsList') ? e.parentElement.querySelector('.optionsList').innerHTML : ''
    let value = type === 'plus' ? parseInt(e.querySelector('.value').innerHTML) + 1 : parseInt(e.querySelector('.value').innerHTML) - 1

    value === 0 ? value = 1 : null

    e.querySelector('.value').innerHTML = value

    cartLocal = JSON.parse(localStorage.getItem('cartLocal'))
    cartLocal.forEach(e => e.ref === refLabel && String(e.options) === refOptions ? e.qty = value : null)
    localStorage.setItem('cartLocal', JSON.stringify(cartLocal))
    refreshCart()

}

function saveCart() {

    let cartLocal = localStorage.getItem('cartLocal') ? localStorage.getItem('cartLocal') : 'null'
    let userLocal = JSON.parse(localStorage.getItem('userLocal'))

    fetch(`/api?action=cart?token=${userLocal.token}&email=${userLocal.email}&state=saveCart`, {
        method: "POST",
        headers: {
            "Content-type": "application/json"
        },
        body: cartLocal,
    })

}

function getCart() {

    let cartLocal = localStorage.getItem('cartLocal') ? localStorage.getItem('cartLocal') : '{}'
    let userLocal = JSON.parse(localStorage.getItem('userLocal'))

    fetch(`/api?action=cart&token=${userLocal.token}&email=${userLocal.email}&state=getCart`, {
        method: "POST",
        headers: {
            "Content-type": "application/json"
        },
        body: cartLocal,
    })
        .then(res => {
            return res.json()
        }).then(data => {
        if (data === false) {
            showPushNotification('error', "Session expirée")
        } else if (data !== 'null') {
            localStorage.setItem('cartLocal', JSON.stringify(data))
        }
    }).then(() => refreshCart())

}
document.addEventListener('initWebsite', function () {

    let userLocal = localStorage.getItem('userLocal')

    if (userLocal) {

        userIsLog()

    } else {

        document.getElementById('loginRegister').firstElementChild.innerHTML = loginLogoutFormHTML

        loginRegister('modal')

        localStorage.getItem('cartLocal') ? refreshCart() : null

    }

    document.querySelectorAll('.accountUserPage').forEach(elt => {

        elt.innerHTML = userProfilHTML

        getUserProfilPage(document.getElementById('accountUserPage'))

    })


})

document.addEventListener('pageChange', () => {

    document.querySelectorAll('.accountUserPage').forEach(elt => {

        elt.innerHTML = userProfilHTML

        getUserProfilPage(document.getElementById('accountUserPage'))

    })

})

function getUserProfilPage(content) {

    writeData()

    let userLocal = JSON.parse(localStorage.getItem('userLocal'))

    content.addEventListener('click', e => {

        if (e.target.classList.contains('editProfil')) {

            let panel = e.target.closest('.panel')
            let inputs = panel.querySelectorAll('input')
            let labelsSpan = panel.querySelectorAll('.labelSpan')
            let button = panel.querySelector('.buttonSection')

            inputs.forEach(elt => {
                elt.hidden = false
            })
            labelsSpan.forEach(elt => {
                elt.hidden = true
            })
            button.hidden = false
        }

        if (e.target.closest('.saveProfil')) {

            let dataSend = {
                'email': userLocal.email,
                'firstname': document.getElementById('firstnameField').nextElementSibling.value,
                'lastname': document.getElementById('lastnameField').nextElementSibling.value,
                'phone': document.getElementById('phoneField').nextElementSibling.value,
                'address': document.getElementById('addressField').nextElementSibling.value,
                'postalCode': document.getElementById('postalcodeField').nextElementSibling.value,
                'town': document.getElementById('townField').nextElementSibling.value,
                'shipping_address': document.getElementById('addressShippingField').nextElementSibling.value,
                'shipping_postalCode': document.getElementById('postalcodeShippingField').nextElementSibling.value,
                'shipping_town': document.getElementById('townShippingField').nextElementSibling.value,
            }

            fetch(`/api?action=updateUser&token=${userLocal.token}`, {
                method: "POST",
                headers: {
                    "Content-type": "application/json"
                },
                body: JSON.stringify(dataSend),
            })
                .then(res => {
                    return res.json()
                }).then(data => {
                if (data === false) {
                    showPushNotification('error', "Session expirée")
                } else {
                    dataSend.token = userLocal.token
                    localStorage.setItem('userLocal', JSON.stringify(dataSend))
                    showPushNotification('success', "Informations sauvegardées")
                    writeData()
                    cancelEdit()
                }
            })
        }

        if (e.target.classList.contains('editPassword')) {

            let newPass = document.getElementById('newPassword').value
            let confirmPass = document.getElementById('confirmPassword').value
            let oldPass = document.getElementById('oldPassword').value
            let email = document.getElementById('emailField').innerHTML
            let token = userLocal.token

            const regexPatPwd = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])[a-zA-Z0-9!@#$%^&*()_+\-=]*.{8,25}$/
            const pwdCheck = regexPatPwd.test(newPass)

            pwdCheck ? editPassword() : showPushNotification('error', "Le mot de passe doit contenir 8 à 25 caractères et au moins 1 majuscule, 1 minuscule et 1 chiffre.")

            function editPassword() {
                if (newPass === confirmPass) {

                    fetch(`/api?action=updatePwd&email=${email}&password=${encodeURIComponent(oldPass)}&newPassword=${encodeURIComponent(newPass)}&token=${token}`)
                        .then(res => {
                            return res.json()
                        })
                        .then(data => {
                            if (data === 'user not found') {
                                showPushNotification('error', "Email incorrect")
                            } else if (data === 'incorrect password') {
                                showPushNotification('error', "Mauvais mot de passe")
                            } else if (data === 'edited document') {
                                showPushNotification('success', "Modification du mot de passe réussi")
                                document.getElementById('newPassword').value = ''
                                document.getElementById('confirmPassword').value = ''
                                document.getElementById('oldPassword').value = ''
                                cancelEdit()
                            }
                        })
                } else {
                    showPushNotification('error', "Le nouveau mot de passe n'est pas identique à la confirmation")
                }
            }


        }

        if (e.target.classList.contains('cancelSave'))
            cancelEdit()

    })

}

function cancelEdit() {
    let inputs = document.querySelectorAll('input')
    let labelsSpan = document.querySelectorAll('.labelSpan')
    let button = document.querySelectorAll('.buttonSection')
    inputs.forEach(elt => {
        elt.hidden = true
    })
    labelsSpan.forEach(elt => {
        elt.hidden = false
    })
    button.forEach(elt => {
        elt.hidden = true
    })
}

function writeData() {

    let userLocal = localStorage.getItem('userLocal')
    userLocal = JSON.parse(userLocal)

    document.getElementById('emailField').innerHTML = userLocal.email
    document.getElementById('firstnameField').innerHTML = document.getElementById('firstnameField').nextElementSibling.value = userLocal.firstname
    document.getElementById('lastnameField').innerHTML = document.getElementById('lastnameField').nextElementSibling.value = userLocal.lastname
    document.getElementById('phoneField').innerHTML = document.getElementById('phoneField').nextElementSibling.value = userLocal.phone
    document.getElementById('addressField').innerHTML = document.getElementById('addressField').nextElementSibling.value = userLocal.address
    document.getElementById('postalcodeField').innerHTML = document.getElementById('postalcodeField').nextElementSibling.value = userLocal.postalCode
    document.getElementById('townField').innerHTML = document.getElementById('townField').nextElementSibling.value = userLocal.town
    document.getElementById('addressShippingField').innerHTML = document.getElementById('addressShippingField').nextElementSibling.value = userLocal.shipping_address
    document.getElementById('postalcodeShippingField').innerHTML = document.getElementById('postalcodeShippingField').nextElementSibling.value = userLocal.shipping_postalCode
    document.getElementById('townShippingField').innerHTML = document.getElementById('townShippingField').nextElementSibling.value = userLocal.shipping_town

}

function userIsLog() {

    localStorage.getItem('cartLocal') ? refreshCart() : getCart()
    document.getElementById('loginRegister').firstElementChild.innerHTML = userMenuHTML
    document.getElementById('logoutMenu').addEventListener('click', e => {
        e.preventDefault()
        localStorage.removeItem('userLocal')
        userIsNotLog()
        showPushNotification('success', "Déconnection réussi !")
        document.dispatchEvent(dbReady)
    })

}

function userIsNotLog() {

    document.getElementById('loginRegister').firstElementChild.innerHTML = loginLogoutFormHTML
    localStorage.removeItem('cartLocal')
    refreshCart()


}

function loginRegister(location) {

    let loginForms = document.querySelectorAll('.loginRegisterForm')

    loginForms.forEach(e => {
        let switchForm = e.querySelector('.switchForm')
        let buttonSubmit = e.querySelector('.buttonSend')
        let disclaimer = e.querySelector('.disclaimer')

        switchForm.addEventListener('click', elt => {

            elt.preventDefault()
            buttonSubmit.classList.contains('loginSubmit') ? switchToRegister() : switchToLogin()

            function switchToLogin() {
                switchForm.innerHTML = "Pas encore enregistré"
                e.querySelector('legend').innerHTML = "S'identifier"
                e.confirmPassword.hidden = disclaimer.hidden = true
                buttonSubmit.value = "Connexion"
                buttonSubmit.classList.toggle('loginSubmit')
            }

            function switchToRegister() {
                switchForm.innerHTML = "J'ai déjà un compte"
                e.querySelector('legend').innerHTML = "S'enregistrer"
                e.confirmPassword.hidden = disclaimer.hidden = false
                buttonSubmit.value = "Inscription"
                buttonSubmit.classList.toggle('loginSubmit')
            }
        })

        if (e) {
            e.addEventListener('submit', async (elt) => {
                elt.preventDefault()
                let param = ''

                if (elt.target.monprenom.value === '' & elt.target.monadresse.value === 'ceci est mon adresse') {
                    let data = new FormData(elt.target)

                    if (buttonSubmit.classList.contains('loginSubmit')) {
                        for (let [key, value] of data.entries()) {
                            param = param.concat(`${key}=${encodeURIComponent(value)}&`)
                        }

                        param = param.slice(0, -1)

                        fetch(`api?action=login&${param}`)
                            .then(res => {
                                return res.json()
                            })
                            .then(data => {
                                if (data === 'document not found') {
                                    showPushNotification('error', "Email incorrect")
                                } else if (data === 'password incorrect') {
                                    showPushNotification('error', "Mauvais mot de passe")
                                } else if (typeof data === 'object') {
                                    localStorage.setItem('userLocal', JSON.stringify(data))
                                    showPushNotification('success', "Connexion réussi !")
                                    location === 'modal' ? hideModal() : purchase('step2')
                                    userIsLog()
                                }
                            })
                    } else {

                        let dataSend = {}

                        for (let [key, value] of data.entries()) {
                            dataSend[key] = value
                            param = param.concat(`${key}=${encodeURIComponent(value)}&`)
                        }

                        const regexPatPwd = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])[a-zA-Z0-9!@#$%^&*()_+\-=]*.{8,25}$/
                        const pwdCheck = regexPatPwd.test(dataSend.password)
                        pwdCheck ? null : showPushNotification('error', "Le mot de passe doit contenir 8 à 25 caractères et au moins 1 majuscule, 1 minuscule et 1 chiffre.")

                        if (pwdCheck && dataSend.password === dataSend.confirmPassword) {
                            param = param.slice(0, -1)

                            fetch(`api?action=register&${param}`)
                                .then(res => {
                                    return res.json()
                                }).then(data => {
                                if (data === 'already existing document') {
                                    showPushNotification('error', "Adresse email déjà utilisée")
                                } else if (data === 'create document') {
                                    showPushNotification('success', "Compte créé, vous pouvez vous connecter")
                                    hideModal()
                                }
                            })
                        }
                    }
                }
            })
        }
    })

}
document.addEventListener('initWebsite', () => {

    document.getElementById('purchase') ? purchase('step1') : null

})
document.addEventListener('pageChange', () => {

    document.getElementById('purchase') ? purchase('step1') : null

})

function purchase(step) {

    let purchaseElem = document.getElementById('purchase')
    let content = purchaseElem.querySelector('.content')
    let purchaseBtn

    if (step === 'step1') {
        content.innerHTML = cartHTML
        purchaseBtn = content.querySelector('.purchaseButton')
        purchaseBtn.firstElementChild.innerHTML = "Continuer ma commande"
        purchaseBtn.href = "#commander?etape=2"
        refreshCart()

    } else if (step === 'step2') {
        content.innerHTML = userProfilHTML
        purchaseBtn = content.querySelector('.purchaseButton')
        purchaseBtn.hidden = false
        purchaseBtn.firstElementChild.innerHTML = "Finaliser ma commande"
        purchaseBtn.href = "#commander?etape=3"
        content.querySelector('.editPassword').style.display = 'none'
        getUserProfilPage(content)

    } else if (step === 'step3') {
        let allLabelSpan = document.querySelectorAll('.labelSpan')
        purchaseBtn = content.querySelector('.purchaseButton')
        const isNotEmpty = elem => elem > 0
        let labelSpanArray = []
        allLabelSpan.forEach(elt => {
            labelSpanArray.push(elt.innerHTML.length)
        })
        labelSpanArray.every(isNotEmpty) ? createOrders() : showPushNotification('error', "Veuillez remplir tous les champs")
    } else if (step === 'step4') {

        content.innerHTML = shippingHTML
        purchaseBtn = content.querySelector('.purchaseButton')
        purchaseBtn.firstElementChild.innerHTML = "Procéder au paiement"
        purchaseBtn.href = "#commander?etape=5"
        calcShipping(document.getElementById('cartModal').querySelector('.cartPrice').innerHTML)

    } else if (step === 'step5') {

        content.innerHTML = paymentHTML

    }

    if (purchaseBtn) {

        purchaseBtn.addEventListener('click', e => {

            e.preventDefault()

            if (localStorage.getItem('userLocal')) {

                e.target.closest('.purchaseButton').hash === '#commander?etape=2' ? purchase('step2') : null
                e.target.closest('.purchaseButton').hash === '#commander?etape=3' ? purchase('step3') : null
                e.target.closest('.purchaseButton').hash === '#commander?etape=5' ? purchase('step5') : null

            } else {

                content.innerHTML = loginLogoutFormHTML
                loginRegister('purchase')

            }

        })
    }
}

function createOrders() {

    let userLocal = JSON.parse(localStorage.getItem('userLocal'))
    let emailUser = userLocal.email
    let tokenUser = userLocal.token

    fetch(`/api?action=orders&token=${tokenUser}&email=${emailUser}`)
        .then(res => {
            return res.json()
        }).then(data => {
        data === 'create document' ? purchase('step4') : showPushNotification('error', "Une erreur est survenue, merci de contacter l'adminitrateur")
    })

}
let nbredan = 0
document.addEventListener('pageReady', () => {
    nbredan = 0
    winWidth()
    window.addEventListener("resize", function () {
        winWidth()
    });
    if(document.getElementsByClassName('cart')) {
        document.querySelector('.cart').addEventListener( 'click', e =>{
            console.log(e.target)
            calcThermo()
        })
    }
    if (document.getElementById('mapid')) {
        let mymap = L.map('mapid').setView([44.4302027, 0.6568098], 12);
        L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
            maxZoom: 20,
            id: 'mapbox/streets-v11',
            tileSize: 512,
            zoomOffset: -1,
            accessToken: 'pk.eyJ1IjoiYXpoYXEiLCJhIjoiY2tlMnRlZXZyMGNuZzJ6bzQyOGg3ZGQzNCJ9.N8RwmZZt6NKIMFoDtrqBgQ'
        }).addTo(mymap);
        let marker = L.marker([44.4302027, 0.6568098]).addTo(mymap);
        marker.bindPopup("<b>Clotures Fran&ccedil;aises</b><br>Lieu dit Mau </b><br> 47 300 Le Lédat ").openPopup();
    }
    if (document.getElementById('configclo')) {
        classic()
        document.getElementById("btnadd").addEventListener('click', () => {
            addingCart()
        })
        document.addEventListener('input', () => {
            classic()
        })
        document.getElementById('redan').addEventListener('click', () => {
            redanClick()

            document.addEventListener('input', () => {
                calcRedan()
                dacClick()
            })
        })
    }
})
document.addEventListener('pageChange', () => {
    nbredan = 0
    winWidth()
    window.addEventListener("resize", function () {
        winWidth()
    });
    if (document.getElementById('mapid')) {
        let mymap = L.map('mapid').setView([44.4302027, 0.6568098], 12);
        L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
            maxZoom: 20,
            id: 'mapbox/streets-v11',
            tileSize: 512,
            zoomOffset: -1,
            accessToken: 'pk.eyJ1IjoiYXpoYXEiLCJhIjoiY2tlMnRlZXZyMGNuZzJ6bzQyOGg3ZGQzNCJ9.N8RwmZZt6NKIMFoDtrqBgQ'
        }).addTo(mymap);
        let marker = L.marker([44.4302027, 0.6568098]).addTo(mymap);
        marker.bindPopup("<b>Clotures Fran&ccedil;aises</b><br>Lieu dit Mau </b><br> 47 300 Le Lédat ").openPopup();
    }
    if (document.getElementById('configclo')) {
        classic()
        document.getElementById("btnadd").addEventListener('click', () => {
            addingCart()
        })
        document.addEventListener('input', () => {
            classic()
        })
        document.getElementById('redan').addEventListener('click', () => {
            redanClick()
            document.addEventListener('input', () => {
                calcRedan()
                dacClick()
            })
        })
    }
})

let resArray, redanArray, price

function calcConfig(tempLength, height) {
    let refStake, refBlade, refCover, refPlate, refSpacer, refStringer, nbStake, nbPlate, nbSpacer, nbCover,
        nbTotalBlade, stringer, hlame, bladePerSection,
        nbSection, heightSealing
    let refArray = new Map()
    for (let item of document.getElementById('configclo').querySelectorAll('[data-ref]')) {
        productsData.forEach(prod => {
            if (prod.ref === item.dataset.ref)
                refArray.set(prod.ref, JSON.parse(`{ "price": "${prod.price}" ${prod.hauteur !== undefined ? ',"hauteur":' + prod.hauteur : ''}}`))
        })
    }

    let fenceLength = tempLength.replace(',', '.')

    if (document.getElementById('scelle').checked) {
        document.querySelector(".scellement").style.display = "block"
        if (document.getElementById('scelleMur').checked || document.getElementById('scelleTerre').checked) {
            heightSealing = document.getElementById('scelleMur').checked ? +document.getElementById('scelleMur').dataset.height : +document.getElementById('scelleTerre').dataset.height
        }
    } else {
        document.querySelector(".scellement").style.display = "none"
        heightSealing = 0
    }
    //ref

    refStake = document.querySelector(`[value='${(height + heightSealing).toFixed(2)}']`).dataset.ref
    refBlade = document.getElementById('lame').dataset.ref
    refCover = document.getElementById('embout').dataset.ref
    refPlate = document.getElementById("platine").dataset.ref
    refStringer = document.getElementById("raid").dataset.ref
    refSpacer = document.getElementById('entretoise') !== null ? document.getElementById('entretoise').dataset.ref : null
    stringer = false

    //calcul
    hlame = +refArray.get(refBlade).hauteur
    bladePerSection = Math.round(height / hlame)
    nbSection = Math.ceil(fenceLength / 1.80)
    nbStake = nbCover = nbSection
    nbTotalBlade = parseInt(bladePerSection * nbSection)
    nbSpacer = Math.ceil(nbTotalBlade / 8)


    if (document.getElementById('platine').checked) {
        if (height > 1.25 && height <= 1.80) {
            stringer = nbStake
        }
        nbPlate = nbStake
    } else {
        nbPlate = 0
    }

    //quantityArray
    let quantityArray = {}
    quantityArray[refStake] = nbStake
    quantityArray[refCover] = nbCover
    quantityArray[refBlade] = nbTotalBlade
    refSpacer !== null ? quantityArray[refSpacer] = nbSpacer : null
    stringer >= 1 ? quantityArray[refStringer] = stringer : null
    nbPlate >= 1 ? quantityArray[refPlate] = nbPlate : null

    return quantityArray
}

function classic() {
    resArray = calcConfig(document.getElementById('longueur').value, +document.getElementById('hauteur').options[document.getElementById('hauteur').selectedIndex].value)
    for (let [key] of Object.entries(resArray)) {
        let poteau = new RegExp("CFPO")
        if (poteau.test(key) || key === 'CFPLA' || key === 'CFR' || key === 'CFB') resArray[key] += 1
    }
    calcDOM(resArray)
}

function dacClick() {
    if (!document.getElementById('redan').checked) {
        document.getElementById("dimension").style.display = "block"
        document.getElementById('divparent').style.display = "none"
        document.getElementById('labelredan').style.display = "none"
        document.getElementById('addredan') ? document.getElementById('addredan').style.display = "none" : null
        classic()
    }
}

function calcDOM(totalArray) {

    let totalPrice = 0
    price = 0
    for (let [key, value] of Object.entries(totalArray)) {
        productsData.forEach(prod => {
            if (prod.ref === key) totalPrice += +prod.price * value
        })
    }
    if (document.querySelector('input[name="couleur"]:checked').dataset.std !== "std") {
        totalPrice <= 1500 ? totalPrice += 150 : totalPrice
    }
    document.getElementById('price').innerHTML = totalPrice.toFixed(2)
    price = totalPrice
}

function redanClick() {
    document.getElementById("divparent").style.display = "block"
    document.getElementById('labelredan').style.display = "block"
    if (document.getElementById('addredan')) document.getElementById('addredan').style.display = "inline-block"
    document.getElementById("dimension").style.display = "none"
    if (document.getElementById('divparent').childElementCount === 0) {

        addRedan()

        document.getElementById('divparent').insertAdjacentHTML('afterend', '<div class="btn-moreinfo mt-2" id="addredan">' +
            '<svg class="feather "><use xlink:href="assets/images/feather-sprite.svg#plus"/></svg><span class="ml-2 mr-2">Ajouter une section</span></div>')

        document.getElementById('addredan').style.display = "inline-block"

        document.getElementById('addredan').addEventListener('click', () => {
            addRedan()
        })
        document.getElementById("addredan").click()
    }

}

function addRedan() {
    nbredan++
    let divparent = document.getElementById('divparent')
    //creation div dimredan
    let divredan = document.createElement('div')
    divredan.classList.add("form-group", "form-inline", "col-5", "m-auto", "text-left")
    divredan.id = 'dimredan' + `${nbredan}`
    divparent.insertAdjacentElement('beforeend', divredan)

    //creation champ longueur
    divredan.insertAdjacentHTML("beforeend", '<label class="form-label " for=' + `longueur${nbredan}` + '>longueur section ' + `${nbredan}` + ' </label>' +
        '<input class="form-input col-12 form-inline longueur" type="text" id=' + `longueur${nbredan}` + ' placeholder="Longueur de la cloture" value="1" min="1">' +
        '<label class="form-label" for=' + `hauteur${nbredan}` + '>hauteur section ' + `${nbredan}` + ' </label>')

    //creation du select
    let div = document.createElement('div')
    div.innerHTML = document.getElementById('hauteur').outerHTML
    div.querySelector("#hauteur").id = 'hauteur' + `${nbredan}`
    div.querySelector(`#hauteur${nbredan}`).classList.add('hauteur')
    divredan.insertAdjacentHTML("beforeend", div.innerHTML)

//ajout boutton suppr
    if (nbredan > 2) {
        divredan.insertAdjacentHTML('beforeend', '<div class="btn-moreinfo btnsup float-right mb-2" id="suppRedan' + `${nbredan}` + '">' +
            '<span class="ml-2 mr-2">Supprimer</span><svg class="feather "><use xlink:href="assets/images/feather-sprite.svg#x"/></svg></div>')

        document.getElementById('suppRedan' + `${nbredan}`).addEventListener('click', e => {
            e.target.closest('.form-group').remove()

            nbredan--
            for (let i = 0, btns = document.querySelectorAll('.btnsup').length - 1; i <= btns; i++) {
                i !== btns ? document.querySelectorAll('.btnsup')[i].style.display = "none" : document.querySelectorAll('.btnsup')[i].style.display = "inline-block"
            }
            calcRedan()
        })
        for (let i = 0, btns = document.querySelectorAll('.btnsup').length - 1; i <= btns; i++) {
            i !== btns ? document.querySelectorAll('.btnsup')[i].style.display = "none" : document.querySelectorAll('.btnsup')[i].style.display = "inline-block"
        }
    }
    calcRedan()
    document.getElementById('divparent').addEventListener('input', () => {
        calcRedan()
    })
}

function calcRedan() {
    let nbRedan = document.getElementById('divparent').childElementCount
    redanArray = {}
    let count = nbRedan
    while (count > 0) {
        let divRedan = document.getElementById(`dimredan${count}`)
        resArray = calcConfig(divRedan.querySelector('.longueur').value, +divRedan.querySelector('.hauteur').value)

        //gestion du nombre de poteau
        if (nbRedan !== count && count !== 1) {
            for (let [key] of Object.entries(resArray)) {
                let poteau = new RegExp("CFPO")
                if (poteau.test(key)) {
                    resArray[key] -= 1
                    resArray[key] === 0 ? delete resArray[key] : null
                }
            }
        }
        //remplissage du tableau final
        if (!Object.keys(redanArray).length) {
            redanArray = resArray
        } else {
            for (let [key, value] of Object.entries(resArray)) {
                redanArray.hasOwnProperty(key) ? redanArray[key] += value : redanArray[key] = value
            }
        }
        count--
    }
    let entre = new RegExp("CFE")
    let lame = new RegExp("CFLA")
    let ttblade
    for (let [key] of Object.entries(redanArray)) {
        if (lame.test(key)) ttblade = redanArray[key]
        if (entre.test(key)) redanArray[key] = Math.ceil(ttblade / 8)
    }

    redanArray["CFPO250"] = +document.getElementById('divparent').childElementCount - 1
    for (let [key] of Object.entries(redanArray)) if (key === 'CFPLA' || key === 'CFR' || key === 'CFB') redanArray[key] += 1

    calcDOM(redanArray)
}

async function addingCart() {
    let optionsList = []
    let optionsName = []
    document.getElementById('couleur').querySelectorAll('input').forEach(opt => {
        if ((opt.selected === true || opt.checked === true) && opt.value !== '') {
            optionsList.push(opt.value)
            optionsName.push(opt.dataset.name)
        }
    })
    if (document.getElementById('redan').checked) {
        for (let [key, value] of Object.entries(redanArray)) {
            await addCart(key, value, optionsList[0] + ', ' + optionsName[0])
        }
    } else {
        for (let [key, value] of Object.entries(resArray)) {
            key !== "CFR" ? await addCart(key, value, optionsList[0] + ', ' + optionsName[0]) : await addCart(key, value)
        }
    }
    if (document.querySelector('input[name="couleur"]:checked').dataset.std !== "std") {
        await addCart("CFCNS", 1, optionsList[0] + ', ' + optionsName[0])
    } else
        await addCart("CFCS", 1, optionsList[0] + ', ' + optionsName[0])
    calcThermo()

}

function winWidth() {
    if (window.innerWidth > 1000) {
        document.querySelector('.mymenu').classList.add("col-8")
        document.querySelector('.mobile-menu').classList.remove("popover", "popover-bottom")
        document.querySelector('.mobile-menu').hidden = true
        document.querySelector('.menu-content').classList.remove("popover-container")
        document.querySelector('.menu-content').firstElementChild.classList.remove("card")
    } else {
        document.querySelector('.mymenu').classList.remove("col-8")
        document.querySelector('.mobile-menu').classList.add("popover", "popover-bottom")
        document.querySelector('.mobile-menu').hidden = false
        document.querySelector('.menu-content').classList.add("popover-container")
        document.querySelector('.menu-content').firstElementChild.classList.add("card")
    }
}

function calcThermo() {
    let mycolor = {}
    JSON.parse(cartLocal).forEach(prod => {
        if (prod.ref !== "CFCNS" || prod.ref !== "CFR") {
            !Object.keys(mycolor).length ? mycolor[prod.options] = prod.qty * prod.price :
                mycolor.hasOwnProperty(prod.options) ? mycolor[prod.options] += prod.qty * prod.price : mycolor[prod.options] = prod.qty * prod.price
        }
    })
    Object.entries(mycolor).forEach(ralcolor => {
            let cart = JSON.parse(cartLocal)
            cart.forEach(prodincart => {
                for (let [key, value] of Object.entries(prodincart)) {
                    value === "CFCNS" ?  ralcolor[1] >= 1500 ? prodincart.price = '0' : prodincart.price = '150' : null
                    console.log(mycolor)

                }
            })
            localStorage.setItem('cartLocal', JSON.stringify(cart))
    })
    refreshCart()
}