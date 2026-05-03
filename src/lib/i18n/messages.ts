import type { Locale } from "./locales";

/**
 * Hand-rolled i18n. Keep this small + practical: only the strings
 * that face new users meaningfully (homepage, auth pages, NavBar,
 * dashboard greeting). Lesson content + audit reports + coach
 * outputs stay in English at v1 (acknowledged in the UI copy).
 *
 * Translation by hand. If a translation is missing, fall back to
 * English silently — better than showing the key.
 */
export type MessageKey =
  | "nav.dashboard"
  | "nav.projects"
  | "nav.learn"
  | "nav.work"
  | "nav.wins"
  | "nav.earnings"
  | "nav.clients"
  | "nav.opportunities"
  | "nav.failures"
  | "nav.keys"
  | "nav.search"
  | "nav.logout"
  | "home.kicker"
  | "home.h1.line1"
  | "home.h1.line2"
  | "home.subhead"
  | "home.cta.signup"
  | "home.cta.login"
  | "home.cta.dashboard"
  | "home.layers.heading"
  | "home.notice.lessons_in_english"
  | "auth.login.heading"
  | "auth.login.subhead"
  | "auth.login.button"
  | "auth.login.google"
  | "auth.login.no_account"
  | "auth.login.signup_link"
  | "auth.signup.heading"
  | "auth.signup.subhead"
  | "auth.signup.button"
  | "auth.signup.google"
  | "auth.signup.has_account"
  | "auth.signup.login_link"
  | "auth.placeholder.email"
  | "auth.placeholder.password"
  | "dashboard.kicker"
  | "dashboard.greeting_anon"
  | "dashboard.greeting_named"
  | "dashboard.subhead"
  | "dashboard.new_project"
  | "language.label"
  | "language.note";

const en: Record<MessageKey, string> = {
  "nav.dashboard": "Dashboard",
  "nav.projects": "Projects",
  "nav.learn": "Learn",
  "nav.work": "Work",
  "nav.wins": "Wins",
  "nav.earnings": "Earnings",
  "nav.clients": "Clients",
  "nav.opportunities": "Radar",
  "nav.failures": "Failures",
  "nav.keys": "Keys",
  "nav.search": "Search",
  "nav.logout": "Log out",
  "home.kicker": "A creator OS — wholesome, grounded, anti-hype",
  "home.h1.line1": "Get genuinely good at AI.",
  "home.h1.line2": "Use it. Earn from it.",
  "home.subhead":
    "Workshop, classroom, and earnings hub in one place. Built for people who want to learn AI, do real work with it, and earn from it — without the doom-scrolling or the 50K-influencer noise.",
  "home.cta.signup": "Sign up — free tier",
  "home.cta.login": "I already have an account",
  "home.cta.dashboard": "Go to your dashboard →",
  "home.layers.heading": "Six layers, one app",
  "home.notice.lessons_in_english":
    "Lessons and AI outputs are in English at v1. The interface is in your language.",
  "auth.login.heading": "Welcome back",
  "auth.login.subhead": "Sign in to pick up where you left off.",
  "auth.login.button": "Log in",
  "auth.login.google": "Sign in with Google",
  "auth.login.no_account": "Don't have an account?",
  "auth.login.signup_link": "Sign up",
  "auth.signup.heading": "Start free",
  "auth.signup.subhead":
    "90 seconds. No credit card. Bring your own keys whenever.",
  "auth.signup.button": "Sign up",
  "auth.signup.google": "Sign up with Google",
  "auth.signup.has_account": "Already have an account?",
  "auth.signup.login_link": "Log in",
  "auth.placeholder.email": "Email",
  "auth.placeholder.password": "Password",
  "dashboard.kicker": "Dashboard",
  "dashboard.greeting_anon": "Welcome.",
  "dashboard.greeting_named": "Welcome, {name}.",
  "dashboard.subhead":
    "Pick up a Project, learn something new, or just open the coach and think out loud.",
  "dashboard.new_project": "+ New Project",
  "language.label": "Language",
  "language.note":
    "UI translation. Lessons and AI outputs stay in English for now.",
};

