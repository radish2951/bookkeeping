async function getAccounts(...type) {

    let querySnapshot

    if (type.length == 0) {
        querySnapshot = await db.collection("accounts").orderBy("type", "asc").get()
    } else if (type.length == 1) {
        querySnapshot = await db.collection("accounts").where("type", "==", type[0]).get()
    } else {
        throw new Error()
    }

    return querySnapshot.docs.map(doc => doc.data())

}

async function setAccounts() {

    const accounts = await getAccounts()

    const datalist = document.getElementById("accounts")

    accounts.forEach(account => {
        const option = document.createElement("option")
        option.value = account.title
        option.innerText = account.title
        datalist.appendChild(option)
    })
}

window.addEventListener("load", e => {
    setAccounts()
})
