
/* =========================================
   VIVERO — FUNCIONALIDADES DO SITE
   ========================================= */

/* -----------------------------------------
   1. PRODUTOS
   ----------------------------------------- */

// Produtos demonstrativos.
// Os nomes e preços poderão ser alterados
// quando definirmos o catálogo definitivo.

let products = [];

/* -----------------------------------------
   2. ELEMENTOS DO HTML
   ----------------------------------------- */

const productGrid = document.getElementById("product-grid");
const searchInput = document.getElementById("product-search");
const filterButtons = document.querySelectorAll(".filter-button");

const cartOverlay = document.getElementById("cart-overlay");
const openCartButton = document.getElementById("open-cart");
const closeCartButton = document.getElementById("close-cart");

const cartItemsContainer = document.getElementById("cart-items");
const cartCountElement = document.getElementById("cart-count");
const cartTotalElement = document.getElementById("cart-total");

const checkoutButton = document.getElementById("checkout-button");

const menuButton = document.getElementById("menu-button");
const navigation = document.querySelector(".navigation");

const newsletterForm = document.getElementById("newsletter-form");
const newsletterMessage = document.getElementById("newsletter-message");


/* -----------------------------------------
   3. CONFIGURAÇÕES
   ----------------------------------------- */

const STORAGE_KEY = "vivero-cart";

let activeFilter = "todos";
let searchTerm = "";
let cart = [];


function formatPrice(value) {
    return value.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}


// Evita problemas ao recuperar dados do navegador.
function loadCart() {
    try {
        const savedCart = JSON.parse(
            localStorage.getItem(STORAGE_KEY)
        );

        if (!Array.isArray(savedCart)) {
            return [];
        }

        const validatedCart = [];

        savedCart.forEach(item => {
            const product = products.find(
                product => product.id === Number(item.id)
            );

            const quantity = Number(item.quantity);

            if (
                product &&
                Number.isInteger(quantity) &&
                quantity > 0
            ) {
                const existing = validatedCart.find(
                    entry => entry.id === product.id
                );

                if (existing) {
                    existing.quantity += quantity;
                } else {
                    validatedCart.push({
                        id: product.id,
                        quantity
                    });
                }
            }
        });

        return validatedCart;

    } catch (error) {
        console.warn(
            "Não foi possível recuperar a sacola:",
            error
        );

        return [];
    }
}


function saveCart() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(cart)
        );
    } catch (error) {
        console.warn(
            "Não foi possível salvar a sacola:",
            error
        );
    }
}


/* -----------------------------------------
   4. EXIBIÇÃO DOS PRODUTOS
   ----------------------------------------- */

function renderProducts() {

    if (!productGrid) return;

    const filteredProducts = products.filter(product => {

        const matchesCategory =
            activeFilter === "todos" ||
            product.category === activeFilter;

        const matchesSearch =
            product.name
                .toLowerCase()
                .includes(searchTerm);

        return matchesCategory && matchesSearch;
    });


    if (filteredProducts.length === 0) {
        productGrid.innerHTML = `
            <p class="no-products">
                Nenhum produto encontrado.
                Tente outra busca.
            </p>
        `;

        return;
    }


    
    
    productGrid.innerHTML = filteredProducts.map(product => `

        <article class="product-card">

            <a
                href="produto.html?id=${product.id}"
                class="product-image product-image-link"
                aria-label="Ver detalhes de ${product.name}"
                style="--product-color: ${product.color};"
            >

                <span class="product-index">
                    0${product.id}
                </span>

                ${product.image
                    ? `
                        <img
                            class="product-photo"
                            src="${product.image}"
                            alt="${product.name}"
                            loading="lazy"
                        >
                    `
                    : `
                        <div class="product-visual product-visual--${product.visual}">
                            <span class="product-handle"></span>
                            <span class="product-body"></span>
                        </div>
                    `
                }

                <span class="product-image-caption">
                    VIVERO OBJECTS
                </span>

            </a>

            <div class="product-info">

                <div class="product-heading">

                    <span class="product-category">
                        ${product.categoryLabel}
                    </span>

                    <span class="product-reference">
                        00${product.id}
                    </span>

                </div>

                <h3>
                    <a
                        href="produto.html?id=${product.id}"
                        class="product-title-link"
                    >
                        ${product.name}
                    </a>
                </h3>

                <a
                    href="produto.html?id=${product.id}"
                    class="product-details-link"
                >
                    VER DETALHES ↗
                </a>

                <div class="product-bottom">
                    <p class="product-price">
                        ${formatPrice(product.price)}
                    </p>

                    <button
                        class="add-to-cart"
                        data-add="${product.id}"
                    >
                        ADICIONAR À SACOLA +
                    </button>

                </div>

            </div>

        </article>

    `).join("");
}


