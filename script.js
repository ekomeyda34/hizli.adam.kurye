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

const generateRandomDistance = () => Math.floor(Math.random() * 20) + 1;
const formatDistance = (km) => `${km} km`;

const showToast = (message) => {
    clearTimeout(toastTimer);
    toastMessage.textContent = message;
    toast.classList.add("show");
    
    // Auto hide after 3 seconds
    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
};

const buildWhatsappMessage = ({ pickup, delivery, distance, price }) => (
    `Yeni Kurye Talebi:\n` +
    `Alış Adresi: ${pickup}\n` +
    `Teslimat Adresi: ${delivery}\n` +
    `Mesafe: ${distance} km\n` +
    `Fiyat: ${price} TL`
);

const submitToWhatsapp = (payload) => {
    // Fiyat hesaplama formu sadece ilk WhatsApp numarasına gönderim yapar
    const whatsappUrl = `https://wa.me/905403022628?text=${encodeURIComponent(buildWhatsappMessage(payload))}`;
    window.open(whatsappUrl, "_blank");
};

const calculatePrice = ({ pickup, delivery }) => {
    const distance = generateRandomDistance();
    const basePrice = distance * 5;
    const baseDeliveryTime = 40;
    const price = Math.floor(basePrice + baseDeliveryTime + (Math.random() * 20));
    return { pickup, delivery, distance, price };
};

const showResult = ({ distance, price }) => {
    distanceField.textContent = formatDistance(distance);
    priceField.textContent = price;
    priceResult.classList.remove("hidden");
    priceForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

priceForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = new FormData(priceForm);
    const pickup = data.get("pickup")?.toString().trim() || "Belirtilmedi";
    const delivery = data.get("delivery")?.toString().trim() || "Belirtilmedi";

    const submitButton = priceForm.querySelector("button[type='submit']");
    submitButton.disabled = true;
    submitButton.textContent = "Hesaplanıyor...";

    setTimeout(() => {
        const result = calculatePrice({ pickup, delivery });
        showResult(result);
        submitToWhatsapp(result);

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

notifyTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
        const message = trigger.dataset.message;
        if (message) {
            showToast(message);
        }
    });
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
            // WhatsApp için toast mesajı
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
