
const $ = (selector) => document.querySelector(selector);

let products = [];
let cat = "الكل";
let term = "";
let cart = [];

try {
  cart = JSON.parse(localStorage.getItem("blcart") || "[]");
  if (!Array.isArray(cart)) cart = [];
} catch {
  cart = [];
}

function money(value) {
  return Number(value || 0).toLocaleString("ar-SA");
}

function toast(message) {
  const el = $("#toast");
  if (el) {
    el.textContent = message;
    el.style.display = "block";
    setTimeout(() => {
      el.style.display = "none";
    }, 3000);
  } else {
    alert(message);
  }
}

function normalizeProduct(doc) {
  const d = doc.data();
  return {
    id: doc.id,
    name: d.name || "منتج",
    description: d.description || "",
    price: Number(d.price) || 0,
    oldPrice: Number(d.oldPrice || d.oldprice || 0),
    category: d.category || "عام",
    rating: Number(d.rating || 5),
    image: d.image || d.imageURL || d.imageUrl || "",
    stock: Number(d.stock ?? 999),
    active: d.active !== false
  };
}

function render() {
  const grid = $("#grid");
  if (!grid) return;

  const filtered = products.filter(p => {
    const matchesText =
      (p.name + " " + p.description).toLowerCase()
      .includes(term.toLowerCase());

    const matchesCategory =
      cat === "الكل" || p.category === cat;

    const maxEl = $("#max");
    const maxPrice = maxEl && maxEl.value
      ? Number(maxEl.value)
      : Infinity;

    return matchesText &&
      matchesCategory &&
      p.price <= maxPrice &&
      p.active;
  });

  grid.innerHTML = filtered.map(p => `
    <article class="product">
      <img
        src="${escapeHTML(p.image)}"
        alt="${escapeHTML(p.name)}"
        onerror="this.style.display='none'"
      >
      <h3>${escapeHTML(p.name)}</h3>
      <p>${escapeHTML(p.description)}</p>
      <p><strong>${money(p.price)}</strong></p>
      <p>⭐ ${p.rating}</p>
      <button type="button" onclick="add('${p.id}')">
        أضف للسلة
      </button>
    </article>
  `).join("");

  const count = $("#count");
  if (count) count.textContent = filtered.length;

  const items = $("#items");
  if (items) items.textContent = products.length;

  const cats = [...new Set(products.map(p => p.category))];
  const filtercats = $("#filtercats");

  if (filtercats && !filtercats.dataset.ready) {
    filtercats.innerHTML = ["الكل", ...cats].map(c => `
      <label>
        <input type="radio" name="category"
          value="${escapeHTML(c)}"
          ${c === cat ? "checked" : ""}>
        ${escapeHTML(c)}
      </label>
    `).join("");

    filtercats.addEventListener("change", e => {
      if (e.target.name === "category") {
        cat = e.target.value;
        render();
      }
    });

    filtercats.dataset.ready = "1";
  }
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[c]);
}

function save() {
  localStorage.setItem("blcart", JSON.stringify(cart));
  drawCart();
}

function add(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  const item = cart.find(x => x.id === id);
  if (item) item.qty = (Number(item.qty) || 1) + 1;
  else cart.push({
    id: product.id,
    name: product.name,
    price: product.price,
    qty: 1
  });

  save();
  toast("تمت إضافة المنتج للسلة");
}

function qty(id, change) {
  const item = cart.find(x => x.id === id);
  if (!item) return;

  item.qty = (Number(item.qty) || 1) + change;
  if (item.qty <= 0) {
    cart = cart.filter(x => x.id !== id);
  }
  save();
}

function removeItem(id) {
  cart = cart.filter(x => x.id !== id);
  save();
}

function drawCart() {
  const mini = $("#mini");
  if (mini) {
    mini.innerHTML = cart.map(item => `
      <div>
        ${escapeHTML(item.name)}
        <button type="button"
          onclick="qty('${item.id}',-1)">−</button>
        ${Number(item.qty) || 1}
        <button type="button"
          onclick="qty('${item.id}',1)">+</button>
        <button type="button"
          onclick="removeItem('${item.id}')">حذف</button>
      </div>
    `).join("");
  }

  const total = cart.reduce(
    (sum, item) =>
      sum + (Number(item.price) || 0) *
      (Number(item.qty) || 1),
    0
  );

  const totalEl = $("#total");
  if (totalEl) totalEl.textContent = money(total);
}

async function loadProducts() {
  const grid = $("#grid");
  if (grid) grid.textContent = "جاري تحميل المنتجات...";

  try {
    if (!window.db) {
      throw new Error("Firebase لم يتم تهيئته في index.html");
    }

    // اقرأ جميع المنتجات أولًا لتجنب إخفائها بسبب فلتر active.
    const snapshot = await window.db
      .collection("products")
      .get();

    products = snapshot.docs
      .map(normalizeProduct)
      .filter(p => p.active);

    render();
    drawCart();

    if (products.length === 0 && grid) {
      grid.textContent =
        "لا توجد منتجات نشطة. تأكد من بيانات المنتجات في Firebase.";
    }
  } catch (error) {
    console.error("خطأ تحميل المنتجات:", error);
    if (grid) {
      grid.textContent =
        "تعذر تحميل المنتجات. تحقق من اتصال Firebase وقواعد Firestore.";
    }
  }
}

const search = $("#search");
if (search) {
  search.addEventListener("input", () => {
    term = search.value || "";
    render();
  });
}

const range = $("#range");
if (range) {
  range.addEventListener("input", () => {
    const max = $("#max");
    if (max) max.value = range.value;
    render();
  });
}

const max = $("#max");
if (max) {
  max.addEventListener("input", render);
}

const checkout = $("#checkout");
if (checkout) {
  checkout.addEventListener("click", async () => {
    if (!cart.length) {
      toast("السلة فارغة");
      return;
    }

    const order = {
      items: cart,
      total: cart.reduce(
        (sum, item) =>
          sum + Number(item.price || 0) *
          Number(item.qty || 1),
        0
      ),
      createdAt: new Date().toISOString(),
      status: "new"
    };

    try {
      await window.db.collection("orders").add(order);

      const message =
        "طلب جديد:%0A" +
        cart.map(item =>
          encodeURIComponent(
            `${item.name} × ${item.qty}`
          )
        ).join("%0A") +
        "%0Aالإجمالي: " + order.total;

      cart = [];
      save();
      toast("تم حفظ الطلب");

      window.open(
        "https://wa.me/966556575822?text=" + message,
        "_blank"
      );
    } catch (error) {
      console.error("خطأ حفظ الطلب:", error);
      toast("تعذر حفظ الطلب. تحقق من اتصال Firebase.");
    }
  });
}

const news = $("#news");
if (news) {
  news.addEventListener("submit", event => {
    event.preventDefault();
    toast("شكرًا لك!");
    news.reset();
  });
}

loadProducts();
