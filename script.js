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
    }
}

// MOBİL MENÜ DÜZELTMESİ
// Tıklanınca body'ye 'nav-open' class'ı ekler/kaldırır.
menuToggle?.addEventListener("click", (e) => {
    e.stopPropagation(); // Tıklamanın kaybolmasını engelle
    document.body.classList.toggle("nav-open");
});

// Sayfa içinde bir yere tıklanınca menüyü kapat (Kullanıcı deneyimi için)
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

// FİYAT HESAPLAMA
priceForm?.addEventListener("submit", (e) => {
    e.preventDefault();

    const pickupVal = document.querySelector('input[name="pickup"]').value;
    const deliveryVal = document.querySelector('input[name="delivery"]').value;
    const shipmentType = document.getElementById("shipmentType").value; // Seçilen tip (Evrak/Koli)

    if (!pickupVal || !deliveryVal) {
        alert("Lütfen adresleri giriniz.");
        return;
    }

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
            const distanceKm = (distanceMeters / 1000).toFixed(1);

            // Fiyat Formülü: 125 TL Açılış + 45 TL/km
            let totalPrice = 125 + (parseFloat(distanceKm) * 45);
            totalPrice = Math.ceil(totalPrice);

            // Sonuçları Yaz
            distanceField.textContent = `${distanceKm} km`;
            priceField.textContent = totalPrice.toLocaleString('tr-TR');
            
            // KOLİ KONTROLÜ
            let whatsappNote = "";
            if (shipmentType === "Koli") {
                koliWarning.classList.remove("hidden"); // Uyarıyı göster
                whatsappNote = "\n⚠️ Not: Gönderim Koli/Paket oldugu için fotoğraf iletecegim.";
            } else {
                koliWarning.classList.add("hidden"); // Uyarıyı gizle
            }

            priceResult.classList.remove("hidden");
            
            // WhatsApp Mesajı Oluştur
            const msg = `Merhaba, web sitenizden fiyat aldım.\n\n📍 Nereden: ${pickupVal}\n📍 Nereye: ${deliveryVal}\n📦 Tip: ${shipmentType}\n🛣️ Mesafe: ${distanceKm} km\n💰 Tutar: ${totalPrice} TL${whatsappNote}`;
            
            whatsappLink.href = `https://wa.me/905403022628?text=${encodeURIComponent(msg)}`;

        } else {
            alert("Mesafe hesaplanamadı. Adresleri kontrol ediniz.");
        }
    });
});

window.initMap = initMap;