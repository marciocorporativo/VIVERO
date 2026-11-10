
/* =========================================
   VIVERO — PAINEL ADMINISTRATIVO
   ========================================= */

// Oculta o painel enquanto verifica a autorização.

document.body.style.visibility = "hidden";


/* -----------------------------------------
   1. VERIFICAR AUTENTICAÇÃO
   ----------------------------------------- */

async function verifyAdminAccess() {

    try {

        // Recupera a sessão atual do Supabase.

        const { data: sessionData, error: sessionError } =
            await window.supabaseClient.auth.getSession();

        if (sessionError) {
            throw sessionError;
        }

        const session = sessionData.session;

        // Sem sessão: retorna para o login.

        if (!session) {

            window.location.replace("admin.html");

            return false;

        }


        // Verifica se o usuário está cadastrado como administrador.

        const { data: admin, error: adminError } =
            await window.supabaseClient
                .from("admin_users")
                .select("user_id")
                .eq("user_id", session.user.id)
                .maybeSingle();


        if (adminError) {
            throw adminError;
        }


        // Usuário autenticado, mas sem autorização administrativa.

        if (!admin) {

            await window.supabaseClient.auth.signOut();

            window.location.replace("admin.html");

            return false;

        }


        // Acesso autorizado.

        console.log(
            "VIVERO: acesso administrativo autorizado!"
        );

        document.body.style.visibility = "visible";

        return true;


    } catch (error) {

        console.error(
            "VIVERO: erro ao verificar acesso administrativo:",
            error
        );

        // Em caso de erro, encerra a sessão por segurança.

        await window.supabaseClient.auth.signOut();

        window.location.replace("admin.html");

        return false;

    }

}

/* -----------------------------------------
   ATUALIZAR DESTAQUE DA NAVEGAÇÃO
   ----------------------------------------- */

function updateActiveNavigation() {

    const sections = [
        "visao-geral",
        "produtos",
        "imagens",
        "pedidos",
        "configuracoes"
    ];

    const referencePosition = window.innerHeight * 0.35;

    let activeSection = "visao-geral";

    sections.forEach(sectionId => {

        const section = document.getElementById(sectionId);

        if (!section || section.hidden) return;

        const position = section.getBoundingClientRect();

        if (position.top <= referencePosition) {
            activeSection = sectionId;
        }

    });

    const navigationLinks = document.querySelectorAll(
        ".dashboard-nav-link"
    );

    navigationLinks.forEach(link => {

        const isActive =
            link.getAttribute("href") === `#${activeSection}`;

        link.classList.toggle("active", isActive);

    });

}

// Atualiza ao carregar o painel.
updateActiveNavigation();

// Atualiza ao clicar nos links.
window.addEventListener(
    "hashchange",
    updateActiveNavigation
);

// Atualiza enquanto a página é rolada.
window.addEventListener(
    "scroll",
    updateActiveNavigation,
    { passive: true }
);

/* -----------------------------------------
   2. ENCERRAR SESSÃO
   ----------------------------------------- */

const logoutButton = document.getElementById(
    "admin-logout-button"
);

logoutButton.addEventListener("click", async () => {

    logoutButton.disabled = true;
    logoutButton.textContent = "SAINDO...";

    try {

        const { error } =
            await window.supabaseClient.auth.signOut();

        if (error) {
            throw error;
        }

        window.location.replace("admin.html");

    } catch (error) {

        console.error(
            "VIVERO: erro ao encerrar sessão:",
            error
        );

        logoutButton.disabled = false;
        logoutButton.textContent = "↪ SAIR DA CONTA";

        alert(
            "Não foi possível encerrar a sessão. Tente novamente."
        );

    }

});


/* -----------------------------------------
   3. INICIALIZAÇÃO
   ----------------------------------------- */

async function initializeDashboard() {

    const authorized = await verifyAdminAccess();

    if (authorized) {

        await loadDashboardStats();

        await loadDashboardProducts();

        await loadImageProductOptions();

    }
}

initializeDashboard();


/* -----------------------------------------
   4. CARREGAR INDICADORES DO PAINEL
   ----------------------------------------- */

