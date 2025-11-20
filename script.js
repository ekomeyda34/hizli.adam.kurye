const priceForm = document.getElementById("priceForm");
const priceResult = document.getElementById("priceResult");
const distanceField = document.getElementById("distance");
const priceField = document.getElementById("price");
const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toastMessage");
const notifyTriggers = document.querySelectorAll(".notify-trigger");
const contactForm = document.querySelector(".contact-form");
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelectorAll(".nav-links a");
let toastTimer;

// Yeni Modal Elementleri ve Numaralar
const mobileActionTriggers = document.querySelectorAll(".mobile-action-trigger");
const choiceModal = document.getElementById("choiceModal");
const choiceTitle = document.getElementById("choiceTitle");
const choiceOptionsContainer = document.getElementById("choiceOptions");
const closeModalButton = document.getElementById("closeModal");

const CONTACT_NUMBERS = {
    whatsapp: [
        { label: "WhatsApp 1 (540 302 26 28)", number: "905403022628", prefix: "https://wa.me/" },
        { label: "WhatsApp 2 (542 302 26 28)", number: "905423022628", prefix: "https://wa.me/" }
    ],
    call: [
        { label: "Bizi Arayın (540 302 26 28)", number: "05403022628", prefix: "tel:" },
        { label: "Bizi Arayın (542 302 26 28)", number: "05423022628", prefix: "tel:" }
    ]
};

// YENİ FİYATLANDIRMA KURALLARI
const PRICING = {
    normal: { name: "Normal Kurye", base: 125, perKm: 45 },
    express: { name: "Express Kurye", base: 200, perKm: 50 },
    vip: { name: "VIP Express Kurye", base: 250, perKm: 60 }
};

// Mesafeyi simüle eden yeni fonksiyon (Gerçek bir harita API'si olmadan çalışmak için)
const generateSimulatedDistance = () => {
    // İstanbul içi 5 km ile 30 km arasında rastgele bir mesafe (küsuratlı)
    return parseFloat(((Math.random() * 25) + 5).toFixed(1)); 
};

const formatDistance = (km) => `${km} km`;

const showToast = (message) => {
    clearTimeout(toastTimer);
    toastMessage.textContent = message;
    toast.classList.add("show");
    
    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
};

const calculatePrice = ({ pickup, delivery, serviceType, itemType }) => {
    // Simüle edilmiş mesafeyi al
    const distance = generateSimulatedDistance(); 
    
    const service = PRICING[serviceType] || PRICING.normal;
    let totalPrice = 0;
    
    // Açılış ücreti (İlk 1 km dahil)
    totalPrice += service.base;

    // Kalan her km için ek ücret (1 km üzeri için)
    if (distance > 1) {
        const extraDistance = distance - 1;
        totalPrice += extraDistance * service.perKm;
    }
    
    // Koli için ek ücret
    if (itemType === 'package') {
        totalPrice += 15; // Koli/Paket için 15 TL ek ücret
    }
    
    return { 
        pickup, 
        delivery, 
        distance, 
        serviceType: service.name,
        itemType,
        price: Math.ceil(totalPrice) // Fiyatı üste yuvarla
    };
};

const buildWhatsappMessage = (payload) => {
    const itemLabel = payload.itemType === 'package' ? 'Koli/Paket' : 'Evrak/Doküman';

    return (
        `YENİ HESAPLANAN KURYE TALEBİ:\n` +
        `----------------------------------------\n` +
        `Hizmet Tipi: ${payload.serviceType}\n` +
        `Gönderi Tipi: ${itemLabel}\n` +
        `Alış Adresi: ${payload.pickup}\n` +
        `Teslimat Adresi: ${payload.delivery}\n` +
        `Hesaplanan Mesafe: ${payload.distance} km\n` +
        `\n` +
        `TAHMİNİ FİYAT: ${payload.price} TL\n` +
        `----------------------------------------\n` +
        `Lütfen teyit için bekleyiniz.`
    );
};

const submitToWhatsapp = (payload) => {
    // Fiyat hesaplama formu sadece ilk WhatsApp numarasına gönderim yapar
    const whatsappUrl = `https://wa.me/905403022628?text=${encodeURIComponent(buildWhatsappMessage(payload))}`;
    window.open(whatsappUrl, "_blank");
};

