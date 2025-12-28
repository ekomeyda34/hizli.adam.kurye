const menuToggle = document.querySelector(".menu-toggle");
const priceForm = document.getElementById("priceForm");
const priceResult = document.getElementById("priceResult");
const distanceField = document.getElementById("distance");
const priceField = document.getElementById("price");
const koliWarning = document.getElementById("koliWarning");
const whatsappLink = document.getElementById("whatsappLink");
const courierTypeDropdown = document.getElementById("courierType");
const shipmentTypeDropdown = document.getElementById("shipmentType");

// Global değişken: Hesaplanan mesafeyi kaydeder
let currentDistanceKm = 0;
let pickupAddress = "";
let deliveryAddress = "";


// --- 1. HARİTA API BAŞLATMA ---
let pickupAutocomplete;
let deliveryAutocomplete;
let directionsService;

function initMap() {
    directionsService = new google.maps.DirectionsService();
    
    const pickupInput = document.querySelector('input[name="pickup"]');
    const deliveryInput = document.querySelector('input[name="delivery"]');
    
    const options = {
        componentRestrictions: { country: "tr" },
        fields: ["geometry", "name"],
        types: ["geocode", "establishment"]
    };

    if (pickupInput && deliveryInput) {
        pickupAutocomplete = new google.maps.places.Autocomplete(pickupInput, options);
        deliveryAutocomplete = new google.maps.places.Autocomplete(deliveryInput, options);

        // Adres değişirse önceki mesafeyi sıfırla
        pickupInput.addEventListener("change", () => { currentDistanceKm = 0; priceResult.classList.add("hidden"); });
        deliveryInput.addEventListener("change", () => { currentDistanceKm = 0; priceResult.classList.add("hidden"); });
    }
}


// --- 2. FİYAT HESAPLAMA MANTIKLARI ---

/**
 * Mevcut mesafeyi ve seçili kurye tipini kullanarak fiyatı hesaplar ve ekrana yazar.
 * @param {number} distanceKm - Hesaplamada kullanılacak mesafe (KM)
 */
const updatePriceDisplay = (distanceKm) => {
    const courierType = courierTypeDropdown.value;
    const shipmentType = shipmentTypeDropdown.value;
    
    let totalPrice = 0;
    let serviceName = "";
    
    // --- FİYAT TARİFESİ (BURADAN DÜZELTME YAPILIR) ---
    if (courierType === "normal") {
        // Normal: Açılış 300 TL + 20 TL/km
        totalPrice = 300 + (parseFloat(distanceKm) * 20); 
        serviceName = "Normal Kurye";
    } 
    else if (courierType === "express") {
        // Ekspres: Açılış 450 TL + 30 TL/km
        totalPrice = 450 + (parseFloat(distanceKm) * 30);
        serviceName = "Ekspres Kurye";
    } 
    else if (courierType === "vip") {
        // VIP: Açılış 550 TL + 40 TL/km
        totalPrice = 550 + (parseFloat(distanceKm) * 40);
        serviceName = "VIP Kurye";
    }

    // Fiyatı tam sayıya yuvarla
    totalPrice = Math.ceil(totalPrice);

    // Sonuçları Ekrana Yaz
    distanceField.textContent = `${distanceKm.toFixed(1)} km`;
    priceField.textContent = totalPrice.toLocaleString('tr-TR');
    
    // KOLİ UYARISI
    let whatsappNote = "";
    if (shipmentType === "Koli") {
        koliWarning.classList.remove("hidden");
        whatsappNote = "\n⚠️ *NOT:* Gönderi 'Koli' olduğu için ürün görselini iletiyorum. Fiyat güncellenebilir.";
    } else {
        koliWarning.classList.add("hidden");
    }

    priceResult.classList.remove("hidden");
    
    // WhatsApp Linkini Oluştur
    const msg = `Merhaba, web sitenizden fiyat teklifi aldım.\n\n🚀 *Hizmet:* ${serviceName}\n📦 *İçerik:* ${shipmentType}\n📍 *Nereden:* ${pickupAddress}\n📍 *Nereye:* ${deliveryAddress}\n🛣️ *Mesafe:* ${distanceKm.toFixed(1)} km\n💰 *Tahmini Tutar:* ${totalPrice} TL${whatsappNote}`;
    
    whatsappLink.href = `https://wa.me/905403022628?text=${encodeURIComponent(msg)}`;
};


/**
 * Google Maps API'yi tetikler, mesafeyi alır ve fiyatı günceller.
 */
