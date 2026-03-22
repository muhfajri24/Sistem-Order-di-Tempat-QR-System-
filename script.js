const ORDER_STORAGE_KEY = "order_ditempat_orders";
const ORDER_UNREAD_KEY = "order_ditempat_unread";

const menuGrid = document.querySelector("[data-menu-grid]");
const cartCountElements = document.querySelectorAll("[data-cart-count]");
const cartTotalElement = document.querySelector("[data-cart-total]");
const cartItemsContainer = document.querySelector("[data-cart-items]");
const tableLabel = document.querySelector("[data-table-label]");
const tableInput = document.querySelector("[data-table-input]");
const openPaymentButton = document.querySelector("[data-open-payment]");
const paymentModal = document.querySelector("[data-payment-modal]");
const paymentTotal = document.querySelector("[data-payment-total]");
const paymentEyebrow = document.querySelector("[data-payment-eyebrow]");
const paymentTitle = document.querySelector("[data-payment-title]");
const paymentCopy = document.querySelector("[data-payment-copy]");
const paymentQr = document.querySelector("[data-payment-qr]");
const cashierInfo = document.querySelector("[data-cashier-info]");
const cashierLabel = document.querySelector("[data-cashier-label]");
const confirmPaymentButton = document.querySelector("[data-confirm-payment]");
const closePaymentButtons = document.querySelectorAll("[data-close-payment]");
const checkoutForm = document.querySelector("[data-checkout-form]");
const orderStatus = document.querySelector("[data-order-status]");
const statusTitle = document.querySelector("[data-status-title]");
const statusCopy = document.querySelector("[data-status-copy]");
const paymentModeButtons = document.querySelectorAll("[data-payment-mode]");
const cashierMethodButtons = document.querySelectorAll("[data-cashier-method]");
const cashierMethodsBox = document.querySelector("[data-cashier-methods]");
const paymentHint = document.querySelector("[data-payment-hint]");
const menuFilterButtons = document.querySelectorAll("[data-menu-filter]");

const cart = new Map();
let currentTable = "Meja 01";
let paymentMode = "qris";
let cashierMethod = "cash";
let activeMenuFilter = "all";

const formatRupiah = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const loadOrders = () => {
  try {
    return JSON.parse(localStorage.getItem(ORDER_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
};

const saveOrders = (orders) => {
  localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orders));
};

const incrementUnread = () => {
  const current = Number(localStorage.getItem(ORDER_UNREAD_KEY) || 0);
  localStorage.setItem(ORDER_UNREAD_KEY, String(current + 1));
};

const getTableFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  const table = params.get("table");
  return table && table.trim() ? table.trim() : "Meja 01";
};

const getPaymentMethodLabel = () => {
  if (paymentMode === "qris") {
    return "QRIS";
  }

  return cashierMethod === "debit" ? "Debit" : "Cash";
};

const syncTableInfo = () => {
  currentTable = getTableFromUrl();

  if (tableLabel) {
    tableLabel.textContent = currentTable;
  }

  if (tableInput) {
    tableInput.value = currentTable;
  }
};

const getCartTotals = () => {
  const items = Array.from(cart.values());
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  return { items, totalItems, totalPrice };
};

const renderCart = () => {
  const { items, totalItems, totalPrice } = getCartTotals();

  cartCountElements.forEach((element) => {
    element.textContent = String(totalItems);
  });

  if (cartTotalElement) {
    cartTotalElement.textContent = formatRupiah(totalPrice);
  }

  if (paymentTotal) {
    paymentTotal.textContent = formatRupiah(totalPrice);
  }

  if (!cartItemsContainer) {
    return;
  }

  if (items.length === 0) {
    cartItemsContainer.innerHTML = '<p class="empty-state">Belum ada menu dipilih.</p>';
    return;
  }

  cartItemsContainer.innerHTML = items
    .map(
      (item) => `
        <div class="cart-item">
          <div>
            <strong>${item.name}</strong>
            <p>${item.quantity} x ${formatRupiah(item.price)}</p>
          </div>
          <div class="cart-item-actions">
            <button type="button" data-cart-action="decrease" data-name="${item.name}">-</button>
            <span class="qty-value">${item.quantity}</span>
            <button type="button" data-cart-action="increase" data-name="${item.name}">+</button>
          </div>
        </div>
      `
    )
    .join("");
};

