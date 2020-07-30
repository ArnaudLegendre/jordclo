let dbReady = new CustomEvent( 'dbReady', { bubbles: true } )
let pageReady = new CustomEvent( 'pageReady', { bubbles: true } )
let pageChange = new CustomEvent( 'pageChange', { bubbles: true } )
let initWebsite = new CustomEvent( 'initWebsite', { bubbles: true } )

let routeList = [ ]
let route
let currentPage
let routes = { }

;( ( ) => { fetch( '/api/get?name=pages' )

    .then( res => { return res.json( ) } )

    .then( data => {

        let folder = 'assets/views/pages/'

        data.forEach( e => {
            let newPage = {
                'slug': e.slug,
                'fileName': folder + e.fileName + '.html',
                'title': e.title,
                'access': e.access,
            }
            routeList.push( newPage )
        })

        Object.assign( routes, routeList )

        loadProducts( )

    } )

} )( );

function loadProducts( ) { fetch( '/api/get?name=products' )

    .then( res => { return res.json( ) } )

    .then( data => {

        let folder = 'assets/views/templates/'

        data.forEach( e => {
            let newPage = {
                'slug': e.slug,
                'fileName': folder + 'product.html',
                'title': e.name,
                'access': e.access,
            }
            routeList.push( newPage )
        })

        Object.assign( routes, routeList )

        document.dispatchEvent( dbReady )

        localStorage.setItem( 'products', JSON.stringify( data ) )

    } )

};

class Router {

    constructor( routes ) {

        this.routes = routes
        this.cache = { }

        window.addEventListener( 'hashchange', this.loadPage.bind( this, 'hashchange' ) )
        document.addEventListener( 'dbReady', this.loadPage.bind( this, 'dbReady' ) )
    }

    async loadPage( e, event ){

        route = location.hash || '#'
        currentPage = await Object.values( this.routes ).find( elt => route === `#${ elt.slug }` )

        if( currentPage === undefined ){

            route = '#404'
            currentPage = Object.values( this.routes ).find( elt => `#${ elt.slug }` === '#404' )
            showPage.bind( this )( )

        } else {

            if( currentPage.access === '1' ){

                let userLocal = localStorage.getItem('userLocal' )

                if( userLocal != null ) {

                    userLocal = JSON.parse(userLocal)
                    let userToken = userLocal.token;

                    ( ( ) => { fetch(`/api/token?token=${userToken}&action=verify` )
                        .then( res => { return res.json( ) } )
                        .then( data => {
                            if ( data != true ) {
                                route = '#401'
                                currentPage = Object.values( this.routes ).find(elt => `#${elt.slug}` === '#401' )
                                showPage.bind( this )( )
                                localStorage.removeItem( 'userLocal' )
                            } else {
                                showPage.bind( this )( )
                            }
                        } )
                    } )( )

                } else {
                    route = '#401'
                    currentPage = Object.values( this.routes ).find(elt => `#${elt.slug}` === '#401' )
                    showPage.bind( this )( )
                }
            } else {
                showPage.bind( this )( )
            }


        }

        async function showPage(  ) {


            if( !this.cache.hasOwnProperty( route ) ) {

                let res = await fetch( currentPage.fileName )
                this.cache[route] = await res.text()

            }

            let newRoute = route.replace( '#', '/' )

            history.replaceState( this.cache[route], null, newRoute )

            document.getElementById( 'content' ).innerHTML = this.cache[route]

            document.querySelector('title').innerHTML = currentPage.title

            if( event.type === 'dbReady' )
                document.dispatchEvent( pageReady )

        }
    }
}

let pagesRoutes = new Router( routes )

let currentPageAccess
window.onpopstate = e => {

    document.getElementById( 'content' ).innerHTML = pagesRoutes.cache[ document.location.pathname.replace( '/', '#' ) ]
    setTimeout(( ) => { document.dispatchEvent( pageChange ) }, 200)

}
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
let productList

