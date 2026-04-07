import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  fr: {
    translation: {
      "hr_dashboard": "Tableau de Bord RH",
      "chat_assistant": "Assistant Chat",
      "my_leave": "Mes Congés",
      "my_hours": "Mes Heures",
      "hr_policies": "Politiques RH",
      "settings": "Paramètres",
      "login_title": "Connexion",
      "login_subtitle": "Accédez à votre espace RH personnalisé",
      "matricule": "Matricule / Email",
      "password": "Mot de passe",
      "login_btn": "Se connecter",
      "login_loading": "Connexion en cours...",
      "need_help": "Besoin d'aide ?",
      "contact_hr": "Contactez le département RH",
      "total_active": "Total Employés Actifs",
      "present": "Présents",
      "new_hires": "Nouvelles Recrues",
      "attendance": "Présence Aujourd'hui",
      "absent": "Absents",
      "late": "En Retard",
      "remote": "En Télétravail",
      "leave_requests": "Demandes de Congés",
      "pending": "En attente",
      "approved": "Approuvé",
      "search": "Rechercher...",
      "logout": "Déconnexion"
    }
  },
  en: {
    translation: {
      "hr_dashboard": "HR Dashboard",
      "chat_assistant": "Chat Assistant",
      "my_leave": "My Leave",
      "my_hours": "My Hours",
      "hr_policies": "HR Policies",
      "settings": "Settings",
      "login_title": "Log In",
      "login_subtitle": "Access your personalized HR space",
      "matricule": "ID / Email",
      "password": "Password",
      "login_btn": "Log In",
      "login_loading": "Logging in...",
      "need_help": "Need help?",
      "contact_hr": "Contact the HR department",
      "total_active": "Total Active Employees",
      "present": "Present",
      "new_hires": "New Hires",
      "attendance": "Today's Attendance",
      "absent": "Absent",
      "late": "Late",
      "remote": "Remote",
      "leave_requests": "Leave Requests",
      "pending": "Pending",
      "approved": "Approved",
      "search": "Search...",
      "logout": "Log Out"
    }
  },
  ar: {
    translation: {
      "hr_dashboard": "لوحة تحكم الموارد البشرية",
      "chat_assistant": "مساعد الدردشة",
      "my_leave": "إجازاتي",
      "my_hours": "ساعات عملي",
      "hr_policies": "سياسات الموارد البشرية",
      "settings": "الإعدادات",
      "login_title": "تسجيل الدخول",
      "login_subtitle": "قم بالوصول إلى مساحة الموارد البشرية الخاصة بك",
      "matricule": "الرقم التعريفي / البريد الإلكتروني",
      "password": "كلمة المرور",
      "login_btn": "تسجيل الدخول",
      "login_loading": "جاري تسجيل الدخول...",
      "need_help": "بحاجة للمساعدة؟",
      "contact_hr": "تواصل مع قسم الموارد البشرية",
      "total_active": "إجمالي الموظفين النشطين",
      "present": "حاضر",
      "new_hires": "تعيينات جديدة",
      "attendance": "حضور اليوم",
      "absent": "غائب",
      "late": "متأخر",
      "remote": "عمل عن بعد",
      "leave_requests": "طلبات الإجازة",
      "pending": "قيد الانتظار",
      "approved": "موافق عليه",
      "search": "بحث...",
      "logout": "تسجيل الخروج"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "fr", // Default language (French as GIBA is likely French/Arabic)
    fallbackLng: "fr",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
