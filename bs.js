// Update BS everytime a transaction is created
async function updateBS(data) {

    const bsRef = db.collection("bs").doc("bs")
    const bsSnapshot = await bsRef.get()
    const bs = bsSnapshot.data()

    data.entries.forEach(e => {
        const account = e.account
        const amount = e.amount
        bs[account] = bs[account] ? bs[account] + amount : amount
    })

    bs.at = new Date() 

    bsRef.update(bs).then(resolved => {
        alert("BS succesfully updated!")
    })
}

async function updateLastUpdated() {
    const generalRef = db.collection("general").doc("general")
    generalRef.update({
        last_updated: new Date()
    })
}

