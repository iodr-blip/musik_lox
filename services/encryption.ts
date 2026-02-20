/**
 * MeganNait Encryption Engine (E2EE) - DISABLED
 * Шифрование отключено по запросу пользователя.
 */

export async function encryptText(text: string, chatId: string): Promise<string> {
  // Возвращаем текст без изменений
  return text;
}

export async function decryptText(encryptedBase64: string, chatId: string): Promise<string> {
  // Возвращаем текст без изменений
  return encryptedBase64;
}