async function loadDashboardStats() {

    try {

        // Consulta a quantidade de produtos cadastrados.

        const { count, error } = await window.supabaseClient
            .from("products")
            .select("id", {
                count: "exact",
                head: true
            });

        if (error) {
            throw error;
        }

        // Atualiza o indicador na página.

        document.getElementById(
            "dashboard-product-count"
        ).textContent = count ?? 0;

        console.log(
            "VIVERO: indicador de produtos atualizado!",
            count
        );

        // Consulta as imagens associadas aos produtos.

        const { data: imageProducts, error: imageError } =
            await window.supabaseClient
                .from("products")
                .select("image, images");

        if (imageError) {
            throw imageError;
        }


        // Calcula a quantidade de imagens cadastradas.

        const imageCount = imageProducts.reduce((total, product) => {

            const images = Array.isArray(product.images) &&
                product.images.length > 0
                    ? product.images
                    : product.image
                        ? [product.image]
                        : [];

            return total + images.length;

        }, 0);


        // Atualiza o indicador de imagens.

        document.getElementById(
            "dashboard-image-count"
        ).textContent = imageCount;

        console.log(
            "VIVERO: indicador de imagens atualizado!",
            imageCount
        );

        // Consulta a quantidade de pedidos registrados.

        const { count: orderCount, error: orderError } =
            await window.supabaseClient
                .from("orders")
                .select("id", {
                    count: "exact",
                    head: true
                });

        if (orderError) {
            throw orderError;
        }

        // Atualiza o indicador de pedidos.

        document.getElementById(
            "dashboard-order-count"
        ).textContent = orderCount ?? 0;

        console.log(
            "VIVERO: indicador de pedidos atualizado!",
            orderCount
        );


    } catch (error) {

        console.error(
            "VIVERO: erro ao carregar quantidade de produtos:",
            error
        );

        document.getElementById(
            "dashboard-product-count"
        ).textContent = "—";

    }

}

/* -----------------------------------------
   5. CARREGAR LISTA DE PRODUTOS
   ----------------------------------------- */

async function loadDashboardProducts() {

    const productList = document.getElementById(
        "dashboard-product-list"
    );

    const productListCount = document.getElementById(
        "product-list-count"
    );

    try {

        // Consulta os produtos no Supabase.

        const products = await window.loadViveroProducts();

        const searchTerm = productSearch.value
            .trim()
            .toLowerCase();

        const filteredProducts = products.filter(product => {

            const name = (product.name || "").toLowerCase();
            const category = (product.category || "").toLowerCase();
            const categoryLabel = (product.categoryLabel || "").toLowerCase();

            return (
                name.includes(searchTerm) ||
                category.includes(searchTerm) ||
                categoryLabel.includes(searchTerm)
            );

        });

        // Atualiza o contador.

       productListCount.textContent =
            `${filteredProducts.length} ${filteredProducts.length === 1 ? "PRODUTO" : "PRODUTOS"}`;

        // Limpa a listagem anterior.

        productList.innerHTML = "";

        // Exibe uma mensagem caso não existam produtos.

        if (filteredProducts.length === 0) {

            productList.textContent = products.length === 0
                ? "Nenhum produto cadastrado."
                : "Nenhum produto encontrado.";

            return;
        }

        // Cria um elemento para cada produto.

        filteredProducts.forEach(product => {

            const item = document.createElement("div");

            item.className = "dashboard-product-item";

            const information = document.createElement("div");

            information.className = "dashboard-product-information";

            const name = document.createElement("strong");

            name.textContent = product.name;

            const category = document.createElement("span");

            category.textContent =
                product.categoryLabel || product.category;

            const price = document.createElement("strong");

            price.textContent = product.price.toLocaleString(
                "pt-BR",
                {
                    style: "currency",
                    currency: "BRL"
                }
            );

            information.appendChild(name);
            information.appendChild(category);

            // Área de ações do produto.

            const actions = document.createElement("div");

            actions.className = "dashboard-product-actions";

            // Botão de edição.

            const editButton = document.createElement("button");

            editButton.type = "button";

            editButton.className = "dashboard-edit-button";

            editButton.textContent = "EDITAR";

            editButton.addEventListener("click", () => {

                openEditProductForm(product);

            });

            // Montagem do produto.

            actions.appendChild(editButton);

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "dashboard-delete-button";
            deleteButton.innerHTML = '<i data-lucide="trash-2"></i>';
            deleteButton.setAttribute("aria-label", "Excluir produto");
            deleteButton.title = "Excluir produto";

            deleteButton.addEventListener("click", () => {
                deleteDashboardProduct(product);
            });

            actions.appendChild(deleteButton);

            item.appendChild(information);
            item.appendChild(price);
            item.appendChild(actions);

            productList.appendChild(item);

            if (window.lucide) {
                window.lucide.createIcons();
            }
        });

        console.log(
            "VIVERO: lista de produtos carregada!",
            products
        );

    } catch (error) {

        console.error(
            "VIVERO: erro ao carregar lista de produtos:",
            error
        );

        productList.textContent =
            "Não foi possível carregar os produtos.";

        productListCount.textContent =
            "ERRO";

    }
}

