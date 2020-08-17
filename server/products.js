import logSys from '../server/msgSystem.js'

export default class Prod{

    calc(db){
        try{
            db.forEach(prod => {
                this.totalVarPrice = 0
                this.prodPrice = 0
                if (prod.priceRules) {
                    prod.priceRules.forEach(rule => {
                        this.prodPrice = this.prodPrice === 0 ? parseFloat(prod.price) : this.prodPrice
                        this.prodPrice = eval(rule.replace(new RegExp(/\$p/g), this.prodPrice))
                    })
                    this.prodPrice = this.prodPrice.toFixed(2)
                }
                if (prod.variables) {
                    for (const [key, value] of Object.entries(prod.variables)) {
                        this.varPrice = 0
                        db.forEach(p => {
                            if (p.ref === key) {
                                this.calcVarPrice = 0
                                if (p.priceRules) {
                                    p.priceRules.forEach(rule => {
                                        this.calcVarPrice = this.calcVarPrice === 0 ? parseFloat(p.price) : this.calcVarPrice
                                        this.calcVarPrice = eval(rule.replace(new RegExp(/\$p/g), this.calcVarPrice))
                                    })
                                    this.calcVarPrice = this.calcVarPrice.toFixed(2)
                                } else {
                                    this.calcVarPrice = p.price
                                }
                                this.varPrice = this.calcVarPrice * value
                                this.totalVarPrice = this.totalVarPrice + this.varPrice
                            }
                        })
                    }
                }
                this.totalProdPrice = (parseFloat(this.prodPrice) + this.totalVarPrice).toFixed(2)
                prod.price = this.totalProdPrice
                delete prod._id
                delete prod.priceRules
            })
            return db
        } catch (e) {
            return e
        }
    }

}