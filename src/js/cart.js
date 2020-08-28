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