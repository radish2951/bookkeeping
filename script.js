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

async function getData(days) {

    const past = new Date()
    past.setHours(0, 0, 0, 0)
    past.setDate(past.getDate() - days)

    const querySnapshot = await db.collection("transactions").orderBy("timestamp", "desc").endAt(past).get()
    return querySnapshot.docs.map(doc => doc.data())

}

function createDataContainer(d) {

    const debitTable = document.createElement("table")
    const creditTable = document.createElement("table")

    d.entries.forEach(j => {

        const tr = document.createElement("tr")
        const tdAccount = document.createElement("td")
        const tdAmount = document.createElement("td")

        tdAccount.innerText = j.account
        tdAmount.innerText = Math.abs(j.amount).toLocaleString()

        tr.appendChild(tdAccount)
        tr.appendChild(tdAmount)

        if (j.amount > 0) {
            debitTable.appendChild(tr)
        } else {
            creditTable.appendChild(tr)
        }
    })

    const date = d.timestamp.toDate()
    const hours = date.getHours().toString().padStart(2, "0")
    const minutes = date.getMinutes().toString().padStart(2, "0")

    const dateDiv = document.createElement("div")
    dateDiv.innerText = `${hours}:${minutes}`

    const summary = d.summary
    const summaryDiv = document.createElement("div")
    summaryDiv.classList.add("summary")
    summaryDiv.innerText = summary

    const container = document.createElement("div")
    container.appendChild(dateDiv)
    container.appendChild(debitTable)
    container.appendChild(creditTable)
    container.appendChild(summaryDiv)



    return container
}

function showData(days) {

    const log = document.getElementById("log")
    let last = new Date()
    last.setDate(last.getDate() - 1)

    getData(days).then(data => {
        data.forEach(d => {

            const date = d.timestamp.toDate()
            const month = date.getMonth() + 1
            const day = date.getDate()
            const weekday = new Intl.DateTimeFormat("ja-JP", {weekday: "short"}).format(date)

            if (date.getDate() != last.getDate()) {
                const dayContainer = document.createElement("div")
                dayContainer.innerText = `${month}月${day}日(${weekday})`
                dayContainer.classList.add("date")
                log.appendChild(dayContainer)
            }

            const container = createDataContainer(d)
            log.appendChild(container)

            last = date

        })
    })
}

