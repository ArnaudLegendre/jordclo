document.addEventListener('initWebsite', function () {
    const pushNotif = document.getElementById('pushNotification')
    const notice = pushNotif.firstElementChild
    // const closeBtn = pushNotif.lastElementChild
    //
    // closeBtn.addEventListener( 'click', e => {
    //     notice.classList.toggle( 'show' )
    //     notice.classList.toggle( 'hide' )
    // })

})

function showPushNotification(type, msg) {

    const pushNotif = document.getElementById('pushNotification')
    const notice = pushNotif.firstElementChild

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

    notice.classList.toggle('hide')
    notice.classList.toggle('show')

    setTimeout(function () {
        if (notice.classList.contains('show')) {
            notice.classList.toggle('show')
            notice.classList.toggle('hide')
        }
    }, 5000)

}