const calculateDistanceAndPrice = (e) => {
    e.preventDefault();

    const pickupVal = document.querySelector('input[name="pickup"]').value;
    const deliveryVal = document.querySelector('input[name="delivery"]').value;

    if (!pickupVal || !deliveryVal) {
        alert("Lütfen çıkış ve varış adreslerini giriniz.");
        return;
    }

    pickupAddress = pickupVal;
    deliveryAddress = deliveryVal;

    const submitBtn = priceForm.querySelector("button");
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Hesaplanıyor...";
    submitBtn.disabled = true;

    const request = {
        origin: pickupVal,
        destination: deliveryVal,
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC
    };

    directionsService.route(request, (result, status) => {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;

        if (status === google.maps.DirectionsStatus.OK) {
            const distanceMeters = result.routes[0].legs[0].distance.value;
            let distanceKm = (distanceMeters / 1000);
            
            // Minimum mesafe 1 km olsun
            if (distanceKm < 1) { distanceKm = 1; }

            // Mesafeyi global değişkene kaydet
            currentDistanceKm = distanceKm;
            
            // Fiyatı hesapla ve göster
            updatePriceDisplay(currentDistanceKm);

        } else {
            alert("Mesafe hesaplanamadı. Lütfen adresleri listeden seçerek tekrar deneyiniz.");
            currentDistanceKm = 0;
            priceResult.classList.add("hidden");
        }
    });
};


// --- 3. OLAY DİNLEYİCİLERİ ---

// Butona basıldığında tam hesaplama başlar (API'yi çağırır)
priceForm?.addEventListener("submit", calculateDistanceAndPrice);

// Kurye Tipi değiştiğinde fiyatı otomatik güncelle
courierTypeDropdown?.addEventListener("change", () => {
    // Eğer daha önce mesafe hesaplandıysa
    if (currentDistanceKm > 0) {
        updatePriceDisplay(currentDistanceKm); // Hızlıca güncelle
    }
});

// Gönderi Tipi (Koli/Evrak) değiştiğinde fiyatı otomatik güncelle (Koli uyarısı için)
shipmentTypeDropdown?.addEventListener("change", () => {
    // Eğer daha önce mesafe hesaplandıysa
    if (currentDistanceKm > 0) {
        updatePriceDisplay(currentDistanceKm); // Hızlıca güncelle
    }
});

// Mobil Menü Mantığı
menuToggle?.addEventListener("click", (e) => {
    e.stopPropagation();
    document.body.classList.toggle("nav-open");
});

document.addEventListener("click", (e) => {
    if (document.body.classList.contains("nav-open") && 
        !e.target.closest(".nav-panel") && 
        !e.target.closest(".menu-toggle")) {
        document.body.classList.remove("nav-open");
    }
});

document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", () => {
        document.body.classList.remove("nav-open");
    });
});

// Google Maps API'nin initMap fonksiyonunu bulması için zorunlu
window.initMap = initMap;
// --- MODAL / SEÇİM MENÜSÜ MANTIĞI ---

const modalElement = document.getElementById("actionModal");
const modalTitle = document.getElementById("modalTitle");
const btnOpt1 = document.getElementById("btnOption1");
const btnOpt2 = document.getElementById("btnOption2");

// Numaralar
const phoneNum1 = "05423022628"; // Hat 1
const phoneNum2 = "05403022628"; // Hat 2 (Mevcut)

// Ülke kodu eklenmiş hali (WhatsApp için)
const waNum1 = "905423022628";
const waNum2 = "905403022628";

function openActionModal(type) {
    if (!modalElement) return;

    modalElement.classList.remove("hidden");
    
    // WhatsApp seçildiyse
    if (type === 'whatsapp') {
        modalTitle.textContent = "WhatsApp Hattı Seçin";
        
        // Stil Ayarı
        btnOpt1.className = "sheet-btn wa-style";
        btnOpt2.className = "sheet-btn wa-style";
        
        // İçerik ve Linkler
        btnOpt1.innerHTML = `<span class="btn-label">📱 WhatsApp 1</span> <span class="btn-num">${phoneNum1}</span>`;
        btnOpt1.href = `https://wa.me/${waNum1}`;
        
        btnOpt2.innerHTML = `<span class="btn-label">📱 WhatsApp 2</span> <span class="btn-num">${phoneNum2}</span>`;
        btnOpt2.href = `https://wa.me/${waNum2}`;
    } 
    // Arama seçildiyse
    else if (type === 'call') {
        modalTitle.textContent = "Aramak İçin Numara Seçin";
        
        // Stil Ayarı
        btnOpt1.className = "sheet-btn call-style";
        btnOpt2.className = "sheet-btn call-style";
        
        // İçerik ve Linkler
        btnOpt1.innerHTML = `<span class="btn-label">📞 Hat 1</span> <span class="btn-num">${phoneNum1}</span>`;
        btnOpt1.href = `tel:${phoneNum1}`;
        
        btnOpt2.innerHTML = `<span class="btn-label">📞 Hat 2</span> <span class="btn-num">${phoneNum2}</span>`;
        btnOpt2.href = `tel:${phoneNum2}`;
    }
}

function closeActionModal() {
    if (modalElement) {
        modalElement.classList.add("hidden");
    }
}

// Esc tuşuna basınca kapatma desteği
document.addEventListener('keydown', function(event) {
    if (event.key === "Escape") {
        closeActionModal();
    }

});


