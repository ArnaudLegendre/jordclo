let routeList = [ ]
let route
let currentPage
let routes = { }

;( ( ) => { fetch( '/api?action=get&name=pages' )

    .then( res => { return res.json( ) } )

    .then( data => {

        let folder = 'assets/views/pages/'

        data.forEach( e => {
            let newPage = {
                'slug': e.slug,
                'fileName': folder + e.fileName + '.html',
                'title': e.title,
                'access': e.access,
            }
            routeList.push( newPage )
        })

        Object.assign( routes, routeList )

        loadProducts( )

    } )

} )( );

function loadProducts( ) { fetch( '/api?action=get&name=products' )

    .then( res => { return res.json( ) } )

    .then( data => {

        let folder = 'assets/views/templates/'

        data.forEach( e => {
            let newPage = {
                'slug': e.slug,
                'fileName': folder + 'product.html',
                'title': e.name,
                'access': e.access,
            }
            routeList.push( newPage )
        })

        Object.assign( routes, routeList )

        document.dispatchEvent( dbReady )

        localStorage.setItem( 'products', JSON.stringify( data ) )

    } )

};

class Router {

    constructor( routes ) {

        this.routes = routes
        this.cache = { }

        window.addEventListener( 'hashchange', this.loadPage.bind( this, 'hashchange' ) )
        document.addEventListener( 'dbReady', this.loadPage.bind( this, 'dbReady' ) )
    }

    async loadPage( e, event ){

        route = location.hash || '#'
        currentPage = await Object.values( this.routes ).find( elt => route === `#${ elt.slug }` )

        if( currentPage === undefined ){

            route = '#404'
            currentPage = Object.values( this.routes ).find( elt => `#${ elt.slug }` === '#404' )
            showPage.bind( this )( )

        } else {

            if( currentPage.access === '1' ){

                let userLocal = localStorage.getItem('userLocal' )

                if( userLocal != null ) {

                    userLocal = JSON.parse(userLocal)
                    let userToken = userLocal.token;

                    ( ( ) => { fetch(`/api?action=token&token=${userToken}&state=verify` )
                        .then( res => { return res.json( ) } )
                        .then( data => {
                            if ( data != true ) {
                                route = '#401'
                                currentPage = Object.values( this.routes ).find(elt => `#${elt.slug}` === '#401' )
                                showPage.bind( this )( )
                                localStorage.removeItem( 'userLocal' )
                            } else {
                                showPage.bind( this )( )
                            }
                        } )
                    } )( )

                } else {
                    route = '#401'
                    currentPage = Object.values( this.routes ).find(elt => `#${elt.slug}` === '#401' )
                    showPage.bind( this )( )
                }
            } else {
                showPage.bind( this )( )
            }


        }

        async function showPage(  ) {


            if( !this.cache.hasOwnProperty( route ) ) {

                let res = await fetch( currentPage.fileName )
                this.cache[route] = await res.text()

            }

            let newRoute = route.replace( '#', '/' )

            history.replaceState( this.cache[route], null, newRoute )

            document.getElementById( 'content' ).innerHTML = this.cache[route]

            document.querySelector('title').innerHTML = currentPage.title

            if( event.type === 'dbReady' )
                document.dispatchEvent( pageReady )

        }
    }
}

let pagesRoutes = new Router( routes )

let currentPageAccess
window.onpopstate = e => {

    document.getElementById( 'content' ).innerHTML = pagesRoutes.cache[ document.location.pathname.replace( '/', '#' ) ]
    setTimeout(( ) => { document.dispatchEvent( pageChange ) }, 200)

}