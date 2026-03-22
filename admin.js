const ORDER_STORAGE_KEY = "order_ditempat_orders";
const ORDER_UNREAD_KEY = "order_ditempat_unread";

const ordersContainer = document.querySelector("[data-admin-orders]");
const unreadCounters = document.querySelectorAll("[data-admin-unread], [data-summary-unread]");
const unreadPill = document.querySelector("[data-admin-unread-pill]");
const totalSummary = document.querySelector("[data-summary-total]");
const processingSummary = document.querySelector("[data-summary-processing]");
const doneSummary = document.querySelector("[data-summary-done]");
const markReadButton = document.querySelector("[data-mark-read]");
const resetOrdersButton = document.querySelector("[data-reset-orders]");

const formatRupiah = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const formatTime = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Waktu tidak tersedia";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

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

const getUnreadCount = () => Number(localStorage.getItem(ORDER_UNREAD_KEY) || 0);

const setUnreadCount = (value) => {
  localStorage.setItem(ORDER_UNREAD_KEY, String(Math.max(0, value)));
};

const getStatusLabel = (status) => {
  if (status === "done") {
    return "selesai";
  }

  if (status === "pending") {
    return "pending";
  }

  return "diproses";
};

const renderSummary = (orders) => {
  const processingCount = orders.filter((order) => order.status === "processing").length;
  const doneCount = orders.filter((order) => order.status === "done").length;
  const unreadCount = getUnreadCount();

  if (totalSummary) {
    totalSummary.textContent = String(orders.length);
  }

  if (processingSummary) {
    processingSummary.textContent = String(processingCount);
  }

  if (doneSummary) {
    doneSummary.textContent = String(doneCount);
  }

  unreadCounters.forEach((element) => {
    element.textContent = String(unreadCount);
  });

  if (unreadPill) {
    unreadPill.textContent = unreadCount > 0 ? `${unreadCount} baru` : "Tidak ada baru";
  }
};

const renderOrders = () => {
  const orders = loadOrders();
  renderSummary(orders);

  if (!ordersContainer) {
    return;
  }

  if (orders.length === 0) {
    ordersContainer.innerHTML = '<p class="empty-state">Belum ada pesanan masuk. Coba buat order dari halaman customer dulu.</p>';
    return;
  }

  ordersContainer.innerHTML = orders
    .map((order) => {
      const customerName = order.customerName ? order.customerName : "Customer tanpa nama";
      const itemsMarkup = order.items
        .map((item) => `<li>${item.name} x${item.quantity} <span>${formatRupiah(item.price * item.quantity)}</span></li>`)
        .join("");
      const paymentDetail = order.paymentChannel && order.paymentMethod
        ? `${order.paymentChannel} - ${order.paymentMethod}`
        : order.paymentMethod || "Belum ada metode";

      return `
        <article class="admin-order">
          <div class="admin-order-top">
            <div>
              <strong>${order.table}</strong>
              <p>${customerName}</p>
            </div>
            <span class="status-pill ${order.status}">${getStatusLabel(order.status)}</span>
          </div>
          <div class="admin-meta">
            <span>Dibayar: ${formatTime(order.createdAt)}</span>
            <span>Total: ${formatRupiah(order.totalPrice)}</span>
            <span>Pembayaran: ${paymentDetail}</span>
          </div>
          <ul class="admin-order-items">
            ${itemsMarkup}
          </ul>
          <div class="status-actions">
            <button class="status-action" type="button" data-status="pending" data-id="${order.id}">Pending</button>
            <button class="status-action" type="button" data-status="processing" data-id="${order.id}">Diproses</button>
            <button class="status-action" type="button" data-status="done" data-id="${order.id}">Selesai</button>
          </div>
        </article>
      `;
    })
    .join("");
};

if (ordersContainer) {
  ordersContainer.addEventListener("click", (event) => {
    const button = event.target.closest("[data-status]");

    if (!button) {
      return;
    }

    const orderId = Number(button.dataset.id);
    const status = button.dataset.status;
    const orders = loadOrders();
    const nextOrders = orders.map((order) => {
      if (order.id !== orderId) {
        return order;
      }

      return {
        ...order,
        status,
        statusLabel: getStatusLabel(status),
      };
    });

    saveOrders(nextOrders);
    renderOrders();
  });
}

if (markReadButton) {
  markReadButton.addEventListener("click", () => {
    setUnreadCount(0);
    renderOrders();
  });
}

if (resetOrdersButton) {
  resetOrdersButton.addEventListener("click", () => {
    localStorage.removeItem(ORDER_STORAGE_KEY);
    localStorage.removeItem(ORDER_UNREAD_KEY);
    renderOrders();
  });
}

window.addEventListener("storage", (event) => {
  if (event.key === ORDER_STORAGE_KEY || event.key === ORDER_UNREAD_KEY) {
    renderOrders();
  }
});

renderOrders();
