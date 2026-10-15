let products = [];
let cart = JSON.parse(localStorage.getItem("blcart") || "[]");

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const fmt = (n) => Number(n || 0).toLocaleString("en-US") + " ر.س";

function toast(message) {
  const el = $("#toast");
  if (!el) {
    alert(message);
    return;
  }
  el.textContent = message;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2500);
}

function normalizeProduct(doc) {
  const d = doc.data();
  return {
    id: doc.id,
    name: d.name || "منتج",
    description: d.description || "",
    price: Number(d.price || 0),
    oldPrice: Number(d.oldPrice || d.old_price || d.price || 0),
    category: d.category || "عام",
    rating: Number(d.rating || 0),
    image: d.image || "",
    stock: Number(d.stock || 0),
    active: d.active === true
  };
}

function render() {
  const grid = $("#grid");
  if (!grid) return;

  const search = ($("#search")?.value || "").trim().toLowerCase();
  const selected = $$("#filtercats input:checked").map(x => x.value);
  const maxPrice = Number($("#range")?.value || 2000);
  const category = window.selectedCategory || "الكل";

  const shown = products.filter(p =>
    p.active &&
    p.price <= maxPrice &&
    p.name.toLowerCase().includes(search) &&
    (category === "الكل" || p.category === category) &&
    (!selected.length || selected.some(c =>
      p.category === c || (c === "4" && p.rating >= 4)
    ))
  );

  grid.innerHTML = shown.length
    ? shown.map(p => `
      <article class="product">
        ${p.image ? `<img loading="lazy" src="${p.image}" alt="${p.name}">` : ""}
        <div class="pinfo">
          <h4>${p.name}</h4>
          <p>${p.description}</p>
          <div class="rating">التقييم: ${p.rating || "—"}</div>
          <div class="price">${fmt(p.price)}</div>
          <button class="add" data-add="${p.id}">أضف إلى السلة</button>
        </div>
      </article>
    `).join("")
    : "<p>لا توجد منتجات نشطة مطابقة للبحث.</p>";

  const mini = $("#mini");
  if (mini) {
    mini.innerHTML = products.filter(p => p.active && p.image).slice(0, 8)
      .map(p => `<img src="${p.image}" alt="${p.name}" title="${p.name}">`)
      .join("");
  }
}

function saveCart() {
  localStorage.setItem("blcart", JSON.stringify(cart));
  drawCart();
}

function add(id) {
  const p = products.find(p => p.id === id);
  if (!p) return;
  if (p.stock <= 0) return toast("هذا المنتج غير متوفر حاليًا");

  const item = cart.find(c => c.id === id);
  if (item) {
    if (item.qty >= p.stock) return toast("الكمية المتوفرة غير كافية");
    item.qty++;
  } else {
    cart.push({ id, qty: 1 });
  }
  saveCart();
  toast("تمت إضافة المنتج إلى السلة");
}

function qty(id, change) {
  const item = cart.find(c => c.id === id);
  const p = products.find(p => p.id === id);
  if (!item || !p) return;
  const next = item.qty + change;
  if (next > p.stock) return toast("الكمية المتوفرة غير كافية");
  item.qty = next;
  cart = cart.filter(c => c.qty > 0);
  saveCart();
}

function removeItem(id) {
  cart = cart.filter(c => c.id !== id);
  saveCart();
}

function drawCart() {
  const count = $("#count");
  const itemsEl = $("#items");
  const totalEl = $("#total");
  if (!count || !itemsEl || !totalEl) return;

  let total = 0;
  count.textContent = cart.reduce((sum, c) => sum + c.qty, 0);

  itemsEl.innerHTML = cart.length ? cart.map(c => {
    const p = products.find(p => p.id === c.id);
    if (!p) return "";
    total += p.price * c.qty;
    return `
      <div class="line">
        ${p.image ? `<img src="${p.image}" alt="${p.name}">` : ""}
        <div>
          <h4>${p.name}</h4>
          <b>${fmt(p.price)}</b>
          <div class="qty">
            <button data-qty="${p.id}" data-change="-1">−</button>
            ${c.qty}
            <button data-qty="${p.id}" data-change="1">+</button>
            <button data-remove="${p.id}">حذف</button>
          </div>
        </div>
      </div>`;
  }).join("") : '<p class="empty">سلتك فارغة حاليًا</p>';

  totalEl.textContent = fmt(total);
}