const productSearch = document.getElementById("product-search");

// PESQUISA EM TEMPO REAL

productSearch.addEventListener("input", () => {
    loadDashboardProducts();
});

/* -----------------------------------------
   6. CONTROLE DO FORMULÁRIO DE PRODUTOS
   ----------------------------------------- */

const addProductButton = document.getElementById(
    "add-product-button"
);

const productSection = document.getElementById(
    "produtos"
);

const productFormSection = document.getElementById(
    "product-form-section"
);

const dashboardProductForm = document.getElementById(
    "dashboard-product-form"
);

const cancelProductButton = document.getElementById(
    "cancel-product-button"
);

const cancelProductFormButton = document.getElementById(
    "cancel-product-form-button"
);



// Identifica o produto que está sendo editado.
// Null significa que estamos cadastrando um novo produto.

let editingProductId = null;

// Abre o formulário.

function openProductForm() {

    productSection.hidden = true;

    productFormSection.hidden = false;

    dashboardProductForm.reset();

    editingProductId = null;

    document.querySelector(
        "#product-form-section .dashboard-eyebrow"
    ).textContent = "CATÁLOGO / NOVO PRODUTO";

    document.querySelector(
        "#product-form-section h2"
    ).textContent = "Cadastrar produto";

    document.getElementById(
        "save-product-button"
    ).textContent = "SALVAR PRODUTO";

    document.getElementById(
        "product-form-message"
    ).textContent = "";

    productFormSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}

/* -----------------------------------------
   ABRIR FORMULÁRIO DE EDIÇÃO
   ----------------------------------------- */

function openEditProductForm(product) {

    editingProductId = product.id;

    // Prepara o formulário.

    productSection.hidden = true;

    productFormSection.hidden = false;

    // Altera os títulos.

    document.querySelector(
        "#product-form-section .dashboard-eyebrow"
    ).textContent = "CATÁLOGO / EDITAR PRODUTO";

    document.querySelector(
        "#product-form-section h2"
    ).textContent = "Editar produto";

    // Preenche os campos com os dados atuais.

    document.getElementById("product-name").value =
        product.name || "";

    document.getElementById("product-category").value =
        product.category || "";

    document.getElementById("product-category-label").value =
        product.category_label || product.categoryLabel || "";

    document.getElementById("product-price").value =
        product.price ?? "";

    document.getElementById("product-color").value =
        product.color || "#344D3B";

    document.getElementById("product-visual").value =
        product.visual || "bag";

    // Limpa mensagens anteriores.

    document.getElementById(
        "product-form-message"
    ).textContent = "";

    // Altera o botão de salvamento.

    document.getElementById(
        "save-product-button"
    ).textContent = "SALVAR ALTERAÇÕES";

    // Exibe o formulário.

    productFormSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}

// Fecha o formulário e retorna à listagem.