const fr: Record<MessageKey, string> = {
  "nav.dashboard": "Tableau de bord",
  "nav.projects": "Projets",
  "nav.learn": "Apprendre",
  "nav.work": "Travail",
  "nav.wins": "Réussites",
  "nav.earnings": "Revenus",
  "nav.clients": "Clients",
  "nav.opportunities": "Radar",
  "nav.failures": "Échecs",
  "nav.keys": "Clés",
  "nav.search": "Rechercher",
  "nav.logout": "Déconnexion",
  "home.kicker":
    "Un OS pour créateurs — bienveillant, ancré, sans hype",
  "home.h1.line1": "Devenez vraiment bon en IA.",
  "home.h1.line2": "Utilisez-la. Gagnez votre vie avec.",
  "home.subhead":
    "Atelier, salle de classe et tableau de bord financier en un seul endroit. Pour les gens qui veulent apprendre l'IA, faire du vrai travail avec, et en tirer un revenu — sans le bruit des prophètes de malheur ou des influenceurs à 50 000 abonnés.",
  "home.cta.signup": "Inscription — niveau gratuit",
  "home.cta.login": "J'ai déjà un compte",
  "home.cta.dashboard": "Mon tableau de bord →",
  "home.layers.heading": "Six couches, une seule app",
  "home.notice.lessons_in_english":
    "Les leçons et sorties IA sont en anglais (v1). L'interface est dans votre langue.",
  "auth.login.heading": "Bon retour",
  "auth.login.subhead": "Connectez-vous pour reprendre votre travail.",
  "auth.login.button": "Se connecter",
  "auth.login.google": "Se connecter avec Google",
  "auth.login.no_account": "Pas encore de compte ?",
  "auth.login.signup_link": "Inscription",
  "auth.signup.heading": "Commencez gratuitement",
  "auth.signup.subhead":
    "90 secondes. Pas de carte bancaire. Vos propres clés API quand vous voulez.",
  "auth.signup.button": "Inscription",
  "auth.signup.google": "S'inscrire avec Google",
  "auth.signup.has_account": "Déjà un compte ?",
  "auth.signup.login_link": "Se connecter",
  "auth.placeholder.email": "E-mail",
  "auth.placeholder.password": "Mot de passe",
  "dashboard.kicker": "Tableau de bord",
  "dashboard.greeting_anon": "Bienvenue.",
  "dashboard.greeting_named": "Bienvenue, {name}.",
  "dashboard.subhead":
    "Reprenez un projet, apprenez quelque chose, ou ouvrez simplement le coach pour réfléchir à voix haute.",
  "dashboard.new_project": "+ Nouveau projet",
  "language.label": "Langue",
  "language.note":
    "Traduction de l'interface. Les leçons et sorties IA restent en anglais pour l'instant.",
};

const sw: Record<MessageKey, string> = {
  "nav.dashboard": "Dashibodi",
  "nav.projects": "Miradi",
  "nav.learn": "Jifunze",
  "nav.work": "Kazi",
  "nav.wins": "Mafanikio",
  "nav.earnings": "Mapato",
  "nav.clients": "Wateja",
  "nav.opportunities": "Rada",
  "nav.failures": "Makosa",
  "nav.keys": "Funguo",
  "nav.search": "Tafuta",
  "nav.logout": "Toka",
  "home.kicker":
    "OS ya mtengenezaji — yenye nia njema, bila uongo wa kuvutia",
  "home.h1.line1": "Pata ujuzi wa kweli wa AI.",
  "home.h1.line2": "Itumie. Pata kipato kutoka kwake.",
  "home.subhead":
    "Sebule ya kazi, darasa, na kituo cha mapato pamoja. Imejengwa kwa watu wanaotaka kujifunza AI, kufanya kazi halisi nayo, na kupata kipato — bila kelele za waathiri wa influencer 50K au utabiri wa hofu.",
  "home.cta.signup": "Jisajili — bure",
  "home.cta.login": "Tayari nina akaunti",
  "home.cta.dashboard": "Nenda dashibodi yako →",
  "home.layers.heading": "Tabaka sita, programu moja",
  "home.notice.lessons_in_english":
    "Masomo na matokeo ya AI ni kwa Kiingereza (v1). Kiolesura ni kwa lugha yako.",
  "auth.login.heading": "Karibu tena",
  "auth.login.subhead": "Ingia kuendelea pale ulipoachia.",
  "auth.login.button": "Ingia",
  "auth.login.google": "Ingia kupitia Google",
  "auth.login.no_account": "Huna akaunti?",
  "auth.login.signup_link": "Jisajili",
  "auth.signup.heading": "Anza bure",
  "auth.signup.subhead":
    "Sekunde 90. Bila kadi ya benki. Leta funguo zako wakati wowote.",
  "auth.signup.button": "Jisajili",
  "auth.signup.google": "Jisajili kupitia Google",
  "auth.signup.has_account": "Tayari una akaunti?",
  "auth.signup.login_link": "Ingia",
  "auth.placeholder.email": "Barua pepe",
  "auth.placeholder.password": "Nenosiri",
  "dashboard.kicker": "Dashibodi",
  "dashboard.greeting_anon": "Karibu.",
  "dashboard.greeting_named": "Karibu, {name}.",
  "dashboard.subhead":
    "Endelea na mradi, jifunze kitu kipya, au fungua tu kocha na fikiri kwa sauti.",
  "dashboard.new_project": "+ Mradi mpya",
  "language.label": "Lugha",
  "language.note":
    "Tafsiri ya kiolesura. Masomo na matokeo ya AI yatabaki Kiingereza kwa sasa.",
};

const ALL_MESSAGES: Record<Locale, Record<MessageKey, string>> = {
  en,
  fr,
  sw,
};

/**
 * Translate a key to a string in the given locale. Falls back to
 * English silently if a translation is missing. Supports simple
 * `{name}` parameter interpolation.
 */
export function translate(
  locale: Locale,
  key: MessageKey,
  params: Record<string, string | number> = {},
): string {
  const localeMessages = ALL_MESSAGES[locale] ?? ALL_MESSAGES.en;
  let str = localeMessages[key] ?? ALL_MESSAGES.en[key] ?? key;
  for (const [k, v] of Object.entries(params)) {
    str = str.replaceAll(`{${k}}`, String(v));
  }
  return str;
}