const updateCardQty = (card, nextValue) => {
  const qtyElement = card.querySelector("[data-qty]");

  if (qtyElement) {
    qtyElement.textContent = String(Math.max(0, nextValue));
  }
};

const syncCardFromCart = (name) => {
  const card = menuGrid?.querySelector(`.menu-card[data-name="${CSS.escape(name)}"]`);
  const qty = cart.get(name)?.quantity ?? 0;

  if (card) {
    updateCardQty(card, qty);
  }
};

const renderMenuFilter = () => {
  menuFilterButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.menuFilter === activeMenuFilter);
  });

  menuGrid?.querySelectorAll(".menu-card").forEach((card) => {
    const category = card.dataset.category || "all";
    const isVisible = activeMenuFilter === "all" || category === activeMenuFilter;
    card.hidden = !isVisible;
  });
};

const renderPaymentSelection = () => {
  paymentModeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.paymentMode === paymentMode);
  });

  cashierMethodButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.cashierMethod === cashierMethod);
  });

  if (cashierMethodsBox) {
    const isTablePayment = paymentMode === "table";
    cashierMethodsBox.classList.toggle("is-open", isTablePayment);
    cashierMethodsBox.setAttribute("aria-hidden", String(!isTablePayment));
  }

  if (paymentHint) {
    paymentHint.textContent = paymentMode === "qris"
      ? "Bayar langsung dari meja tempat Anda duduk dengan scan QRIS."
      : "Silakan menuju kasir, lalu pilih pembayaran cash atau debit.";
  }

  if (openPaymentButton) {
    openPaymentButton.textContent = paymentMode === "qris"
      ? "Lanjut Bayar di Meja"
      : `Lanjut Bayar di Kasir (${getPaymentMethodLabel()})`;
  }
};

const renderPaymentModal = () => {
  const methodLabel = getPaymentMethodLabel();

  if (paymentMode === "qris") {
    if (paymentEyebrow) {
      paymentEyebrow.textContent = "Pembayaran di Meja";
    }

    if (paymentTitle) {
      paymentTitle.textContent = "Scan QRIS dari meja Anda";
    }

    if (paymentQr) {
      paymentQr.hidden = false;
    }

    if (cashierInfo) {
      cashierInfo.hidden = true;
    }

    if (paymentCopy) {
      paymentCopy.textContent = "Setelah pembayaran dari meja berhasil, pesanan akan masuk ke dashboard admin terpisah.";
    }

    if (confirmPaymentButton) {
      confirmPaymentButton.textContent = "Simulasikan Pembayaran Berhasil";
    }

    return;
  }

  if (paymentEyebrow) {
    paymentEyebrow.textContent = "Bayar di Kasir";
  }

  if (paymentTitle) {
    paymentTitle.textContent = `Selesaikan pembayaran ${methodLabel} di kasir`;
  }

  if (paymentQr) {
    paymentQr.hidden = true;
  }

  if (cashierInfo) {
    cashierInfo.hidden = false;
  }

  if (cashierLabel) {
    cashierLabel.textContent = methodLabel;
  }

  if (paymentCopy) {
    paymentCopy.textContent = "Setelah pembayaran di kasir selesai, pesanan akan langsung masuk ke dashboard admin terpisah.";
  }

  if (confirmPaymentButton) {
    confirmPaymentButton.textContent = `Simulasikan ${methodLabel} di Kasir Berhasil`;
  }
};

if (paymentModeButtons.length) {
  paymentModeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      paymentMode = button.dataset.paymentMode || "qris";
      renderPaymentSelection();
    });
  });
}

if (cashierMethodButtons.length) {
  cashierMethodButtons.forEach((button) => {
    button.addEventListener("click", () => {
      cashierMethod = button.dataset.cashierMethod || "cash";
      renderPaymentSelection();
    });
  });
}

