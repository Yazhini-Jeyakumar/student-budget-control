let userJustLoggedIn = false;

// HELPERS
function val(id) {
    return document.getElementById(id).value;
}

function num(id) {
    return Number(val(id)) || 0;
}

function setText(id, text) {
    const el = document.getElementById(id);

    if (el) {
        el.innerText = text;
    }
}

function showMessage(msg) {
    setText("statusMsg", msg);

    setTimeout(() => {
        setText("statusMsg", "");
    }, 3000);
}

function month() {
    return val("monthSelect");
}

// SIGNUP
function signup() {

    auth.createUserWithEmailAndPassword(
        val("email"),
        val("password")
    )
    .then((res) => {

        const name = prompt("Enter your name");

        return db.collection("users")
        .doc(res.user.uid)
        .set({
            name: name || "User",
            totalSavings: 0
        });
    })
    .then(() => {
        showMessage("Signup successful ✅");
    })
    .catch((error) => {
        alert(error.message);
    });
}

// LOGIN
function login() {

    auth.signInWithEmailAndPassword(
        val("email"),
        val("password")
    )
    .then(() => {

        userJustLoggedIn = true;

        showMessage("✅ Login successful");

        alert("Login successful ✅");

        loadMonths();
    })
    .catch((error) => {
        alert(error.message);
    });
}

// RESET PASSWORD
function resetPassword() {

    auth.sendPasswordResetEmail(val("email"))
    .then(() => {
        showMessage("Reset email sent 📩");
    })
    .catch((error) => {
        alert(error.message);
    });
}

// LOAD MONTHS
function loadMonths() {

    const select = document.getElementById("monthSelect");

    select.innerHTML = "";

    const now = new Date();

    for (let i = 0; i < 6; i++) {

        const d = new Date(
            now.getFullYear(),
            now.getMonth() - i,
            1
        );

        const monthName = d.toLocaleString(
            'default',
            {
                month: 'long',
                year: 'numeric'
            }
        );

        const option = document.createElement("option");

        option.value = monthName;
        option.textContent = monthName;

        select.appendChild(option);
    }

    loadData();
}

// SAVE BUDGET
function saveBudget() {

    const user = auth.currentUser;

    if (!user) {
        alert("Login first");
        return;
    }

    db.collection("users")
    .doc(user.uid)
    .collection("months")
    .doc(month())
    .set({
        income: num("income"),
        food: num("foodBudget"),
        travel: num("travelBudget"),
        sub: num("subBudget")
    }, { merge: true })
    .then(() => {

        showMessage("Budget saved ✅");

        loadData();
    });
}

// ADD EXPENSE
function addExpense() {

    const user = auth.currentUser;

    if (!user) {
        alert("Login first");
        return;
    }

    db.collection("users")
    .doc(user.uid)
    .collection("months")
    .doc(month())
    .collection("expenses")
    .add({
        amount: num("amount"),
        category: val("category"),
        date: val("date")
    })
    .then(() => {

        showMessage("✅ Expense added successfully");

        alert("Expense added successfully ✅");

        document.getElementById("amount").value = "";
        document.getElementById("date").value = "";

        loadData();
    });
}

// DELETE EXPENSE
function deleteExpense(id) {

    const user = auth.currentUser;

    if (!user) return;

    if (!confirm("Delete this expense?")) {
        return;
    }

    db.collection("users")
    .doc(user.uid)
    .collection("months")
    .doc(month())
    .collection("expenses")
    .doc(id)
    .delete()
    .then(() => {

        showMessage("Expense deleted ❌");

        loadData();
    });
}

// EDIT EXPENSE
function editExpense(id, oldAmount, oldCategory, oldDate) {

    const newAmount = prompt(
        "Edit amount",
        oldAmount
    );

    if (newAmount === null) return;

    const newCategory = prompt(
        "Edit category",
        oldCategory
    );

    if (newCategory === null) return;

    const newDate = prompt(
        "Edit date",
        oldDate
    );

    if (newDate === null) return;

    const user = auth.currentUser;

    db.collection("users")
    .doc(user.uid)
    .collection("months")
    .doc(month())
    .collection("expenses")
    .doc(id)
    .update({
        amount: Number(newAmount),
        category: newCategory,
        date: newDate
    })
    .then(() => {

        showMessage("Expense updated ✏️");

        loadData();
    });
}