function closeProductForm() {

    productFormSection.hidden = true;

    productSection.hidden = false;

    dashboardProductForm.reset();

    document.getElementById(
        "product-form-message"
    ).textContent = "";

    productSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


// Eventos dos botões.

addProductButton.addEventListener(
    "click",
    openProductForm
);

cancelProductButton.addEventListener(
    "click",
    closeProductForm
);

cancelProductFormButton.addEventListener(
    "click",
    closeProductForm
);

/* -----------------------------------------
   7. SALVAR NOVO PRODUTO
   ----------------------------------------- */

dashboardProductForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const saveButton = document.getElementById(
        "save-product-button"
    );

    const message = document.getElementById(
        "product-form-message"
    );

    // Captura os dados preenchidos.

    const newProduct = {

        name: document.getElementById("product-name").value.trim(),

        category: document.getElementById("product-category").value,

        category_label: document.getElementById(
            "product-category-label"
        ).value.trim(),

        price: Number(
            document.getElementById("product-price").value
        ),

        color: document.getElementById("product-color").value,

        visual: document.getElementById("product-visual").value,

        image: "",

        images: []

    };


    // Impede o envio de dados inválidos.

    if (
        !newProduct.name ||
        !newProduct.category ||
        !Number.isFinite(newProduct.price) ||
        newProduct.price <= 0
    ) {

        message.textContent =
            "Preencha corretamente todos os campos obrigatórios.";

        message.className = "dashboard-form-message error";

        return;

    }


    saveButton.disabled = true;

    saveButton.textContent = "SALVANDO...";

    message.textContent = "";


    try {

        // Verifica se estamos editando ou cadastrando.

        if (editingProductId !== null) {

            // Atualiza um produto existente.

            const { error } = await window.supabaseClient
                .from("products")
                .update({

                    name: newProduct.name,

                    category: newProduct.category,

                    category_label: newProduct.category_label,

                    price: newProduct.price,

                    color: newProduct.color,

                    visual: newProduct.visual

                })
                .eq("id", editingProductId);

            if (error) {
                throw error;
            }

        } else {

            // Insere um novo produto.

            const { error } = await window.supabaseClient
                .from("products")
                .insert(newProduct);

            if (error) {
                throw error;
            }

        }


        // Atualiza o carregamento dos produtos.

        window.viveroProductsPromise = null;

        await loadDashboardProducts();

        await loadDashboardStats();


        // Exibe confirmação.

        message.textContent = editingProductId !== null
            ? "Produto atualizado com sucesso!"
            : "Produto cadastrado com sucesso!";

        message.className =
            "dashboard-form-message success";


        console.log(
            "VIVERO: novo produto cadastrado!",
            newProduct
        );


        // Retorna à listagem após um pequeno intervalo.

        setTimeout(() => {

            closeProductForm();

        }, 1200);


    } catch (error) {

        console.error(
            "VIVERO: erro ao cadastrar produto:",
            error
        );

        message.textContent =
            "Não foi possível cadastrar o produto. Verifique os dados e tente novamente.";

        message.className =
            "dashboard-form-message error";

    } finally {

        saveButton.disabled = false;

        saveButton.textContent = "SALVAR PRODUTO";

    }

});

/* -----------------------------------------
   8. EXCLUIR PRODUTO
   ----------------------------------------- */

async function deleteDashboardProduct(product) {

    const confirmed = window.confirm(
        `Deseja realmente excluir o produto "${product.name}"?\n\nEssa ação não poderá ser desfeita.`
    );

    if (!confirmed) return;

    try {

        const { error } = await window.supabaseClient
            .from("products")
            .delete()
            .eq("id", product.id);

        if (error) throw error;

        // Atualiza o cache de produtos
        window.viveroProductsPromise = null;

        // Atualiza a listagem e os indicadores
        await loadDashboardProducts();
        await loadDashboardStats();

        alert("Produto excluído com sucesso!");

        console.log(
            "VIVERO: produto excluído!",
            product.name
        );

    } catch (error) {

        console.error(
            "VIVERO: erro ao excluir produto:",
            error
        );

        alert(
            "Não foi possível excluir o produto. Tente novamente."
        );

    }
}

/* -----------------------------------------
   9. CARREGAR PRODUTOS NO SELETOR DE IMAGENS
   ----------------------------------------- */

