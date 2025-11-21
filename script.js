const priceForm = document.getElementById("priceForm");
const priceResult = document.getElementById("priceResult");
const distanceField = document.getElementById("distance");
const priceField = document.getElementById("price");
const packageNote = document.getElementById("packageNote");
const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toastMessage");
const notifyTriggers = document.querySelectorAll(".notify-trigger");
const contactForm = document.querySelector(".contact-form");
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelectorAll(".nav-links a");
let toastTimer;
let currentCalculationResult = null;
let distanceSimulationValue = null;

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

// FİYATLANDIRMA KURALLARI
const PRICING = {
    normal: { name: "Normal Kurye", base: 125, perKm: 45 },
    express: { name: "Express Kurye", base: 200, perKm: 50 },
    vip: { name: "VIP Express Kurye", base: 250, perKm: 60 }
};

// Menü Kapatma
const closeMenu = () => {
    document.body.classList.remove("nav-open");
    menuToggle?.setAttribute("aria-expanded", "false");
};

// Toast Gösterme
const showToast = (message) => {
    clearTimeout(toastTimer);
    toastMessage.textContent = message;
    toast.classList.add("show");
    
    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
};

// Mesafeyi simüle eden fonksiyon
const generateSimulatedDistance = () => {
    return parseFloat(((Math.random() * 25) + 5).toFixed(1)); 
};

const formatDistance = (km) => `${km} km`;

// Form verilerini okuma
const getFormData = () => {
    if (!priceForm) return {};
    const data = new FormData(priceForm);
    return {
        pickup: data.get("pickup")?.toString().trim() || "Alış Adresi Belirtilmedi",
        delivery: data.get("delivery")?.toString().trim() || "Teslimat Adresi Belirtilmedi",
        serviceType: data.get("serviceType")?.toString().trim() || "normal",
        itemType: data.get("itemType")?.toString().trim() || "document",
    };
};

// Fiyat Hesaplama Fonksiyonu
const calculatePrice = ({ serviceType, itemType, distance }) => {
    const service = PRICING[serviceType] || PRICING.normal;
    let totalPrice = 0;
    
    totalPrice += service.base;

    if (distance > 1) {
        const extraDistance = distance - 1;
        totalPrice += extraDistance * service.perKm;
    }
    
    // Koliye göre ek ücret simülasyonu
    if (itemType === 'small-package') {
        totalPrice += 15;
    } else if (itemType === 'medium-package') {
        totalPrice += 30;
    } else if (itemType === 'large-package') {
        totalPrice += 50; 
    }
    
    return { 
        distance, 
        serviceType: service.name,
        itemType,
        price: Math.ceil(totalPrice)
    };
};

const showResult = ({ distance, price }) => {
    distanceField.textContent = formatDistance(distance);
    priceField.textContent = price;
    priceResult.classList.remove("hidden");
};

const buildWhatsappMessage = (payload) => {
    const itemLabel = payload.itemType === 'document' ? 'Evrak/Zarf/Dosya' : 
                      payload.itemType === 'small-package' ? 'Küçük Koli' :
                      payload.itemType === 'medium-package' ? 'Orta Koli' :
                      payload.itemType === 'large-package' ? 'Büyük Koli' : 'Belirtilmedi';

    const packageWarning = payload.itemType.includes('package') 
        ? "\n\n!!! Koli/Paket için Ölçü ve Resim Onayı Bekleniyor !!!" 
        : "";

    return (
        `YENİ KURYE SİPARİŞ TALEBİ:\n` +
        `----------------------------------------\n` +
        `Hizmet Tipi: ${payload.serviceType}\n` +
        `Gönderi Tipi: ${itemLabel}\n` +
        `Alış Adresi: ${payload.pickup}\n` +
        `Teslimat Adresi: ${payload.delivery}\n` +
        `Hesaplanan Mesafe: ${payload.distance} km\n` +
        `\n` +
        `TAHMİNİ FİYAT: ${payload.price} TL\n` +
        `----------------------------------------\n` +
        `Lütfen teyit için bekleyiniz.${packageWarning}`
    );
};

const submitToWhatsapp = (payload) => {
    const whatsappUrl = `https://wa.me/905403022628?text=${encodeURIComponent(buildWhatsappMessage(payload))}`;
    window.open(whatsappUrl, "_blank");
};

