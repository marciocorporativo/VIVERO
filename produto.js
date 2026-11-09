
/* =========================================
   VIVERO — PÁGINA INDIVIDUAL DE PRODUTO
   ========================================= */

const productParams = new URLSearchParams(window.location.search);
const productId = Number(productParams.get("id"));

const detailImage = document.getElementById("product-detail-image");
const detailVisual = document.getElementById("product-detail-visual");

const detailName = document.getElementById("product-detail-name");
const detailPrice = document.getElementById("product-detail-price");
const detailCategory = document.getElementById("product-detail-category");
const detailDescription = document.getElementById("product-detail-description");

const detailIndex = document.getElementById("product-detail-index");
const detailReference = document.getElementById("product-detail-reference");
const breadcrumbName = document.getElementById("product-breadcrumb-name");

const quantityInput = document.getElementById("product-quantity");
const quantityMinus = document.getElementById("quantity-minus");
const quantityPlus = document.getElementById("quantity-plus");

const detailAddButton = document.getElementById("product-detail-add");
const detailFeedback = document.getElementById("product-detail-feedback");


/* -----------------------------------------
   1. CARREGAR E VERIFICAR PRODUTO
   ----------------------------------------- */

async function initializeProductPage() {

    try {

        const products = await window.loadViveroProducts();

        const selectedProduct = products.find(
            product => product.id === productId
        );

        if (!selectedProduct) {

            document.title = "Produto não encontrado | VIVERO";

            document.querySelector(".product-detail-section").innerHTML = `
                <div class="product-not-found">
                    <span class="eyebrow">VIVERO / 404</span>
                    <h1>PRODUTO<br>NÃO ENCONTRADO.</h1>
                    <p>Não conseguimos localizar esse produto.</p>
                    <a href="index.html#produtos">
                        VOLTAR PARA A COLEÇÃO ↗
                    </a>
                </div>
            `;

            return;

        }


        /* -----------------------------------------
           2. EXIBIR INFORMAÇÕES
           ----------------------------------------- */

        document.title = `${selectedProduct.name} | VIVERO`;

        detailName.textContent = selectedProduct.name;

        detailPrice.textContent = formatPrice(
            selectedProduct.price
        );

        detailCategory.textContent =
            selectedProduct.categoryLabel;

        detailIndex.textContent =
            `00${selectedProduct.id}`;

        detailReference.textContent =
            `00${selectedProduct.id}`;

        breadcrumbName.textContent =
            selectedProduct.name.toUpperCase();

        detailImage.style.setProperty(
            "--product-color",
            selectedProduct.color || "#344D3B"
        );


        // Descrições provisórias.
        // Serão substituídas pelas descrições definitivas
        // quando tivermos as especificações dos fornecedores.

        const descriptions = {
            1: "A Bolsa Horizonte foi pensada para acompanhar sua rotina com praticidade e personalidade. Um acessório versátil para diferentes momentos do seu dia.",
            2: "A Bolsa Travessia combina funcionalidade e estilo em uma proposta versátil, ideal para acompanhar você em diferentes experiências.",
            3: "O Organizador Rota ajuda a manter seus itens essenciais organizados, trazendo praticidade para sua rotina e suas viagens.",
            4: "A Nécessaire Campo foi pensada para reunir seus pequenos essenciais em um único lugar, com praticidade para acompanhar seu ritmo."
        };

        const description = descriptions[selectedProduct.id] || "";

        detailDescription.textContent = description;


        /* -----------------------------------------
           3. DETALHES E ESPECIFICAÇÕES
           ----------------------------------------- */

        const longDescription = document.getElementById(
            "product-long-description"
        );

        const productSpecifications = {
            material: document.getElementById("product-material"),
            dimensions: document.getElementById("product-dimensions"),
            capacity: document.getElementById("product-capacity"),
            compartments: document.getElementById("product-compartments"),
            care: document.getElementById("product-care")
        };

        longDescription.textContent = description;

        productSpecifications.material.textContent = "A confirmar";
        productSpecifications.dimensions.textContent = "A confirmar";
        productSpecifications.capacity.textContent = "A confirmar";
        productSpecifications.compartments.textContent = "A confirmar";
        productSpecifications.care.textContent = "A confirmar";


        /* -----------------------------------------
           4. IMAGEM DO PRODUTO
           ----------------------------------------- */

        const galleryThumbnails = document.getElementById(
            "product-gallery-thumbnails"
        );

        const productImages = selectedProduct.images?.length
            ? selectedProduct.images
            : selectedProduct.image
                ? [selectedProduct.image]
                : [];

        function showProductImage(index) {

            detailVisual.innerHTML = "";

            const image = document.createElement("img");

            image.src = productImages[index];
            image.alt = `${selectedProduct.name} — Foto ${index + 1}`;
            image.className = "product-detail-photo";

            detailVisual.appendChild(image);

            const thumbnailButtons = galleryThumbnails.querySelectorAll("button");

            thumbnailButtons.forEach((button, buttonIndex) => {

                button.classList.toggle(
                    "active",
                    buttonIndex === index
                );

                button.setAttribute(
                    "aria-pressed",
                    buttonIndex === index ? "true" : "false"
                );

            });

        }


        if (productImages.length > 0) {

            productImages.forEach((imageSrc, index) => {

                const thumbnail = document.createElement("button");

                thumbnail.type = "button";
                thumbnail.className = "product-gallery-thumbnail";

                thumbnail.setAttribute(
                    "aria-label",
                    `Ver foto ${index + 1} de ${selectedProduct.name}`
                );

                const thumbnailImage = document.createElement("img");

                thumbnailImage.src = imageSrc;
                thumbnailImage.alt = "";

                thumbnail.appendChild(thumbnailImage);

                thumbnail.addEventListener("click", () => {
                    showProductImage(index);
                });

                galleryThumbnails.appendChild(thumbnail);

            });

            if (productImages.length > 1) {
                galleryThumbnails.style.display = "flex";
            }

            showProductImage(0);

        } else {

            const visual = document.createElement("div");

            visual.className = `product-visual product-visual--${selectedProduct.visual}`;

            visual.innerHTML = `
                <span class="product-handle"></span>
                <span class="product-body"></span>
            `;

            detailVisual.appendChild(visual);

            galleryThumbnails.style.display = "none";

        }


        /* -----------------------------------------
           5. CONTROLE DE QUANTIDADE
           ----------------------------------------- */

        quantityMinus.addEventListener("click", () => {

            const currentQuantity = Number(quantityInput.value);

            quantityInput.value = Math.max(
                1,
                currentQuantity - 1
            );

        });


        quantityPlus.addEventListener("click", () => {

            const currentQuantity = Number(quantityInput.value);

            quantityInput.value = Math.min(
                99,
                currentQuantity + 1
            );

        });


        quantityInput.addEventListener("change", () => {

            let quantity = Number(quantityInput.value);

            if (!Number.isInteger(quantity)) {
                quantity = 1;
            }

            quantityInput.value = Math.max(
                1,
                Math.min(99, quantity)
            );

        });


        /* -----------------------------------------
           6. ADICIONAR À SACOLA
           ----------------------------------------- */

        detailAddButton.addEventListener("click", () => {

            const quantity = Math.max(
                1,
                Math.min(99, Math.floor(Number(quantityInput.value) || 1))
            );

            addToCart(selectedProduct.id, quantity);

            quantityInput.value = 1;

            detailFeedback.textContent =
                "Produto adicionado à sua sacola ✓";

            detailFeedback.style.color = "#344D3B";

            detailAddButton.textContent =
                "ADICIONADO À SACOLA ✓";

            setTimeout(() => {

                detailAddButton.textContent =
                    "ADICIONAR À SACOLA ↗";

            }, 1500);

        });

        console.log(
            "VIVERO: página do produto carregada com sucesso!"
        );

    } catch (error) {

        console.error(
            "VIVERO: erro ao carregar a página do produto:",
            error
        );

        document.querySelector(".product-detail-section").innerHTML = `
            <div class="product-not-found">
                <span class="eyebrow">VIVERO / ERRO</span>
                <h1>NÃO FOI POSSÍVEL<br>CARREGAR O PRODUTO.</h1>
                <p>Tente novamente mais tarde.</p>
                <a href="index.html#produtos">
                    VOLTAR PARA A COLEÇÃO ↗
                </a>
            </div>
        `;

    }

}

initializeProductPage();
