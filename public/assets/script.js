document.addEventListener('pageReady', () => {

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
                domRedan()
            })

        })
    }
})
document.addEventListener('pageChange', () => {

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
                domRedan()
            })
            document.getElementById('addredan').addEventListener('click', () => {
                addRedan()
            })
        })
    }
})

// let refStake, refBlade, refSpacer, refCover, refPlate, refStringer, nbStake, nbPlate, nbCover, nbTotalBlade, nbSpacer,
//     priceStake, pricePlate, priceCover, priceSpacer, priceStringer, priceBlade,
//     stringer, hlame
let prodList = JSON.parse(localStorage.getItem('products'))
let resArray, redanArray
let nbredan = 0
function calcConfig(tempLength, height) {
    let refStake, refBlade, refSpacer, refCover, refPlate, refStringer, nbStake, nbPlate, nbCover, nbTotalBlade, nbSpacer,
        priceStake, pricePlate, priceCover, priceSpacer, priceStringer, priceBlade, stringer, hlame, bladePerSection, nbSection, heightSealing, totalPrice = 0
    let refArray = new Map()
    for (let item of document.getElementById('configclo').querySelectorAll('[data-ref]')) {
        prodList.forEach(prod => {
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
    refSpacer = document.getElementById('entretoise') !== null ? document.getElementById('entretoise').dataset.ref : null
    refPlate = document.getElementById("platine").dataset.ref
    refStringer = document.getElementById("raid").dataset.ref
    stringer = false

    //price
    priceStake = +refArray.get(refStake).price
    pricePlate = +refArray.get(refPlate).price
    priceSpacer = refSpacer !== null ? +refArray.get(refSpacer).price : 0
    priceCover = +refArray.get(refCover).price
    priceStringer = +refArray.get(refStringer).price
    priceBlade = +refArray.get(refBlade).price

    //calcul
    hlame = +refArray.get(refBlade).hauteur
    bladePerSection = Math.round(height / hlame)
    nbSection = Math.ceil(fenceLength / 1.80)
    nbStake = nbCover = nbSection
    nbTotalBlade = parseInt(bladePerSection * nbSection)
    nbSpacer = refBlade == "lam01" ? Math.ceil(nbTotalBlade / 8) : Math.ceil(nbTotalBlade / 16)

    //totalprice
    totalPrice = priceStake * nbStake
    totalPrice += priceCover * nbCover
    totalPrice += priceSpacer * nbSpacer
    totalPrice += priceBlade * nbTotalBlade

    if (document.getElementById('platine').checked) {
        if (height > 1.25 && height <= 1.80) {
            stringer = nbStake
            totalPrice += priceStringer * stringer
        }
        nbPlate = nbStake
        totalPrice += pricePlate * nbPlate
    } else {
        nbPlate = 0
    }

    //quantityArray
    let quantityArray = {}
    quantityArray[refStake] = nbStake
    quantityArray[refCover] = nbCover
    quantityArray[refBlade] = nbTotalBlade
    stringer >= 1 ? quantityArray[refStringer] = stringer : null
    refSpacer !== null ? quantityArray[refSpacer] = nbSpacer : null
    nbPlate >= 1 ? quantityArray[refPlate] = nbPlate : null
    quantityArray.prix = +totalPrice.toFixed(2)

    return quantityArray
}



function classic() {
    resArray = calcConfig(document.getElementById('longueur').value, +document.getElementById('hauteur').options[document.getElementById('hauteur').selectedIndex].value)
    for (let [key] of Object.entries(resArray)) {
        let poteau = new RegExp("pot")
        if (poteau.test(key) || key === 'pla' || key === 'raid' || key === 'emb') {
            resArray[key] += 1
            prodList.forEach(prod => {
                if (prod.ref === key) resArray.prix += +prod.price
            })
        }
    }
    document.getElementById('price').innerHTML = resArray.prix.toFixed(2)
}

function redanClick() {
    if (document.getElementById('divparent').childElementCount === 0) {
        document.getElementById("dimension").style.display = "none"

        addRedan()

        document.getElementById('divparent').insertAdjacentHTML('afterend', '<div class="btn btn-primary" id="addredan">' +
            '<svg class="feather "><use xlink:href="assets/svg/feather-sprite.svg#plus"/></svg></div>')

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
    divredan.classList.add("form-group", "form-inline", "col-6")
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

    domRedan()
    document.getElementById('divparent').addEventListener('input', () => {
        calcRedan()
    })

}

function calcRedan() {
    let nbRedan = document.getElementById('divparent').childElementCount
    redanArray = {}
    let count = nbRedan
    while (count > 0) {
        //todo Si (nbRedau !== count || count !== 1), -1 sur la valeur dont la key commence par POT
        let divRedan = document.getElementById(`dimredan${count}`)
        resArray = calcConfig(divRedan.querySelector('.longueur').value, +divRedan.querySelector('.hauteur').value)
        console.log('count' + count)
        console.log('nbRedan' + nbRedan)

        //gestion du nombre de poteau
        if (nbRedan !== count || count !== 1) {
            for (let [key] of Object.entries(resArray)) {
                let poteau = new RegExp("pot")
                if (poteau.test(key)) {
                    resArray[key] -= 1
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
    //todo Add N poteau en 2.50 (N = nbRedan - 1)
    console.log(redanArray)

}

function domRedan() {
    calcRedan()
    //TODO prix -> Math.round()
    document.getElementById('price').innerHTML = redanArray.prix.toFixed(2)
}

async function addingCart() {
    if (document.getElementById('redan').checked) {
        for (let [key, value] of Object.entries(redanArray)) {
            if (key != "prix") await addCart(key, value)
        }
    } else {
        for (let [key, value] of Object.entries(resArray)) {
            if (key != "prix") await addCart(key, value)
        }
    }
}