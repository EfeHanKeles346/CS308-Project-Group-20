// ======================== SCROLL REVEAL ========================
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const children = entry.target.querySelectorAll(
          ".product-card, .feature-card, .banner-card, .category-card"
        );
        if (children.length > 0) {
          children.forEach((child, i) => {
            child.style.opacity = "0";
            child.style.transform = "translateY(20px)";
            child.style.transition = `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.07}s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.07}s`;
            requestAnimationFrame(() => {
              child.style.opacity = "1";
              child.style.transform = "translateY(0)";
            });
          });
        }
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
);

document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

// ======================== CURSOR GLOW ========================
const cursorGlow = document.getElementById("cursorGlow");
let glowActive = false;

document.addEventListener("mousemove", (e) => {
  if (!glowActive) {
    glowActive = true;
    cursorGlow.classList.add("active");
  }
  cursorGlow.style.left = e.clientX + "px";
  cursorGlow.style.top = e.clientY + "px";
});

// ======================== HEADER SCROLL ========================
const header = document.getElementById("header");
window.addEventListener("scroll", () => {
  if (window.scrollY > 50) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
});

// ======================== TOAST ========================
function showToast(message, type = "success") {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  const icons = { success: "fa-check-circle", error: "fa-exclamation-circle" };
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<i class="fas ${icons[type]}"></i> ${message}`;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("show"));

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// ======================== PRODUCT TABS ========================
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", function () {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    this.classList.add("active");
  });
});

// ======================== WISHLIST ========================
document.querySelectorAll(".wishlist-btn").forEach((btn) => {
  btn.addEventListener("click", function () {
    const icon = this.querySelector("i");
    if (icon.classList.contains("far")) {
      icon.classList.replace("far", "fas");
      this.style.color = "var(--pink)";
      this.style.borderColor = "rgba(236, 72, 153, 0.3)";
      this.style.background = "rgba(236, 72, 153, 0.15)";
      showToast("Added to wishlist!", "success");
    } else {
      icon.classList.replace("fas", "far");
      this.style.color = "";
      this.style.borderColor = "";
      this.style.background = "";
      showToast("Removed from wishlist.", "error");
    }
  });
});

// ======================== ADD TO CART ========================
document.querySelectorAll(".add-to-cart").forEach((btn) => {
  btn.addEventListener("click", function () {
    const badge = document.getElementById("cartBadge");
    if (badge) {
      const current = parseInt(badge.textContent);
      badge.textContent = current + 1;

      badge.style.transform = "scale(1.5)";
      badge.style.transition = "transform 0.15s ease";
      setTimeout(() => {
        badge.style.transform = "scale(0.8)";
        setTimeout(() => {
          badge.style.transform = "scale(1)";
        }, 100);
      }, 150);
    }

    const originalText = this.innerHTML;
    this.innerHTML = '<i class="fas fa-check"></i> Added!';
    this.style.background = "var(--gradient-primary)";
    this.style.borderColor = "transparent";
    this.style.color = "white";
    this.style.boxShadow = "var(--shadow-glow)";
    setTimeout(() => {
      this.innerHTML = originalText;
      this.style.background = "";
      this.style.borderColor = "";
      this.style.color = "";
      this.style.boxShadow = "";
    }, 1200);

    showToast("Product added to cart!", "success");
  });
});

// ======================== HERO PRODUCT ROTATION ========================
const heroProducts = [
  { img: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&h=400&fit=crop&q=80", brand: "Sony", name: "WH-1000XM5", old: "$399", price: "$299" },
  { img: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=400&fit=crop&q=80", brand: "Apple", name: "iPhone 16 Pro Max", old: "$1,199", price: "$999" },
  { img: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop&q=80", brand: "Apple", name: "MacBook Pro M4", old: "", price: "$1,999" },
  { img: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=400&fit=crop&q=80", brand: "Sony", name: "PlayStation 5 Slim", old: "$449", price: "$379" },
  { img: "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400&h=400&fit=crop&q=80", brand: "Apple", name: "Watch Ultra 2", old: "", price: "$799" },
];

let currentHeroProduct = 0;

function rotateHeroProduct() {
  const card = document.getElementById("heroProductCard");
  const img = document.getElementById("heroProductImg");
  const brand = document.getElementById("heroProductBrand");
  const name = document.getElementById("heroProductName");
  const oldPrice = document.getElementById("heroProductOld");
  const newPrice = document.getElementById("heroProductNew");

  if (!card) return;

  card.classList.add("switching");

  setTimeout(() => {
    currentHeroProduct = (currentHeroProduct + 1) % heroProducts.length;
    const p = heroProducts[currentHeroProduct];

    img.src = p.img;
    img.alt = p.brand + " " + p.name;
    brand.textContent = p.brand;
    name.textContent = p.name;
    oldPrice.textContent = p.old;
    oldPrice.style.display = p.old ? "" : "none";
    newPrice.textContent = p.price;

    card.classList.remove("switching");
  }, 500);
}

setInterval(rotateHeroProduct, 4000);
