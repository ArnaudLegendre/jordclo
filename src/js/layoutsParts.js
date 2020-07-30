let userMenuHTML,
    loginLogoutFormHTML,
    cartHTML,
    cartRowHTML,
    userProfilHTML,
    productsOptionsHTML,
    productCardHTML,
    shippingHTML,
    paymentHTML

fetch('assets/views/parts/navbar.html', {mode: 'no-cors'})
    .then(response => response.text())
    .then(data => document.getElementById('navbar').innerHTML = data)
    .catch(error => console.error(error))

fetch('assets/views/parts/footer.html', {mode: 'no-cors'})
    .then(response => response.text())
    .then(data => document.getElementById('footer').innerHTML = data)
    .catch(error => console.error(error))

fetch('assets/views/parts/pushNotification.html', {mode: 'no-cors'})
    .then(response => response.text())
    .then(data => document.getElementById('pushNotification').innerHTML = data)
    .catch(error => console.error(error))

fetch('assets/views/parts/userMenu.html', {mode: 'no-cors'})
    .then(response => response.text())
    .then(data => userMenuHTML = data)
    .catch(error => console.error(error))

fetch('assets/views/parts/loginLogoutForm.html', {mode: 'no-cors'})
    .then(response => response.text())
    .then(data => loginLogoutFormHTML = data)
    .catch(error => console.error(error))

fetch('assets/views/parts/cart.html', {mode: 'no-cors'})
    .then(response => response.text())
    .then(data => cartHTML = data)
    .catch(error => console.error(error))

fetch('assets/views/parts/cartRow.html', {mode: 'no-cors'})
    .then(response => response.text())
    .then(data => cartRowHTML = data)
    .catch(error => console.error(error))

fetch('assets/views/parts/userProfil.html', {mode: 'no-cors'})
    .then(response => response.text())
    .then(data => userProfilHTML = data)
    .catch(error => console.error(error))

fetch('assets/views/parts/productsOptions.html', {mode: 'no-cors'})
    .then(response => response.text())
    .then(data => productsOptionsHTML = data)
    .catch(error => console.error(error))

fetch('assets/views/parts/productCard.html', {mode: 'no-cors'})
    .then(response => response.text())
    .then(data => productCardHTML = data)
    .catch(error => console.error(error))

fetch('assets/views/parts/shipping.html', {mode: 'no-cors'})
    .then(response => response.text())
    .then(data => shippingHTML = data)
    .catch(error => console.error(error))

fetch('assets/views/parts/payment.html', {mode: 'no-cors'})
    .then(response => response.text())
    .then(data => paymentHTML = data)
    .catch(error => console.error(error))