import type { Locale } from "./types";

export const LOCALE_COOKIE = "giba_locale";
export const DEFAULT_LOCALE: Locale = "en";

/** Display names shown in the language switcher. */
export const languageNames: Record<Locale, string> = {
  en: "EN",
  fr: "FR",
};

const RTL_LOCALES: ReadonlyArray<Locale> = [];

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "fr";
}

export function isRtlLocale(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}

/** Replace `{token}` placeholders in a string with the provided values. */
export function formatTemplate(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

const en = {
  common: {
    confidence: { high: "High confidence", medium: "Medium confidence", low: "Low confidence" },
    roleLabels: { admin: "Administrator", repairer: "Technician" },
    problem: "Problem",
    cause: "Cause",
    solution: "Solution",
    machineType: "Machine type",
    title: "Title",
    working: "Working…",
    send: "Send",
    signOut: "Sign out",
    light: "Light",
    dark: "Dark",
  },
  shell: {
    nav: {
      chat: "Assistant",
      knowledge: "Knowledge",
      dashboard: "Dashboard",
      reports: "Reports",
      settings: "Settings",
    },
  },
  login: {
    accessWorkspace: "Access workspace",
    accessDescription: "Sign in to the GIBA maintenance assistant.",
    username: "Username",
    password: "Password",
    signIn: "Sign in",
    signingIn: "Signing in…",
  },
  chat: {
    title: "Maintenance assistant",
    welcome: "Hello {name}. Describe a fault or ask a question to get started.",
    placeholder: "Ask about a fault, error code, or procedure… (type / to file a report)",
    slashSubmitReport: "File a report",
    slashCommands: "Commands",
    slashReportDescription: "Open the report form in the chat",
    noCommandMatch: "No matching command",
    suggestionsTitle: "Try asking",
    suggestions: [
      "The mold is not closing properly — what should I check first?",
      "What does error code E-204 mean on the HyPET5e?",
      "How do I purge the injection unit safely?",
    ],
    unableToAnswer: "Unable to answer right now. Please try again.",
    addFieldBeforeEnhancement: "Add a {field} before enhancing it.",
    unableToEnhance: "Could not enhance that field.",
    completeFields: "Complete every field before continuing.",
    unauthorizedMachine: "You are not authorized for this machine.",
    reviewReady: "AI review is ready below.",
    unableToReformulate: "Could not generate the AI review.",
    unableToModify: "Could not apply that change.",
    unableToCommit: "Could not submit the report.",
    committed: "Report {id} committed for {machine}.",
    reportComposerTitle: "File a maintenance report",
    enhance: "Enhance",
    aiReviewCard: "AI review",
    modifyPlaceholder: "Describe how to adjust the AI version…",
    modifyAiVersion: "Apply change",
    approveAndCommit: "Approve & commit",
    reviewAiVersion: "Review AI version",
    submitReport: "Submit as-is",
  },
  dashboard: {
    title: "Operations dashboard",
    description: "Knowledge base activity, query quality, and ingestion health.",
    cards: {
      reports: "Reports",
      queries: "Queries",
      lowConfidence: "Low-confidence",
      jobs: "Active jobs",
    },
    recentJobs: "Recent ingestion jobs",
    recentQueries: "Recent queries",
    recentReports: "Recent reports",
    noQueries: "No queries yet.",
    noReports: "No reports yet.",
  },
  knowledge: {
    title: "Knowledge administration",
    description: "Ingest manuals and manufacturer alerts into the knowledge base.",
    uploadManual: "Upload a manual",
    summary: "Summary",
    documentFile: "Document file (PDF)",
    queueManual: "Queue manual",
    queueAlert: "Queue alert",
    submitting: "Submitting…",
    submitManufacturerAlert: "Submit manufacturer alert",
    ingestionDescription: "Submitted content is chunked, embedded, and indexed for retrieval.",
    ingestionStatus: "Ingestion status",
    alertTitle: "Alert title",
    alertDetails: "Alert details",
    submitManualError: "Could not submit the manual.",
    submitAlertError: "Could not submit the alert.",
  },
  settings: {
    title: "Settings",
    description: "Manage appearance, language, and account preferences.",
    appearance: "Appearance",
    language: "Language",
    account: "Account",
  },
  unauthorized: {
    title: "Access denied",
    heading: "You do not have access to this area",
    description: "This section requires elevated permissions.",
    cta: "Back to assistant",
  },
};

export type Dictionary = typeof en;

const fr: Dictionary = {
  common: {
    confidence: { high: "Confiance élevée", medium: "Confiance moyenne", low: "Confiance faible" },
    roleLabels: { admin: "Administrateur", repairer: "Technicien" },
    problem: "Problème",
    cause: "Cause",
    solution: "Solution",
    machineType: "Type de machine",
    title: "Titre",
    working: "En cours…",
    send: "Envoyer",
    signOut: "Se déconnecter",
    light: "Clair",
    dark: "Sombre",
  },
  shell: {
    nav: {
      chat: "Assistant",
      knowledge: "Connaissances",
      dashboard: "Tableau de bord",
      reports: "Rapports",
      settings: "Paramètres",
    },
  },
  login: {
    accessWorkspace: "Accéder à l'espace",
    accessDescription: "Connectez-vous à l'assistant de maintenance GIBA.",
    username: "Identifiant",
    password: "Mot de passe",
    signIn: "Se connecter",
    signingIn: "Connexion…",
  },
  chat: {
    title: "Assistant de maintenance",
    welcome: "Bonjour {name}. Décrivez une panne ou posez une question pour commencer.",
    placeholder: "Décrivez une panne, un code d'erreur ou une procédure… (tapez / pour un rapport)",
    slashSubmitReport: "Créer un rapport",
    slashCommands: "Commandes",
    slashReportDescription: "Ouvrir le formulaire de rapport dans la discussion",
    noCommandMatch: "Aucune commande correspondante",
    suggestionsTitle: "Essayez de demander",
    suggestions: [
      "Le moule ne se ferme pas correctement — que vérifier en premier ?",
      "Que signifie le code d'erreur E-204 sur la HyPET5e ?",
      "Comment purger l'unité d'injection en toute sécurité ?",
    ],
    unableToAnswer: "Impossible de répondre pour le moment. Réessayez.",
    addFieldBeforeEnhancement: "Ajoutez un(e) {field} avant de l'améliorer.",
    unableToEnhance: "Impossible d'améliorer ce champ.",
    completeFields: "Complétez tous les champs avant de continuer.",
    unauthorizedMachine: "Vous n'êtes pas autorisé pour cette machine.",
    reviewReady: "La révision IA est prête ci-dessous.",
    unableToReformulate: "Impossible de générer la révision IA.",
    unableToModify: "Impossible d'appliquer cette modification.",
    unableToCommit: "Impossible de soumettre le rapport.",
    committed: "Rapport {id} enregistré pour {machine}.",
    reportComposerTitle: "Créer un rapport de maintenance",
    enhance: "Améliorer",
    aiReviewCard: "Révision IA",
    modifyPlaceholder: "Décrivez comment ajuster la version IA…",
    modifyAiVersion: "Appliquer",
    approveAndCommit: "Approuver et enregistrer",
    reviewAiVersion: "Réviser via IA",
    submitReport: "Soumettre tel quel",
  },
  dashboard: {
    title: "Tableau de bord",
    description: "Activité de la base de connaissances, qualité des requêtes et ingestion.",
    cards: {
      reports: "Rapports",
      queries: "Requêtes",
      lowConfidence: "Faible confiance",
      jobs: "Tâches actives",
    },
    recentJobs: "Tâches d'ingestion récentes",
    recentQueries: "Requêtes récentes",
    recentReports: "Rapports récents",
    noQueries: "Aucune requête pour l'instant.",
    noReports: "Aucun rapport pour l'instant.",
  },
  knowledge: {
    title: "Administration des connaissances",
    description: "Importez des manuels et alertes constructeur dans la base.",
    uploadManual: "Importer un manuel",
    summary: "Résumé",
    documentFile: "Fichier (PDF)",
    queueManual: "Mettre en file",
    queueAlert: "Mettre en file",
    submitting: "Envoi…",
    submitManufacturerAlert: "Soumettre une alerte constructeur",
    ingestionDescription: "Le contenu soumis est découpé, vectorisé et indexé pour la recherche.",
    ingestionStatus: "État de l'ingestion",
    alertTitle: "Titre de l'alerte",
    alertDetails: "Détails de l'alerte",
    submitManualError: "Impossible de soumettre le manuel.",
    submitAlertError: "Impossible de soumettre l'alerte.",
  },
  settings: {
    title: "Paramètres",
    description: "Gérez l'apparence, la langue et les préférences du compte.",
    appearance: "Apparence",
    language: "Langue",
    account: "Compte",
  },
  unauthorized: {
    title: "Accès refusé",
    heading: "Vous n'avez pas accès à cette zone",
    description: "Cette section requiert des permissions élevées.",
    cta: "Retour à l'assistant",
  },
};

const dictionaries: Record<Locale, Dictionary> = { en, fr };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}
