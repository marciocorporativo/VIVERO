/* =========================================
   VIVERO — CONEXÃO COM SUPABASE
   ========================================= */

// 1. CONFIGURAÇÕES DA CONEXÃO

const SUPABASE_URL = "https://ppnxbtjoalprwumaofos.supabase.co";

const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_aEcDO--HkSxOkL3Cu7Txxw_A8HVuib1";


/* -----------------------------------------
   2. INICIALIZAÇÃO
   ----------------------------------------- */

window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);


/* -----------------------------------------
   3. PRODUTOS
   ----------------------------------------- */

// Armazena a consulta para evitar
// requisições duplicadas.

window.viveroProductsPromise = null;


window.loadViveroProducts = async function () {

    if (!window.viveroProductsPromise) {

        window.viveroProductsPromise = (async () => {

            const { data, error } = await window.supabaseClient
                .from("products")
                .select("*")
                .order("id", { ascending: true });

            if (error) {
                throw error;
            }

            return data.map(product => ({

                ...product,

                id: Number(product.id),

                price: Number(product.price),

                categoryLabel: product.category_label || "",

                images: Array.isArray(product.images)
                    ? product.images
                    : []

            }));

        })();

    }

    try {

        return await window.viveroProductsPromise;

    } catch (error) {

        window.viveroProductsPromise = null;

        console.error(
            "VIVERO: erro ao carregar produtos:",
            error
        );

        throw error;

    }

};


console.log("VIVERO: conexão com Supabase inicializada!");