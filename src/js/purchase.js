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