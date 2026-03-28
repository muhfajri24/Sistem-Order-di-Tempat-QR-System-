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
const analyticsRangeButtons = document.querySelectorAll("[data-analytics-range]");
const analyticsRangeLabel = document.querySelector("[data-analytics-range-label]");
const analyticsOrders = document.querySelector("[data-analytics-orders]");
const analyticsRevenue = document.querySelector("[data-analytics-revenue]");
const analyticsFavorite = document.querySelector("[data-analytics-favorite]");
const analyticsFavoriteCopy = document.querySelector("[data-analytics-favorite-copy]");
const analyticsLow = document.querySelector("[data-analytics-low]");
const analyticsLowCopy = document.querySelector("[data-analytics-low-copy]");
const analyticsTopList = document.querySelector("[data-analytics-top-list]");
const analyticsLowList = document.querySelector("[data-analytics-low-list]");
const analyticsInsights = document.querySelector("[data-analytics-insights]");

let activeAnalyticsRange = "day";

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

const formatShortDate = (value) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
  }).format(value);

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

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

const getRangeMeta = (range) => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);

  if (range === "month") {
    start.setDate(1);
    end.setMonth(start.getMonth() + 1, 1);

    return {
      start,
      end,
      label: new Intl.DateTimeFormat("id-ID", {
        month: "long",
        year: "numeric",
      }).format(start),
    };
  }

  if (range === "week") {
    const dayIndex = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - dayIndex);
    end.setTime(start.getTime());
    end.setDate(start.getDate() + 7);

    const lastDay = new Date(end);
    lastDay.setDate(end.getDate() - 1);

    return {
      start,
      end,
      label: `${formatShortDate(start)} - ${formatShortDate(lastDay)}`,
    };
  }

  end.setDate(start.getDate() + 1);

  return {
    start,
    end,
    label: "hari ini",
  };
};

const getOrdersInRange = (orders, range) => {
  const meta = getRangeMeta(range);
  const filteredOrders = orders.filter((order) => {
    const date = new Date(order.createdAt);
    return !Number.isNaN(date.getTime()) && date >= meta.start && date < meta.end;
  });

  return { meta, filteredOrders };
};

const getMenuAnalytics = (orders) => {
  const menuMap = new Map();

  orders.forEach((order) => {
    order.items.forEach((item) => {
      const current = menuMap.get(item.name) || {
        name: item.name,
        quantity: 0,
        revenue: 0,
        orders: 0,
      };

      current.quantity += Number(item.quantity) || 0;
      current.revenue += (Number(item.price) || 0) * (Number(item.quantity) || 0);
      current.orders += 1;
      menuMap.set(item.name, current);
    });
  });

  const items = Array.from(menuMap.values());
  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalRevenue = orders.reduce((sum, order) => sum + (Number(order.totalPrice) || 0), 0);

  const sortedByDemand = [...items].sort((a, b) => {
    if (b.quantity !== a.quantity) {
      return b.quantity - a.quantity;
    }

    return b.revenue - a.revenue;
  });

  const sortedLowDemand = [...items].sort((a, b) => {
    if (a.quantity !== b.quantity) {
      return a.quantity - b.quantity;
    }

    return a.revenue - b.revenue;
  });

  return {
    totalUnits,
    totalRevenue,
    topItems: sortedByDemand.slice(0, 4),
    lowItems: sortedLowDemand.slice(0, Math.min(4, sortedLowDemand.length)).reverse().reverse(),
    favoriteItem: sortedByDemand[0] || null,
    lowItem: sortedLowDemand[0] || null,
  };
};

const renderAnalyticsList = (container, items, emptyMessage) => {
  if (!container) {
    return;
  }

  if (!items.length) {
    container.innerHTML = `<p class="empty-state analytics-empty">${escapeHtml(emptyMessage)}</p>`;
    return;
  }

  const maxQuantity = Math.max(...items.map((item) => item.quantity), 1);

  container.innerHTML = items
    .map((item, index) => {
      const percentage = Math.max(14, Math.round((item.quantity / maxQuantity) * 100));

      return `
        <article class="analytics-list-item">
          <div class="analytics-list-top">
            <div>
              <strong>${index + 1}. ${escapeHtml(item.name)}</strong>
              <p>${item.quantity} porsi terjual . ${formatRupiah(item.revenue)}</p>
            </div>
            <span>${item.orders} order</span>
          </div>
          <div class="analytics-bar-track">
            <span style="width:${percentage}%"></span>
          </div>
        </article>
      `;
    })
    .join("");
};

