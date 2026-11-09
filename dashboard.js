
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

verifyAdminAccess();


console.log(
    "VIVERO: proteção do painel inicializada!"
);
