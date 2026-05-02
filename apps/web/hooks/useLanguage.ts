import { useEffect, useState } from "react";

export type Language = "es" | "en" | "pt";

export const translations = {
  es: {
    common: {
      save: "Guardar",
      cancel: "Cancelar",
      delete: "Eliminar",
      edit: "Editar",
      back: "Atrás",
      next: "Siguiente",
      loading: "Cargando...",
      error: "Error",
      success: "Éxito",
    },
    appointments: {
      title: "Citas",
      create: "Crear Cita",
      upcoming: "Próximas",
      past: "Pasadas",
      confirmed: "Confirmada",
      cancelled: "Cancelada",
      attended: "Completada",
      noShow: "No presentado",
    },
    auth: {
      login: "Iniciar Sesión",
      register: "Registrarse",
      logout: "Cerrar Sesión",
      email: "Correo Electrónico",
      password: "Contraseña",
      forgotPassword: "¿Olvidé mi contraseña?",
    },
  },
  en: {
    common: {
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      back: "Back",
      next: "Next",
      loading: "Loading...",
      error: "Error",
      success: "Success",
    },
    appointments: {
      title: "Appointments",
      create: "Create Appointment",
      upcoming: "Upcoming",
      past: "Past",
      confirmed: "Confirmed",
      cancelled: "Cancelled",
      attended: "Completed",
      noShow: "No Show",
    },
    auth: {
      login: "Login",
      register: "Register",
      logout: "Logout",
      email: "Email",
      password: "Password",
      forgotPassword: "Forgot password?",
    },
  },
  pt: {
    common: {
      save: "Salvar",
      cancel: "Cancelar",
      delete: "Deletar",
      edit: "Editar",
      back: "Voltar",
      next: "Próximo",
      loading: "Carregando...",
      error: "Erro",
      success: "Sucesso",
    },
    appointments: {
      title: "Compromissos",
      create: "Criar Compromisso",
      upcoming: "Próximos",
      past: "Passados",
      confirmed: "Confirmado",
      cancelled: "Cancelado",
      attended: "Concluído",
      noShow: "Não Compareceu",
    },
    auth: {
      login: "Fazer Login",
      register: "Registrar",
      logout: "Sair",
      email: "Email",
      password: "Senha",
      forgotPassword: "Esqueceu a senha?",
    },
  },
};

export function useLanguage() {
  const [language, setLanguage] = useState<Language>("es");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Leer preferencia guardada o del navegador
    const saved = localStorage.getItem("language");
    if (saved && (saved === "es" || saved === "en" || saved === "pt")) {
      setLanguage(saved);
    } else {
      const browserLang = navigator.language.split("-")[0];
      if (browserLang === "en" || browserLang === "pt") {
        setLanguage(browserLang as Language);
      }
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("language", language);
    }
  }, [language, mounted]);

  const t = (path: string, defaultValue = "") => {
    const keys = path.split(".");
    let value: any = translations[language];

    for (const key of keys) {
      value = value?.[key];
    }

    return value || defaultValue;
  };

  return {
    language,
    setLanguage,
    t,
    mounted,
  };
}
