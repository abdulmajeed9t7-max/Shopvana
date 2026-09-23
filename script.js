// ================= FIREBASE SETUP =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC3Y_HCqr3yTohx-UZJr4DiGZqPtI5yhmQ",
  authDomain: "shopvana9t7.firebaseapp.com",
  projectId: "shopvana9t7",
  storageBucket: "shopvana9t7.firebasestorage.app",
  messagingSenderId: "1014799100986",
  appId: "1:1014799100986:web:1ed26542d4e1be028f9903"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ================= GLOBAL STATE =================
let currentUser = null;
let items = [];
let bill = [];
let settings = {
  shopName: 'Meri Shop',
  address: '',
  phone: '',
  slipFooter: 'Shukriya! Dobara tashreef laayen 🙏'
};

// ================= STORAGE HELPERS =================
async function saveUserData() {
  if (!currentUser) return;
  try {
    await setDoc(doc(db, "shops", currentUser.username), {
      username: currentUser.username,
      shopName: currentUser.shopName,
      items: items,
      settings: settings,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (e) {
    console.error("Save error:", e);
    alert("⚠️ Data save nahi hua. Internet check karo.");
  }
}

async function loadUserData(username) {
  try {
    const snap = await getDoc(doc(db, "shops", username));
    if (snap.exists()) {
      const data = snap.data();
      items = data.items || [];
      settings = data.settings || settings;
      return true;
    }
    return false;
  } catch (e) {
    console.error("Load error:", e);
    alert("⚠️ Data load nahi hua. Internet check karo.");
    return false;
  }
}

// ================= AUTH =================
window.switchAuth = function (type) {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const loginBtn = document.getElementById('loginTabBtn');
  const signupBtn = document.getElementById('signupTabBtn');

  if (type === 'login') {
    loginForm.style.display = 'block';
    signupForm.style.display = 'none';
    loginBtn.classList.add('active');
    signupBtn.classList.remove('active');
  } else {
    loginForm.style.display = 'none';
    signupForm.style.display = 'block';
    signupBtn.classList.add('active');
    loginBtn.classList.remove('active');
  }
};

window.doSignup = async function () {
  const shop = document.getElementById('signupShop').value.trim();
  const user = document.getElementById('signupUser').value.trim().toLowerCase();
  const pass = document.getElementById('signupPass').value;

  if (!shop || !user || !pass) {
    alert('Sab fields bharo!');
    return;
  }

  if (pass.length < 4) {
    alert('Password kam az kam 4 characters ka ho!');
    return;
  }

  const btn = event.target;
  btn.textContent = '⏳ Wait...';
  btn.disabled = true;

  try {
    const userRef = doc(db, "shops", user);
    const existing = await getDoc(userRef);

    if (existing.exists()) {
      alert('❌ Ye username pehle se mojood hai!');
      btn.textContent = '✅ Sign Up';
      btn.disabled = false;
      return;
    }

    // Naya account banao
    items = [];
    settings = {
      shopName: shop,
      address: '',
      phone: '',
      slipFooter: 'Shukriya! Dobara tashreef laayen 🙏'
    };

    currentUser = { username: user, shopName: shop, password: pass };

    await setDoc(userRef, {
      username: user,
      password: pass,
      shopName: shop,
      items: [],
      settings: settings,
      createdAt: new Date().toISOString()
    });

    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    alert('✅ Account ban gaya!');
    enterApp();
  } catch (e) {
    console.error(e);
    alert('❌ Error: ' + e.message);
    btn.textContent = '✅ Sign Up';
    btn.disabled = false;
  }
};

window.doLogin = async function () {
  const user = document.getElementById('loginUser').value.trim().toLowerCase();
  const pass = document.getElementById('loginPass').value;

  if (!user || !pass) {
    alert('Username aur password dono likho!');
    return;
  }

  const btn = event.target;
  btn.textContent = '⏳ Wait...';
  btn.disabled = true;

  try {
    const snap = await getDoc(doc(db, "shops", user));

    if (!snap.exists()) {
      alert('❌ Ye username nahi mila. Pehle Sign Up karo.');
      btn.textContent = '🔓 Login';
      btn.disabled = false;
      return;
    }

    const data = snap.data();
    if (data.password !== pass) {
      alert('❌ Galat password!');
      btn.textContent = '🔓 Login';
      btn.disabled = false;
      return;
    }

    // Load user data
    currentUser = { username: data.username, shopName: data.shopName };
    items = data.items || [];
    settings = data.settings || settings;

    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    alert('✅ Login ho gaya!');
    enterApp();
  } catch (e) {
    console.error(e);
    alert('❌ Error: ' + e.message);
    btn.textContent = '🔓 Login';
    btn.disabled = false;
  }
};

window.doLogout = function () {
  if (confirm('Logout karna hai?')) {
    currentUser = null;
    items = [];
    bill = [];
    localStorage.removeItem('currentUser');
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('loginUser').value = '';
    document.getElementById('loginPass').value = '';
  }
};

function enterApp() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('mainApp').style.display = 'block';

  document.getElementById('setShopName').value = settings.shopName || '';
  document.getElementById('setShopAddress').value = settings.address || '';
  document.getElementById('setShopPhone').value = settings.phone || '';
  document.getElementById('setSlipFooter').value = settings.slipFooter || '';
  document.getElementById('headerShopName').textContent = '🏪 ' + settings.shopName;

  renderItems();
  renderItemList();
  renderBill();
}

// ================= TABS =================
window.showTab = function (id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  event.target.classList.add('active');
};

// ================= ITEMS =================
window.saveItem = async function () {
  const name = document.getElementById('newItemName').value.trim();
  const rate = parseFloat(document.getElementById('newItemRate').value);

  if (!name || isNaN(rate)) {
    alert('Item name aur rate dono likho!');
    return;
  }

  const existing = items.findIndex(i => i.name.toLowerCase() === name.toLowerCase());
  if (existing > -1) {
    items[existing].rate = rate;
  } else {
    items.push({ name, rate });
  }

  document.getElementById('newItemName').value = '';
  document.getElementById('newItemRate').value = '';

  renderItems();
  renderItemList();
  await saveUserData();
  alert('✅ Save ho gaya (cloud mein bhi)!');
};

function renderItems() {
  const tbody = document.querySelector('#itemsTable tbody');
  tbody.innerHTML = '';
  items.forEach((item, i) => {
    tbody.innerHTML += `
      <tr>
        <td>${item.name}</td>
        <td>Rs ${item.rate}</td>
        <td><button class="delete-btn" onclick="deleteItem(${i})">X</button></td>
      </tr>`;
  });
}

window.deleteItem = async function (i) {
  if (confirm('Delete karna hai?')) {
    items.splice(i, 1);
    renderItems();
    renderItemList();
    await saveUserData();
  }
};

function renderItemList() {
  const dl = document.getElementById('itemList');
  dl.innerHTML = '';
  items.forEach(i => {
    dl.innerHTML += `<option value="${i.name}">`;
  });
}

// ================= BILLING =================
window.addToBill = function () {
  const name = document.getElementById('itemName').value.trim();
  const qty = parseFloat(document.getElementById('qty').value);

  if (!name || !qty || qty <= 0) {
    alert('Item name aur quantity sahi likho!');
    return;
  }

  const found = items.find(i => i.name.toLowerCase() === name.toLowerCase());
  if (!found) {
    alert('❌ Ye item list mein nahi hai. Pehle "📦 Items" tab mein add karo.');
    return;
  }

  bill.push({ name: found.name, rate: found.rate, qty, total: found.rate * qty });
  document.getElementById('itemName').value = '';
  document.getElementById('qty').value = 1;
  renderBill();
  document.getElementById('itemName').focus();
};

function renderBill() {
  const tbody = document.querySelector('#billTable tbody');
  tbody.innerHTML = '';
  let grand = 0;
  bill.forEach((b, i) => {
    grand += b.total;
    tbody.innerHTML += `
      <tr>
        <td>${b.name}</td>
        <td>${b.rate}</td>
        <td>${b.qty}</td>
        <td>${b.total}</td>
        <td><button class="delete-btn" onclick="removeFromBill(${i})">X</button></td>
      </tr>`;
  });
  document.getElementById('grandTotal').textContent = grand;
}

window.removeFromBill = function (i) {
  bill.splice(i, 1);
  renderBill();
};

window.clearBill = function () {
  if (bill.length === 0) return;
  if (confirm('Poora bill clear karna hai?')) {
    bill = [];
    renderBill();
  }
};

// ================= PRINT =================
window.printBill = function () {
  if (bill.length === 0) {
    alert('Bill khali hai!');
    return;
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();

  let rows = '';
  let grand = 0;
  bill.forEach(b => {
    grand += b.total;
    rows += `<tr><td>${b.name}</td><td>${b.qty}</td><td>${b.rate}</td><td>${b.total}</td></tr>`;
  });

  const slip = `
    <div class="slip">
      <h3>🏪 ${settings.shopName || 'Meri Shop'}</h3>
      <div class="shop-info">
        ${settings.address ? settings.address + '<br>' : ''}
        ${settings.phone ? '📞 ' + settings.phone + '<br>' : ''}
        ${dateStr}
      </div>
      <div class="line"></div>
      <table>
        <tr><th>Item</th><th>Qty</th><th>Rate</th><th>Total</th></tr>
        ${rows}
      </table>
      <div class="line"></div>
      <p style="text-align:right;"><b>Grand Total: Rs ${grand}</b></p>
      <div class="line"></div>
      <p style="text-align:center;font-size:11px;">${settings.slipFooter || 'Shukriya!'}</p>
    </div>
  `;

  document.getElementById('printArea').innerHTML = slip;
  document.getElementById('printArea').style.display = 'block';
  window.print();
  setTimeout(() => document.getElementById('printArea').style.display = 'none', 500);
};

// ================= SETTINGS =================
window.saveSettings = async function () {
  settings.shopName = document.getElementById('setShopName').value.trim() || 'Meri Shop';
  settings.address = document.getElementById('setShopAddress').value.trim();
  settings.phone = document.getElementById('setShopPhone').value.trim();
  settings.slipFooter = document.getElementById('setSlipFooter').value.trim();

  if (currentUser) currentUser.shopName = settings.shopName;
  document.getElementById('headerShopName').textContent = '🏪 ' + settings.shopName;

  await saveUserData();
  alert('✅ Settings cloud mein save ho gayi!');
};

window.resetAllData = function () {
  if (confirm('⚠️ Kya aap PAKKA chahte ho? Sab data delete ho jayega!')) {
    if (confirm('Aakhri warning: Sab kuch delete ho jayega!')) {
      localStorage.clear();
      location.reload();
    }
  }
};

// ================= AUTO LOGIN =================
async function autoLogin() {
  const saved = JSON.parse(localStorage.getItem('currentUser'));
  document.getElementById('loading').style.display = 'none';

  if (saved && saved.username) {
    try {
      const snap = await getDoc(doc(db, "shops", saved.username));
      if (snap.exists()) {
        const data = snap.data();
        currentUser = { username: data.username, shopName: data.shopName };
        items = data.items || [];
        settings = data.settings || settings;
        enterApp();
        return;
      }
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem('currentUser');
  }

  document.getElementById('loginScreen').style.display = 'flex';
}

autoLogin();