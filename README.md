# Chess Tournament System

Lekki system turniejowy szachowy działający w przeglądarce, inspirowany układem i zakresem funkcji znanym z ChessArbiter. Aplikacja nie ma backendu ani prawdziwej autoryzacji serwerowej. Wszystkie dane są zapisywane lokalnie w `localStorage`.

## Funkcje

- obsługa wielu turniejów w jednym stanie aplikacji
- konfiguracja turnieju szwajcarskiego lub kołowego
- logowanie jako `użytkownik` albo `sędzia`
- zapisywanie i wypisywanie zalogowanego użytkownika z turnieju
- rejestracja zawodników przez sędziego
- generowanie rund
- wpisywanie wyników
- klasyfikacja z tie-breakami: Buchholz, Sonneborn-Berger, liczba wygranych
- eksport tabeli do CSV
- migracja starego pojedynczego turnieju ze stanu `cts-state-v1` do modelu wielu turniejów

## Role

### Użytkownik

Zwykły użytkownik może przeglądać listę turniejów, wybrać turniej oraz zapisać lub wypisać samego siebie. Po zapisie konto użytkownika jest traktowane jako zawodnik na liście uczestników danego turnieju. Użytkownik nie może dodawać ani edytować turniejów, zawodników, rund i wyników.

Zapisy i wypisy są blokowane po rozpoczęciu turnieju, czyli po wygenerowaniu pierwszej rundy.

### Sędzia

Sędzia ma pełny dostęp administracyjny. Może tworzyć wiele turniejów, przełączać aktywny turniej, edytować jego konfigurację, dodawać i usuwać zawodników, generować rundy, wpisywać wyniki, zamykać rundy oraz eksportować klasyfikację do CSV.

## Logowanie

Panel logowania wymaga tylko loginu/nazwy użytkownika oraz wyboru roli:

- `użytkownik`
- `sędzia`

Po zalogowaniu sesja jest zapisywana w `localStorage`, więc odświeżenie strony zachowuje aktualnego użytkownika. Przycisk `Wyloguj` usuwa aktywną sesję ze stanu aplikacji.

To jest mechanizm demonstracyjny po stronie frontendu. Nie zastępuje bezpiecznego logowania, haseł ani autoryzacji backendowej.

## Dane

Nowy stan aplikacji używa struktury:

```js
{
  users: [],
  currentUserId: null,
  selectedTournamentId: null,
  tournaments: []
}
```

Każdy turniej ma własne `id`, dane konfiguracyjne, `participants` oraz `roundsData`. Dzięki temu zawodnicy, rundy i wyniki są odseparowane między turniejami.

## Uruchomienie

Możesz otworzyć bezpośrednio `index.html` w przeglądarce albo uruchomić lokalny serwer:

```bash
npm start
```

Następnie otwórz `http://localhost:4173`.

## Uwagi

Kojarzenie dla systemu szwajcarskiego jest heurystyczne: pilnuje punktów, unika powtórzeń i stara się balansować kolory, ale nie implementuje pełnego standardu FIDE Dutch.