const renderInsights = (container, orders, analytics, rangeLabel) => {
  if (!container) {
    return;
  }

  if (!orders.length || !analytics.favoriteItem || !analytics.lowItem) {
    container.innerHTML = '<p class="empty-state analytics-empty">Insight promo akan muncul setelah ada transaksi di periode ini.</p>';
    return;
  }

  const favoriteShare = analytics.totalUnits > 0
    ? Math.round((analytics.favoriteItem.quantity / analytics.totalUnits) * 100)
    : 0;

  const insights = [
    `Dorong promo bundling ${analytics.lowItem.name} dengan ${analytics.favoriteItem.name} agar menu yang sepi ikut terbeli saat menu favorit dipesan.`,
    `${analytics.favoriteItem.name} menyumbang sekitar ${favoriteShare}% penjualan item pada ${rangeLabel}. Jadikan menu ini sebagai anchor promo dan upsell.`,
  ];

  if (analytics.lowItem.name !== analytics.favoriteItem.name) {
    insights.push(`Beri promo happy hour atau potongan kecil untuk ${analytics.lowItem.name} pada jam sepi supaya pergerakan stok lebih merata.`);
  }

  if (orders.length < 5) {
    insights.push(`Data ${rangeLabel} masih sedikit. Jalankan promo ringan dulu dan evaluasi ulang setelah order bertambah.`);
  } else {
    insights.push(`Pantau ulang ${rangeLabel} berikutnya. Jika ${analytics.lowItem.name} tetap rendah, pertimbangkan revisi foto, nama menu, atau penempatan di daftar.`);
  }

  container.innerHTML = insights
    .map(
      (insight) => `
        <article class="analytics-insight-item">
          <strong>Insight</strong>
          <p>${escapeHtml(insight)}</p>
        </article>
      `
    )
    .join("");
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

const renderAnalytics = (orders) => {
  const { meta, filteredOrders } = getOrdersInRange(orders, activeAnalyticsRange);
  const analytics = getMenuAnalytics(filteredOrders);

  analyticsRangeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.analyticsRange === activeAnalyticsRange);
  });

  if (analyticsRangeLabel) {
    analyticsRangeLabel.textContent = meta.label;
  }

  if (analyticsOrders) {
    analyticsOrders.textContent = String(filteredOrders.length);
  }

  if (analyticsRevenue) {
    analyticsRevenue.textContent = formatRupiah(analytics.totalRevenue);
  }

  if (analytics.favorite) {
    analytics.favorite.textContent = analytics.favoriteItem ? analytics.favoriteItem.name : "-";
  }

  if (analyticsFavoriteCopy) {
    analyticsFavoriteCopy.textContent = analytics.favoriteItem
      ? `${analytics.favoriteItem.quantity} porsi terjual pada periode ini.`
      : "Belum ada data menu favorit.";
  }

  if (analyticsLow) {
    analyticsLow.textContent = analytics.lowItem ? analytics.lowItem.name : "-";
  }

  if (analyticsLowCopy) {
    analyticsLowCopy.textContent = analytics.lowItem
      ? `${analytics.lowItem.quantity} porsi terjual. Cocok untuk didorong dengan promo.`
      : "Belum ada data menu yang perlu didorong.";
  }

  renderAnalyticsList(analyticsTopList, analytics.topItems, "Belum ada data order untuk periode ini.");
  renderAnalyticsList(analyticsLowList, analytics.lowItems, "Belum ada data order untuk periode ini.");
  renderInsights(analyticsInsights, filteredOrders, analytics, meta.label);
};

const renderOrders = () => {
  const orders = loadOrders();
  renderSummary(orders);
  renderAnalytics(orders);

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
        .map((item) => `<li>${escapeHtml(item.name)} x${item.quantity} <span>${formatRupiah(item.price * item.quantity)}</span></li>`)
        .join("");
      const paymentDetail = order.paymentChannel && order.paymentMethod
        ? `${order.paymentChannel} - ${order.paymentMethod}`
        : order.paymentMethod || "Belum ada metode";

      return `
        <article class="admin-order">
          <div class="admin-order-top">
            <div>
              <strong>${escapeHtml(order.table)}</strong>
              <p>${escapeHtml(customerName)}</p>
            </div>
            <span class="status-pill ${order.status}">${getStatusLabel(order.status)}</span>
          </div>
          <div class="admin-meta">
            <span>Dibayar: ${formatTime(order.createdAt)}</span>
            <span>Total: ${formatRupiah(order.totalPrice)}</span>
            <span>Pembayaran: ${escapeHtml(paymentDetail)}</span>
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

if (analyticsRangeButtons.length) {
  analyticsRangeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeAnalyticsRange = button.dataset.analyticsRange || "day";
      renderOrders();
    });
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
