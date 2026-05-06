import { ChatWorkspace } from "@/components/chat-workspace";
import { getSessionUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n";
import { getLocaleFromCookies } from "@/lib/i18n-server";

export default async function ChatPage() {
  const user = await getSessionUser();
  const locale = await getLocaleFromCookies();

  if (!user) {
    return null;
  }

  return <ChatWorkspace user={user} locale={locale} dictionary={getDictionary(locale)} />;
}
