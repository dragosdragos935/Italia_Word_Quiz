# Flashcarduri Română - Italiană

O aplicație web modernă pentru învățarea limbii italiene prin flashcarduri interactive.

## 🎯 Funcționalități Noi

### 📝 Toate Modurile de Practice Funcționale
Aplicația include acum **9 moduri complete de practice**:

1. **✍️ Typing Mode** - Scrie traducerea corectă
2. **📋 Multiple Choice** - Alege din 4 opțiuni
3. **📄 Sentence Mode** - Traduce propoziții complete
4. **🔄 Flashcard Mode** - Întoarce cardurile pentru a vedea traducerea
5. **🎧 Listening Mode** - Ascultă și scrie ce auzi (Text-to-Speech)
6. **🧩 Matching Mode** - Potrivește perechile de cuvinte
7. **⚡ Speed Round** - Răspunde rapid împotriva cronometrului (10 secunde)
8. **🎤 Pronunciation Mode** - Înregistrează pronunția ta cu microfonul
9. **🎲 Mixed Mode** - Combină toate modurile aleatoriu

### 🎤 Înregistrare Pronunție cu Microfon
- **Înregistrare audio** prin apăsare lungă pe buton
- **Salvare locală** permanentă a pronunțiilor în localStorage
- **Redare** înregistrărilor tale pentru comparație
- **Stocare** pentru fiecare cuvânt individual

## Funcționalități Principale

- ✅ **Adăugare flashcarduri** - Adaugă cuvinte și fraze în română și italiană
- ✅ **9 moduri de quiz** - Toate modurile sunt funcționale
- ✅ **Sistem de progres** - Salvează progresul în browser
- ✅ **Repetare răspunsuri greșite** - Repeți automat răspunsurile greșite
- ✅ **Statistici detaliate** - Vezi progresul și acuratețea
- ✅ **Dicționar personal** - Salvează și gestionează vocabularul
- ✅ **Resurse educaționale** - PDF-uri și linkuri utile
- ✅ **Interfață modernă** - Design responsive și intuitiv

## 🚀 Cum să folosești

### Adăugare Flashcarduri
1. Mergi la tab-ul **Flashcards**
2. Apasă **Add Card**
3. Completează cuvintele/frazele în română și italiană
4. Alege categoria (Words, Phrases, Sentences, Texts)

### Moduri de Practice
1. Mergi la tab-ul **Practice**
2. Selectează unul din cele 9 moduri disponibile
3. Alege limbile (From/To) pentru direcția traducerii
4. Apasă **Start Quiz**
5. Răspunde la întrebări în funcție de modul selectat

**⚠️ Notă Importantă:** Când greșești un răspuns, **trebuie să îl repeți până răspunzi corect**. Nu poți trece la următoarea întrebare fără să răspunzi corect la cea curentă. Acest sistem te ajută să înveți mai bine!

### Înregistrare Pronunție (Pronunciation Mode)
1. Selectează **Pronunciation Mode** din Practice
2. Ascultă pronunția corectă apăsând butonul de play 🔊
3. **Ține apăsat** butonul roșu de înregistrare 🎤
4. Vorbește cuvântul în microfon
5. Eliberează butonul pentru a opri înregistrarea
6. Ascultă înregistrarea ta cu **Play My Recording**
7. Apasă **Save & Continue** pentru a salva și continua

### Dicționar Personal
1. Mergi la tab-ul **Dictionary**
2. Adaugă cuvinte noi sau caută în dicționar
3. Toate cuvintele din flashcard-uri sunt adăugate automat

### Resurse Educaționale
1. Mergi la tab-ul **Resources**
2. Accesează PDF-urile incluse (dicționare, gramatică)
3. Adaugă propriile resurse sau linkuri

## 🔧 Tehnologii

- **HTML5** - Structură semantică
- **CSS3** - Design modern cu animații și gradiente
- **JavaScript (ES6+)** - Logică aplicație
- **Web Audio API** - Înregistrare audio
- **MediaRecorder API** - Capturare audio din microfon
- **Speech Synthesis API** - Text-to-Speech pentru listening mode
- **LocalStorage** - Salvare date locală (flashcards, dicționar, pronunții)
- **Font Awesome** - Iconițe
- **Google Fonts (Inter)** - Tipografie modernă

## 💾 Stocare Date

Toate datele sunt salvate local în browser folosind LocalStorage:
- 📚 Flashcard-uri și progres
- 📖 Dicționar personal
- 📊 Statistici și progres zilnic
- 🎤 **Înregistrări audio** (format base64)
- 🔥 Streak-uri și obiective

## 📱 Compatibilitate

### Desktop
- ✅ Chrome/Edge (recomandat - suport complet)
- ✅ Firefox (suport complet)
- ⚠️ Safari (funcționalitate limitată pentru înregistrare)

### Mobile
- ✅ Chrome Mobile
- ✅ Firefox Mobile
- ⚠️ Safari iOS (necesită permisiuni pentru microfon)

## ⚠️ Permisiuni Necesare

Pentru **Pronunciation Mode**, browser-ul va cere permisiune pentru:
- 🎤 **Acces la microfon** - necesar pentru înregistrare audio

Asigură-te că permiți accesul la microfon când browser-ul îți cere.

## Instalare și rulare

1. Clonează repository-ul:
```bash
git clone https://github.com/username/flashcarduri-romana-italiana.git
```

2. Deschide `index.html` în browser sau folosește un server local:
```bash
# Cu Python
python -m http.server 8000

# Cu Node.js
npx serve .
```

3. Accesează aplicația la `http://localhost:8000`

## Hosting pe GitHub Pages

Aplicația este gata pentru hosting pe GitHub Pages. Doar:

1. Fă push la repository
2. Activează GitHub Pages în setările repository-ului
3. Aplicația va fi disponibilă la `https://username.github.io/repository-name`

## Structura proiectului

```
├── index.html          # Pagina principală
├── styles.css          # Stilurile CSS
├── script.js           # Logica JavaScript
└── README.md           # Documentația
```

## Contribuții

Contribuțiile sunt binevenite! Pentru a contribui:

1. Fork repository-ul
2. Creează o branch nouă (`git checkout -b feature/noua-functie`)
3. Commit modificările (`git commit -am 'Adaugă noua funcție'`)
4. Push la branch (`git push origin feature/noua-functie`)
5. Creează un Pull Request

## Licență

Acest proiect este open source și disponibil sub licența MIT.
