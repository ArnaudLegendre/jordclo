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