async function loadImageProductOptions() {

    const productSelect = document.getElementById(
        "image-product-select"
    );

    try {

        const products = await window.loadViveroProducts();

        productSelect.innerHTML = `
            <option value="">
                Selecione um produto
            </option>
        `;

        products.forEach(product => {

            const option = document.createElement("option");

            option.value = product.id;
            option.textContent = product.name;

            productSelect.appendChild(option);

        });

        const imageProductSearch = document.getElementById(
            "image-product-search"
        );

        imageProductSearch.addEventListener("input", () => {

            const searchTerm = imageProductSearch.value
                .trim()
                .toLowerCase();

            const filteredProducts = products.filter(product =>
                product.name.toLowerCase().includes(searchTerm)
            );

            productSelect.innerHTML = `
                <option value="">
                    Selecione um produto
                </option>
            `;

            filteredProducts.forEach(product => {

                const option = document.createElement("option");

                option.value = product.id;
                option.textContent = product.name;

                productSelect.appendChild(option);

            });

        });

        console.log(
            "VIVERO: produtos carregados no seletor de imagens!"
        );

    } catch (error) {

        console.error(
            "VIVERO: erro ao carregar produtos para imagens:",
            error
        );

        productSelect.innerHTML = `
            <option value="">
                Não foi possível carregar os produtos
            </option>
        `;

    }
}

/* -----------------------------------------
   10. CARREGAR GALERIA DE IMAGENS
   ----------------------------------------- */

async function loadDashboardImages() {

    const productSelect = document.getElementById(
        "image-product-select"
    );

    const imageList = document.getElementById(
        "dashboard-image-list"
    );

    const productId = Number(productSelect.value);

    if (!productId) {

        imageList.innerHTML = `
            <p class="dashboard-product-loading">
                Selecione um produto para visualizar suas imagens.
            </p>
        `;

        return;
    }

    try {

        const products = await window.loadViveroProducts();

        const product = products.find(
            item => item.id === productId
        );

        if (!product) {
            throw new Error("Produto não encontrado.");
        }

        const images = Array.isArray(product.images)
            ? [...product.images]
            : [];

        if (images.length === 0 && product.image) {
            images.push(product.image);
        }

        imageList.innerHTML = "";

        if (images.length === 0) {

            imageList.innerHTML = `
                <p class="dashboard-product-loading">
                    Este produto ainda não possui imagens.
                </p>
            `;

            return;
        }

        const grid = document.createElement("div");
        grid.className = "dashboard-image-grid";

        images.forEach((image, index) => {

            const card = document.createElement("div");
            card.className = "dashboard-image-card";

            const preview = document.createElement("img");
            preview.src = image;
            preview.alt = `${product.name} — imagem ${index + 1}`;
            preview.loading = "lazy";

            const information = document.createElement("div");
            information.className = "dashboard-image-information";

            const label = document.createElement("span");
            label.textContent = `Imagem ${index + 1}`;

            // BOTÃO DE EXCLUSÃO
            const deleteButton = document.createElement("button");

            deleteButton.type = "button";
            deleteButton.className = "dashboard-image-delete";
            deleteButton.innerHTML = '<i data-lucide="trash-2"></i>';

            deleteButton.setAttribute(
                "aria-label",
                `Excluir imagem ${index + 1}`
            );

            deleteButton.title = "Excluir imagem";

            deleteButton.addEventListener("click", () => {
                deleteDashboardImage(product, image);
            });

            information.appendChild(label);
            information.appendChild(deleteButton);

            card.appendChild(preview);
            card.appendChild(information);

            grid.appendChild(card);
        });

        imageList.appendChild(grid);

        if (window.lucide) {
            window.lucide.createIcons();
        }

    } catch (error) {

        console.error(
            "VIVERO: erro ao carregar galeria:",
            error
        );

        imageList.textContent =
            "Não foi possível carregar as imagens.";

    }
}

/* -----------------------------------------
   13. EXCLUIR IMAGEM INDIVIDUAL
   ----------------------------------------- */

