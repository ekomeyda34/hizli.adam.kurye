const menuToggle = document.querySelector(".menu-toggle");
const priceForm = document.getElementById("priceForm");
const priceResult = document.getElementById("priceResult");
const distanceField = document.getElementById("distance");
const priceField = document.getElementById("price");
const koliWarning = document.getElementById("koliWarning");
const whatsappLink = document.getElementById("whatsappLink");

let pickupAutocomplete;
let deliveryAutocomplete;
let directionsService;

// 1. Google Maps Başlatma Fonksiyonu
function initMap() {
    directionsService = new google.maps.DirectionsService();
    
    const pickupInput = document.querySelector('input[name="pickup"]');
    const deliveryInput = document.querySelector('input[name="delivery"]');
    
    // Sadece Türkiye sınırlarında arama yap
    const options = {
        componentRestrictions: { country: "tr" },
        fields: ["geometry", "name"],
        types: ["geocode", "establishment"]
    };

    if (pickupInput && deliveryInput) {
        pickupAutocomplete = new google.maps.places.Autocomplete(pickupInput, options);
        deliveryAutocomplete = new google.maps.places.Autocomplete(deliveryInput, options);
    }
}

// 2. Mobil Menü Mantığı
menuToggle?.addEventListener("click", (e) => {
    e.stopPropagation();
    document.body.classList.toggle("nav-open");
});

// Sayfa içinde boşluğa tıklanırsa menüyü kapat
document.addEventListener("click", (e) => {
    if (document.body.classList.contains("nav-open") && 
        !e.target.closest(".nav-panel") && 
        !e.target.closest(".menu-toggle")) {
        document.body.classList.remove("nav-open");
    }
});

// Menü linkine tıklanırsa menüyü kapat
document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", () => {
        document.body.classList.remove("nav-open");
    });
});

// 3. Fiyat Hesaplama Mantığı
priceForm?.addEventListener("submit", (e) => {
    e.preventDefault(); // Sayfa yenilenmesini engelle

    const pickupVal = document.querySelector('input[name="pickup"]').value;
    const deliveryVal = document.querySelector('input[name="delivery"]').value;
    const courierType = document.getElementById("courierType").value; // Hizmet Tipi
    const shipmentType = document.getElementById("shipmentType").value; // Gönderi Tipi

    if (!pickupVal || !deliveryVal) {
        alert("Lütfen çıkış ve varış adreslerini giriniz.");
        return;
    }

    const submitBtn = priceForm.querySelector("button");
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Hesaplanıyor...";
    submitBtn.disabled = true;

    // Google Servisine İstek At
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
            // Mesafeyi al ve KM'ye çevir
            const distanceMeters = result.routes[0].legs[0].distance.value;
            let distanceKm = (distanceMeters / 1000).toFixed(1);
            
            // Minimum mesafe 1 km olsun
            if (parseFloat(distanceKm) < 1) { distanceKm = 1; }

            let totalPrice = 0;
            let serviceName = "";

            // --- SENİN BELİRLEDİĞİN FİYAT TARİFESİ ---
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

            // Fiyatı tam sayı yap
            totalPrice = Math.ceil(totalPrice);

            // Sonuçları Ekrana Yaz
            distanceField.textContent = `${distanceKm} km`;
            priceField.textContent = totalPrice.toLocaleString('tr-TR');
            
            // KOLİ UYARISI VE NOT
            let whatsappNote = "";
            if (shipmentType === "Koli") {
                koliWarning.classList.remove("hidden");
                whatsappNote = "\n⚠️ *NOT:* Gönderi 'Koli' olduğu için ürün görselini iletiyorum. Fiyat güncellenebilir.";
            } else {
                koliWarning.classList.add("hidden");
            }

            // Sonuç kutusunu göster
            priceResult.classList.remove("hidden");
            
            // WhatsApp Linkini Oluştur
            const msg = `Merhaba, web sitenizden fiyat teklifi aldım.\n\n🚀 *Hizmet:* ${serviceName}\n📦 *İçerik:* ${shipmentType}\n📍 *Nereden:* ${pickupVal}\n📍 *Nereye:* ${deliveryVal}\n🛣️ *Mesafe:* ${distanceKm} km\n💰 *Tahmini Tutar:* ${totalPrice} TL${whatsappNote}`;
            
            whatsappLink.href = `https://wa.me/905403022628?text=${encodeURIComponent(msg)}`;

        } else {
            alert("Mesafe hesaplanamadı. Lütfen adresleri listeden seçerek tekrar deneyiniz.");
        }
    });
});

// Bu satır GitHub üzerinde çalışması için çok önemlidir:
window.initMap = initMap;
