const menuToggle = document.querySelector(".menu-toggle");
const priceForm = document.getElementById("priceForm");
const priceResult = document.getElementById("priceResult");
const distanceField = document.getElementById("distance");
const priceField = document.getElementById("price");
const koliWarning = document.getElementById("koliWarning");
const whatsappLink = document.getElementById("whatsappLink");
const courierTypeDropdown = document.getElementById("courierType");
const shipmentTypeDropdown = document.getElementById("shipmentType");
const whatsappChooser = document.getElementById("whatsappChooser"); // YENİ DEĞİŞKEN

// Global değişken: Hesaplanan mesafeyi kaydeder
let currentDistanceKm = 0;
let pickupAddress = "";
let deliveryAddress = "";


// --- 1. HARİTA API BAŞLATMA ---
let pickupAutocomplete;
let deliveryAutocomplete;
let directionsService;

// Google Maps API tarafından çağrılan zorunlu fonksiyon
function initMap() {
    //directionsService, Google Maps API'sinin bir parçasıdır.
    if (typeof google === 'undefined' || typeof google.maps === 'undefined') return;

    directionsService = new google.maps.DirectionsService();
    
    const pickupInput = document.querySelector('input[name="pickup"]');
    const deliveryInput = document.querySelector('input[name="delivery"]');
    
    // Autocomplete seçenekleri
    const options = {
        componentRestrictions: { country: "tr" },
        fields: ["geometry", "name"],
        types: ["geocode", "establishment"]
    };

    if (pickupInput && deliveryInput) {
        pickupAutocomplete = new google.maps.places.Autocomplete(pickupInput, options);
        deliveryAutocomplete = new google.maps.places.Autocomplete(deliveryInput, options);

        // Adres değişirse (yeni adres yazılırsa) önceki mesafeyi sıfırla
        const resetDistance = () => { currentDistanceKm = 0; priceResult.classList.add("hidden"); };
        pickupInput.addEventListener("change", resetDistance);
        deliveryInput.addEventListener("change", resetDistance);
        
        // Autocomplete ile adres seçilince hesaplamayı tekrar tetikle
        pickupAutocomplete.addListener('place_changed', () => { 
            currentDistanceKm = 0;
            if (pickupInput.value && deliveryInput.value) {
                priceForm.dispatchEvent(new Event('submit'));
            }
        });
        deliveryAutocomplete.addListener('place_changed', () => { 
            currentDistanceKm = 0;
            if (pickupInput.value && deliveryInput.value) {
                priceForm.dispatchEvent(new Event('submit'));
            }
        });
    }
}


// --- 2. FİYAT HESAPLAMA MANTIKLARI ---

/**
 * Mevcut mesafeyi ve seçili kurye tipini kullanarak fiyatı hesaplar ve ekrana yazar.
 * @param {number} distanceKm - Hesaplamada kullanılacak mesafe (KM)
 */
const updatePriceDisplay = (distanceKm) => {
    // Eğer mesafe hesaplanmadıysa (0 ise) fiyat sonucunu gösterme
    if (distanceKm <= 0) {
        priceResult.classList.add("hidden");
        return;
    }
    
    const courierType = courierTypeDropdown.value;
    const shipmentType = shipmentTypeDropdown.value;
    const selectedWhatsapp = whatsappChooser.value; // YENİ: Seçilen numarayı al
    
    let totalPrice = 0;
    let serviceName = "";
    
    // --- FİYAT TARİFESİ (BURAYI DÜZELTİN) ---
    if (courierType === "normal") {
        // Normal: Açılış 125 TL + 45 TL/km
        totalPrice = 125 + (parseFloat(distanceKm) * 45); 
        serviceName = "Normal Kurye";
    } 
    else if (courierType === "express") {
        // Ekspres: Açılış 200 TL + 50 TL/km
        totalPrice = 200 + (parseFloat(distanceKm) * 50);
        serviceName = "Ekspres Kurye";
    } 
    else if (courierType === "vip") {
        // VIP: Açılış 250 TL + 60 TL/km
        totalPrice = 250 + (parseFloat(distanceKm) * 60);
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
    
    // WhatsApp Linkini Oluştur (Seçilen numarayı kullan)
    const msg = `Merhaba, web sitenizden fiyat teklifi aldım.\n\n🚀 *Hizmet:* ${serviceName}\n📦 *İçerik:* ${shipmentType}\n📍 *Nereden:* ${pickupAddress}\n📍 *Nereye:* ${deliveryAddress}\n🛣️ *Mesafe:* ${distanceKm.toFixed(1)} km\n💰 *Tahmini Tutar:* ${totalPrice} TL${whatsappNote}`;
    
    whatsappLink.href = `https://wa.me/${selectedWhatsapp}?text=${encodeURIComponent(msg)}`;
};


/**
 * Google Maps API'yi tetikler, mesafeyi alır ve fiyatı günceller.
 */
const calculateDistanceAndPrice = (e) => {
    e.preventDefault();

    const pickupVal = document.querySelector('input[name="pickup"]').value;
    const deliveryVal = document.querySelector('input[name="delivery"]').value;

    if (!pickupVal || !deliveryVal) {
        // Eğer adresler boşsa, zaten otomatik güncelleme yapamayız.
        priceResult.classList.add("hidden");
        return;
    }

    pickupAddress = pickupVal;
    deliveryAddress = deliveryVal;

    const submitBtn = priceForm.querySelector("button");
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Hesaplanıyor...";
    submitBtn.disabled = true;

    // Google Maps API isteği
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

            // Mesafeyi global değişkene kaydet (Otomatik güncelleme için)
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
        updatePriceDisplay(currentDistanceKm); 
    }
});

// YENİ EKLEME: WhatsApp Seçimi değiştiğinde linki otomatik güncelle
whatsappChooser?.addEventListener("change", () => {
    // Eğer daha önce mesafe hesaplandıysa
    if (currentDistanceKm > 0) {
        updatePriceDisplay(currentDistanceKm); // Sadece linki güncellemek için fiyatı tekrar hesapla/göster
    }
});


// Mobil Menü ve Toast Mantığı (mevcut yapıya uygun)
const closeMenu = () => {
    document.body.classList.remove("nav-open");
    menuToggle?.setAttribute("aria-expanded", "false");
};

menuToggle?.addEventListener("click", () => {
    const isOpen = document.body.classList.toggle("nav-open");
    menuToggle.setAttribute("aria-expanded", isOpen.toString());
});

document.addEventListener("click", (e) => {
    if (document.body.classList.contains("nav-open") && 
        !e.target.closest(".nav-panel") && 
        !e.target.closest(".menu-toggle")) {
        closeMenu();
    }
});

document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", closeMenu);
});


// Toast uyarıları (varsayılan toast fonksiyonlarını kaldırdım, sadece dinleyicileri bıraktım)
const notifyTriggers = document.querySelectorAll(".notify-trigger");
notifyTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
        // İstenirse buraya bir uyarı gösterme fonksiyonu eklenebilir.
    });
});


// Google Maps API'nin initMap fonksiyonunu bulması için zorunlu
window.initMap = initMap;
