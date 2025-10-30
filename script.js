class LanguageLearningApp {
    constructor() {
        this.cards = this.loadCards();
        this.dictionary = this.loadDictionary();
        this.theory = this.loadTheory();
        this.dailyProgress = this.loadDailyProgress();
        
        this.currentTab = 'cards';
        this.currentQuiz = null;
        this.currentQuestionIndex = 0;
        this.quizMode = 'typing';
        this.isAnswered = false;
        this.correctCount = 0;
        this.wrongCount = 0;
        this.hintUsed = false;
		this.cardsSearchQuery = '';
		this.cardsFilters = { query: '', sort: 'recent', sourceLang: 'any', targetLang: 'any', letter: 'all', category: 'any' };
		this.dictionaryFilters = { query: '', sort: 'recent', sourceLang: 'any', targetLang: 'any', letter: 'all' };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateStats();
        this.renderCards();
        this.renderDictionary();
        this.renderTheory();
        this.updateLanguageLabels();
    }

    // Data Management
    loadCards() {
        const saved = localStorage.getItem('flashcards');
        const cards = saved ? JSON.parse(saved) : [];
        
        // Migrate old Romanian category values to English
        return cards.map(card => {
            if (card.category === 'cuvinte') card.category = 'words';
            if (card.category === 'fraze') card.category = 'phrases';
            if (card.category === 'propozitii') card.category = 'sentences';
            if (card.category === 'texte') card.category = 'texts';
            return card;
        });
    }

    // Dictionary Import/Export
exportDictionary() {
    if (this.dictionary.length === 0) {
        this.showNotification('No dictionary entries to export!', 'error');
        return;
    }

    const data = {
        dictionary: this.dictionary,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dictionary-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.showNotification('Dictionary exported successfully!', 'success');
}

importDictionary(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            
            if (!data.dictionary || !Array.isArray(data.dictionary)) {
                this.showNotification('Invalid dictionary file format!', 'error');
                return;
            }

            const entryCount = data.dictionary.length;
            const confirmMessage = `This will import ${entryCount} dictionary entries and replace your current dictionary. Continue?`;
            
            if (!confirm(confirmMessage)) return;

            this.dictionary = data.dictionary;
            this.saveDictionary();
            this.renderDictionary();
            this.showNotification(`Successfully imported ${entryCount} dictionary entries!`, 'success');
        } catch (error) {
            console.error('Import error:', error);
            this.showNotification('Error importing dictionary file!', 'error');
        }
    };
    reader.readAsText(file);
}


    saveCards() {
        localStorage.setItem('flashcards', JSON.stringify(this.cards));
    }

    loadDictionary() {
        const saved = localStorage.getItem('dictionary');
        return saved ? JSON.parse(saved) : [];
    }

    saveDictionary() {
        localStorage.setItem('dictionary', JSON.stringify(this.dictionary));
    }

    loadTheory() {
        const saved = localStorage.getItem('theory');
        return saved ? JSON.parse(saved) : [];
    }

    saveTheory() {
        localStorage.setItem('theory', JSON.stringify(this.theory));
    }

    loadDailyProgress() {
        const saved = localStorage.getItem('dailyProgress');
        const defaultProgress = {
            lastStudyDate: null,
            studiedToday: 0,
            streak: 0,
            totalStudied: 0
        };
        return saved ? JSON.parse(saved) : defaultProgress;
    }

    saveDailyProgress() {
        localStorage.setItem('dailyProgress', JSON.stringify(this.dailyProgress));
    }

    // Event Listeners
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.closest('.nav-tab').dataset.tab);
            });
        });

        // Cards
        document.getElementById('addCardBtn').addEventListener('click', () => {
            this.showAddCardForm();
        });

        document.getElementById('addFirstCard').addEventListener('click', () => {
            this.showAddCardForm();
        });

		// Cards search (live)
		const cardsSearchEl = document.getElementById('cardsSearch');
		if (cardsSearchEl) {
			cardsSearchEl.addEventListener('input', () => {
				this.cardsSearchQuery = cardsSearchEl.value.trim().toLowerCase();
				this.renderCards();
			});
		}
        // Edit Dictionary Modal
document.getElementById('closeEditDictionaryModal').addEventListener('click', () => {
    this.hideModal('editDictionaryModal');
});

document.getElementById('cancelEditDictionary').addEventListener('click', () => {
    this.hideModal('editDictionaryModal');
});

document.getElementById('editDictionaryForm').addEventListener('submit', (e) => {
    e.preventDefault();
    this.saveEditedDictionaryEntry();
});


        // Import/Export
        document.getElementById('exportCardsBtn').addEventListener('click', () => {
            this.exportCards();
        });



        // Dictionary Import/Export
document.getElementById('exportDictionaryBtn').addEventListener('click', () => {
    this.exportDictionary();
});

document.getElementById('importDictionaryBtn').addEventListener('click', () => {
    document.getElementById('importDictionaryFile').click();
});

