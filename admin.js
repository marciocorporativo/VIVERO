
/* =========================================
   VIVERO — AUTENTICAÇÃO ADMINISTRATIVA
   ========================================= */

const adminLoginForm = document.getElementById(
    "admin-login-form"
);

const adminEmail = document.getElementById(
    "admin-email"
);

const adminPassword = document.getElementById(
    "admin-password"
);

const adminLoginButton = document.getElementById(
    "admin-login-button"
);

const adminLoginMessage = document.getElementById(
    "admin-login-message"
);


/* -----------------------------------------
   1. EXIBIR MENSAGENS
   ----------------------------------------- */

function showAdminMessage(message, type = "") {

    adminLoginMessage.textContent = message;

    adminLoginMessage.className = type;

}


/* -----------------------------------------
   2. AUTENTICAÇÃO
   ----------------------------------------- */

adminLoginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const email = adminEmail.value.trim();
    const password = adminPassword.value;

    adminLoginButton.disabled = true;
    adminLoginButton.textContent = "VERIFICANDO...";

    showAdminMessage("");


    try {

        // Verifica as credenciais no Supabase.

        const { data, error } = await window.supabaseClient.auth
            .signInWithPassword({
                email,
                password
            });

        if (error) {
            throw error;
        }


        // Verifica se o usuário possui autorização administrativa.

        const { data: admin, error: adminError } =
            await window.supabaseClient
                .from("admin_users")
                .select("user_id")
                .eq("user_id", data.user.id)
                .maybeSingle();


        if (adminError) {

            await window.supabaseClient.auth.signOut();

            throw adminError;

        }


        if (!admin) {

            await window.supabaseClient.auth.signOut();

            showAdminMessage(
                "Esta conta não possui autorização administrativa.",
                "error"
            );

            return;

        }


        // Acesso autorizado.

        showAdminMessage(
            "Acesso autorizado! Autenticação realizada com sucesso.",
            "success"
        );

        console.log(
            "VIVERO: administrador autenticado com sucesso!"
        );

        // Redireciona para o painel administrativo.

        setTimeout(() => {

            window.location.replace("dashboard.html");

        }, 1000);


    } catch (error) {

        console.error(
            "VIVERO: erro na autenticação administrativa:",
            error
        );

        showAdminMessage(
            "Não foi possível entrar. Verifique suas credenciais e tente novamente.",
            "error"
        );

    } finally {

        adminLoginButton.disabled = false;

        adminLoginButton.textContent =
            "ENTRAR NO PAINEL ↗";

    }

});


console.log(
    "VIVERO: autenticação administrativa inicializada!"
);