/* -----------------------------------------
   5. FILTROS DO CATÁLOGO
   ----------------------------------------- */

filterButtons.forEach(button => {

    button.addEventListener("click", () => {

        activeFilter = button.dataset.filter;

        filterButtons.forEach(item => {
            item.classList.remove("active");
        });

        button.classList.add("active");

        renderProducts();

    });

});


/* -----------------------------------------
   6. BUSCA DE PRODUTOS
   ----------------------------------------- */

if (searchInput) {

    searchInput.addEventListener("input", () => {

        searchTerm = searchInput.value
            .trim()
            .toLowerCase();

        renderProducts();

    });

}


/* -----------------------------------------
   7. ADICIONAR À SACOLA
   ----------------------------------------- */

function addToCart(productId, quantity = 1) {

    const product = products.find(
        item => item.id === productId
    );

    if (!product) return;

    const existingItem = cart.find(
        item => item.id === productId
    );

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: productId,
            quantity
        });
    }

    saveCart();
    renderCart();

}


// Evento delegado: funciona mesmo após
// os produtos serem recriados pelos filtros.

if (productGrid) {

    productGrid.addEventListener("click", event => {

        const button = event.target.closest("[data-add]");

        if (!button) return;

        const productId = Number(button.dataset.add);

        addToCart(productId);

        const originalText = button.textContent;

        button.textContent = "ADICIONADO ✓";

        button.disabled = true;

        setTimeout(() => {
            button.textContent = originalText;
            button.disabled = false;
        }, 900);

    });

}



/* -----------------------------------------
   8. ATUALIZAR E REMOVER PRODUTOS DA SACOLA
   ----------------------------------------- */

function updateCartQuantity(productId, change) {

    const item = cart.find(
        item => item.id === productId
    );

    if (!item) return;

    item.quantity += change;

    // Remove o produto quando a quantidade chega a zero.
    if (item.quantity <= 0) {
        cart = cart.filter(
            item => item.id !== productId
        );
    }

    saveCart();
    renderCart();
}


function removeFromCart(productId) {

    cart = cart.filter(
        item => item.id !== productId
    );

    saveCart();
    renderCart();

}


// Eventos dos controles da sacola.

if (cartItemsContainer) {

    cartItemsContainer.addEventListener("click", event => {

        const increaseButton = event.target.closest("[data-increase]");
        const decreaseButton = event.target.closest("[data-decrease]");
        const removeButton = event.target.closest("[data-remove]");

        if (increaseButton) {
            updateCartQuantity(
                Number(increaseButton.dataset.increase),
                1
            );
            return;
        }

        if (decreaseButton) {
            updateCartQuantity(
                Number(decreaseButton.dataset.decrease),
                -1
            );
            return;
        }

        if (removeButton) {
            removeFromCart(
                Number(removeButton.dataset.remove)
            );
        }

    });

}


/* -----------------------------------------
   9. ATUALIZAR A SACOLA
   ----------------------------------------- */

function renderCart() {

    if (!cartItemsContainer) return;

    let total = 0;
    let totalQuantity = 0;


    if (cart.length === 0) {

        cartItemsContainer.innerHTML = `
            <p class="empty-cart">
                Sua sacola está vazia.
            </p>
        `;

    } else {

        cartItemsContainer.innerHTML = cart.map(item => {

            const product = products.find(
                product => product.id === item.id
            );

            if (!product) return "";

            const subtotal = product.price * item.quantity;

            total += subtotal;
            totalQuantity += item.quantity;

            return `

                <div class="cart-item">

                    <div class="cart-item-info">

                        <strong>${product.name}</strong>

                        <p>
                            ${formatPrice(product.price)} por unidade
                        </p>

                        <strong>
                            ${formatPrice(subtotal)}
                        </strong>

                    </div>

                    <div class="cart-item-actions">

                        <div class="quantity-controls">

                            <button
                                type="button"
                                class="cart-quantity-button"
                                data-decrease="${product.id}"
                                aria-label="Diminuir quantidade de ${product.name}"
                            >
                                −
                            </button>

                            <span class="cart-quantity">
                                ${item.quantity}
                            </span>

                            <button
                                type="button"
                                class="cart-quantity-button"
                                data-increase="${product.id}"
                                aria-label="Aumentar quantidade de ${product.name}"
                            >
                                +
                            </button>

                        </div>

                        <button
                            type="button"
                            class="cart-remove-button"
                            data-remove="${product.id}"
                            aria-label="Remover ${product.name} da sacola"
                        >
                            REMOVER
                        </button>

                    </div>

                </div>

            `;

        }).join("");

    }


    // Atualiza quantidade total.

    if (cartCountElement) {
        cartCountElement.textContent = totalQuantity;
    }


    // Atualiza subtotal.

    if (cartTotalElement) {
        cartTotalElement.textContent = formatPrice(total);
    }

}