// OTOMATİK HESAPLAMA VE GÖRÜNTÜLEME
const updateCalculationAndDisplay = (isInitial = false) => {
    if (!priceForm) return;

    const data = getFormData();
    
    const isAddressChanged = data.pickup !== currentCalculationResult?.pickup || data.delivery !== currentCalculationResult?.delivery;
    const isServiceChanged = data.serviceType !== currentCalculationResult?.serviceType;

    if (isInitial || isAddressChanged || isServiceChanged) {
        distanceSimulationValue = generateSimulatedDistance();
    }
    
    const calculationPayload = { ...data, distance: distanceSimulationValue };
    const result = calculatePrice(calculationPayload); 
    
    currentCalculationResult = { ...data, ...result }; 
    showResult(currentCalculationResult);

    if (packageNote) {
        if (data.itemType.includes('package')) {
            packageNote.classList.remove("hidden");
        } else {
            packageNote.classList.add("hidden");
        }
    }
};

const initializeFormListeners = () => {
    if (!priceForm) return;

    const formElements = priceForm.querySelectorAll("input, select");
    formElements.forEach(element => {
        element.addEventListener(element.tagName === 'SELECT' ? "change" : "input", () => {
             setTimeout(() => updateCalculationAndDisplay(false), 100);
        });
    });
    
    updateCalculationAndDisplay(true);
};

// MODAL İŞLEMLERİ
const openChoiceModal = (actionType) => {
    const choices = CONTACT_NUMBERS[actionType];
    const titleText = actionType === 'whatsapp' ? 'Lütfen WhatsApp hattınızı seçin' : 'Lütfen aramak istediğiniz numarayı seçin';

    choiceTitle.textContent = titleText;
    choiceOptionsContainer.innerHTML = '';

    choices.forEach(choice => {
        const link = document.createElement('a');
        link.href = choice.prefix + choice.number;
        link.target = actionType === 'whatsapp' ? '_blank' : '_self';
        link.className = `choice-option ${actionType}`;
        link.textContent = choice.label;
        
        link.addEventListener('click', () => {
            const message = actionType === 'whatsapp' ? `WhatsApp hattı ${choice.number} açılıyor.` : `Numara ${choice.number} aranıyor.`;
            showToast(message);
            closeChoiceModal();
        });

        choiceOptionsContainer.appendChild(link);
    });

    choiceModal.classList.remove('hidden');
    setTimeout(() => choiceModal.classList.add('show'), 10); 
};

const closeChoiceModal = () => {
    choiceModal.classList.remove('show');
    setTimeout(() => choiceModal.classList.add('hidden'), 300); 
};


// TÜM BAŞLANGIÇ İŞLEMLERİ (DOMContentLoaded)
document.addEventListener('DOMContentLoaded', () => {
    // 1. Fiyat Hesaplama Formu Listener'ları (Sadece index.html'de çalışır)
    initializeFormListeners();

    // 2. Mobil Menü Listener'ı (Tüm sayfalarda çalışır)
    if (menuToggle) {
        menuToggle.addEventListener("click", () => {
            const isOpen = document.body.classList.toggle("nav-open");
            menuToggle.setAttribute("aria-expanded", isOpen.toString());
        });
    }

    // Navigasyon linklerine tıklandığında menüyü kapat
    navLinks.forEach((link) => {
        link.addEventListener("click", () => {
            if (window.innerWidth <= 768) {
                closeMenu();
            }
        });
    });

    // 3. Mobil Aksiyon Tetikleyicileri (WhatsApp/Ara Modalı)
    mobileActionTriggers.forEach(trigger => {
        trigger.addEventListener('click', (event) => {
            event.preventDefault(); 
            const actionType = trigger.dataset.action;
            if (actionType) {
                openChoiceModal(actionType);
            }
        });
    });

    // Modal Kapatma Listener'ları
    if (closeModalButton) closeModalButton.addEventListener('click', closeChoiceModal);
    if (choiceModal) {
        choiceModal.addEventListener('click', (event) => {
            if (event.target.id === 'choiceModal') {
                closeChoiceModal();
            }
        });
    }

    // 4. Form Submit Listener'ları
    if (priceForm) {
        priceForm.addEventListener("submit", (event) => {
            event.preventDefault();
            
            if (currentCalculationResult) {
                const submitButton = priceForm.querySelector("button[type='submit']");
                submitButton.disabled = true;
                submitButton.textContent = "WhatsApp'a Yönlendiriliyor...";
                
                setTimeout(() => {
                    submitToWhatsapp(currentCalculationResult);
                    submitButton.disabled = false;
                    submitButton.textContent = "WhatsApp ile Sipariş Ver";
                }, 300);
            } else {
                showToast("Lütfen adres bilgilerini doldurunuz.");
            }
        });
    }

    if (contactForm) {
        contactForm.addEventListener("submit", (event) => {
            event.preventDefault();
            const data = new FormData(contactForm);
            const company = data.get("company")?.toString().trim() || "Şirket";
            showToast(`${company} kaydedildi. Operasyon ekibi kısa sürede dönüş yapacak.`);
            contactForm.reset();
        });
    }
});
