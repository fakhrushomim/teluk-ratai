"use strict";

const status = document.querySelector("#status");

if (typeof L === "undefined") {
  status.textContent = "Pustaka peta gagal dimuat. Periksa sambungan internet, lalu muat ulang.";
} else {
  tampilkanPeta();
}

function tampilkanPeta() {
  const pilihan = document.querySelector("#pilihan");
  const daftarLayer = document.querySelector("#layer");
  const metadata = document.querySelector("#metadata");
  const map = L.map("peta", {zoomSnap: 0.25, maxZoom: 19});
  L.control.scale({imperial: false}).addTo(map);
  const overlay = L.layerGroup().addTo(map);
  let bounds;
  let aktif = [];

  for (const [i, peta] of katalogPeta.peta.entries()) {
    pilihan.add(new Option(peta.judul, i));
  }

  function cakupanAwal() {
    map.fitBounds(bounds, {padding: [15, 15]});
  }

  function pilihPeta() {
    const peta = katalogPeta.peta[Number(pilihan.value)];
    overlay.clearLayers();
    daftarLayer.replaceChildren();
    status.textContent = "";
    bounds = L.latLngBounds(peta.batas);

    aktif = peta.layer.map((layer, index) => {
      const image = L.imageOverlay(layer.aset, bounds, {
        alt: "",
        zIndex: peta.layer.length - index,
      });
      image.on("error", () => {
        if (overlay.hasLayer(image)) status.textContent = `Gagal memuat layer ${layer.nama}.`;
      });
      const baris = document.createElement("div");
      baris.className = "layer-row";
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = true;
      input.addEventListener("change", () => {
        if (input.checked) overlay.addLayer(image);
        else overlay.removeLayer(image);
      });
      label.append(input);
      if (layer.legenda.length === 1) label.append(swatch(layer.legenda[0].warna));
      label.append(layer.nama);
      baris.append(label);
      if (layer.legenda.length > 1) baris.append(legenda(layer.legenda));
      daftarLayer.append(baris);
      overlay.addLayer(image);
      return {input, image};
    });

    const ringkasan = document.createElement("p");
    ringkasan.textContent = `${peta.layer.length} layer · ${peta.crs_web} · ${peta.ukuran_px.join(" × ")} piksel per overlay`;
    const details = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = "Metadata QGIS";
    const pre = document.createElement("pre");
    pre.textContent = JSON.stringify(peta.metadata_qgis, null, 2);
    details.append(summary, pre);
    metadata.replaceChildren(ringkasan, details);
    cakupanAwal();
  }

  pilihan.addEventListener("change", pilihPeta);
  document.querySelector("#pulihkan").addEventListener("click", () => {
    for (const {input, image} of aktif) {
      input.checked = true;
      overlay.addLayer(image);
    }
  });
  document.querySelector("#cakupan").addEventListener("click", cakupanAwal);
  pilihPeta();
}

function swatch(color) {
  const span = document.createElement("span");
  span.className = "swatch";
  span.style.backgroundColor = color;
  span.setAttribute("aria-hidden", "true");
  return span;
}

function legenda(items) {
  const details = document.createElement("details");
  details.className = "legend";
  const summary = document.createElement("summary");
  summary.textContent = "Legenda";
  const list = document.createElement("ul");
  for (const item of items) {
    const row = document.createElement("li");
    row.append(swatch(item.warna), item.label);
    list.append(row);
  }
  details.append(summary, list);
  return details;
}