/* -----------------------------------------
   10. ABRIR E FECHAR A SACOLA
   ----------------------------------------- */

function openCart() {

    if (!cartOverlay) return;

    cartOverlay.classList.add("open");

    document.body.style.overflow = "hidden";

}


function closeCart() {

    if (!cartOverlay) return;

    cartOverlay.classList.remove("open");

    document.body.style.overflow = "";

}


if (openCartButton) {
    openCartButton.addEventListener("click", openCart);
}


if (closeCartButton) {
    closeCartButton.addEventListener("click", closeCart);
}


// Fecha ao clicar fora do painel.

if (cartOverlay) {

    cartOverlay.addEventListener("click", event => {

        if (event.target === cartOverlay) {
            closeCart();
        }

    });

}


// Fecha com a tecla ESC.

document.addEventListener("keydown", event => {

    if (event.key === "Escape") {
        closeCart();
        closeMobileMenu();
    }

});


/* -----------------------------------------
   11. MENU MOBILE
   ----------------------------------------- */

function closeMobileMenu() {

    if (!navigation || !menuButton) return;

    navigation.classList.remove("open");

    menuButton.setAttribute(
        "aria-expanded",
        "false"
    );

    menuButton.setAttribute(
        "aria-label",
        "Abrir menu"
    );

    menuButton.textContent = "☰";

}


if (menuButton && navigation) {

    menuButton.setAttribute("aria-expanded", "false");

    menuButton.addEventListener("click", () => {

        const isOpen = navigation.classList.toggle("open");

        menuButton.setAttribute(
            "aria-expanded",
            String(isOpen)
        );

        menuButton.setAttribute(
            "aria-label",
            isOpen ? "Fechar menu" : "Abrir menu"
        );

        menuButton.textContent = isOpen ? "✕" : "☰";

    });


    // Fecha o menu após clicar em um link.

    navigation.querySelectorAll("a").forEach(link => {

        link.addEventListener("click", closeMobileMenu);

    });

}


/* -----------------------------------------
   12. NEWSLETTER
   ----------------------------------------- */

if (newsletterForm) {

    newsletterForm.addEventListener("submit", event => {

        event.preventDefault();

        const emailInput = newsletterForm.querySelector(
            'input[type="email"]'
        );

        if (!emailInput || !emailInput.checkValidity()) {
            return;
        }

        newsletterMessage.textContent =
            "Obrigado! Sua inscrição foi registrada nesta demonstração.";

        newsletterMessage.style.color = "#344D3B";

        newsletterForm.reset();

    });

}


/* -----------------------------------------
   13. FINALIZAÇÃO DA COMPRA
   ----------------------------------------- */

if (checkoutButton) {

    checkoutButton.addEventListener("click", () => {

        if (cart.length === 0) {

            alert("Sua sacola está vazia!");

            return;

        }

        alert(
            "A VIVERO ainda está preparando seu checkout! " +
            "A integração de pagamento será adicionada em uma próxima etapa."
        );

    });

}

/* -----------------------------------------
   14. INICIALIZAÇÃO DO SITE
   ----------------------------------------- */

async function initializeStore() {

    try {

        // Carrega os produtos do Supabase.
        products = await window.loadViveroProducts();

        // Recupera a sacola após carregar os produtos.
        cart = loadCart();

        // Exibe os produtos e a sacola.
        renderProducts();
        renderCart();

        console.log(
            "VIVERO: site inicializado com sucesso!"
        );

    } catch (error) {

        console.error(
            "VIVERO: não foi possível inicializar a loja:",
            error
        );

        if (productGrid) {

            productGrid.innerHTML = `
                <p class="no-products">
                    Não foi possível carregar os produtos.
                    Tente novamente mais tarde.
                </p>
            `;

        }

    }

}

initializeStore();