document.getElementById('importDictionaryFile').addEventListener('change', (e) => {
    this.importDictionary(e.target.files[0]);
});


        document.getElementById('importCardsBtn').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });

        document.getElementById('importFile').addEventListener('change', (e) => {
            this.importCards(e.target.files[0]);
        });

        document.getElementById('closeForm').addEventListener('click', () => {
            this.hideAddCardForm();
        });

        document.getElementById('cancelForm').addEventListener('click', () => {
            this.hideAddCardForm();
        });

        document.getElementById('cardForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addCard();
        });

        // Language change listeners
        document.getElementById('sourceLanguage').addEventListener('change', () => {
            this.updateLanguageLabels();
        });

        document.getElementById('targetLanguage').addEventListener('change', () => {
            this.updateLanguageLabels();
        });

        // Quiz
        document.getElementById('startQuizBtn').addEventListener('click', () => {
            this.startQuiz();
        });

        document.getElementById('closeQuiz').addEventListener('click', () => {
            this.closeQuiz();
        });

        document.getElementById('checkAnswer').addEventListener('click', () => {
            this.checkTypingAnswer();
        });

        document.getElementById('checkSentence').addEventListener('click', () => {
            this.checkSentenceAnswer();
        });

        document.getElementById('nextQuestion').addEventListener('click', () => {
            this.nextQuestion();
        });

        document.getElementById('skipQuestion').addEventListener('click', () => {
            this.skipQuestion();
        });

        // Hint button
        document.getElementById('hintBtn').addEventListener('click', () => {
            if (!this.currentQuestion) return;
            const btn = document.getElementById('hintBtn');
            let hintReveal = document.getElementById('hintReveal');
            if (!hintReveal) {
                hintReveal = document.createElement('div');
                hintReveal.id = 'hintReveal';
                document.getElementById('questionText').parentNode.appendChild(hintReveal);
            }
            if (this.hintVisible) {
                hintReveal.style.display = 'none';
                btn.innerHTML = '<i class="fas fa-lightbulb"></i> Arată Hint';
                this.hintVisible = false;
            } else {
                hintReveal.textContent = this.currentQuestion.correctAnswer;
                hintReveal.style.display = 'block';
                btn.innerHTML = '<i class="fas fa-lightbulb"></i> Ascunde Hint';
                this.hintVisible = true;
            }
        });

		// Enter key support
        document.getElementById('typingAnswer').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !this.isAnswered) {
                this.checkTypingAnswer();
            }
        });

        document.getElementById('sentenceAnswer').addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter' && !this.isAnswered) {
                this.checkSentenceAnswer();
            }
        });

        // Dictionary
        document.getElementById('addDictionaryBtn').addEventListener('click', () => {
            this.showModal('dictionaryModal');
        });

        document.getElementById('closeDictionaryModal').addEventListener('click', () => {
            this.hideModal('dictionaryModal');
        });

        document.getElementById('cancelDictionary').addEventListener('click', () => {
            this.hideModal('dictionaryModal');
        });

        document.getElementById('dictionaryForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addDictionaryEntry();
        });

        document.getElementById('searchBtn').addEventListener('click', () => {
			// mirror to filters then render
			const q = document.getElementById('dictionarySearch').value.trim().toLowerCase();
			this.dictionaryFilters.query = q;
			this.renderDictionary();
        });

        document.getElementById('dictionarySearch').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
				const q = document.getElementById('dictionarySearch').value.trim().toLowerCase();
				this.dictionaryFilters.query = q;
				this.renderDictionary();
            }
        });

		// Dictionary filters (live)
		const dSort = document.getElementById('dictionarySort');
		const dSrc = document.getElementById('dictSourceFilter');
		const dTgt = document.getElementById('dictTargetFilter');
		const dLetter = document.getElementById('dictLetter');
		[dSort, dSrc, dTgt, dLetter].forEach(el => {
			if (!el) return;
			el.addEventListener('input', () => {
				this.dictionaryFilters.sort = dSort ? dSort.value : 'recent';
				this.dictionaryFilters.sourceLang = dSrc ? dSrc.value : 'any';
				this.dictionaryFilters.targetLang = dTgt ? dTgt.value : 'any';
				this.dictionaryFilters.letter = dLetter ? dLetter.value : 'all';
				this.renderDictionary();
			});
		});

        // Theory
        document.getElementById('addTheoryBtn').addEventListener('click', () => {
            this.showModal('theoryModal');
        });

        document.getElementById('closeTheoryModal').addEventListener('click', () => {
            this.hideModal('theoryModal');
        });

        document.getElementById('cancelTheory').addEventListener('click', () => {
            this.hideModal('theoryModal');
        });

        document.getElementById('theoryForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTheoryMaterial();
        });

        // Edit modal
        document.getElementById('closeEditModal').addEventListener('click', () => {
            this.hideModal('editModal');
        });

        document.getElementById('cancelEdit').addEventListener('click', () => {
            this.hideModal('editModal');
        });

        document.getElementById('editForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEditedCard();
        });

		// Cards filters
		const cardsSort = document.getElementById('cardsSort');
		const cardsSourceFilter = document.getElementById('cardsSourceFilter');
		const cardsTargetFilter = document.getElementById('cardsTargetFilter');
		const cardsLetter = document.getElementById('cardsLetter');
		const cardsCategoryFilter = document.getElementById('cardsCategoryFilter');
		[cardsSort, cardsSourceFilter, cardsTargetFilter, cardsLetter, cardsCategoryFilter].forEach(el => {
			if (!el) return;
			el.addEventListener('input', () => {
				this.cardsFilters.sort = cardsSort ? cardsSort.value : 'recent';
				this.cardsFilters.sourceLang = cardsSourceFilter ? cardsSourceFilter.value : 'any';
				this.cardsFilters.targetLang = cardsTargetFilter ? cardsTargetFilter.value : 'any';
				this.cardsFilters.letter = cardsLetter ? cardsLetter.value : 'all';
				this.cardsFilters.category = cardsCategoryFilter ? cardsCategoryFilter.value : 'any';
				this.renderCards();
			});
		});
    }

	updateQuizAvailableCount() {
		const count = this.cards.length;
		const el = document.getElementById('quizTotalCards');
		if (el) el.textContent = count;
	}

	getFilteredCardsForQuiz() {
		return this.cards;
	}

    renderDictionaryResults(results) {
        const container = document.getElementById('dictionaryResults');
        
        if (results.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-search"></i>
                    </div>
                    <h3>No results found</h3>
                    <p>Try searching for a different word</p>
                </div>
            `;
            return;
        }
    
        container.innerHTML = results.map(entry => `
            <div class="dictionary-entry slide-in-up">
                <div class="dictionary-main">
                    <div class="dictionary-word">${entry.sourceWord}</div>
                    <div class="dictionary-translation">${entry.targetWord}</div>
                    ${entry.description ? `<div class="dictionary-description">${entry.description}</div>` : ''}
                </div>
                <div class="dictionary-meta">
                    <span class="dictionary-type">${entry.type || ''}</span>
                    <div class="dictionary-actions">
                        <button class="btn-icon" onclick="app.editDictionaryEntry(${entry.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete" onclick="app.deleteDictionaryEntry(${entry.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    // Navigation
    switchTab(tabName) {
        // Update active tab
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update active content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        this.currentTab = tabName;

		// Update quiz stats if switching to quiz tab
		if (tabName === 'quiz') {
			this.updateQuizAvailableCount();
		}
    }

    // Cards Management
    showAddCardForm() {
        document.getElementById('addCardForm').style.display = 'block';
        document.getElementById('addCardForm').scrollIntoView({ behavior: 'smooth' });
    }

    hideAddCardForm() {
        document.getElementById('addCardForm').style.display = 'none';
        document.getElementById('cardForm').reset();
    }

    addCard() {
        const category = document.getElementById('cardCategory').value;
        const sourceLanguage = document.getElementById('sourceLanguage').value;
        const targetLanguage = document.getElementById('targetLanguage').value;
        const sourceText = document.getElementById('sourceText').value.trim();
        const targetText = document.getElementById('targetText').value.trim();

        if (!sourceText || !targetText) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        if (sourceLanguage === targetLanguage) {
            this.showNotification('Source and target languages must be different', 'error');
            return;
        }

        const card = {
            id: Date.now(),
            category,
            sourceLanguage,
            targetLanguage,
            sourceText,
            targetText,
            attempts: 0,
            correct: 0,
            createdAt: new Date().toISOString()
        };

        this.cards.push(card);
        this.saveCards();
        this.updateStats();
        this.renderCards();
        this.hideAddCardForm();
        this.showNotification('Card added successfully!', 'success');

		// Auto-add to dictionary
		this.addDictionaryFromCard(card);
    }

	addDictionaryFromCard(card) {
		if (!card) return;
		const exists = this.dictionary.some(e =>
			e.sourceLang === card.sourceLanguage &&
			e.targetLang === card.targetLanguage &&
			e.sourceWord === card.sourceText &&
			e.targetWord === card.targetText
		);
		if (exists) {
			this.renderDictionary();
			return;
		}
		const entry = {
			id: Date.now() + Math.floor(Math.random() * 1000),
			sourceLang: card.sourceLanguage,
			targetLang: card.targetLanguage,
			sourceWord: card.sourceText,
			targetWord: card.targetText,
			type: card.category === 'words' ? 'noun' : 'other',
			description: '',
			createdAt: new Date().toISOString()
		};
		this.dictionary.push(entry);
		this.saveDictionary();
		this.renderDictionary();
		this.showNotification('Word added to dictionary automatically.', 'success');
	}

    deleteCard(cardId) {
        if (confirm('Are you sure you want to delete this card?')) {
            this.cards = this.cards.filter(card => card.id !== cardId);
            this.saveCards();
            this.updateStats();
            this.renderCards();
            this.showNotification('Card deleted successfully!', 'success');
        }
    }

    editCard(cardId) {
        const card = this.cards.find(c => c.id === cardId);
        if (!card) return;

        document.getElementById('editCategory').value = card.category;
        document.getElementById('editSourceText').value = card.sourceText;
        document.getElementById('editTargetText').value = card.targetText;
        
        // Store the card ID for saving
        document.getElementById('editForm').dataset.cardId = cardId;
        
        this.showModal('editModal');
    }

    saveEditedCard() {
        const cardId = parseInt(document.getElementById('editForm').dataset.cardId);
        const card = this.cards.find(c => c.id === cardId);
        
        if (!card) return;

        card.category = document.getElementById('editCategory').value;
        card.sourceText = document.getElementById('editSourceText').value.trim();
        card.targetText = document.getElementById('editTargetText').value.trim();

        this.saveCards();
        this.renderCards();
        this.hideModal('editModal');
        this.showNotification('Card updated successfully!', 'success');
    }
    editDictionaryEntry(id) {
        const entry = this.dictionary.find(e => e.id === id);
        if (!entry) return;
    
        // Populate modal
        document.getElementById('editDictSourceLang').value = entry.sourceLang;
        document.getElementById('editDictTargetLang').value = entry.targetLang;
        document.getElementById('editDictSourceWord').value = entry.sourceWord;
        document.getElementById('editDictTargetWord').value = entry.targetWord;
        document.getElementById('editDictType').value = entry.type || '';
        document.getElementById('editDictDescription').value = entry.description || '';
    
        // Store id for saving
        document.getElementById('editDictionaryForm').dataset.entryId = id;
    
        this.showModal('editDictionaryModal');
    }
    
    saveEditedDictionaryEntry() {
        const id = parseInt(document.getElementById('editDictionaryForm').dataset.entryId);
        const entry = this.dictionary.find(e => e.id === id);
        if (!entry) return;
    
        entry.sourceLang = document.getElementById('editDictSourceLang').value;
        entry.targetLang = document.getElementById('editDictTargetLang').value;
        entry.sourceWord = document.getElementById('editDictSourceWord').value.trim();
        entry.targetWord = document.getElementById('editDictTargetWord').value.trim();
        entry.type = document.getElementById('editDictType').value.trim();
        entry.description = document.getElementById('editDictDescription').value.trim();
    
        this.saveDictionary();
        this.renderDictionary();
        this.hideModal('editDictionaryModal');
        this.showNotification('Dictionary entry updated successfully!', 'success');
    }
    
    deleteDictionaryEntry(id) {
        if (!confirm('Are you sure you want to delete this dictionary entry?')) return;
        this.dictionary = this.dictionary.filter(e => e.id !== id);
        this.saveDictionary();
        this.renderDictionary();
        this.showNotification('Dictionary entry deleted successfully!', 'success');
    }
    

    renderCards() {
        const container = document.getElementById('cardsGrid');
        
        if (this.cards.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-layer-group"></i>
                    </div>
                    <h3>No flashcards yet</h3>
                    <p>Add your first flashcard to get started!</p>
                    <button class="btn btn-primary" id="addFirstCard">
                        <i class="fas fa-plus"></i>
                        Add First Card
                    </button>
                </div>
            `;
            
            // Re-add event listener for the button
            document.getElementById('addFirstCard').addEventListener('click', () => {
                this.showAddCardForm();
            });
            return;
        }

        const filters = this.cardsFilters;
        let list = [...this.cards];
        const q = this.cardsSearchQuery;
        if (q) list = list.filter(card => (card.sourceText||'').toLowerCase().includes(q) || (card.targetText||'').toLowerCase().includes(q));
        if (filters.sourceLang !== 'any') list = list.filter(card => card.sourceLanguage===filters.sourceLang);
        if (filters.targetLang !== 'any') list = list.filter(card => card.targetLanguage===filters.targetLang);
        if (filters.letter !== 'all') list = list.filter(card => ((card.sourceText||'').charAt(0).toUpperCase()===filters.letter));
        if (filters.category !== 'any') list = list.filter(card => card.category === filters.category);
        if (filters.sort==='recent') list.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
        else if (filters.sort==='az') list.sort((a,b)=>(a.sourceText||'').localeCompare(b.sourceText||''));
        else if (filters.sort==='za') list.sort((a,b)=>(b.sourceText||'').localeCompare(a.sourceText||''));

        if (list.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-search"></i>
                    </div>
                    <h3>Nicio potrivire</h3>
                    <p>Ajustează căutarea pentru a vedea carduri</p>
                </div>
            `;
            return;
        }

        container.innerHTML = list.map(card => `
            <div class="card slide-in-up">
                <div class="card-header">
                    <div class="card-category">${this.getCategoryLabel(card.category)}</div>
                    <div class="card-actions">
                        <button class="card-action" onclick="app.editCard(${card.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="card-action delete" onclick="app.deleteCard(${card.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="card-content">
                    <div class="card-direction">${this.getLanguageName(card.sourceLanguage)} → ${this.getLanguageName(card.targetLanguage)}</div>
                    <div class="card-text">${card.sourceText}</div>
                    <div class="card-translation">${card.targetText}</div>
                </div>
                <div class="card-stats">
                    <span>Attempts: ${card.attempts}</span>
                    <span>Correct: ${card.correct}</span>
                </div>
            </div>
        `).join('');
    }

    // Quiz Management
    startQuiz() {
        if (this.cards.length === 0) {
            this.showNotification('Please add at least one card to start the quiz!', 'error');
            return;
        }

        // Get selected quiz mode
        const selectedMode = document.querySelector('input[name="quizMode"]:checked').value;
        this.quizMode = selectedMode;

        // Build quiz list from filters
        const filtered = this.cards;
        if (filtered.length === 0) {
            this.showNotification('Nu există carduri care să corespundă filtrării pentru quiz.', 'error');
            return;
        }

        // Initialize quiz state
        this.currentQuiz = [...filtered];
        this.shuffleArray(this.currentQuiz);
        this.currentQuestionIndex = 0;
        this.isAnswered = false;
        this.correctCount = 0;
        this.wrongCount = 0;
        this.hintUsed = false;

        // Update daily progress
        this.updateDailyProgress();

        // Show quiz content
        document.getElementById('quizStart').style.display = 'none';
        document.getElementById('quizContent').style.display = 'block';

        // Show first question
        this.showQuestion();
        
       
    }

    closeQuiz() {
        document.getElementById('quizStart').style.display = 'block';
        document.getElementById('quizContent').style.display = 'none';
        this.showNotification('Quiz closed.', 'info');
    }

    showQuestion() {
        if (!this.currentQuiz || this.currentQuestionIndex >= this.currentQuiz.length) {
            this.endQuiz();
            return;
        }
    
        const currentCard = this.currentQuiz[this.currentQuestionIndex];
    
        // --- Preluare selecție utilizator ---
        const sourceLang = document.getElementById('quizSourceLang').value;
        const targetLang = document.getElementById('quizTargetLang').value;
    
        // --- Determinare text pentru întrebare și răspuns ---
        let questionText, correctAnswer, directionText;
    
        // Dacă sursa și ținta coincid cu cardul curent
        if (currentCard.sourceLanguage === sourceLang && currentCard.targetLanguage === targetLang) {
            questionText = currentCard.sourceText;
            correctAnswer = currentCard.targetText;
            directionText = `${this.getLanguageName(sourceLang)} → ${this.getLanguageName(targetLang)}`;
        } else if (currentCard.sourceLanguage === targetLang && currentCard.targetLanguage === sourceLang) {
            // invers
            questionText = currentCard.targetText;
            correctAnswer = currentCard.sourceText;
            directionText = `${this.getLanguageName(targetLang)} → ${this.getLanguageName(sourceLang)}`;
        } else {
            // dacă cardul nu are limbile selectate, aleg random ca fallback
            const isSourceToTarget = Math.random() < 0.5;
            questionText = isSourceToTarget ? currentCard.sourceText : currentCard.targetText;
            correctAnswer = isSourceToTarget ? currentCard.targetText : currentCard.sourceText;
            directionText = isSourceToTarget
                ? `${this.getLanguageName(currentCard.sourceLanguage)} → ${this.getLanguageName(currentCard.targetLanguage)}`
                : `${this.getLanguageName(currentCard.targetLanguage)} → ${this.getLanguageName(currentCard.sourceLanguage)}`;
        }
    
        // Store current question data
        this.currentQuestion = {
            card: currentCard,
            isSourceToTarget: questionText === currentCard.sourceText,
            correctAnswer: correctAnswer
        };
    
        // Update UI
        document.getElementById('questionText').textContent = questionText;
        document.getElementById('questionHint').textContent = `Translate to ${this.getLanguageName(targetLang)}`;
        document.getElementById('questionDirection').textContent = directionText;
    
        const modeLabels = {
            'typing': 'Typing Mode',
            'multiple': 'Multiple Choice',
            'sentence': 'Sentence Mode'
        };
        document.getElementById('questionType').textContent = modeLabels[this.quizMode] || 'Typing Mode';
    
        // Reset UI state
        this.isAnswered = false;
        this.hintUsed = false;
        this.clearAnswerInputs();
        document.getElementById('feedbackSection').style.display = 'none';
    
        // Reset hint button
        const hintBtn = document.getElementById('hintBtn');
        hintBtn.classList.remove('hint-used');
        hintBtn.innerHTML = '<i class="fas fa-lightbulb"></i> Arată Hint';
        hintBtn.disabled = false;
    
        // Update progress
        document.getElementById('questionCounter').textContent = `${this.currentQuestionIndex + 1} / ${this.currentQuiz.length}`;
        const progress = (this.currentQuestionIndex / this.currentQuiz.length) * 100;
        document.getElementById('progressFill').style.width = `${progress}%`;
    
        // Show appropriate mode
        this.setQuizMode(this.quizMode);
    
        // Focus on input if typing mode
        if (this.quizMode === 'typing') {
            setTimeout(() => {
                document.getElementById('typingAnswer').focus();
            }, 100);
        }
    
        // Hint handling
        this.hintVisible = false;
        let hintReveal = document.getElementById('hintReveal');
        if (!hintReveal) {
            hintReveal = document.createElement('div');
            hintReveal.id = 'hintReveal';
            document.getElementById('questionText').parentNode.appendChild(hintReveal);
        }
        hintReveal.style.display = 'none';
        hintReveal.textContent = '';
    }
    
    

    setQuizMode(mode) {
        // Hide all modes
        document.getElementById('typingMode').style.display = 'none';
        document.getElementById('multipleMode').style.display = 'none';
        document.getElementById('sentenceMode').style.display = 'none';

        // Show selected mode
        switch(mode) {
            case 'typing':
                document.getElementById('typingMode').style.display = 'block';
                break;
            case 'multiple':
                document.getElementById('multipleMode').style.display = 'block';
                this.generateMultipleChoiceOptions();
                break;
            case 'sentence':
                document.getElementById('sentenceMode').style.display = 'block';
                break;
        }
    }

    generateMultipleChoiceOptions() {
        const container = document.getElementById('optionsGrid');
        const correctAnswer = this.currentQuestion.correctAnswer;
        
        // Get 3 wrong answers from other cards
        const wrongAnswers = this.cards
            .filter(card => card.id !== this.currentQuestion.card.id)
            .map(card => card.targetText)
            .filter(text => text !== correctAnswer)
            .slice(0, 3);

        // Combine correct and wrong answers
        const allAnswers = [correctAnswer, ...wrongAnswers];
        this.shuffleArray(allAnswers);

        // Generate option buttons
        container.innerHTML = allAnswers.map(answer => `
            <button class="option-btn" data-answer="${answer}">${answer}</button>
        `).join('');

        // Add event listeners
        container.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.isAnswered) return;
                
                const selectedAnswer = btn.dataset.answer;
                const isCorrect = selectedAnswer === correctAnswer;
                
                // Update button styles
                btn.classList.add(isCorrect ? 'correct' : 'incorrect');
                
                // Disable all buttons
                container.querySelectorAll('.option-btn').forEach(b => {
                    b.disabled = true;
                    if (b.dataset.answer === correctAnswer) {
                        b.classList.add('correct');
                    }
                });
                
                this.handleAnswer(isCorrect);
            });
        });
    }

    checkTypingAnswer() {
        if (this.isAnswered) return;
        
        const userAnswer = document.getElementById('typingAnswer').value.trim().toLowerCase();
        const correctAnswer = this.currentQuestion.correctAnswer.toLowerCase();
        
        const isCorrect = this.isAnswerCorrect(userAnswer, correctAnswer);
        
        if (isCorrect) {
            this.handleAnswer(true);
            this.nextQuestion(); // trecem la următoarea doar dacă răspunsul e corect
        } else {
            this.handleAnswer(false);
            // Răspuns greșit, rămânem pe aceeași întrebare
            // Poți adăuga aici un mesaj de avertizare sau alte acțiuni
            this.showNotification('Răspuns greșit. Încearcă din nou!', 'error');
        }
    }

    checkSentenceAnswer() {
        if (this.isAnswered) return;
        
        const userAnswer = document.getElementById('sentenceAnswer').value.trim().toLowerCase();
        const correctAnswer = this.currentQuestion.correctAnswer.toLowerCase();
        
        const isCorrect = this.isAnswerCorrect(userAnswer, correctAnswer);
        
        if (isCorrect) {
            this.handleAnswer(true);
            this.nextQuestion(); // trecem la următoarea doar dacă răspunsul e corect
        } else {
            this.handleAnswer(false);
            this.showNotification('Răspuns greșit. Încearcă din nou!', 'error');
            // Rămânem pe aceeași întrebare
        }
    }
    isAnswerCorrect(userAnswer, correctAnswer) {
        // Exact match
        if (userAnswer === correctAnswer) return true;
        
        // Remove accents and compare
        const normalize = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (normalize(userAnswer) === normalize(correctAnswer)) return true;
        
        // Check if user answer contains the correct answer or vice versa
        if (userAnswer.includes(correctAnswer) || correctAnswer.includes(userAnswer)) {
            return Math.abs(userAnswer.length - correctAnswer.length) <= 2;
        }
        
        return false;
    }

    handleAnswer(isCorrect) {
        this.isAnswered = true;
        
        if (isCorrect) {
            this.correctCount++;
            this.currentQuestion.card.attempts++;
            this.currentQuestion.card.correct++;
            this.showFeedback(true, `🎉 Correct! Well done!`);
        } else {
            this.wrongCount++;
            this.currentQuestion.card.attempts++;
            this.showFeedback(false, `❌ Incorrect. Try again or use the hint!`);
        }
        
        this.saveCards();
        this.updateStats();
        this.updateDailyProgress();
    }

    showFeedback(isCorrect, message) {
        const feedbackCard = document.getElementById('feedbackCard');
        
        feedbackCard.innerHTML = `
            <div class="feedback-icon">
                ${isCorrect ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-times-circle"></i>'}
            </div>
            <div class="feedback-message">${message}</div>
        `;
        
        feedbackCard.className = `feedback-card ${isCorrect ? 'correct' : 'incorrect'}`;
        document.getElementById('feedbackSection').style.display = 'block';
        
        // Add shake animation for incorrect answers
        if (!isCorrect) {
            feedbackCard.classList.add('shake');
        }
    }

    nextQuestion() {
        this.currentQuestionIndex++;
        this.showQuestion();
    }

    skipQuestion() {
        this.wrongCount++;
        this.currentQuestion.card.attempts++;
        this.nextQuestion();
    }

    endQuiz() {
        const totalQuestions = this.currentQuiz.length;
        const accuracy = Math.round((this.correctCount / totalQuestions) * 100);
        
        this.showNotification(`Quiz completed! Accuracy: ${accuracy}%`, 'success');
        this.closeQuiz();
    }

    clearAnswerInputs() {
        document.getElementById('typingAnswer').value = '';
        document.getElementById('sentenceAnswer').value = '';
    }

    // Dictionary Management
    addDictionaryEntry() {
        const sourceLang = document.getElementById('dictSourceLang').value;
        const targetLang = document.getElementById('dictTargetLang').value;
        const sourceWord = document.getElementById('dictSourceWord').value.trim();
        const targetWord = document.getElementById('dictTargetWord').value.trim();
        const type = document.getElementById('dictType').value;
        const description = document.getElementById('dictDescription').value.trim();

        if (!sourceWord || !targetWord) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        if (sourceLang === targetLang) {
            this.showNotification('Source and target languages must be different', 'error');
            return;
        }

        const entry = {
            id: Date.now(),
            sourceLang,
            targetLang,
            sourceWord,
            targetWord,
            type,
            description,
            createdAt: new Date().toISOString()
        };

        this.dictionary.push(entry);
        this.saveDictionary();
        this.renderDictionary();
        this.hideModal('dictionaryModal');
        this.showNotification('Dictionary entry added successfully!', 'success');
        
        // Reset form
        document.getElementById('dictionaryForm').reset();
    }

    searchDictionary() {
        const query = document.getElementById('dictionarySearch').value.trim().toLowerCase();
        
        if (!query) {
            this.renderDictionary();
            return;
        }

        const results = this.dictionary.filter(entry => 
            entry.sourceWord.toLowerCase().includes(query) ||
            entry.targetWord.toLowerCase().includes(query) ||
            entry.description.toLowerCase().includes(query)
        );

        this.renderDictionaryResults(results);
    }

    renderDictionary() {
        const list = this.getFilteredDictionary();
        this.renderDictionaryResults(list);
    }

    getFilteredDictionary() {
        let list = [...this.dictionary];
        const { query, sourceLang, targetLang, letter, sort } = this.dictionaryFilters || {};

        if (query) {
            const q = query.toLowerCase();
            list = list.filter(e =>
                (e.sourceWord && e.sourceWord.toLowerCase().includes(q)) ||
                (e.targetWord && e.targetWord.toLowerCase().includes(q)) ||
                (e.description && e.description.toLowerCase().includes(q))
            );
        }

        if (sourceLang && sourceLang !== 'any') list = list.filter(e => e.sourceLang === sourceLang);
        if (targetLang && targetLang !== 'any') list = list.filter(e => e.targetLang === targetLang);

        if (letter && letter !== 'all') {
            list = list.filter(e => {
                const w = (e.sourceWord || '').trim();
                return w.charAt(0).toUpperCase() === letter;
            });
        }

        if (sort === 'recent') {
            list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (sort === 'az') {
            list.sort((a, b) => (a.sourceWord || '').localeCompare(b.sourceWord || ''));
        } else if (sort === 'za') {
            list.sort((a, b) => (b.sourceWord || '').localeCompare(a.sourceWord || ''));
        }

        return list;
    }

    renderDictionaryResults(results) {
        const container = document.getElementById('dictionaryResults');
        
        if (results.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-search"></i>
                    </div>
                    <h3>No results found</h3>
                    <p>Try searching for a different word</p>
                </div>
            `;
            return;
        }
    
        container.innerHTML = results.map(entry => `
            <div class="dictionary-entry slide-in-up">
                <div class="dictionary-main">
                    <div class="dictionary-word">${entry.sourceWord}</div>
                    <div class="dictionary-translation">${entry.targetWord}</div>
                    ${entry.description ? `<div class="dictionary-description">${entry.description}</div>` : ''}
                </div>
                <div class="dictionary-meta">
                    <span class="dictionary-type">${entry.type || ''}</span>
                    <div class="dictionary-actions">
                        <button class="btn-icon" onclick="app.editDictionaryEntry(${entry.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete" onclick="app.deleteDictionaryEntry(${entry.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    
    // Theory Management
    addTheoryMaterial() {
        const title = document.getElementById('theoryTitle').value.trim();
        const language = document.getElementById('theoryLanguage').value;
        const description = document.getElementById('theoryDescription').value.trim();
        const file = document.getElementById('theoryFile').files[0];

        if (!title || !description) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        const material = {
            id: Date.now(),
            title,
            language,
            description,
            file: file ? file.name : null,
            createdAt: new Date().toISOString()
        };

        this.theory.push(material);
        this.saveTheory();
        this.renderTheory();
        this.hideModal('theoryModal');
        this.showNotification('Theory material added successfully!', 'success');
        
        // Reset form
        document.getElementById('theoryForm').reset();
    }

    deleteTheory(id) {
        if (confirm('Are you sure you want to delete this material?')) {
            this.theory = this.theory.filter(material => material.id !== id);
            this.saveTheory();
            this.renderTheory();
            this.showNotification('Material deleted successfully!', 'success');
        }
    }

    renderTheory() {
        const container = document.getElementById('theoryList');
        
        if (this.theory.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-graduation-cap"></i>
                    </div>
                    <h3>No theory materials yet</h3>
                    <p>Add your first learning material to get started!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.theory.map(material => `
            <div class="theory-item slide-in-up">
                <div class="theory-header">
                    <div class="theory-title">${material.title}</div>
                    <div class="theory-language">${this.getLanguageName(material.language)}</div>
                </div>
                <div class="theory-description">${material.description}</div>
                ${material.file ? `<div class="theory-file"><i class="fas fa-file"></i> ${material.file}</div>` : ''}
                <div class="theory-actions">
                    <button class="btn btn-secondary btn-sm" onclick="app.deleteTheory(${material.id})">
                        <i class="fas fa-trash"></i>
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Utility Functions
    updateLanguageLabels() {
        const sourceLang = document.getElementById('sourceLanguage').value;
        const targetLang = document.getElementById('targetLanguage').value;
        
        document.getElementById('sourceTextLabel').textContent = `Text in ${this.getLanguageName(sourceLang)}`;
        document.getElementById('targetTextLabel').textContent = `Text in ${this.getLanguageName(targetLang)}`;
        
        document.getElementById('sourceText').placeholder = `Enter text in ${this.getLanguageName(sourceLang)}...`;
        document.getElementById('targetText').placeholder = `Enter translation in ${this.getLanguageName(targetLang)}...`;
    }

    getLanguageName(code) {
        const languages = {
            'ro': 'Romanian',
            'en': 'English',
            'it': 'Italian'
        };
        return languages[code] || code;
    }

    getCategoryLabel(category) {
        const categories = {
            'words': 'Words',
            'phrases': 'Phrases',
            'sentences': 'Sentences',
            'texts': 'Long Texts'
        };
        return categories[category] || category;
    }

    updateStats() {
        document.getElementById('totalCards').textContent = this.cards.length;
        
        const learnedCards = this.cards.filter(card => card.correct > 0).length;
        document.getElementById('learnedCards').textContent = learnedCards;
        
        document.getElementById('studiedToday').textContent = this.dailyProgress.studiedToday;
        document.getElementById('streak').textContent = this.dailyProgress.streak;
    }

    updateDailyProgress() {
        const today = new Date().toDateString();
        
        if (this.dailyProgress.lastStudyDate !== today) {
            if (this.dailyProgress.lastStudyDate) {
                const lastDate = new Date(this.dailyProgress.lastStudyDate);
                const todayDate = new Date(today);
                const diffTime = todayDate - lastDate;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays === 1) {
                    this.dailyProgress.streak++;
                } else if (diffDays > 1) {
                    this.dailyProgress.streak = 1;
                }
            } else {
                this.dailyProgress.streak = 1;
            }
            
            this.dailyProgress.lastStudyDate = today;
            this.dailyProgress.studiedToday = 0;
        }
        
        this.dailyProgress.studiedToday++;
        this.dailyProgress.totalStudied++;
        
        this.saveDailyProgress();
        this.updateStats();
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // Modal Management
    showModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    }

    hideModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }

    // Import/Export Functions
    exportCards() {
        if (this.cards.length === 0) {
            this.showNotification('No cards to export!', 'error');
            return;
        }

        const data = {
            cards: this.cards,
            dictionary: this.dictionary,
            theory: this.theory,
            dailyProgress: this.dailyProgress,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `flashcards-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification('Cards exported successfully!', 'success');
    }

    importCards(file) {
        if (!file) return;
    
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (!data.cards || !Array.isArray(data.cards)) {
                    this.showNotification('Invalid file format!', 'error');
                    return;
                }
    
                const cardCount = data.cards.length;
                const confirmMessage = `This will import ${cardCount} cards. This will replace all your current data. Are you sure?`;
                
                if (!confirm(confirmMessage)) return;
    
                // Import cards
                this.cards = data.cards || [];
                this.dictionary = data.dictionary || [];
                this.theory = data.theory || [];
                this.dailyProgress = data.dailyProgress || this.loadDailyProgress();
    
                // Auto-add each card to dictionary
                this.cards.forEach(card => this.addDictionaryFromCard(card));
    
                // Save to localStorage
                this.saveCards();
                this.saveDictionary();
                this.saveTheory();
                this.saveDailyProgress();
    
                // Update UI
                this.updateStats();
                this.renderCards();
                this.renderDictionary();
                this.renderTheory();
    
                this.showNotification(`Successfully imported ${cardCount} cards and updated dictionary!`, 'success');
    
            } catch (error) {
                console.error('Import error:', error);
                this.showNotification('Error importing file! Please check the file format.', 'error');
            }
        };
        reader.readAsText(file);
    }
    
    // Hint System
    showHint() {
        if (this.hintUsed || this.isAnswered) return;

        this.hintUsed = true;
        const hintBtn = document.getElementById('hintBtn');
        
        // Update button appearance
        hintBtn.classList.add('hint-used');
        hintBtn.innerHTML = '<i class="fas fa-lightbulb"></i> Hint Used';
        hintBtn.disabled = true;

        // Show the correct answer
        const correctAnswer = this.currentQuestion.correctAnswer;
        
        // Create hint notification
        this.showNotification(`💡 Hint: The answer is "${correctAnswer}"`, 'info');
        
        // Highlight the correct answer in multiple choice mode
        if (this.quizMode === 'multiple') {
            const options = document.querySelectorAll('.option-btn');
            options.forEach(option => {
                if (option.dataset.answer === correctAnswer) {
                    option.style.border = '3px solid #f59e0b';
                    option.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
                    option.style.color = 'white';
                }
            });
        }
    }

    // Notification System
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const messageEl = document.getElementById('notificationMessage');
        
        messageEl.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 20000);
    }
}

// Initialize the app
const app = new LanguageLearningApp();