function smoothInput() {

    const inputs = document.querySelectorAll("input[type='number']")

    let h = 0;

    const body = document.body

    inputs.forEach(input => {
        input.addEventListener("touchstart", () => {
            console.log("Touch start")
            input.addEventListener("touchmove", e => {

                const x = e.touches[0].clientX
                const y = e.touches[0].clientY

                body.style.backgroundColor = `hsl(${h}, 50%, 50%)`
                h += 1

                input.value = Math.floor(x) + "" + Math.floor(y)

                console.log(x, y)
            })
        })
    })
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

async function getPL(from, to) {

    let pl = {}

    const accounts = await getAccounts()

    const titles = accounts.map(account => account.title)
    const types = accounts.map(account => account.type)

    return db.collection("transactions").orderBy("timestamp", "desc").startAt(to).endAt(from).get().then(querySnapshot => {
        querySnapshot.forEach(doc => {
            doc.data().entries.forEach(e => {
                const title = e.account
                const type = types[titles.indexOf(title)]
                if (type == "expense" || type == "revenue") {
                    pl[title] = pl[title] ? pl[title] + e.amount : e.amount
                }
            })
        })
    }).then(() => {
        Object.entries(pl).forEach(e => {
            const key = e[0]
            const value = e[1]
            if (value == 0) delete pl[key]
        })
    }).then(() => {
        return pl
    })
}



async function getTrialBalance(from, to) {
    balance = {}
    return db.collection("transactions").orderBy("timestamp", "desc").startAt(to).endAt(from).get().then(querySnapshot => {
        querySnapshot.forEach(doc => {
            doc.data().entries.forEach(e => {
                balance[e.account] = balance[e.account] ? balance[e.account] + e.amount : e.amount
            })
        })
    }).then(() => {
        Object.entries(balance).forEach(e => {
            const key = e[0]
            const value = e[1]
            if (value == 0) delete balance[key]
        })
    }).then(() => {
        return balance
    })
}

window.addEventListener("load", e => {
    setAccounts()
    showData(2)
})

new Vue({
    el: '#date',
    data: {
        from: '',
        to: '',
        BS: {},
        PL: {}
    },
    methods: {
        get: async function() {
            const from = new Date(this.from)
            const to = new Date(this.to)
            to.setDate(to.getDate() + 1)
            this.BS = await getBS(from, to)
            this.PL = await getPL(from, to)
        }
    },
    computed: {
        computedBS: function() {
            return Object.entries(this.BS)
        },
        computedPL: function() {
            return Object.entries(this.PL)
        }
    },
    created: function() {
        const from = new Date()
        const to = new Date()
        from.setDate(1)
        from.setTime(from.getTime() - from.getTimezoneOffset() * 60 * 1000)
        to.setTime(to.getTime() - to.getTimezoneOffset() * 60 * 1000)
        this.from = from.toISOString().split("T")[0]
        this.to = to.toISOString().split("T")[0]
        this.get()
    }
})

new Vue({
    el: '#vue',
    data: {
        entries: [{
            debitAccount: '',
            debitAmount: 0,
            creditAccount: '',
            creditAmount: 0
        }],
        summary: ''
    },
    methods: {
        add: function() {
            this.entries.push({
                debitAccount: '',
                debitAmount: 0,
                creditAccount: '',
                creditAmount: 0
            })
        },
        syncCredit: function(i) {
            if (this.entries[i].creditAmount == 0) {
                this.entries[i].creditAmount = this.entries[i].debitAmount
            }
        },
        syncDebit: function(i) {
            if (this.entries[i].debitAmount == 0) {
                this.entries[i].debitAmount = this.entries[i].creditAmount
            }
        },
        resetDebit: function(i) {
            this.entries[i].debitAccount = ''
        },
        resetCredit: function(i) {
            this.entries[i].creditAccount = ''
        },
        validate: function() {
            return this.entries.map(e => {
                return e.debitAmount - e.creditAmount
            }).reduce((a, c) => {
                return a + c
            }) == 0
        },
        submit: function() {
            if (!this.validate()) {
                alert("金額が間違っています！")
                return
            }

            const data = {
                entries: [],
                summary: this.summary,
                timestamp: new Date()
            }

            this.entries.forEach(e => {
                if (!!e.debitAccount && e.debitAmount > 0) {
                    data.entries.push({
                        account: e.debitAccount,
                        amount: e.debitAmount
                    })
                }

                if (!!e.creditAccount && e.creditAmount > 0) {
                    data.entries.push({
                        account: e.creditAccount,
                        amount: -e.creditAmount
                    })
                }
            })

            if (data.entries.length == 0) {
                alert("何も入力されていません！")
                return
            }

            db.collection("transactions").add(data)
                .then(docRef => {
                    alert("登録されました")
                    docRef.get().then(docSnapshot => {
                        const d = docSnapshot.data()
                        const container = createDataContainer(d)
                        const log = document.getElementById("log")
                        log.insertBefore(container, log.firstChild)
                        this.entries = [{
                            debitAccount: '',
                            debitAmount: 0,
                            creditAccount: '',
                            creditAmount: 0
                        }]
                        this.summary = ''
                    })
                })
        }
    }
})

firebase.auth().onAuthStateChanged(user => {
    if (!user) {
        document.getElementById("firebaseui-auth-container").style.display = "block"
    }
})

const ui = new firebaseui.auth.AuthUI(firebase.auth())
ui.start("#firebaseui-auth-container", {
    signInSuccessUrl: "/",
            credentialHelper: firebaseui.auth.CredentialHelper.NONE,
            signInOptions: [
                firebase.auth.GoogleAuthProvider.PROVIDER_ID
            ],
        })