function buildProduct() {


    let target = location.pathname.split('/').pop()
    productList = JSON.parse(localStorage.getItem('products'))


    productList.forEach(elt => {

        if (elt.slug === target) {
            document.querySelector('h1').innerHTML = elt.name
            document.getElementById('ref').innerHTML = elt.ref

            let prodImg
            elt.images[0] ? prodImg = elt.images[0] : prodImg = 'assets/images/aucune-image.png'
            document.getElementById('productImg').src = prodImg

            // Calc price & write technical
            let totalVarPrice = 0
            let tableTech = document.getElementById('productTech').querySelector('tbody')
            elt.tech !== undefined ? tableTech.innerHTML = tableTech.innerHTML.concat(`<tr><td>${elt.tech}</td></tr>`) : null

            if (elt.variables) {
                for (const [key, value] of Object.entries(elt.variables)) {
                    let varPrice
                    productList.forEach(prod => {
                        if (prod.ref === key) {
                            varPrice = prod.price * value
                            totalVarPrice = totalVarPrice + varPrice

                            let rowHTML = `<tr><td>${prod.name} | ${prod.tech}</td></tr>`
                            tableTech.innerHTML = tableTech.innerHTML.concat(rowHTML)
                        }
                    })
                }
            }
            let totalProdPrice = (parseFloat(elt.price) + totalVarPrice).toFixed(2)
            document.getElementById('price').innerHTML = productPrice = totalProdPrice

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
                            productList.forEach(prod => {
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

    document.getElementById('price').innerHTML = totalPrice.toFixed(2)

}

function productsPage(cat = 'all', count = -1) {

    let productsPage = document.getElementById('productsPage')
    if (productsPage) {

        let productsList = JSON.parse(localStorage.getItem('products'))

        let counter = 1

        productsList.forEach(prod => {

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

        let productsList = JSON.parse(localStorage.getItem('products'))

        let counter = 1
        let count = parseInt(catNode.dataset.count)
        let cat = catNode.dataset.cat

        productsList.forEach(prod => {

            let thisProd

            cat !== 'all' && prod.category === cat && parseFloat(prod.access) === 0 ? thisProd = prod : cat === 'all' ? thisProd = prod : null

            if (thisProd && (counter <= count || count === -1)) {
                counter++
                let prodCardHTML = document.createElement('span')
                prodCardHTML.innerHTML = productCardHTML
                prodCardHTML.querySelector('.productCard').href = `#${thisProd.slug}`
                prodCardHTML.querySelector('.productCard').dataset.filters = `[${JSON.stringify(thisProd.filters)}]`
                prodCardHTML.querySelector('.productName').innerHTML = thisProd.name

                let prodImg
                thisProd.images[0] ? prodImg = thisProd.images[0] : prodImg = '/assets/images/aucune-image.png'
                prodCardHTML.querySelector('.productImg').src = prodImg

                let totalVarPrice = 0
                if (thisProd.variables) {
                    for (const [key, value] of Object.entries(thisProd.variables)) {
                        let varPrice
                        productsList.forEach(p => {
                            if (p.ref === key) {
                                varPrice = p.price * value
                                totalVarPrice = totalVarPrice + varPrice
                            }
                        })
                    }

                }
                let totalProdPrice = (parseFloat(thisProd.price) + totalVarPrice).toFixed(2)
                prodCardHTML.querySelector('.productPrice').innerHTML = `${totalProdPrice}€ TTC`
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
let userMenuHTML,
    loginLogoutFormHTML,
    cartHTML,
    cartRowHTML,
    userProfilHTML,
    productsOptionsHTML,
    productCardHTML,
    shippingHTML,
    paymentHTML

fetch( 'assets/views/parts/navbar.html', { mode: 'no-cors' } )
    .then( response => response.text( ) )
    .then( data => document.getElementById( 'navbar' ).innerHTML = data )
    .catch( error => console.error( error ) )

fetch( 'assets/views/parts/footer.html', { mode: 'no-cors' } )
    .then( response => response.text( ) )
    .then( data => document.getElementById( 'footer' ).innerHTML = data )
    .catch( error => console.error( error ) )

fetch( 'assets/views/parts/pushNotification.html', { mode: 'no-cors' } )
    .then( response => response.text( ) )
    .then( data => document.getElementById( 'pushNotification' ).innerHTML = data )
    .catch( error => console.error( error ) )

fetch( 'assets/views/parts/userMenu.html', { mode: 'no-cors' } )
    .then( response => response.text( ) )
    .then( data => userMenuHTML = data )
    .catch( error => console.error( error ) )

fetch( 'assets/views/parts/loginLogoutForm.html', { mode: 'no-cors' } )
    .then( response => response.text( ) )
    .then( data => loginLogoutFormHTML = data )
    .catch( error => console.error( error ) )

fetch( 'assets/views/parts/cart.html', { mode: 'no-cors' } )
    .then( response => response.text( ) )
    .then( data => cartHTML = data )
    .catch( error => console.error( error ) )

fetch( 'assets/views/parts/cartRow.html', { mode: 'no-cors' } )
    .then( response => response.text( ) )
    .then( data => cartRowHTML = data )
    .catch( error => console.error( error ) )

fetch( 'assets/views/parts/userProfil.html', { mode: 'no-cors' } )
    .then( response => response.text( ) )
    .then( data => userProfilHTML = data )
    .catch( error => console.error( error ) )

fetch( 'assets/views/parts/productsOptions.html', { mode: 'no-cors' } )
    .then( response => response.text( ) )
    .then( data => productsOptionsHTML = data )
    .catch( error => console.error( error ) )

fetch( 'assets/views/parts/productCard.html', { mode: 'no-cors' } )
    .then( response => response.text( ) )
    .then( data => productCardHTML = data )
    .catch( error => console.error( error ) )

fetch( 'assets/views/parts/shipping.html', { mode: 'no-cors' } )
    .then( response => response.text( ) )
    .then( data => shippingHTML = data )
    .catch( error => console.error( error ) )

fetch( 'assets/views/parts/payment.html', { mode: 'no-cors' } )
    .then( response => response.text( ) )
    .then( data => paymentHTML = data )
    .catch( error => console.error( error ) )

document.addEventListener( 'initWebsite', function( ) {
    const pushNotif = document.getElementById( 'pushNotification' )
    const notice = pushNotif.firstElementChild
    // const closeBtn = pushNotif.lastElementChild
    //
    // closeBtn.addEventListener( 'click', e => {
    //     notice.classList.toggle( 'show' )
    //     notice.classList.toggle( 'hide' )
    // })

})

function showPushNotification( type, msg ){

    const pushNotif = document.getElementById( 'pushNotification' )
    const notice = pushNotif.firstElementChild

    notice.classList.remove( 'show' )
    notice.classList.add( 'hide' )
    notice.classList.remove( 'info' )
    notice.classList.remove( 'success' )
    notice.classList.remove( 'error' )

    switch ( type ) {
        case 'success':
            notice.classList.add( 'success' )
            break
        case 'error':
            notice.classList.add( 'error' )
            break
        case 'info':
            notice.classList.add( 'info' )
            break
    }

    notice.querySelector( '.msg' ).innerText = ''
    notice.querySelector( '.msg' ).innerText = msg

    notice.classList.toggle( 'hide' )
    notice.classList.toggle( 'show' )

    setTimeout( function( ) {
        if ( notice.classList.contains( 'show' ) ) {
            notice.classList.toggle( 'show' )
            notice.classList.toggle( 'hide' )
        }
    }, 5000 )

}
document.body.addEventListener( 'click', e => {
    e.target.dataset.modaltarget != null ? showModal( e.target.dataset.modaltarget ) : e.target.classList.contains('modal') || e.target.classList.contains('btn') ? hideModal() : null

} )

window.addEventListener( 'hashchange', hideModal )

function showModal( e ){
    document.querySelectorAll( `[data-modal]` ).forEach( elt => elt.classList.remove('active' ) )
    document.querySelector( `[data-modal=${e}]` ).classList.add('active' )
}

function hideModal( ){
    document.querySelectorAll( `[data-modal]` ).forEach( elt => elt.classList.remove('active') )
}
let cartLocal = null

document.addEventListener( 'pageChange', ( ) => {

    document.getElementById( 'addCart' ) ? document.getElementById( 'addCart' ).addEventListener( 'click', e => addCartFromProductPage( e.target ) ) : null
    document.getElementById( 'cartModal' ).firstElementChild.innerHTML = cartHTML
    refreshCart( )

} )

document.addEventListener( 'pageReady', ( ) => {

    document.getElementById( 'addCart' ) ? document.getElementById( 'addCart' ).addEventListener( 'click', e => addCartFromProductPage( e.target ) ) : null
    document.getElementById( 'cartModal' ).firstElementChild.innerHTML = cartHTML
    refreshCart( )

} )

document.body.addEventListener( 'click', e => {

    if( e.target.closest( '.removeCart' ) ) {
        let ref = e.target.closest( '.removeCart' ).parentElement.parentElement.parentElement.querySelector( '.refLabel > .value' ).innerHTML
        let opt = e.target.closest( '.removeCart' ).parentElement.parentElement.parentElement.querySelector( '.refLabel > .optionsList' ) ? e.target.closest( '.removeCart' ).parentElement.parentElement.parentElement.querySelector( '.refLabel > .optionsList' ).innerHTML : ''
        removeCart( ref, opt )
    }


    e.target.closest( '.plusProduct' ) ? plusMinusProduct( e.target.closest( '.plusProduct' ).closest('.qtyLabel' ), 'plus' ) : null

    e.target.closest( '.minusProduct' ) ? plusMinusProduct( e.target.closest( '.minusProduct' ).closest('.qtyLabel' ), 'minus' ) : null

} )

function refreshCart( ) {

    cartLocal = localStorage.getItem( 'cartLocal' ) ? localStorage.getItem( 'cartLocal' ) : null

    const buttonCart = document.getElementById( 'buttonCart' )
    const carts = document.querySelectorAll('.cart' )

    carts.forEach( e => {
        const tbody = e.getElementsByTagName( 'tbody' )[0]
        tbody.innerHTML = ''
        let totalPrice = 0
        buttonCart.classList.add( 'tooltip' )
        buttonCart.classList.remove( 'buttonModal' )
        buttonCart.removeAttribute('data-modaltarget')

        if ( cartLocal != null ) {

            buttonCart.classList.remove( 'tooltip' )
            buttonCart.classList.add( 'buttonModal' )
            buttonCart.dataset.modaltarget = 'cart'

            JSON.parse( cartLocal ).forEach( e => {

                tbody.innerHTML += cartRowHTML

                let optsName = ''
                if ( e.optName != undefined )
                    optsName = ` Options : ${e.optName}`

                tbody.lastElementChild.querySelector( '.refLabel > .value' ).innerHTML = e.ref
                tbody.lastElementChild.querySelector( '.productLabel > .value' ).innerHTML = `${e.name}. ${optsName}`
                tbody.lastElementChild.querySelector( '.priceLabel > .value' ).innerHTML = e.price
                tbody.lastElementChild.querySelector( '.qtyLabel > .value' ).innerHTML = e.qty
                tbody.lastElementChild.querySelector( '.totalLabel > .value' ).innerHTML = (e.price * e.qty).toFixed(2 )

                if ( e.options.length > 0 ) {

                    let optionDiv = document.createElement('div' )
                    optionDiv.innerHTML = e.options
                    optionDiv.classList.add( 'optionsList' )
                    tbody.lastElementChild.querySelector( '.refLabel > .value' ).after( optionDiv )

                }

                totalPrice += e.price * e.qty

            })

            document.querySelector( '.cartPrice' ).innerHTML = totalPrice.toFixed(2 )

            document.getElementById('buttonCart').querySelector('svg' ).setAttribute('data-modaltarget', 'cart')

        } else {

            document.getElementById('buttonCart').querySelector('svg' ).removeAttribute('data-modaltarget')

        }
    });

    localStorage.getItem( 'userLocal' ) ? saveCart(  ) : null
    refreshCounter( )

}

async function addCartFromProductPage( e ) {

    let productElem = e.closest( '.productElem' )
    let productAdd = { }
    let data = [ ]
    let optionsList = [ ]
    let optionsName = [ ]

    productAdd = {
        "ref"           : productElem.querySelector('#ref' ).innerHTML,
        "name"          : productElem.querySelector('#name' ).innerHTML,
        "price"         : parseFloat( productElem.querySelector('#price' ).innerHTML ),
        "qty"           : parseFloat( productElem.querySelector('#qty' ).children[ 'qtyInput' ].value )
    }

    let prodVar = new Promise( resolve => {
        productList.forEach(prod => {
            prod.ref === productElem.querySelector('#ref').innerHTML ? resolve( prod.variables ) : null
        } )
    } )
    Object.getOwnPropertyNames( await prodVar ).length > 0 ? productAdd.var = await prodVar : null

    if ( productElem.querySelector('#options' )  ) {
        productElem.querySelectorAll('input' ).forEach( opt => {
            if( ( opt.selected === true || opt.checked === true ) && opt.value !== '' ) {
                optionsList.push( opt.value )
                optionsName.push( opt.dataset.name )
            }
        } )
        productAdd.options = optionsList
        productAdd.optName = optionsName
    }


    if ( !cartLocal ){

        await data.push( productAdd )
        localStorage.setItem( 'cartLocal', JSON.stringify( data ) )
        refreshCart( )

    } else {

        data = JSON.parse( localStorage.getItem( 'cartLocal' ) )
        let newItem = true

        data.forEach( e => {
            ( productAdd.ref === e.ref && String( productAdd.options ) === String( e.options ) ) ? ( e.qty += productAdd.qty, newItem = false ) : null;
        } )
        newItem ? ( data.push( productAdd ), localStorage.setItem( 'cartLocal', JSON.stringify( data ) ) ) : localStorage.setItem( 'cartLocal', JSON.stringify( data ) )
        refreshCart( )

    }

}

async function addCart( ref, qty ) {
    let productAdd = { }
    let data = [ ]

    let prod = new Promise( resolve => {
        productList.forEach(prod => {
            prod.ref === ref ? resolve( prod ) : null
        } )
    } )

    let product = await prod

    productAdd = {
        "ref"           : ref,
        "qty"           : qty,
        "name"          : product.name,
        "price"         : product.price,
        "options"       : ''
    }

    if ( !cartLocal ){

        await data.push( productAdd )
        localStorage.setItem( 'cartLocal', JSON.stringify( data ) )
        refreshCart( )

    } else {

        data = JSON.parse( localStorage.getItem( 'cartLocal' ) )
        let newItem = true

        data.forEach( e => {
            ( productAdd.ref === e.ref && String( productAdd.options ) === String( e.options ) ) ? ( e.qty += productAdd.qty, newItem = false ) : null;
        } )
        newItem ? ( data.push( productAdd ), localStorage.setItem( 'cartLocal', JSON.stringify( data ) ) ) : localStorage.setItem( 'cartLocal', JSON.stringify( data ) )
        refreshCart( )

    }

}

function removeCart( ref, opt ){

    let newData = [ ]
    JSON.parse( cartLocal ).forEach( e => ( e.ref === ref && String( e.options ) === opt ) ? null : newData.push( e ) )
    newData.length <= 0 ? ( localStorage.removeItem( 'cartLocal' ), refreshCart( ), hideModal( ) ) : ( localStorage.setItem( 'cartLocal', JSON.stringify( newData ) ), refreshCart( ) )

}

function refreshCounter( ){

    let cartCount = document.getElementById('buttonCart')
    let modalCart = document.getElementById( 'cartModal' )

    cartCount ? cartCount.dataset['badge'] = modalCart.querySelectorAll('.productLabel').length : null

}

function plusMinusProduct( e, type ) {

    let refLabel = e.parentElement.querySelector('.refLabel' ).firstElementChild.innerHTML
    let refOptions = e.parentElement.querySelector('.optionsList' ) ? e.parentElement.querySelector('.optionsList' ).innerHTML : ''
    let value = type === 'plus' ? parseInt( e.querySelector('.value' ).innerHTML ) + 1 : parseInt( e.querySelector('.value' ).innerHTML ) - 1

    value === 0 ? value = 1 : null

    e.querySelector('.value' ).innerHTML = value

    cartLocal = JSON.parse( localStorage.getItem( 'cartLocal' ) )
    cartLocal.forEach( e => e.ref === refLabel && String( e.options ) === refOptions ? e.qty = value : null )
    localStorage.setItem( 'cartLocal', JSON.stringify( cartLocal ) )
    refreshCart( )

}

function saveCart( ){

    let cartLocal = localStorage.getItem('cartLocal' ) ? localStorage.getItem('cartLocal' ) : 'null'
    let userLocal = JSON.parse( localStorage.getItem('userLocal' ) )

    fetch( `/api/cart?token=${userLocal.token}&email=${userLocal.email}&action=saveCart`, {
        method: "POST",
        headers: {
            "Content-type": "application/json"
        },
        body: cartLocal,
    } )

}

function getCart( ){

    let cartLocal = localStorage.getItem('cartLocal' ) ? localStorage.getItem('cartLocal' ) : '{}'
    let userLocal = JSON.parse( localStorage.getItem('userLocal' ) )

    fetch( `/api/cart?token=${userLocal.token}&email=${userLocal.email}&action=getCart`, {
        method: "POST",
        headers: {
            "Content-type": "application/json"
        },
        body: cartLocal,
    } )
        .then( res => {
            return res.json( )
        }).then( data => {
        if ( data === false ){
            showPushNotification( 'error', "Session expirée" )
        } else if( data !== 'null' ) {
            localStorage.setItem( 'cartLocal', JSON.stringify( data ) )
        }
    }).then( ( ) => refreshCart( ) )

}
document.addEventListener( 'initWebsite', function( ) {

    let userLocal = localStorage.getItem( 'userLocal' )

    if ( userLocal ) {

        userIsLog( )

    } else {

        document.getElementById( 'loginRegister' ).firstElementChild.innerHTML = loginLogoutFormHTML

        loginRegister( 'modal' )

        localStorage.getItem('cartLocal' ) ? refreshCart( ) : null

    }

    document.querySelectorAll('.accountUserPage' ).forEach(elt => {

        elt.innerHTML = userProfilHTML

        getUserProfilPage( document.getElementById('accountUserPage' ) )

    } )

} )

document.addEventListener( 'pageChange', ( ) => {

    document.querySelectorAll('.accountUserPage' ).forEach(elt => {

        elt.innerHTML = userProfilHTML

        getUserProfilPage( document.getElementById('accountUserPage' ) )

    } )

} )

function getUserProfilPage( content ) {

    writeData( )

    let userLocal = JSON.parse( localStorage.getItem('userLocal' ) )

    content.addEventListener('click', e => {

        if( e.target.classList.contains( 'editProfil' ) ){

            let panel = e.target.closest( '.panel' )
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

        if( e.target.closest('.saveProfil') ){

            let dataSend = {
                'email':                userLocal.email,
                'firstname':            document.getElementById('firstnameField').nextElementSibling.value,
                'lastname':             document.getElementById('lastnameField').nextElementSibling.value,
                'phone':                document.getElementById('phoneField').nextElementSibling.value,
                'address':              document.getElementById('addressField').nextElementSibling.value,
                'postalCode':           document.getElementById('postalcodeField').nextElementSibling.value,
                'town':                 document.getElementById('townField').nextElementSibling.value,
                'shipping_address':     document.getElementById('addressShippingField').nextElementSibling.value,
                'shipping_postalCode':  document.getElementById('postalcodeShippingField').nextElementSibling.value,
                'shipping_town':        document.getElementById('townShippingField').nextElementSibling.value,
            }

            fetch( `/api/updateUser?token=${userLocal.token}`, {
                method: "POST",
                headers: {
                    "Content-type": "application/json"
                },
                body: JSON.stringify( dataSend ),
            } )
                .then( res => {
                    return res.json( )
                }).then( data => {
                if ( data === false ){
                    showPushNotification( 'error', "Session expirée" )
                } else {
                    dataSend.token = userLocal.token
                    localStorage.setItem( 'userLocal', JSON.stringify( dataSend ) )
                    showPushNotification( 'success', "Informations sauvegardées" )
                    writeData()
                    cancelEdit()
                }
            } )
        }

        if ( e.target.classList.contains( 'editPassword' ) ) {

            let newPass         = document.getElementById('newPassword' ).value
            let confirmPass     = document.getElementById('confirmPassword' ).value
            let oldPass         = document.getElementById('oldPassword' ).value
            let email           = document.getElementById('emailField').innerHTML
            let token           = userLocal.token

            const regexPatPwd = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])[a-zA-Z0-9!@#$%^&*()_+\-=]*.{8,25}$/
            const pwdCheck = regexPatPwd.test( newPass )

            pwdCheck ? editPassword( ) : showPushNotification( 'error', "Le mot de passe doit contenir 8 à 25 caractères et au moins 1 majuscule, 1 minuscule et 1 chiffre." )

            function editPassword( ){
                if ( newPass === confirmPass ) {

                    fetch( `/api/updatePwd?email=${email}&password=${encodeURIComponent(oldPass)}&newPassword=${encodeURIComponent(newPass)}&token=${token}` )
                        .then( res => {
                            return res.json( )
                        } )
                        .then( data => {
                            if ( data === 'user not found' ) {
                                showPushNotification( 'error', "Email incorrect" )
                            } else if ( data === 'incorrect password' ) {
                                showPushNotification( 'error', "Mauvais mot de passe" )
                            } else if ( data === 'edited document') {
                                showPushNotification( 'success', "Modification du mot de passe réussi" )
                                document.getElementById('newPassword' ).value = ''
                                document.getElementById('confirmPassword' ).value = ''
                                document.getElementById('oldPassword' ).value = ''
                                cancelEdit( )
                            }
                        } )
                } else {
                    showPushNotification( 'error', "Le nouveau mot de passe n'est pas identique à la confirmation" )
                }
            }


        }

        if ( e.target.classList.contains( 'cancelSave' ) )
            cancelEdit( )

    } )

}

function cancelEdit( ) {
    let inputs = document.querySelectorAll('input' )
    let labelsSpan = document.querySelectorAll('.labelSpan' )
    let button = document.querySelectorAll('.buttonSection' )
    inputs.forEach(elt => {
        elt.hidden = true
    } )
    labelsSpan.forEach(elt => {
        elt.hidden = false
    } )
    button.forEach(elt => {
        elt.hidden = true
    } )
}

function writeData( ) {

    let userLocal = localStorage.getItem( 'userLocal' )
    userLocal = JSON.parse( userLocal )

    document.getElementById('emailField' ).innerHTML                 = userLocal.email
    document.getElementById('firstnameField' ).innerHTML             = document.getElementById('firstnameField' ).nextElementSibling.value            = userLocal.firstname
    document.getElementById('lastnameField' ).innerHTML              = document.getElementById('lastnameField' ).nextElementSibling.value             = userLocal.lastname
    document.getElementById('phoneField' ).innerHTML                 = document.getElementById('phoneField' ).nextElementSibling.value                = userLocal.phone
    document.getElementById('addressField' ).innerHTML               = document.getElementById('addressField' ).nextElementSibling.value              = userLocal.address
    document.getElementById('postalcodeField' ).innerHTML            = document.getElementById('postalcodeField' ).nextElementSibling.value           = userLocal.postalCode
    document.getElementById('townField' ).innerHTML                  = document.getElementById('townField' ).nextElementSibling.value                 = userLocal.town
    document.getElementById('addressShippingField' ).innerHTML       = document.getElementById('addressShippingField' ).nextElementSibling.value      = userLocal.shipping_address
    document.getElementById('postalcodeShippingField' ).innerHTML    = document.getElementById('postalcodeShippingField' ).nextElementSibling.value   = userLocal.shipping_postalCode
    document.getElementById('townShippingField' ).innerHTML          = document.getElementById('townShippingField' ).nextElementSibling.value         = userLocal.shipping_town

}

function userIsLog( ) {

    localStorage.getItem('cartLocal' ) ? refreshCart( ) : getCart( )
    document.getElementById( 'loginRegister' ).firstElementChild.innerHTML = userMenuHTML
    document.getElementById( 'logoutMenu' ).addEventListener( 'click', e => {
        e.preventDefault( )
        localStorage.removeItem( 'userLocal' )
        userIsNotLog( )
        showPushNotification( 'success', "Déconnection réussi !" )
        document.dispatchEvent( dbReady )
    })

}

function userIsNotLog( ) {

    document.getElementById( 'loginRegister' ).firstElementChild.innerHTML = loginLogoutFormHTML
    localStorage.removeItem('cartLocal' )
    refreshCart( )


}

function loginRegister( location ){

    let loginForms = document.querySelectorAll( '.loginRegisterForm' )

    loginForms.forEach( e => {
        let switchForm = e.querySelector( '.switchForm' )
        let buttonSubmit = e.querySelector( '.buttonSend' )
        let disclaimer = e.querySelector( '.disclaimer' )

        switchForm.addEventListener( 'click',  elt => {

            elt.preventDefault( )
            buttonSubmit.classList.contains( 'loginSubmit' ) ? switchToRegister( ) : switchToLogin( )

            function switchToLogin( ) {
                switchForm.innerHTML = "Pas encore enregistré"
                e.querySelector( 'legend' ).innerHTML = "S'identifier"
                e.confirmPassword.hidden = disclaimer.hidden = true
                buttonSubmit.value = "Connexion"
                buttonSubmit.classList.toggle( 'loginSubmit' )
            }

            function switchToRegister( ) {
                switchForm.innerHTML = "J'ai déjà un compte"
                e.querySelector( 'legend' ).innerHTML = "S'enregistrer"
                e.confirmPassword.hidden = disclaimer.hidden = false
                buttonSubmit.value = "Inscription"
                buttonSubmit.classList.toggle( 'loginSubmit' )
            }
        })

        if ( e ){

            e.addEventListener( 'submit', async( elt ) => {

                elt.preventDefault( )
                let param = '?'

                if( elt.target.monprenom.value === '' & elt.target.monadresse.value === 'ceci est mon adresse' ) {
                    let data = new FormData( elt.target )

                    if ( buttonSubmit.classList.contains( 'loginSubmit' ) ) {
                        for ( var [key, value] of data.entries( ) ) {
                            param = param.concat( `${key}=${encodeURIComponent(value)}&` )
                        }
                        param = param.slice( 0, -1 )

                        fetch( `api/login${param}` )
                            .then( res => {
                                return res.json( )
                            })
                            .then( data => {
                                if ( data === 'document not found' ) {
                                    showPushNotification( 'error', "Email incorrect" )
                                } else if ( data === 'password incorrect' ) {
                                    showPushNotification( 'error', "Mauvais mot de passe" )
                                } else if ( typeof data === 'object') {
                                    localStorage.setItem( 'userLocal', JSON.stringify( data ) )
                                    showPushNotification( 'success', "Connexion réussi !" )
                                    location === 'modal' ? hideModal( ) : purchase( 'step2' )
                                    userIsLog( )
                                }
                            })
                    } else {

                        let dataSend = { }

                        for ( var [key, value] of data.entries( ) ) {
                            dataSend[key] = value
                            param = param.concat( `${key}=${encodeURIComponent(value)}&` )
                        }

                        const regexPatPwd = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])[a-zA-Z0-9!@#$%^&*()_+\-=]*.{8,25}$/
                        const pwdCheck = regexPatPwd.test( dataSend.password )
                        pwdCheck ? null : showPushNotification( 'error', "Le mot de passe doit contenir 8 à 25 caractères et au moins 1 majuscule, 1 minuscule et 1 chiffre." )

                        if ( pwdCheck && dataSend.password === dataSend.confirmPassword ){
                            param = param.slice( 0, -1 )

                            fetch( `api/register${param}` )
                                .then( res => {
                                    return res.json( )
                                }).then( data => {
                                if ( data === 'already existing document' ){
                                    showPushNotification( 'error', "Adresse email déjà utilisée" )
                                } else if ( data === 'create document') {
                                    showPushNotification( 'success', "Compte créé, vous pouvez vous connecter" )
                                    hideModal( )
                                }
                            })
                        }
                    }
                }
            })
        }
    })

}
document.addEventListener( 'initWebsite', ( ) => {

    document.getElementById('purchase' ) ? purchase( 'step1' ) : null

} )
document.addEventListener( 'pageChange', ( ) => {

    document.getElementById('purchase' ) ? purchase( 'step1' ) : null

} )

function purchase( step ){

    let purchaseElem = document.getElementById('purchase' )
    let content = purchaseElem.querySelector('.content' )
    let purchaseBtn

    if ( step === 'step1' ) {
        content.innerHTML = cartHTML
        purchaseBtn = content.querySelector('.purchaseButton' )
        purchaseBtn.firstElementChild.innerHTML = "Continuer ma commande"
        purchaseBtn.href = "#commander?etape=2"
        refreshCart( )

    } else if ( step === 'step2' ) {
        content.innerHTML = userProfilHTML
        purchaseBtn = content.querySelector('.purchaseButton' )
        purchaseBtn.hidden = false
        purchaseBtn.firstElementChild.innerHTML = "Finaliser ma commande"
        purchaseBtn.href = "#commander?etape=3"
        content.querySelector('.editPassword' ).style.display = 'none'
        getUserProfilPage( content )

    } else if ( step === 'step3' ) {
        let allLabelSpan = document.querySelectorAll('.labelSpan' )
        purchaseBtn = content.querySelector('.purchaseButton' )
        const isNotEmpty = elem => elem > 0
        let labelSpanArray = [ ]
        allLabelSpan.forEach(elt => {
            labelSpanArray.push( elt.innerHTML.length )
        } )
        labelSpanArray.every( isNotEmpty ) ? createOrders() : showPushNotification( 'error', "Veuillez remplir tous les champs" )
    } else if ( step === 'step4' ){

        content.innerHTML = shippingHTML
        purchaseBtn = content.querySelector('.purchaseButton' )
        purchaseBtn.firstElementChild.innerHTML = "Procéder au paiement"
        purchaseBtn.href = "#commander?etape=5"
        calcShipping( document.getElementById('cartModal').querySelector('.cartPrice').innerHTML )

    } else if ( step === 'step5' ){

        content.innerHTML = paymentHTML

    }

    if( purchaseBtn ) {

        purchaseBtn.addEventListener('click', e => {

            e.preventDefault( )

            if ( localStorage.getItem('userLocal' ) ) {

                e.target.closest( '.purchaseButton' ).hash === '#commander?etape=2' ? purchase( 'step2' ) : null
                e.target.closest( '.purchaseButton' ).hash === '#commander?etape=3' ? purchase( 'step3' ) : null
                e.target.closest( '.purchaseButton' ).hash === '#commander?etape=5' ? purchase( 'step5' ) : null

            }  else {

                content.innerHTML = loginLogoutFormHTML
                loginRegister( 'purchase' )

            }

        } )
    }
}

function createOrders( ) {

    let userLocal = JSON.parse( localStorage.getItem('userLocal' ) )
    let emailUser = userLocal.email
    let tokenUser = userLocal.token

    fetch( `/api/orders?token=${tokenUser}&email=${emailUser}&action=createOrders` )
        .then( res => {
            return res.json( )
        } ).then( data => {
        data === 'create document' ? purchase( 'step4' ) : showPushNotification( 'error', "Une erreur est survenue, merci de contacter l'adminitrateur" )
    } )

}
document.addEventListener('pageReady', () => {

    if (document.getElementById('configclo')) {
        config()
        document.getElementById("btnadd").addEventListener('click', () => {
            addingCart()
        })
        document.addEventListener('input', () => {
            calcConfig(document.getElementById('longueur').value, +document.getElementById('hauteur').options[document.getElementById('hauteur').selectedIndex].value)

        })
        document.getElementById('redan').addEventListener('click', () => {
            redanClick()
        })

    }
})
document.addEventListener('pageChange', () => {

    if (document.getElementById('configclo')) {
        config()
        calcConfig(document.getElementById('longueur').value, +document.getElementById('hauteur').options[document.getElementById('hauteur').selectedIndex].value)

        document.getElementById("btnadd").addEventListener('click', () => {
            addingCart()
        })
        document.addEventListener('input', () => {
            calcConfig(document.getElementById('longueur').value, +document.getElementById('hauteur').options[document.getElementById('hauteur').selectedIndex].value)
        })
        document.getElementById('redan').addEventListener('click', () => {
            redanClick()
            document.getElementById('addredan').addEventListener('click', () => {
                addRedan()
            })
        })

    }
})

let refArray

function config() {
    refArray = new Map()
    for (let item of document.getElementById('configclo').querySelectorAll('[data-ref]')) {
        JSON.parse(localStorage.getItem('products')).forEach(prod => {
            if (prod.ref === item.dataset.ref) {
                refArray.set(prod.ref, JSON.parse(`{ "price": "${prod.price}" ${prod.hauteur !== undefined ? ',"hauteur":' + prod.hauteur : ''}}`))
            }
        })
    }
}

function classic() {

}
let refStake, refBlade, refSpacer, refCover, nbStake, nbPlate, nbCover, nbTotalBlade, nbSpacer, stringer,
    hlame


function calcConfig(tempLength, height) {
    let fenceLength = +tempLength.replace(',', '.')
    let priceStake, pricePlate, priceCover, priceSpacer, priceStringer, priceBlade,bladePerSection,nbSection,totalPrice = 0
    let quantityArray = []

    //ref
    refStake = document.getElementById('hauteur').options[document.getElementById('hauteur').selectedIndex].dataset.ref
    refBlade = document.getElementById('lame').dataset.ref
    refCover = document.getElementById('embout').dataset.ref
    refSpacer = document.getElementById('entretoise') !== null ? document.getElementById('entretoise').dataset.ref : null
    stringer = false

    //price
    priceStake = +refArray.get(refStake).price
    pricePlate = +refArray.get(document.getElementById('platine').dataset.ref).price
    priceSpacer = refSpacer !== null ? +refArray.get(refSpacer).price : 0
    priceCover = +refArray.get(refCover).price
    priceStringer = +refArray.get(document.getElementById('raid').dataset.ref).price
    priceBlade = +refArray.get(refBlade).price

    //calcul
    hlame = +refArray.get(refBlade).hauteur
    bladePerSection = height / hlame
    nbSection = Math.ceil(fenceLength / 1.80)
    nbStake = nbSection + 1
    nbCover = nbStake
    nbTotalBlade = parseInt(bladePerSection * nbSection)
    nbSpacer = Math.ceil(nbTotalBlade / 8)

    //totalprice
    totalPrice = priceStake * nbStake
    totalPrice += priceCover * nbCover
    totalPrice += priceSpacer * nbSpacer
    totalPrice += priceBlade * nbTotalBlade

    //
    if (document.getElementById('platine').checked) {
        nbPlate = nbStake
        totalPrice += pricePlate * nbPlate
    } else {
        nbPlate = 0
    }
    if (height > 1.25 && height <= 1.80) {
        stringer = nbStake
        totalPrice += priceStringer * stringer
    }
    //quantityArray
    quantityArray.push({[refStake]: nbStake}, {[refCover]: nbCover}, {[refBlade]: nbTotalBlade})
    stringer > 1 ? quantityArray.push({"raid": stringer}) : null
    refSpacer !== null ? quantityArray.push({[refSpacer]: nbSpacer}) : null
    nbPlate >1 ? quantityArray.push({"pl01": nbPlate}) : null
    console.log(quantityArray)
    document.getElementById('price').innerHTML = totalPrice.toFixed(2)

}

function redanClick() {
    document.getElementById("dimension").style.display = "none"

    addRedan()

    document.getElementById('divparent').insertAdjacentHTML('afterend', '<div class="btn btn-primary" id="addredan">' +
        '<svg class="feather "><use xlink:href="assets/svg/feather-sprite.svg#plus"/></svg></div>')

    document.getElementById('addredan').addEventListener('click', () => {
        addRedan()
    })

    document.getElementById("addredan").click()
}

let nbredan = 0

function addRedan() {
    nbredan++
    let divparent = document.getElementById('divparent')

    //creation div dimredan
    let divredan = document.createElement('div')
    divredan.classList.add("form-group", "form-inline", "col-5")
    divredan.id = 'dimredan' + `${nbredan}`
    divparent.insertAdjacentElement('beforeend', divredan)

    //creation champ longueur
    divredan.insertAdjacentHTML("beforeend", '<label class="form-label " for=' + `longueur${nbredan}` + '>longueur section ' + `${nbredan}` + ' </label>' +
        '<input class="form-input col-12 form-inline" type="text" id=' + `longueur${nbredan}` + ' placeholder="Longueur de la cloture" value="1" min="1">' +
        '<label class="form-label" for=' + `hauteur${nbredan}` + '>hauteur section ' + `${nbredan}` + ' </label>')

    //creation du select
    let div = document.createElement('div')
    div.innerHTML = document.getElementById('hauteur').outerHTML
    div.querySelector("#hauteur").id = 'hauteur' + `${nbredan}`
    divredan.insertAdjacentHTML("beforeend", div.innerHTML)


}

async function addingCart() {

    await addCart(refStake, nbStake)
    nbPlate > 1 ? await addCart("pl01", nbPlate) : null
    await addCart(refBlade, nbTotalBlade)
    await addCart("emb01", nbCover)
    nbSpacer >= 1 ? await addCart(refSpacer, nbSpacer) : null
    stringer > 1 ? await addCart("raid", stringer) : null

}
