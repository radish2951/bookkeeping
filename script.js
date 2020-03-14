async function getData(from, to) {

    const now = new Date()
    if (from > 0) {
        now.setHours(0, 0, 0, 0)
        now.setDate(now.getDate() - from + 1)
    }
    const past = new Date()
    past.setHours(0, 0, 0, 0)
    past.setDate(past.getDate() - to)

    const querySnapshot = await db.collection("transactions").orderBy("timestamp", "desc").startAfter(now).endAt(past).get()
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

const logVue = new Vue({
    el: '#log',
    data: {
        days: 2,
        logsDaily: []
    },

    methods: {
        toZero: function(date) {
            date.setHours(0)
            date.setMinutes(0)
            date.setSeconds(0)
            date.setMilliseconds(0)

            return date
        },
        toString: function(date) {
            return date.toLocaleDateString() + ` (${new Intl.DateTimeFormat("ja-JP", { weekday: "short" }).format(date)})`
        },
        toHTML: function(data) {
            const container = createDataContainer(data)
            return container.innerHTML
        }
    },
    created: async function() {

        /* initialize logs */
        for (let i = 0; i < this.days; i++) {
            const date = new Date()
            date.setDate(date.getDate() - i)
            // const text = today.toLocaleDateString() + `(${new Intl.DateTimeFormat("ja-JP", { weekday: "short" }).format(today)})`
            this.logsDaily.push({
                date: date,
                details: []
            })
        }

        /* fetch data */
        const data = await getData(0, this.days - 1)

        data.forEach(d => {

            let date = d.timestamp.toDate()
            let now = new Date()

            date = this.toZero(date)
            now = this.toZero(now)

            const diff = Math.round((now - date) / (1000 * 60 * 60 * 24))

            this.logsDaily[diff].details.push(d)
        })

    }
})

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
                    update() // Update BS with data till yesterday
                    alert("登録されました")
                    docRef.get().then(docSnapshot => {

                        const d = docSnapshot.data()
                        logVue.logsDaily[0].details.unshift(d)

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