const showResult = ({ distance, price }) => {
    distanceField.textContent = formatDistance(distance);
    priceField.textContent = price;
    priceResult.classList.remove("hidden");
    priceForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// FORM SUBMIT OLAYI GÜNCELLENDİ
priceForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = new FormData(priceForm);
    const pickup = data.get("pickup")?.toString().trim() || "Belirtilmedi";
    const delivery = data.get("delivery")?.toString().trim() || "Belirtilmedi";
    const serviceType = data.get("serviceType")?.toString().trim() || "normal";
    const itemType = data.get("itemType")?.toString().trim() || "document";

    const submitButton = priceForm.querySelector("button[type='submit']");
    submitButton.disabled = true;
    submitButton.textContent = "Hesaplanıyor...";

    setTimeout(() => {
        // Yeni parametrelerle hesaplamayı çalıştır
        const result = calculatePrice({ pickup, delivery, serviceType, itemType });
        showResult(result);
        submitToWhatsapp(result); // Hesaplanan sonuçları WhatsApp'a gönder

        submitButton.disabled = false;
        submitButton.textContent = "Fiyatı Hesapla";
    }, 600);
});

contactForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(contactForm);
    const company = data.get("company")?.toString().trim() || "Şirket";
    showToast(`${company} kaydedildi. Operasyon ekibi kısa sürede dönüş yapacak.`);
    contactForm.reset();
});

// NOT: Tüm HTML dosyalarındaki sabit WhatsApp/Ara butonları da 
// artık JS ile çalışacak şekilde güncellenmiştir (mobile-action-trigger class'ı ile).

notifyTriggers.forEach((trigger) => {
    // Eski sabit linkli butonlar için:
    if(trigger.tagName === 'A' && !trigger.classList.contains('mobile-action-trigger')) {
         trigger.addEventListener("click", () => {
            const message = trigger.dataset.message;
            if (message) {
                showToast(message);
            }
        });
    }
});

const closeMenu = () => {
    document.body.classList.remove("nav-open");
    menuToggle?.setAttribute("aria-expanded", "false");
};

menuToggle?.addEventListener("click", () => {
    const isOpen = document.body.classList.toggle("nav-open");
    menuToggle.setAttribute("aria-expanded", isOpen.toString());
});

navLinks.forEach((link) => {
    link.addEventListener("click", () => {
        if (window.innerWidth <= 768) {
            closeMenu();
        }
    });
});

// MODAL İŞLEMLERİ (Önceki istekten kalan)

// Modal'ı açma fonksiyonu
const openChoiceModal = (actionType) => {
    const choices = CONTACT_NUMBERS[actionType];
    const titleText = actionType === 'whatsapp' ? 'Lütfen WhatsApp hattınızı seçin' : 'Lütfen aramak istediğiniz numarayı seçin';

    choiceTitle.textContent = titleText;
    choiceOptionsContainer.innerHTML = ''; // Önceki seçenekleri temizle

    choices.forEach(choice => {
        const link = document.createElement('a');
        link.href = choice.prefix + choice.number;
        link.target = actionType === 'whatsapp' ? '_blank' : '_self';
        link.className = `choice-option ${actionType}`;
        link.textContent = choice.label;
        
        // Tıklamada toast gösterme
        link.addEventListener('click', () => {
            const message = actionType === 'whatsapp' ? `WhatsApp hattı ${choice.number} açılıyor.` : `Numara ${choice.number} aranıyor.`;
            showToast(message);
            closeChoiceModal();
        });

        choiceOptionsContainer.appendChild(link);
    });

    choiceModal.classList.remove('hidden');
    // Animasyon için kısa bir gecikme
    setTimeout(() => choiceModal.classList.add('show'), 10); 
};

// Modal'ı kapatma fonksiyonu
const closeChoiceModal = () => {
    choiceModal.classList.remove('show');
    // Animasyon tamamlandıktan sonra gizle
    setTimeout(() => choiceModal.classList.add('hidden'), 300); 
};

// Mobil aksiyon tetikleyicilerini dinle
mobileActionTriggers.forEach(trigger => {
    trigger.addEventListener('click', (event) => {
        event.preventDefault(); // Varsayılan link aksiyonunu engelle
        const actionType = trigger.dataset.action;
        if (actionType) {
            openChoiceModal(actionType);
        }
    });
});

// Modal kapatma butonu
closeModalButton.addEventListener('click', closeChoiceModal);

// Modal dışına tıklayınca kapatma
choiceModal.addEventListener('click', (event) => {
    // Sadece modalın kendisine tıklanırsa kapat (içeriğe tıklanırsa değil)
    if (event.target.id === 'choiceModal') {
        closeChoiceModal();
    }
});
