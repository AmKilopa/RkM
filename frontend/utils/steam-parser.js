// === ПАРСЕР STEAM ID ===
class SteamParser {
    static parseId(input) {
        // Удаляем пробелы
        input = input.trim();
        
        // Steam URL patterns
        const patterns = [
            /steamcommunity\.com\/profiles\/([0-9]+)/,
            /steamcommunity\.com\/id\/([a-zA-Z0-9_]+)/,
            /^([0-9]{17})$/, // Direct Steam64 ID
            /^([a-zA-Z0-9_]+)$/ // Username
        ];
        
        for (const pattern of patterns) {
            const match = input.match(pattern);
            if (match) {
                return match[1];
            }
        }
        
        return input; // Возвращаем как есть если не распознали
    }
}

window.SteamParser = SteamParser;