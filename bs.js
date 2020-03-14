/*
async function getData(days) {

    const past = new Date()
    past.setHours(0, 0, 0, 0)
    past.setDate(past.getDate() - days)

    const querySnapshot = await db.collection("transactions").orderBy("timestamp", "desc").endAt(past).get()
    return querySnapshot.docs.map(doc => doc.data())

}

async function getBS(from, to) {

    let bs = {}

    const accounts = await getAccounts()

    const titles = accounts.map(account => account.title)
    const types = accounts.map(account => account.type)

    return db.collection("transactions").orderBy("timestamp", "desc").startAt(to).endAt(from).get().then(querySnapshot => {
        querySnapshot.forEach(doc => {
            doc.data().entries.forEach(e => {
                const title = e.account
                const type = types[titles.indexOf(title)]
                if (type == "asset" || type == "liability") {
                    bs[title] = bs[title] ? bs[title] + e.amount : e.amount
                }
            })
        })
    }).then(() => {
        Object.entries(bs).forEach(e => {
            const key = e[0]
            const value = e[1]
            if (value == 0) delete bs[key]
        })
    }).then(() => {
        return bs
    })
}
*/

async function update() {

    const generalRef = db.collection("general").doc("general")
    const generalSnapshot = await generalRef.get()
    const lastUpdated = generalSnapshot.data().last_updated.toDate()
    const today = new Date()

    lastUpdated.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)

    // If this is first transaction today, then update BS.
    if (lastUpdated.getTime() != today.getTime()) {

        generalRef.update({
            last_updated: new Date()
        })

        const bsRef = db.collection("bs").doc("bs")
        const bsSnapshot = await bsRef.get()
        const bs = bsSnapshot.data()

        const dataYesterday = await getData(1, 1)

        dataYesterday.forEach(d => {
            d.entries.forEach(e => {

                const account = e.account
                const amount = e.amount

                bs[account] = bs[account] ? bs[account] + amount : amount
            })
        })

        bs.at = today 

        bsRef.update(bs).then(resolved => {
            alert("BS succesfully updated!")
        })
    }
}