async function deleteDashboardImage(product, imageUrl) {

    const confirmed = window.confirm(
        "Deseja realmente excluir esta imagem?\n\nEssa ação não poderá ser desfeita."
    );

    if (!confirmed) return;

    try {

        const { data: currentProduct, error: productError } =
            await window.supabaseClient
                .from("products")
                .select("id, image, images")
                .eq("id", product.id)
                .single();

        if (productError) throw productError;

        const currentImages = Array.isArray(currentProduct.images)
            ? [...currentProduct.images]
            : [];

        if (currentImages.length === 0 && currentProduct.image) {
            currentImages.push(currentProduct.image);
        }

        const updatedImages = currentImages.filter(
            url => url !== imageUrl
        );

        if (updatedImages.length === currentImages.length) {
            throw new Error("Imagem não encontrada no produto.");
        }

        const { error: updateError } =
            await window.supabaseClient
                .from("products")
                .update({
                    images: updatedImages,
                    image: updatedImages[0] || ""
                })
                .eq("id", product.id);

        if (updateError) throw updateError;

        const storagePrefix =
            "/storage/v1/object/public/product-images/";

        const storageIndex = imageUrl.indexOf(storagePrefix);

        if (storageIndex === -1) {
            throw new Error("Não foi possível identificar o arquivo no armazenamento.");
        }

        const filePath = decodeURIComponent(
            imageUrl.substring(storageIndex + storagePrefix.length)
        );

        const { error: storageError } =
            await window.supabaseClient
                .storage
                .from("product-images")
                .remove([filePath]);

        if (storageError) {
            console.error(
                "VIVERO: imagem removida do cadastro, mas não do armazenamento:",
                storageError
            );

            imageFormMessage.textContent =
                "Imagem removida do produto, mas houve um erro ao excluir o arquivo armazenado.";

            imageFormMessage.className =
                "dashboard-form-message error";
        } else {

            imageFormMessage.textContent =
                "Imagem excluída com sucesso!";

            imageFormMessage.className =
                "dashboard-form-message success";
        }

        window.viveroProductsPromise = null;

        await loadDashboardImages();

        await loadDashboardStats();

        console.log("VIVERO: imagem excluída!", imageUrl);

    } catch (error) {

        console.error(
            "VIVERO: erro ao excluir imagem:",
            error
        );

        imageFormMessage.textContent =
            "Não foi possível excluir a imagem. Tente novamente.";

        imageFormMessage.className =
            "dashboard-form-message error";
    }
}

/* ATUALIZAR GALERIA AO SELECIONAR PRODUTO */

document
    .getElementById("image-product-select")
    .addEventListener("change", loadDashboardImages);

/* -----------------------------------------
   11. VALIDAR ARQUIVOS DE IMAGEM
   ----------------------------------------- */

const productImageFiles = document.getElementById(
    "product-image-files"
);

const imageFormMessage = document.getElementById(
    "image-form-message"
);

productImageFiles.addEventListener("change", () => {

    const files = Array.from(productImageFiles.files);

    imageFormMessage.textContent = "";
    imageFormMessage.className = "dashboard-form-message";

    if (files.length === 0) {
        return;
    }

    const invalidFile = files.find(file =>
        !file.type.startsWith("image/")
    );

    if (invalidFile) {

        imageFormMessage.textContent =
            "Selecione apenas arquivos de imagem.";

        imageFormMessage.classList.add("error");

        productImageFiles.value = "";

        return;
    }

    const oversizedFile = files.find(file =>
        file.size > 5 * 1024 * 1024
    );

    if (oversizedFile) {

        imageFormMessage.textContent =
            "Cada imagem deve ter no máximo 5 MB.";

        imageFormMessage.classList.add("error");

        productImageFiles.value = "";

        return;
    }

    imageFormMessage.textContent =
        `${files.length} ${files.length === 1 ? "imagem selecionada" : "imagens selecionadas"}.`;

    imageFormMessage.classList.add("success");

});

/* -----------------------------------------
   12. ENVIAR IMAGENS PARA O SUPABASE
   ----------------------------------------- */

const dashboardImageForm = document.getElementById(
    "dashboard-image-form"
);

const uploadImagesButton = document.getElementById(
    "upload-product-images-button"
);

dashboardImageForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const productId = Number(
        document.getElementById("image-product-select").value
    );

    const files = Array.from(productImageFiles.files);

    if (!productId) {
        imageFormMessage.textContent =
            "Selecione um produto antes de enviar.";
        imageFormMessage.className =
            "dashboard-form-message error";
        return;
    }

    if (files.length === 0) {
        imageFormMessage.textContent =
            "Selecione pelo menos uma imagem.";
        imageFormMessage.className =
            "dashboard-form-message error";
        return;
    }

    if (files.some(file =>
        !file.type.startsWith("image/") ||
        file.size > 5 * 1024 * 1024
    )) {
        imageFormMessage.textContent =
            "Verifique os arquivos: somente imagens de até 5 MB são permitidas.";
        imageFormMessage.className =
            "dashboard-form-message error";
        return;
    }

    uploadImagesButton.disabled = true;
    uploadImagesButton.textContent = "ENVIANDO...";

    imageFormMessage.textContent =
        "Enviando fotografias. Aguarde...";

    imageFormMessage.className =
        "dashboard-form-message";

    const uploadedPaths = [];

    try {

        // Buscar imagens já cadastradas no produto

        const { data: product, error: productError } =
            await window.supabaseClient
                .from("products")
                .select("id, image, images")
                .eq("id", productId)
                .single();

        if (productError) throw productError;

        const existingImages = Array.isArray(product.images)
            ? [...product.images]
            : [];

        if (existingImages.length === 0 && product.image) {
            existingImages.push(product.image);
        }

        const newImageUrls = [];

        // Enviar cada fotografia ao armazenamento

        for (const file of files) {

            const safeFileName = file.name
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-zA-Z0-9._-]/g, "-");

            const uniqueName =
                `${Date.now()}-${Math.random().toString(36).slice(2)}-${safeFileName}`;

            const filePath = `${productId}/${uniqueName}`;

            const { error: uploadError } =
                await window.supabaseClient
                    .storage
                    .from("product-images")
                    .upload(filePath, file, {
                        cacheControl: "3600",
                        upsert: false,
                        contentType: file.type
                    });

            if (uploadError) throw uploadError;

            uploadedPaths.push(filePath);

            const { data: publicUrlData } =
                window.supabaseClient
                    .storage
                    .from("product-images")
                    .getPublicUrl(filePath);

            newImageUrls.push(publicUrlData.publicUrl);

        }

        // Atualizar as imagens do produto no banco de dados

        const updatedImages = [
            ...existingImages,
            ...newImageUrls
        ];

        const { error: updateError } =
            await window.supabaseClient
                .from("products")
                .update({
                    images: updatedImages,
                    image: updatedImages[0] || ""
                })
                .eq("id", productId);

        if (updateError) throw updateError;

        // Atualizar os dados exibidos no painel

        window.viveroProductsPromise = null;

        await loadDashboardImages();

        await loadDashboardStats();

        productImageFiles.value = "";

        imageFormMessage.textContent =
            `${newImageUrls.length} ${newImageUrls.length === 1 ? "imagem enviada com sucesso!" : "imagens enviadas com sucesso!"}`;

        imageFormMessage.className =
            "dashboard-form-message success";

        console.log(
            "VIVERO: imagens enviadas com sucesso!",
            newImageUrls
        );

    } catch (error) {

        console.error(
            "VIVERO: erro ao enviar imagens:",
            error
        );

        // Remover arquivos enviados caso o processo falhe

        if (uploadedPaths.length > 0) {

            const { error: cleanupError } =
                await window.supabaseClient
                    .storage
                    .from("product-images")
                    .remove(uploadedPaths);

            if (cleanupError) {
                console.error(
                    "VIVERO: erro ao limpar arquivos enviados:",
                    cleanupError
                );
            }

        }

        imageFormMessage.textContent =
            "Não foi possível enviar as imagens. Verifique sua conexão e tente novamente.";

        imageFormMessage.className =
            "dashboard-form-message error";

    } finally {

        uploadImagesButton.disabled = false;
        uploadImagesButton.textContent = "ENVIAR IMAGENS";

    }

});

console.log(
    "VIVERO: proteção do painel inicializada!"
);