document.addEventListener("click", e => {
  const addButton = e.target.closest("[data-add]");
  if (addButton) add(addButton.dataset.add);

  const qtyButton = e.target.closest("[data-qty]");
  if (qtyButton) qty(qtyButton.dataset.qty, Number(qtyButton.dataset.change));

  const removeButton = e.target.closest("[data-remove]");
  if (removeButton) removeItem(removeButton.dataset.remove);

  const catButton = e.target.closest("[data-cat]");
  if (catButton) {
    window.selectedCategory = catButton.dataset.cat;
    render();
  }
});

$("#search")?.addEventListener("input", render);
$("#range")?.addEventListener("input", () => {
  const max = $("#max");
  if (max) max.textContent = "إلى " + Number($("#range").value).toLocaleString("en-US") + " ر.س";
  render();
});
$$("#filtercats input").forEach(el => el.addEventListener("change", render));

$("#all")?.addEventListener("click", () => {
  window.selectedCategory = "الكل";
  if ($("#search")) $("#search").value = "";
  $$("#filtercats input").forEach(el => el.checked = false);
  if ($("#range")) $("#range").value = 2000;
  render();
});

$("#checkout")?.addEventListener("click", async () => {
  if (!cart.length) return toast("أضف منتجات إلى السلة أولًا");
  if (!window.db) return toast("اتصال Firebase غير جاهز");

  const button = $("#checkout");
  button.disabled = true;

  try {
    const items = cart.map(c => {
      const p = products.find(p => p.id === c.id);
      if (!p) throw new Error("أحد المنتجات لم يعد موجودًا");
      return {
        productId: p.id,
        name: p.name,
        price: p.price,
        quantity: c.qty,
        subtotal: p.price * c.qty
      };
    });

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);

    const result = await window.db.collection("orders").add({
      items,
      total,
      currency: "SAR",
      status: "pending",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    const message = [
      "مرحبًا BRITTON LIFE، أريد إتمام الطلب:",
      "رقم الطلب: " + result.id,
      ...items.map(i => `${i.name} × ${i.quantity} — ${fmt(i.subtotal)}`),
      "الإجمالي: " + fmt(total),
      "الاسم:",
      "المدينة والعنوان:"
    ].join("\n");

    window.open(
      "https://wa.me/966556575822?text=" + encodeURIComponent(message),
      "_blank"
    );

    cart = [];
    saveCart();
    toast("تم تسجيل الطلب");
  } catch (error) {
    console.error(error);
    toast("تعذر تسجيل الطلب. تحقق من اتصال Firebase وقواعد الأمان.");
  } finally {
    button.disabled = false;
  }
});

$("#news")?.addEventListener("submit", e => {
  e.preventDefault();
  toast("شكرًا لاشتراكك");
});

async function loadProducts() {
  const grid = $("#grid");
  if (grid) grid.textContent = "جارٍ تحميل المنتجات...";

  try {
    if (!window.db) throw new Error("Firebase غير مهيأ");

    const snapshot = await window.db.collection("products")
      .where("active", "==", true)
      .get();

    products = snapshot.docs.map(normalizeProduct);
    render();
    drawCart();

    if (!products.length && grid) {
      grid.textContent = "لا توجد منتجات نشطة في قاعدة البيانات.";
    }
  } catch (error) {
    console.error("تعذر تحميل المنتجات من Firebase:", error);
    if (grid) {
      grid.textContent = "تعذر تحميل المنتجات. تحقق من اتصال Firebase وقواعد قراءة المنتجات.";
    }
  }
}

loadProducts();
