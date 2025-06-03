// cart.js - Lógica centralizada del carrito con soporte para español e inglés

const cart = {}; // Objeto para almacenar productos por nombre, precio y cantidad
const cartItemsList = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const cartCountElement = document.querySelector(".cart-count");
const cartDropdown = document.getElementById("cartDropdown");
const clearCartBtn = document.getElementById("clearCart");
const checkoutBtn = document.getElementById("checkoutBtn");
let total = 0;

// Objeto de traducciones para mensajes y textos de la interfaz del carrito
const translations = {
    es: {
        remove: "Eliminar",
        emptyCartAlert: "El carrito está vacío. Añade productos antes de finalizar la compra.",
        thankYouAlert: (total) => `Gracias por tu compra. Total a pagar: ${total}€`,
        messageSentAlert: "Mensaje enviado. Pronto nuestro equipo de soporte contactará con usted.",
        clearCartButton: "Vaciar carrito",
        checkoutButton: "Finalizar compra",
        pricePrefix: "Precio: ",
        // Textos específicos para la sección "Mi carrito"
        cartTotalLabel: "Total: "
    },
    en: {
        remove: "Remove",
        emptyCartAlert: "Your cart is empty. Please add products before checking out.",
        thankYouAlert: (total) => `Thank you for your purchase. Total to pay: ${total}€`,
        messageSentAlert: "Message sent. Our support team will contact you soon.",
        clearCartButton: "Empty Cart",
        checkoutButton: "Checkout",
        pricePrefix: "Price: ",
        // Textos específicos para la sección "My Cart"
        cartTotalLabel: "Total: "
    }
};

// Función para determinar el idioma actual de la página
function getCurrentLanguage() {
    // Comprueba el atributo 'lang' del elemento <html>
    const htmlLang = document.documentElement.lang;
    if (htmlLang === 'es' || htmlLang === 'en') {
        return htmlLang;
    }
    // Fallback: si el atributo lang no está presente o es inesperado,
    // intenta inferir del nombre del archivo (ej. _en.html)
    if (window.location.pathname.includes('_en.html')) {
        return 'en';
    }
    return 'es'; // Idioma por defecto si no se puede determinar
}

// Función para obtener una traducción por clave
function getTranslation(key, ...args) {
    const lang = getCurrentLanguage();
    const text = translations[lang][key];
    if (typeof text === 'function') {
        return text(...args);
    }
    return text;
}

// Guarda el carrito y el total en localStorage
function saveCartToLocalStorage() {
    localStorage.setItem("cart", JSON.stringify(cart));
    localStorage.setItem("total", total.toString());
}

// Carga el carrito y el total desde localStorage
function loadCartFromLocalStorage() {
    const savedCart = localStorage.getItem("cart");
    const savedTotal = localStorage.getItem("total");

    if (savedCart) {
        Object.assign(cart, JSON.parse(savedCart));
    }
    if (savedTotal) {
        total = parseFloat(savedTotal);
    }
    updateCartUI(); // Actualiza la interfaz del carrito después de cargar
}

// Llama a esta función al cargar la página para inicializar el carrito
loadCartFromLocalStorage();

