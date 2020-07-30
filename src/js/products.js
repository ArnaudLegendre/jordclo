document.addEventListener('pageReady', () => {
    buildProduct()
    productsPage()
    getProductsByCat()
    enableFilters()
    document.dispatchEvent(initWebsite)
    document.getElementById('qtyInput').addEventListener('input', () => calcProductPrice())
})

window.addEventListener('pageChange', () => {
    buildProduct()
    productsPage()
    getProductsByCat()
    enableFilters()
    document.getElementById('qtyInput').addEventListener('input', () => calcProductPrice())
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
            let prodPrice = 0
            let tableTech = document.getElementById('productTech').querySelector('tbody')
            elt.tech !== undefined ? tableTech.innerHTML = tableTech.innerHTML.concat(`<tr><td>${elt.tech}</td></tr>`) : null

            if (elt.priceRules) {
                elt.priceRules.forEach(rule => {
                    prodPrice = prodPrice === 0 ? parseFloat(elt.price) : prodPrice
                    prodPrice = eval(rule.replace(new RegExp(/\$p/g), prodPrice))
                })
                prodPrice = prodPrice.toFixed(2)
            }

            if (elt.variables) {
                for (const [key, value] of Object.entries(elt.variables)) {
                    let varPrice
                    productList.forEach(prod => {
                        if (prod.ref === key) {
                            let calcVarPrice = 0
                            if (prod.priceRules) {
                                prod.priceRules.forEach(rule => {
                                    calcVarPrice = calcVarPrice === 0 ? parseFloat(prod.price) : calcVarPrice
                                    calcVarPrice = eval(rule.replace(new RegExp(/\$p/g), calcVarPrice))
                                })
                                calcVarPrice = calcVarPrice.toFixed(2)
                            } else {
                                calcVarPrice = prod.price
                            }
                            varPrice = calcVarPrice * value
                            totalVarPrice = totalVarPrice + varPrice
                            let rowHTML = `<tr><td>${prod.name} | ${prod.tech}</td></tr>`
                            tableTech.innerHTML = tableTech.innerHTML.concat(rowHTML)
                        }
                    })
                }
            }
            let totalProdPrice = (parseFloat(prodPrice) + totalVarPrice).toFixed(2)
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

    document.getElementById('price').innerHTML = (totalPrice * document.getElementById('qtyInput').value).toFixed(2)

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
                let prodPrice = 0
                if (thisProd.priceRules) {
                    thisProd.priceRules.forEach(rule => {
                        prodPrice = prodPrice === 0 ? parseFloat(thisProd.price) : prodPrice
                        prodPrice = eval(rule.replace(new RegExp(/\$p/g), prodPrice))
                    })
                    prodPrice = prodPrice.toFixed(2)
                }

                let totalVarPrice = 0
                if (thisProd.variables) {
                    for (const [key, value] of Object.entries(thisProd.variables)) {
                        let varPrice
                        productsList.forEach(p => {
                            let calcVarPrice = 0
                            if (p.ref === key) {
                                if (p.priceRules) {
                                    p.priceRules.forEach(rule => {
                                        calcVarPrice = calcVarPrice === 0 ? parseFloat(p.price) : calcVarPrice
                                        calcVarPrice = eval(rule.replace(new RegExp(/\$p/g), calcVarPrice))
                                    })
                                    calcVarPrice = calcVarPrice.toFixed(2)
                                } else {
                                    calcVarPrice = p.price
                                }
                                varPrice = calcVarPrice * value
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