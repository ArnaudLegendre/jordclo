
document.addEventListener( 'click', e => {
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