// LOAD DATA
function loadData() {

    const user = auth.currentUser;

    if (!user) {
        return;
    }

    let total = 0;

    let spent = {
        Food: 0,
        Travel: 0,
        Subscriptions: 0,
        Other: 0
    };

    const list = document.getElementById("dailyList");

    list.innerHTML = "";

    db.collection("users")
    .doc(user.uid)
    .collection("months")
    .doc(month())
    .collection("expenses")
    .get()
    .then((snapshot) => {

        snapshot.forEach((doc) => {

            const data = doc.data();

            total += Number(data.amount);

            // CATEGORY TOTAL
            if (spent[data.category] !== undefined) {
                spent[data.category] += Number(data.amount);
            }

            // EXPENSE ITEM
            const li = document.createElement("li");

            li.innerHTML = `
                <b>${data.category}</b><br>
                Amount: ₹${data.amount}<br>
                Date: ${data.date}<br><br>

                <button onclick="editExpense('${doc.id}', '${data.amount}', '${data.category}', '${data.date}')">
                    Edit
                </button>

                <button onclick="deleteExpense('${doc.id}')">
                    Delete
                </button>
            `;

            list.appendChild(li);
        });

        return db.collection("users")
        .doc(user.uid)
        .collection("months")
        .doc(month())
        .get();
    })
    .then((doc) => {

        const data = doc.data() || {};

        const income = Number(data.income) || 0;
        const foodBudget = Number(data.food) || 0;
        const travelBudget = Number(data.travel) || 0;
        const subBudget = Number(data.sub) || 0;

        let remaining = income - total;

        return db.collection("users")
        .doc(user.uid)
        .get()
        .then((userDoc) => {

            const userData = userDoc.data() || {};

            let savingsWallet = Number(userData.totalSavings) || 0;

            // ADD REMAINING TO SAVINGS
            if (remaining > 0) {
                savingsWallet += remaining;
            }

            // USE SAVINGS IF OVERSPENDING
            if (remaining < 0 && savingsWallet > 0) {

                const needed = Math.abs(remaining);

                if (savingsWallet >= needed) {
                    savingsWallet -= needed;
                    remaining = 0;
                }
                else {
                    remaining += savingsWallet;
                    savingsWallet = 0;
                }
            }

            // SAVE UPDATED SAVINGS
            db.collection("users")
            .doc(user.uid)
            .update({
                totalSavings: savingsWallet
            });

            // TOTAL
            setText(
                "remaining",
                `Total Remaining: ₹${remaining}`
            );

            // FOOD
            setText(
                "foodUsed",
                `Used: ₹${spent.Food}`
            );

            setText(
                "foodLeft",
                `Remaining: ₹${foodBudget - spent.Food}`
            );

            // TRAVEL
            setText(
                "travelUsed",
                `Used: ₹${spent.Travel}`
            );

            setText(
                "travelLeft",
                `Remaining: ₹${travelBudget - spent.Travel}`
            );

            // SUBSCRIPTIONS
            setText(
                "subUsed",
                `Used: ₹${spent.Subscriptions}`
            );

            setText(
                "subLeft",
                `Remaining: ₹${subBudget - spent.Subscriptions}`
            );

            // OTHER
            setText(
                "otherUsed",
                `Used: ₹${spent.Other}`
            );

            // SAVINGS
            setText(
                "savings",
                `₹${savingsWallet}`
            );

            setText(
                "savingsInfo",
                `Backup savings available: ₹${savingsWallet}`
            );

            const name = userData.name || "User";

            if (userJustLoggedIn) {
                setText(
                    "welcomeUser",
                    `Hello ${name} 👋`
                );
            }

            let message =
                `${name}, you're managing well 😊`;

            if (remaining < 0 && savingsWallet <= 0) {

                message =
                    `⚠️ ${name}, you are overspending!`;
            }
            else if (remaining <= 0 && savingsWallet > 0) {

                message =
                    `💰 ${name}, savings wallet is being used`;
            }

            setText("warning", message);
        });
    })
    .catch((error) => {
        console.log(error);
    });
}

// AUTH STATE
auth.onAuthStateChanged((user) => {

    if (!user) {

        setText(
            "welcomeUser",
            "Hello 👋"
        );
    }
});

// TIME
setInterval(() => {

    setText(
        "datetime",
        new Date().toLocaleString()
    );

}, 1000);