if (menuFilterButtons.length) {
  menuFilterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeMenuFilter = button.dataset.menuFilter || "all";
      renderMenuFilter();
    });
  });
}

if (menuGrid) {
  menuGrid.addEventListener("click", (event) => {
    const button = event.target.closest(".qty-btn");
    const card = event.target.closest(".menu-card");

    if (!button || !card) {
      return;
    }

    const name = card.dataset.name;
    const price = Number(card.dataset.price);
    const currentValue = cart.get(name)?.quantity ?? 0;
    const nextValue = button.dataset.action === "increase" ? currentValue + 1 : Math.max(0, currentValue - 1);

    if (nextValue === 0) {
      cart.delete(name);
    } else {
      cart.set(name, { name, price, quantity: nextValue });
    }

    updateCardQty(card, nextValue);
    renderCart();
  });
}

if (cartItemsContainer) {
  cartItemsContainer.addEventListener("click", (event) => {
    const button = event.target.closest("[data-cart-action]");

    if (!button) {
      return;
    }

    const name = button.dataset.name;
    const item = cart.get(name);

    if (!item) {
      return;
    }

    const nextValue = button.dataset.cartAction === "increase" ? item.quantity + 1 : Math.max(0, item.quantity - 1);

    if (nextValue === 0) {
      cart.delete(name);
    } else {
      item.quantity = nextValue;
      cart.set(name, item);
    }

    syncCardFromCart(name);
    renderCart();
  });
}

if (openPaymentButton) {
  openPaymentButton.addEventListener("click", () => {
    const { items, totalPrice } = getCartTotals();

    if (items.length === 0) {
      window.alert("Pilih minimal satu menu sebelum lanjut ke pembayaran.");
      return;
    }

    if (paymentTotal) {
      paymentTotal.textContent = formatRupiah(totalPrice);
    }

    renderPaymentModal();

    if (paymentModal) {
      paymentModal.hidden = false;
    }
  });
}

closePaymentButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (paymentModal) {
      paymentModal.hidden = true;
    }
  });
});

if (confirmPaymentButton) {
  confirmPaymentButton.addEventListener("click", () => {
    const { items, totalPrice } = getCartTotals();

    if (items.length === 0) {
      return;
    }

    const customerName = String(new FormData(checkoutForm).get("name") || "").trim();
    const paymentMethod = getPaymentMethodLabel();

    const order = {
      id: Date.now(),
      table: currentTable,
      customerName,
      items: items.map((item) => ({ ...item })),
      totalPrice,
      paymentChannel: paymentMode === "qris" ? "di meja" : "di kasir",
      paymentMethod,
      status: "processing",
      statusLabel: "diproses",
      createdAt: new Date().toISOString(),
    };

    const orders = loadOrders();
    orders.unshift(order);
    saveOrders(orders);
    incrementUnread();

    cart.clear();
    document.querySelectorAll(".menu-card").forEach((card) => updateCardQty(card, 0));
    renderCart();

    if (paymentModal) {
      paymentModal.hidden = true;
    }

    if (statusTitle) {
      statusTitle.textContent = paymentMode === "qris"
        ? "Pembayaran QRIS berhasil, pesanan sedang diproses"
        : `Pembayaran ${paymentMethod} di kasir berhasil, pesanan sedang diproses`;
    }

    if (statusCopy) {
      statusCopy.textContent = paymentMode === "qris"
        ? "Order berhasil masuk ke sistem setelah pembayaran QRIS dari meja. Silakan tunggu pesanan disiapkan oleh tim kami."
        : `Order berhasil masuk ke sistem setelah pembayaran ${paymentMethod.toLowerCase()} di kasir. Silakan tunggu pesanan disiapkan oleh tim kami.`;
    }

    if (orderStatus) {
      orderStatus.hidden = false;
    }
  });
}

syncTableInfo();
renderPaymentSelection();
renderMenuFilter();
renderCart();







