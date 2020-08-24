let nbredan = 0
document.addEventListener('pageReady', () => {
    console.log(productsData)
    nbredan = 0
    if(document.getElementById('mapid')){
        let mymap = L.map('mapid').setView([44.4302027, 0.6568098], 17);
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
    if(document.getElementById('mapid')){
        let mymap = L.map('mapid').setView([44.4302027, 0.6568098], 17);
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

let resArray, redanArray

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
        document.getElementById('addredan') ? document.getElementById('addredan').style.display = "none": null
        classic()
    }
}

function calcDOM(totalArray) {
    let totalPrice = 0
    for (let [key, value] of Object.entries(totalArray)) {
        productsData.forEach(prod => {
            if (prod.ref === key) totalPrice += +prod.price * value
        })
    }
    document.getElementById('price').innerHTML = totalPrice.toFixed(2)
    console.log(totalArray)
}

function redanClick() {
    document.getElementById("divparent").style.display = "block"
    if (document.getElementById('addredan')) document.getElementById('addredan').style.display = "inline-block"
    document.getElementById("dimension").style.display = "none"
    if (document.getElementById('divparent').childElementCount === 0) {

        addRedan()

        document.getElementById('divparent').insertAdjacentHTML('afterend', '<div class="btn btn-primary mt-2" id="addredan">' +
            '<svg class="feather "><use xlink:href="assets/svg/feather-sprite.svg#plus"/></svg><span class="ml-2 mr-2">Ajouter une section</span></div>')

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
    divredan.classList.add("form-group", "form-inline", "col-5", "column","m-auto")
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
        divredan.insertAdjacentHTML('beforeend', '<div class="btn btn-primary btnsup float-right mb-2" id="suppRedan' + `${nbredan}` + '">' +
            '<span class="ml-2 mr-2">Supprimer</span><svg class="feather "><use xlink:href="assets/svg/feather-sprite.svg#x"/></svg></div>')

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