// Función para añadir productos al carrito
document.querySelectorAll(".btn").forEach((button) => {
    button.addEventListener("click", () => {
        const product = button.closest(".product") || button.closest(".novedades-product") || button.closest(".outlet-product");
        if (!product) return; // Asegurarse de que se encontró un producto

        const productName = product.querySelector("h2").textContent;
        let productPrice;

        // Lógica para obtener el precio dependiendo del tipo de producto/página
        if (product.querySelector(".discount-price")) { // Producto de outlet
            productPrice = parseFloat(product.querySelector(".discount-price").textContent.replace("€", ""));
        } else if (product.querySelector(".price")) { // Producto de novedades (con clase .price)
            productPrice = parseFloat(product.querySelector(".price").textContent.replace("€", ""));
        } else { // Productos normales (con precio en un <p> sin clase específica)
            // Manejar tanto "Precio: " como "Price: "
            const priceText = product.querySelector("p").textContent;
            productPrice = parseFloat(priceText.replace(getTranslation('pricePrefix'), '').replace(translations['en']['pricePrefix'], '').replace("€", ""));
        }

        if (isNaN(productPrice)) {
            console.error("No se pudo obtener el precio del producto:", productName);
            return;
        }

        if (cart[productName]) {
            cart[productName].quantity += 1; // Incrementa la cantidad si ya existe
        } else {
            cart[productName] = { price: productPrice, quantity: 1 }; // Añade un nuevo producto
        }

        total += productPrice;
        updateCartUI();
        saveCartToLocalStorage();
    });
});

// Función para actualizar la interfaz de usuario del carrito
function updateCartUI() {
    cartItemsList.innerHTML = ""; // Limpia los productos existentes en la lista
    let itemCount = 0;

    for (const [name, product] of Object.entries(cart)) {
        const cartItem = document.createElement("li");
        cartItem.classList.add("cart-item");

        cartItem.innerHTML = `
            <span>${name} - ${product.price.toFixed(2)}€ x ${product.quantity}</span>
            <button onclick="removeFromCart('${name}')">${getTranslation('remove')}</button>
        `;
        cartItemsList.appendChild(cartItem);

        itemCount += product.quantity;
    }

    cartCountElement.textContent = itemCount;
    cartTotal.textContent = `${total.toFixed(2)}€`;

    // Actualiza el texto de los botones del carrito y la etiqueta del total
    if (clearCartBtn) clearCartBtn.textContent = getTranslation('clearCartButton');
    if (checkoutBtn) checkoutBtn.textContent = getTranslation('checkoutButton');
    const cartTotalLabelElement = document.querySelector("#cartTotal").previousElementSibling;
    if (cartTotalLabelElement && cartTotalLabelElement.tagName === 'P') {
        cartTotalLabelElement.textContent = getTranslation('cartTotalLabel');
    }
}

// Función para eliminar productos del carrito
function removeFromCart(productName) {
    if (cart[productName]) {
        total -= cart[productName].price * cart[productName].quantity;
        delete cart[productName]; // Elimina el producto del carrito
        updateCartUI();
        saveCartToLocalStorage();
    }
}

// Event listener para vaciar el carrito
if (clearCartBtn) {
    clearCartBtn.addEventListener("click", () => {
        for (const productName in cart) {
            delete cart[productName];
        }
        total = 0;
        updateCartUI();
        saveCartToLocalStorage();
    });
}

// Event listener para mostrar/ocultar el carrito
document.querySelector(".cart-icon").addEventListener("click", () => {
    if (cartDropdown) {
        cartDropdown.style.display = cartDropdown.style.display === "block" ? "none" : "block";
    }
});

// Event listener para finalizar compra
if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
        if (Object.keys(cart).length === 0) {
            alert(getTranslation('emptyCartAlert'));
            return;
        }

        // Obtener el idioma actual para redirigir a la página de pago correcta
        const currentLang = getCurrentLanguage();
        const paymentPage = currentLang === 'es' ? 'pago.html' : 'pago_en.html';

        alert(getTranslation('thankYouAlert', total.toFixed(2))); 
        
        // No limpiamos el carrito aquí. Lo limpiará la página de pago
        // después de que el usuario "finalice el pago" en esa página.

        // Redirigir a la página de pago
        window.location.href = paymentPage;
    });
}

// Event listener para el formulario de contacto (si existe en la página)
const contactForm = document.querySelector("form[action='submit_contact_form.php']");
if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
        event.preventDefault(); // Previene el envío por defecto del formulario
        alert(getTranslation('messageSentAlert'));
        event.target.reset(); // Resetea los campos del formulario
    });
}