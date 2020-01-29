function isLastDayOfMonth() {
    const today = new Date()
    const date = today.getDate()
    const tommorow = new Date()
    tommorow.setDate(tommorow.getDate() + 1)
    return today.getMonth() != tommorow.getMonth()
}

function getDepreciateAmount(asset) {
    const acquisitionDate = new Date(asset.acquisition_date.seconds * 1000)
    const serviceLife = asset.service_life
    const cost = asset.cost
    const accumulation = asset.accumulation

    const today = new Date()
    const pastYears = (today - acquisitionDate) / (1000 * 60 * 60 * 24 * 365)

    return Math.min(
            Math.floor(cost * pastYears / serviceLife), // first month
            cost - accumulation,                        // last month
            Math.floor(cost / 12 / serviceLife)         // else
            )
}

function isDepreciable(asset) {
    const lastUpdated = new Date(asset.last_updated.seconds * 1000)
    const today = new Date()
    const lastMonth = new Date()
    lastMonth.setMonth(today.getMonth() - 1)
    const cost = asset.cost
    const accumulation = asset.accumulation

    const updatedLastMonth = lastUpdated.getMonth() == lastMonth.getMonth()
    const registeredThisMonth = lastUpdated.getDay() < today.getDay()
    const notAccumulated = cost > accumulation
    return notAccumulated && (updatedLastMonth || registeredThisMonth)
}

if (isLastDayOfMonth() && confirm("Depreciate?")) {
db.collection("depreciable_assets").orderBy("cost", "desc").get().then(querySnapshot => {
    querySnapshot.forEach(doc => {
        const id = doc.id
        const asset = doc.data()
        const accumulation = asset.accumulation
        const depreciate = getDepreciateAmount(asset)
        const title = asset.title

        if (isDepreciable(asset)) {
            db.collection("depreciable_assets").doc(id).update({
                accumulation: accumulation + depreciate,
                last_updated: new Date() 
            })

            const data = {
                entries: [
                {
                    account: "減価償却費",
                    amount: depreciate
                },
                {
                    account: "減価償却累計額",
                    amount: -depreciate
                }
                ],
                summary: title + " 減価償却",
                timestamp: new Date()
            }

            db.collection("transactions").add(data)
        }
    })
})
}
