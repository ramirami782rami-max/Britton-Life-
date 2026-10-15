let cart=JSON.parse
[1,"حلقة السيليكون الذكية","مريحة وآمنة بتصميم أنيق",249,399,"إكسسوارات",4.8,"https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=500&q=80"],
[2,"أرنب الهزاز المتطور","تحكم سهل وتصميم أنيق",349,499,"الألعاب الزوجية",4.9,"https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=500&q=80"],
[3,"جهاز المساج السحري","هادئ ومتعدد السرعات",199,299,"الألعاب الزوجية",4.7,"https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=500&q=80"],
[4,"لانجري أنيق للنساء","تصميم أنيق ومريح",129,199,"رومانسية",4.6,"https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=500&q=80"],
[5,"كوب الاستمناء الذكي","خامات ناعمة وسهلة التنظيف",229,329,"الألعاب الزوجية",4.8,"https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=500&q=80"],
[6,"قناع العين الفاخر","للأسترخاء والتجربة المثالية",79,129,"إكسسوارات",4.5,"https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=500&q=80"],
[7,"شموع عطرية رومانسية","أجواء هادئة بعطر مميز",89,129,"رومانسية",4.7,"https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=500&q=80"],
[8,"زيت تدليك فاخر","ملمس ناعم ورائحة لطيفة",59,99,"العناية",4.6,"https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=500&q=80"],
[9,"دليل العلاقة السعيدة","إرشادات عملية للتواصل",69,99,"كتب",4.8,"https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=500&q=80"],
[10,"باقة العناية المميزة","مجموعة مختارة بعناية",159,249,"العناية",4.9,"https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=500&q=80"],
[11,"مجموعة رومانسية","تفاصيل للحظات أجمل",119,179,"رومانسية",4.7,"https://images.unsplash.com/photo-1515894347714-9f2c3f2b8b0c?auto=format&fit=crop&w=500&q=80"],
[12,"عرض خاص محدود","وفر أكثر مع باقتنا",99,199,"العروض",4.8,"https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=500&q=80"]];
let cart=JSON.parse(localStorage.getItem("blcart")||"[]"),cat="الكل",term="";const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],fmt=n=>n.toLocaleString("en-US")+" ر.س";
function toast(s){let t=$("#toast");t.textContent=s;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2000)}
function render(){let max=+$(`#range`).value,checks=$$("#filtercats input:checked").map(x=>x.value);let arr=products.filter(p=>(cat==="الكل"||p[5]===cat)&&p[3]<=max&&p[1].toLowerCase().includes(term.toLowerCase())&&(!checks.length||checks.some(c=>p[5]===c||(c==="4"&&p[6]>=4))));$("#grid").innerHTML=arr.map(p=>`<article class="product"><img loading="lazy" src="${p[7]}" alt="${p[1]}"><div class="pinfo"><h4>${p[1]}</h4><p>${p[2]}</p><div class="rating">★★★★★ (${p[6]})</div><div class="price">${fmt(p[3])} <span class="old">${fmt(p[4])}</span></div><button class="add" onclick="add(${p[0]})">أضف إلى السلة</button></div></article>`).join("")||"<p>لا توجد منتجات مطابقة.</p>";$("#mini").innerHTML=products.slice(0,8).map(p=>`<img src="${p[7]}" alt="${p[1]}" title="${p[1]}" onclick="add(${p[0]})">`).join("")}
function add(id){let x=cart.find(c=>c.id===id);x?x.qty++:cart.push({id,qty:1});save();toast("تمت إضافة المنتج إلى السلة")}
function qty(id,n){let x=cart.find(c=>c.id===id);if(x)x.qty+=n;cart=cart.filter(c=>c.qty>0);save()}
function save(){localStorage.setItem("blcart",JSON.stringify(cart));drawCart()}
function drawCart(){let n=cart.reduce((s,c)=>s+c.qty,0),total=0;$("#count").textContent=n;$("#items").innerHTML=cart.length?cart.map(c=>{let p=products.find(p=>p[0]===c.id);total+=p[3]*c.qty;return `<div class="line"><img src="${p[7]}"><div><h4>${p[1]}</h4><b>${fmt(p[3])}</b><div class="qty"><button onclick="qty(${p[0]},-1)">−</button>${c.qty}<button onclick="qty(${p[0]},1)">+</button><button class="remove" onclick="removeItem(${p[0]})">حذف</button></div></div></div>`}).join(""):'<p class="empty">سلتك فارغة حالياً</p>';$("#total").textContent=fmt(total)}
function removeItem(id){cart=cart.filter(c=>c.id!==id);save()}
$$("[data-cat]").forEach(b=>b.addEventListener("click",()=>{cat=b.dataset.cat;render();$("#products").scrollIntoView({behavior:"smooth"})}));
$("#search").addEventListener("input",e=>{term=e.target.value;render()});$("#range").addEventListener("input",e=>{$("#max").textContent="إلى "+(+e.target.value).toLocaleString("en-US")+" ر.س";render()});$$('#filtercats input').forEach(x=>x.addEventListener("change",render));
$("#all").onclick=()=>{cat="الكل";term="";$("#search").value="";$$('#filtercats input').forEach(x=>x.checked=false);$("#range").value=2000;render()};

$("#checkout").onclick = async () => {
  if (!cart.length) {
    return toast("أضف منتجات إلى السلة أولاً");
  }

  const button = $("#checkout");
  button.disabled = true;

  try {
    const items = cart.map(c => {
      const p = products.find(p => p[0] === c.id);
      return {
        productId: c.id,
        name: p[1],
        price: p[3],
        quantity: c.qty,
        subtotal: p[3] * c.qty
      };
    });

    const total = items.reduce((sum, item) =>
      sum + item.subtotal, 0
    );

    if (!window.db) {
      throw new Error("Firebase غير متصل");
    }

    const order = {
      items,
      total,
      currency: "SAR",
      status: "pending",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    const result = await window.db.collection("orders").add(order);

    const detail = items.map(item =>
      `${item.name} × ${item.quantity} — ${fmt(item.subtotal)}`
    ).join("\n");

    const phone = "966556575822";

    const message =
      "مرحباً BRITTON LIFE، أريد إتمام الطلب:\n" +
      "رقم الطلب: " + result.id + "\n" +
      detail + "\n" +
      "الإجمالي: " + fmt(total) +
      "\nالاسم:\nالمدينة والعنوان:";

    window.open(
      "https://wa.me/" + phone + "?text=" +
      encodeURIComponent(message),
      "_blank"
    );

    toast("تم تسجيل الطلب بنجاح");
  } catch (error) {
    console.error(error);
    toast("تعذر تسجيل الطلب. حاول لاحقاً");
  } finally {
    button.disabled = false;
  }
};
$("#news").onsubmit=e=>{e.preventDefault();toast("شكراً لاشتراكك — اربط النموذج بخدمة بريدية لحفظ العناوين");e.target.reset()};render();drawCart()
