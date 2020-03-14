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
