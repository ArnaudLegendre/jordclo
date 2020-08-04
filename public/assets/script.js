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

let refStake, refBlade, refSpacer, refCover, refPlate, refStringer, nbStake, nbPlate, nbCover, nbTotalBlade, nbSpacer,
    stringer, hlame
let quantityArray = []

function calcConfig(tempLength, height) {

    let refArray = new Map()
    for (let item of document.getElementById('configclo').querySelectorAll('[data-ref]')) {
        JSON.parse(localStorage.getItem('products')).forEach(prod => {
            if (prod.ref === item.dataset.ref)
                refArray.set(prod.ref, JSON.parse(`{ "price": "${prod.price}" ${prod.hauteur !== undefined ? ',"hauteur":' + prod.hauteur : ''}}`))
        })
    }

    let fenceLength = tempLength.replace(',', '.')
    let priceStake, pricePlate, priceCover, priceSpacer, priceStringer, priceBlade, bladePerSection, nbSection,
        totalPrice = 0


    //ref
    refStake = document.querySelector(`[value='${height}']`).dataset.ref
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
    bladePerSection = height / hlame
    nbSection = Math.ceil(fenceLength / 1.80)
    nbStake = nbCover = nbSection + 1
    // document.getElementById('redan').checked ? nbStake = nbCover = nbSection : nbStake = nbCover = nbSection + 1
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
    quantityArray = {}
    quantityArray[refStake] = nbStake
    quantityArray[refCover] = nbCover
    quantityArray[refBlade] = nbTotalBlade
    stringer > 1 ? quantityArray[refStringer] = stringer : null
    refSpacer !== null ? quantityArray[refSpacer] = nbSpacer : null
    nbPlate > 1 ? quantityArray[refPlate] = nbPlate : null
    quantityArray.prix = +totalPrice.toFixed(2)

    return quantityArray
}

function classic() {
    calcConfig(document.getElementById('longueur').value, +document.getElementById('hauteur').options[document.getElementById('hauteur').selectedIndex].value)
    document.getElementById('price').innerHTML = quantityArray.prix
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

let nbredan = 0

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

let redanArray

function calcRedan() {
    let nbRedan = document.getElementById('divparent').childElementCount
    redanArray = {}
    while (nbRedan > 0) {
        let divRedan = document.getElementById(`dimredan${nbRedan}`)
        calcConfig(divRedan.querySelector('.longueur').value, divRedan.querySelector('.hauteur').value)

        if (!Object.keys(redanArray).length) {
            redanArray = quantityArray
        } else {
            for (let [key, value] of Object.entries(quantityArray)) {
                redanArray.hasOwnProperty(key) ? redanArray[key] += value : redanArray[key] = value
            }
            console.log(redanArray)
        }
        nbRedan--
    }
    console.log(redanArray[refStake]=  redanArray[refStake]-1)

}

function domRedan() {
    calcRedan()
    document.getElementById('price').innerHTML = redanArray.prix.toFixed(2)
}

async function addingCart() {
    if (document.getElementById('redan').checked) {
        for (let [key, value] of Object.entries(redanArray)) {
            if(key !="prix"){
                await addCart(key, value)
            }
        }
    } else {
        await addCart(refStake, nbStake)
        nbPlate > 1 ? await addCart(refPlate, nbPlate) : null
        await addCart(refBlade, nbTotalBlade)
        await addCart(refCover, nbCover)
        nbSpacer >= 1 ? await addCart(refSpacer, nbSpacer) : null
        stringer > 1 ? await addCart(refStringer, stringer) : null
    }
}