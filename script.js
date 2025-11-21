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
		this.cardsFilters = { query: '', sort: 'recent', sourceLang: 'any', targetLang: 'any', letter: 'all', category: 'any', difficulty: 'any' };
		this.dictionaryFilters = { query: '', sort: 'recent', sourceLang: 'any', targetLang: 'any', letter: 'all' };
		this.currentDictTab = 'online';
		this.translationDirection = { from: 'ro', to: 'it' };
		this.selectedLetter = 'all';
		this.currentPage = 1;
		this.wordsPerPage = 50;
		this.allWordsCache = {};
		this.currentResourceCategory = 'all';
		this.builtInDictionary = this.loadBuiltInDictionary();
        
        // Pronunciation recording
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.recordedAudio = null;
        this.pronunciations = this.loadPronunciations();
        
        // Speed mode timer
        this.speedTimer = null;
        this.speedTimeLeft = 10;
        
        // Matching mode
        this.matchingPairs = [];
        this.selectedMatchingItems = [];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateStats();
        this.renderCards();
        this.renderDictionary();
        this.renderTheory('all'); // Initialize resources with 'all' category
        this.updateLanguageLabels();
        this.currentResourceCategory = 'all'; // Set default category
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
        const saved = localStorage.getItem('resources');
        const userResources = saved ? JSON.parse(saved) : [];
        
        // Built-in resources from dictionary_pdf folder
        const builtInResources = [
            {
                id: 'builtin-1',
                title: 'Dicționar Italian-Român A-Z (Complete)',
                category: 'dictionaries',
                description: 'Dicționar complet Italian-Român cu OCR, conține toate cuvintele de la A la Z',
                type: 'pdf',
                path: 'dictionary_pdf/DictionarItalian-Roman.A-Z..Full..OCR..pdf',
                builtIn: true,
                createdAt: '2024-01-01'
            },
            {
                id: 'builtin-2',
                title: 'Dicționar Italian-Român (ilide.info)',
                category: 'dictionaries',
                description: 'Dicționar Italian-Român complet pentru învățare',
                type: 'pdf',
                path: 'dictionary_pdf/ilide.info-dictionar-italian-roman-pr_39c38b1df61b521b208146a4e983c23d.pdf',
                builtIn: true,
                createdAt: '2024-01-01'
            },
            {
                id: 'builtin-3',
                title: 'Gramatica Limbii Italiene',
                category: 'grammar',
                description: 'Carte completă de gramatică italiană cu explicații în română',
                type: 'pdf',
                path: 'dictionary_pdf/ilide.info-gramatica-limbii-italiene-pdf-pr_494972a4ff8dfbd4513ac19737081dcc.pdf',
                builtIn: true,
                createdAt: '2024-01-01'
            },
            {
                id: 'builtin-4',
                title: 'Carte Italiană - Gramatica (Dorin)',
                category: 'grammar',
                description: 'Manual de gramatică italiană de Dorin, cu exerciții practice',
                type: 'pdf',
                path: 'dictionary_pdf/ilide.info-carte-italiana-gramatica-dorin-pdf-pr_e4c50aba810f37fd5457cbc6c45fe657.pdf',
                builtIn: true,
                createdAt: '2024-01-01'
            }
        ];
        
        // Combine built-in and user resources
        return [...builtInResources, ...userResources];
    }

    saveTheory() {
        // Only save user-added resources (not built-in ones)
        const userResources = this.theory.filter(r => !r.builtIn);
        localStorage.setItem('resources', JSON.stringify(userResources));
    }

    loadDailyProgress() {
        const saved = localStorage.getItem('dailyProgress');
        const defaultProgress = {
            lastStudyDate: null,
            studiedToday: 0,
            exercisesToday: 0,
            streak: 0,
            totalStudied: 0
        };
        
        if (!saved) return defaultProgress;
        
        const progress = JSON.parse(saved);
        const today = new Date().toDateString();
        
        // Reset daily counters if it's a new day
        if (progress.lastStudyDate !== today) {
            progress.studiedToday = 0;
            progress.exercisesToday = 0;
        }
        
        // Ensure all fields exist
        if (!progress.exercisesToday) progress.exercisesToday = 0;
        
        return progress;
    }

    saveDailyProgress() {
        localStorage.setItem('dailyProgress', JSON.stringify(this.dailyProgress));
    }

    loadPronunciations() {
        const saved = localStorage.getItem('pronunciations');
        return saved ? JSON.parse(saved) : {};
    }

    savePronunciations() {
        localStorage.setItem('pronunciations', JSON.stringify(this.pronunciations));
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
        document.getElementById('addCardBtn')?.addEventListener('click', () => {
            this.showAddCardForm();
        });

        document.getElementById('addFirstCard')?.addEventListener('click', () => {
            this.showAddCardForm();
        });

		// Cards search (live)
		const cardsSearchEl = document.getElementById('cardsSearch');
		if (cardsSearchEl) {
			cardsSearchEl.addEventListener('input', () => {
				this.cardsSearchQuery = cardsSearchEl.value.trim().toLowerCase();
				const clearBtn = document.getElementById('clearCardsSearch');
				if (clearBtn) {
					clearBtn.style.display = this.cardsSearchQuery ? 'block' : 'none';
				}
				this.renderCards();
			});
		}
        // Edit Dictionary Modal
document.getElementById('closeEditDictionaryModal')?.addEventListener('click', () => {
    this.hideModal('editDictionaryModal');
});

document.getElementById('cancelEditDictionary')?.addEventListener('click', () => {
    this.hideModal('editDictionaryModal');
});

        document.getElementById('editDictionaryForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEditedDictionaryEntry();
        });

        // Reset stats button
        document.getElementById('resetStatsBtn')?.addEventListener('click', () => {
            this.resetDailyStats();
        });
        
        // Notification close button
        document.getElementById('notificationClose')?.addEventListener('click', () => {
            this.hideNotification();
        });


        // Import/Export
        document.getElementById('exportCardsBtn')?.addEventListener('click', () => {
            this.exportCards();
        });



        // Dictionary Import/Export
document.getElementById('exportDictionaryBtn')?.addEventListener('click', () => {
    this.exportDictionary();
});

document.getElementById('importDictionaryBtn')?.addEventListener('click', () => {
    document.getElementById('importDictionaryFile')?.click();
});

document.getElementById('importDictionaryFile').addEventListener('change', (e) => {
    this.importDictionary(e.target.files[0]);
});


        document.getElementById('importCardsBtn')?.addEventListener('click', () => {
            document.getElementById('importFile')?.click();
        });

        document.getElementById('importFile')?.addEventListener('change', (e) => {
            this.importCards(e.target.files[0]);
        });

        document.getElementById('closeForm')?.addEventListener('click', () => {
            this.hideAddCardForm();
        });

        document.getElementById('cancelForm')?.addEventListener('click', () => {
            this.hideAddCardForm();
        });

        document.getElementById('cardForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addCard();
        });

        // Language change listeners
        document.getElementById('sourceLanguage')?.addEventListener('change', () => {
            this.updateLanguageLabels();
        });

        document.getElementById('targetLanguage')?.addEventListener('change', () => {
            this.updateLanguageLabels();
        });

        // Quiz
        document.getElementById('startQuizBtn')?.addEventListener('click', () => {
            this.startQuiz();
        });

        document.getElementById('closeQuiz')?.addEventListener('click', () => {
            this.closeQuiz();
        });

        document.getElementById('checkAnswer')?.addEventListener('click', () => {
            this.checkTypingAnswer();
        });

        document.getElementById('checkSentence')?.addEventListener('click', () => {
            this.checkSentenceAnswer();
        });

        document.getElementById('nextQuestion')?.addEventListener('click', () => {
            this.nextQuestion();
        });

        document.getElementById('skipQuestion')?.addEventListener('click', () => {
            this.skipQuestion();
        });

        // Flashcard mode
        document.getElementById('flashcard')?.addEventListener('click', () => {
            this.flipFlashcard();
        });

        document.getElementById('flashcardCorrect')?.addEventListener('click', () => {
            this.handleFlashcardAnswer(true);
        });

        document.getElementById('flashcardWrong')?.addEventListener('click', () => {
            this.handleFlashcardAnswer(false);
        });

        // Listening mode
        document.getElementById('playAudio')?.addEventListener('click', () => {
            this.playAudio(false);
        });

        document.getElementById('playAudioSlow')?.addEventListener('click', () => {
            this.playAudio(true);
        });

        document.getElementById('checkListening')?.addEventListener('click', () => {
            this.checkListeningAnswer();
        });

        document.getElementById('listeningAnswer')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !this.isAnswered) {
                this.checkListeningAnswer();
            }
        });

        // Speed mode
        document.getElementById('checkSpeed')?.addEventListener('click', () => {
            this.checkSpeedAnswer();
        });

        document.getElementById('speedAnswer')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !this.isAnswered) {
                this.checkSpeedAnswer();
            }
        });

        // Pronunciation mode
        document.getElementById('playPronunciation')?.addEventListener('click', () => {
            this.playPronunciation();
        });

        document.getElementById('recordBtn')?.addEventListener('mousedown', () => {
            this.startRecording();
        });

        document.getElementById('recordBtn')?.addEventListener('mouseup', () => {
            this.stopRecording();
        });

        document.getElementById('recordBtn')?.addEventListener('mouseleave', () => {
            if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
                this.stopRecording();
            }
        });

        document.getElementById('playRecording')?.addEventListener('click', () => {
            this.playRecording();
        });

        document.getElementById('savePronunciation')?.addEventListener('click', () => {
            this.savePronunciation();
        });

        // Hint button
        document.getElementById('hintBtn')?.addEventListener('click', () => {
            if (!this.currentQuestion) return;
            const btn = document.getElementById('hintBtn');
            let hintReveal = document.getElementById('hintReveal');
            if (!hintReveal) {
                hintReveal = document.createElement('div');
                hintReveal.id = 'hintReveal';
                document.getElementById('questionText')?.parentNode?.appendChild(hintReveal);
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

        // Dictionary tabs
        document.querySelectorAll('.dict-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchDictTab(e.target.closest('.dict-tab').dataset.dictTab);
            });
        });

        // Online dictionary search
        const onlineSearchEl = document.getElementById('onlineSearch');
        if (onlineSearchEl) {
            onlineSearchEl.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchOnlineDictionary(e.target.value.trim());
                }
            });
            onlineSearchEl.addEventListener('input', (e) => {
                const clearBtn = document.getElementById('clearOnlineSearch');
                if (clearBtn) {
                    clearBtn.style.display = e.target.value ? 'block' : 'none';
                }
            });
        }

        // Clear online search
        document.getElementById('clearOnlineSearch')?.addEventListener('click', () => {
            document.getElementById('onlineSearch').value = '';
            document.getElementById('clearOnlineSearch').style.display = 'none';
            document.getElementById('onlineResults').innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"><i class="fas fa-search"></i></div>
                    <h3>Search for any word</h3>
                    <p>Type a word in Romanian or Italian to see translations</p>
                </div>
            `;
        });

        // Translation direction toggle
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.translationDirection = {
                    from: e.target.dataset.from,
                    to: e.target.dataset.to
                };
                // Refresh dictionary view
                if (this.selectedLetter !== 'all') {
                    this.showWordsByLetter(this.selectedLetter);
                }
            });
        });

        // Alphabet navigation
        document.querySelectorAll('.alphabet-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.alphabet-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                const letter = e.target.dataset.letter;
                this.selectedLetter = letter;
                if (letter === 'all') {
                    this.showAllLetters();
                } else {
                    this.showWordsByLetter(letter);
                }
            });
        });

        // My words search
        const myWordsSearchEl = document.getElementById('myWordsSearch');
        if (myWordsSearchEl) {
            myWordsSearchEl.addEventListener('input', (e) => {
                const clearBtn = document.getElementById('clearMyWordsSearch');
                if (clearBtn) {
                    clearBtn.style.display = e.target.value ? 'block' : 'none';
                }
                this.renderMyWords();
            });
        }

        // Clear my words search
        document.getElementById('clearMyWordsSearch')?.addEventListener('click', () => {
            document.getElementById('myWordsSearch').value = '';
            document.getElementById('clearMyWordsSearch').style.display = 'none';
            this.renderMyWords();
        });

        // My words filters toggle
        document.getElementById('toggleMyWordsFilters')?.addEventListener('click', () => {
            const panel = document.getElementById('myWordsFiltersPanel');
            if (panel) {
                const isVisible = panel.style.display !== 'none';
                panel.style.display = isVisible ? 'none' : 'block';
            }
        });

        // My words filters
        ['myWordsSort', 'myWordsSourceFilter', 'myWordsTargetFilter'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', () => {
                this.renderMyWords();
            });
        });

        // Dictionary
        document.getElementById('addDictionaryBtn')?.addEventListener('click', () => {
            this.showModal('dictionaryModal');
        });

        document.getElementById('closeDictionaryModal')?.addEventListener('click', () => {
            this.hideModal('dictionaryModal');
        });

        document.getElementById('cancelDictionary')?.addEventListener('click', () => {
            this.hideModal('dictionaryModal');
        });

        document.getElementById('dictionaryForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addDictionaryEntry();
        });

        document.getElementById('searchBtn')?.addEventListener('click', () => {
			// mirror to filters then render
			const q = document.getElementById('dictionarySearch')?.value.trim().toLowerCase();
			this.dictionaryFilters.query = q;
			this.renderDictionary();
        });

        document.getElementById('dictionarySearch')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
				const q = document.getElementById('dictionarySearch')?.value.trim().toLowerCase();
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

        // Resources
        const addResourceBtn = document.getElementById('addResourceBtn');
        if (addResourceBtn) {
            addResourceBtn.addEventListener('click', () => {
                console.log('Add Resource button clicked');
                this.showModal('resourceModal');
            });
        } else {
            console.error('addResourceBtn not found');
        }

        const addLinkBtn = document.getElementById('addLinkBtn');
        if (addLinkBtn) {
            addLinkBtn.addEventListener('click', () => {
                console.log('Add Link button clicked');
                this.showModal('linkModal');
            });
        } else {
            console.error('addLinkBtn not found');
        }

        document.getElementById('closeResourceModal')?.addEventListener('click', () => {
            this.hideModal('resourceModal');
        });

        document.getElementById('cancelResource')?.addEventListener('click', () => {
            this.hideModal('resourceModal');
        });

        document.getElementById('closeLinkModal')?.addEventListener('click', () => {
            this.hideModal('linkModal');
        });

        document.getElementById('cancelLink')?.addEventListener('click', () => {
            this.hideModal('linkModal');
        });

        // Resource form submit
        document.getElementById('resourceForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const fileInput = document.getElementById('resourceFile');
            const file = fileInput.files[0];
            
            if (!file) {
                this.showNotification('Please select a file to upload', 'error');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (event) => {
                const formData = {
                    title: document.getElementById('resourceTitle').value,
                    category: document.getElementById('resourceCategory').value,
                    description: document.getElementById('resourceDescription').value,
                    fileData: event.target.result,
                    fileName: file.name,
                    fileType: file.type
                };
                
                this.addResource(formData);
                this.hideModal('resourceModal');
                document.getElementById('resourceForm').reset();
            };
            reader.readAsDataURL(file);
        });

        // Link form submit
        document.getElementById('linkForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = {
                title: document.getElementById('linkTitle').value,
                url: document.getElementById('linkUrl').value,
                description: document.getElementById('linkDescription').value
            };
            
            this.addLink(formData);
            this.hideModal('linkModal');
            document.getElementById('linkForm').reset();
        });

        // Resource category buttons
        document.querySelectorAll('.resource-category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.resource-category-btn').forEach(b => b.classList.remove('active'));
                e.target.closest('.resource-category-btn').classList.add('active');
                const category = e.target.closest('.resource-category-btn').dataset.category;
                this.currentResourceCategory = category;
                this.renderTheory(category);
            });
        });

        // Edit modal
        document.getElementById('closeEditModal')?.addEventListener('click', () => {
            this.hideModal('editModal');
        });

        document.getElementById('cancelEdit')?.addEventListener('click', () => {
            this.hideModal('editModal');
        });

        document.getElementById('editForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEditedCard();
        });

		// Cards filters
		const cardsSort = document.getElementById('cardsSort');
		const cardsSourceFilter = document.getElementById('cardsSourceFilter');
		const cardsTargetFilter = document.getElementById('cardsTargetFilter');
		const cardsLetter = document.getElementById('cardsLetter');
		const cardsCategoryFilter = document.getElementById('cardsCategoryFilter');
		const cardsDifficulty = document.getElementById('cardsDifficulty');
		[cardsSort, cardsSourceFilter, cardsTargetFilter, cardsLetter, cardsCategoryFilter, cardsDifficulty].forEach(el => {
			if (!el) return;
			el.addEventListener('input', () => {
				this.cardsFilters.sort = cardsSort ? cardsSort.value : 'recent';
				this.cardsFilters.sourceLang = cardsSourceFilter ? cardsSourceFilter.value : 'any';
				this.cardsFilters.targetLang = cardsTargetFilter ? cardsTargetFilter.value : 'any';
				this.cardsFilters.letter = cardsLetter ? cardsLetter.value : 'all';
				this.cardsFilters.category = cardsCategoryFilter ? cardsCategoryFilter.value : 'any';
				this.cardsFilters.difficulty = cardsDifficulty ? cardsDifficulty.value : 'any';
				this.updateActiveFiltersCount();
				this.renderCards();
			});
		});

		// Toggle filters panel
		const toggleFiltersBtn = document.getElementById('toggleFilters');
		if (toggleFiltersBtn) {
			toggleFiltersBtn.addEventListener('click', () => {
				const panel = document.getElementById('filtersPanel');
				if (panel) {
					const isVisible = panel.style.display !== 'none';
					panel.style.display = isVisible ? 'none' : 'block';
					const chevron = toggleFiltersBtn.querySelector('.fa-chevron-down');
					if (chevron) {
						chevron.style.transform = isVisible ? 'rotate(0deg)' : 'rotate(180deg)';
					}
				}
			});
		}

		// Reset filters
		const resetFiltersBtn = document.getElementById('resetFilters');
		if (resetFiltersBtn) {
			resetFiltersBtn.addEventListener('click', () => {
				this.resetFilters();
			});
		}

		// Clear search button
		const clearSearchBtn = document.getElementById('clearCardsSearch');
		if (clearSearchBtn) {
			clearSearchBtn.addEventListener('click', () => {
				document.getElementById('cardsSearch').value = '';
				this.cardsSearchQuery = '';
				clearSearchBtn.style.display = 'none';
				this.renderCards();
			});
		}
    }

	updateQuizAvailableCount() {
		const count = this.cards.length;
		const el = document.getElementById('quizTotalCards');
		if (el) el.textContent = count;
	}

	getFilteredCardsForQuiz() {
		return this.cards;
	}

	updateActiveFiltersCount() {
		const filters = this.cardsFilters;
		let count = 0;
		
		if (filters.category !== 'any') count++;
		if (filters.sourceLang !== 'any') count++;
		if (filters.targetLang !== 'any') count++;
		if (filters.letter !== 'all') count++;
		if (filters.difficulty !== 'any') count++;
		if (filters.sort !== 'recent') count++;
		
		const countEl = document.getElementById('activeFiltersCount');
		if (countEl) {
			if (count > 0) {
				countEl.textContent = `${count} active`;
				countEl.style.display = 'inline-block';
			} else {
				countEl.style.display = 'none';
			}
		}
	}

	resetFilters() {
		this.cardsFilters = {
			query: '',
			sort: 'recent',
			sourceLang: 'any',
			targetLang: 'any',
			letter: 'all',
			category: 'any',
			difficulty: 'any'
		};
		
		this.cardsSearchQuery = '';
		
		const searchInput = document.getElementById('cardsSearch');
		if (searchInput) searchInput.value = '';
		
		const categoryFilter = document.getElementById('cardsCategoryFilter');
		if (categoryFilter) categoryFilter.value = 'any';
		
		const sortFilter = document.getElementById('cardsSort');
		if (sortFilter) sortFilter.value = 'recent';
		
		const sourceFilter = document.getElementById('cardsSourceFilter');
		if (sourceFilter) sourceFilter.value = 'any';
		
		const targetFilter = document.getElementById('cardsTargetFilter');
		if (targetFilter) targetFilter.value = 'any';
		
		const letterFilter = document.getElementById('cardsLetter');
		if (letterFilter) letterFilter.value = 'all';
		
		const difficultyFilter = document.getElementById('cardsDifficulty');
		if (difficultyFilter) difficultyFilter.value = 'any';
		
		const clearBtn = document.getElementById('clearCardsSearch');
		if (clearBtn) clearBtn.style.display = 'none';
		
		this.updateActiveFiltersCount();
		this.renderCards();
	}

    // Navigation
    switchTab(tabName) {
        // Update active tab
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');

        // Update active content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`)?.classList.add('active');

        this.currentTab = tabName;

		// Update quiz stats if switching to quiz tab
		if (tabName === 'quiz') {
			this.updateQuizAvailableCount();
		}
		
		// Render resources when switching to theory tab
		if (tabName === 'theory') {
			this.renderTheory(this.currentResourceCategory || 'all');
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
        
        // Search filter
        if (q) list = list.filter(card => (card.sourceText||'').toLowerCase().includes(q) || (card.targetText||'').toLowerCase().includes(q));
        
        // Language filters
        if (filters.sourceLang !== 'any') list = list.filter(card => card.sourceLanguage===filters.sourceLang);
        if (filters.targetLang !== 'any') list = list.filter(card => card.targetLanguage===filters.targetLang);
        
        // Letter filter
        if (filters.letter !== 'all') list = list.filter(card => ((card.sourceText||'').charAt(0).toUpperCase()===filters.letter));
        
        // Category filter
        if (filters.category !== 'any') list = list.filter(card => card.category === filters.category);
        
        // Difficulty filter
        if (filters.difficulty !== 'any') {
            list = list.filter(card => {
                if (filters.difficulty === 'new') return card.attempts === 0;
                if (filters.difficulty === 'learning') {
                    const acc = card.attempts > 0 ? (card.correct / card.attempts) * 100 : 0;
                    return acc < 50;
                }
                if (filters.difficulty === 'mastered') {
                    const acc = card.attempts > 0 ? (card.correct / card.attempts) * 100 : 0;
                    return acc > 80;
                }
                return true;
            });
        }
        
        // Sorting
        if (filters.sort==='recent') {
            list.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
        } else if (filters.sort==='az') {
            list.sort((a,b)=>(a.sourceText||'').localeCompare(b.sourceText||''));
        } else if (filters.sort==='za') {
            list.sort((a,b)=>(b.sourceText||'').localeCompare(a.sourceText||''));
        } else if (filters.sort==='mostPracticed') {
            list.sort((a,b)=>b.attempts - a.attempts);
        } else if (filters.sort==='leastPracticed') {
            list.sort((a,b)=>a.attempts - b.attempts);
        } else if (filters.sort==='hardest') {
            list.sort((a,b)=>{
                const accA = a.attempts > 0 ? (a.correct / a.attempts) : 1;
                const accB = b.attempts > 0 ? (b.correct / b.attempts) : 1;
                return accA - accB;
            });
        } else if (filters.sort==='easiest') {
            list.sort((a,b)=>{
                const accA = a.attempts > 0 ? (a.correct / a.attempts) : 0;
                const accB = b.attempts > 0 ? (b.correct / b.attempts) : 0;
                return accB - accA;
            });
        }
        
        // Update results count
        const resultsEl = document.getElementById('resultsCount');
        if (resultsEl) {
            resultsEl.textContent = `Showing ${list.length} of ${this.cards.length} cards`;
        }

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

        container.innerHTML = list.map(card => {
            const accuracy = card.attempts > 0 ? Math.round((card.correct / card.attempts) * 100) : 0;
            const difficultyClass = accuracy > 80 ? 'easy' : accuracy > 50 ? 'medium' : 'hard';
            
            // Determine which text to pronounce (Italian text)
            const italianText = card.targetLanguage === 'it' ? card.targetText : 
                               card.sourceLanguage === 'it' ? card.sourceText : '';
            
            return `
                <div class="card slide-in-up">
                    <div class="card-header">
                        <div class="card-category">${this.getCategoryLabel(card.category)}</div>
                        <div class="card-actions">
                            ${italianText ? `
                                <button class="card-action pronunciation" onclick="app.pronounceCard('${italianText.replace(/'/g, "\\'")}', 'it')" title="Pronunție Italiană">
                                    <i class="fas fa-volume-up"></i>
                                </button>
                            ` : ''}
                            <button class="card-action" onclick="app.editCard(${card.id})" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="card-action delete" onclick="app.deleteCard(${card.id})" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="card-content">
                        <div class="card-direction">${this.getLanguageName(card.sourceLanguage)} → ${this.getLanguageName(card.targetLanguage)}</div>
                        <div class="card-text" data-lang="${this.getLanguageFlag(card.sourceLanguage)}">${card.sourceText}</div>
                        <div class="card-translation" data-lang="${this.getLanguageFlag(card.targetLanguage)}">${card.targetText}</div>
                    </div>
                    <div class="card-stats">
                        <span><i class="fas fa-redo"></i> ${card.attempts}</span>
                        <span><i class="fas fa-check"></i> ${card.correct}</span>
                        <span class="accuracy ${difficultyClass}"><i class="fas fa-chart-line"></i> ${accuracy}%</span>
                    </div>
                </div>
            `;
        }).join('');
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
        document.getElementById('flashcardMode').style.display = 'none';
        document.getElementById('listeningMode').style.display = 'none';
        document.getElementById('matchingMode').style.display = 'none';
        document.getElementById('speedMode').style.display = 'none';
        document.getElementById('pronunciationMode').style.display = 'none';

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
            case 'flashcard':
                document.getElementById('flashcardMode').style.display = 'block';
                this.setupFlashcard();
                break;
            case 'listening':
                document.getElementById('listeningMode').style.display = 'block';
                this.playAudio(false);
                break;
            case 'matching':
                document.getElementById('matchingMode').style.display = 'block';
                this.generateMatchingPairs();
                break;
            case 'speed':
                document.getElementById('speedMode').style.display = 'block';
                this.startSpeedTimer();
                break;
            case 'pronunciation':
                document.getElementById('pronunciationMode').style.display = 'block';
                this.setupPronunciation();
                break;
            case 'mixed':
                // Random mode selection
                const modes = ['typing', 'multiple', 'sentence', 'flashcard', 'listening'];
                const randomMode = modes[Math.floor(Math.random() * modes.length)];
                this.quizMode = randomMode;
                this.setQuizMode(randomMode);
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
                
                if (isCorrect) {
                    // Răspuns corect
                    this.isAnswered = true;
                    btn.classList.add('correct');
                    
                    // Disable all buttons
                    container.querySelectorAll('.option-btn').forEach(b => {
                        b.disabled = true;
                    });
                    
                    this.handleAnswer(true);
                    this.showFeedback(true, `✅ Corect! Răspunsul este: ${correctAnswer}`);
                    
                    setTimeout(() => {
                        this.nextQuestion();
                    }, 2000);
                } else {
                    // Răspuns greșit - arată greșeala dar permite reîncercare
                    this.wrongCount++;
                    this.currentQuestion.card.attempts++;
                    this.saveCards();
                    this.updateStats();
                    
                    btn.classList.add('incorrect');
                    
                    // Dezactivează doar butonul greșit temporar
                    btn.disabled = true;
                    
                    // Arată feedback fără butoane
                    this.showFeedback(false, `❌ Greșit! Încearcă alt răspuns.`);
                    
                    // Ascunde feedback-ul după 1.5 secunde
                    setTimeout(() => {
                        document.getElementById('feedbackSection').style.display = 'none';
                    }, 1500);
                }
            });
        });
    }

    checkTypingAnswer() {
        if (this.isAnswered) return;
        
        const answerInput = document.getElementById('typingAnswer');
        const userAnswer = answerInput.value.trim().toLowerCase();
        const correctAnswer = this.currentQuestion.correctAnswer.toLowerCase();
        const isCorrect = this.isAnswerCorrect(userAnswer, correctAnswer);
    
        if (isCorrect) {
            this.isAnswered = true;
            this.handleAnswer(true);
            this.showFeedback(true, `✅ Corect! Răspunsul este: ${this.currentQuestion.correctAnswer}`);
            
            // Așteaptă 2 secunde și treci la următoarea întrebare
            setTimeout(() => {
                this.nextQuestion();
            }, 2000);
        } else {
            // Răspuns greșit - nu marchează ca răspuns și permite reîncercare
            this.wrongCount++;
            this.currentQuestion.card.attempts++;
            this.saveCards();
            this.updateStats();
            
            // Arată feedback fără butoane
            this.showFeedback(false, `❌ Greșit! Încearcă din nou.`);
            
            // Golește input-ul pentru a încerca din nou
            answerInput.value = '';
            answerInput.focus();
            
            // Ascunde feedback-ul după 2 secunde
            setTimeout(() => {
                document.getElementById('feedbackSection').style.display = 'none';
            }, 2000);
        }
    }

    checkSentenceAnswer() {
        if (this.isAnswered) return;
        
        const answerInput = document.getElementById('sentenceAnswer');
        const userAnswer = answerInput.value.trim().toLowerCase();
        const correctAnswer = this.currentQuestion.correctAnswer.toLowerCase();
        const isCorrect = this.isAnswerCorrect(userAnswer, correctAnswer);
    
        if (isCorrect) {
            this.isAnswered = true;
            this.handleAnswer(true);
            this.showFeedback(true, `✅ Corect! Răspunsul este: ${this.currentQuestion.correctAnswer}`);
            
            // Așteaptă 2 secunde și treci la următoarea întrebare
            setTimeout(() => {
                this.nextQuestion();
            }, 2000);
        } else {
            // Răspuns greșit - nu marchează ca răspuns și permite reîncercare
            this.wrongCount++;
            this.currentQuestion.card.attempts++;
            this.saveCards();
            this.updateStats();
            
            // Arată feedback fără butoane
            this.showFeedback(false, `❌ Greșit! Încearcă din nou.`);
            
            // Golește textarea pentru a încerca din nou
            answerInput.value = '';
            answerInput.focus();
            
            // Ascunde feedback-ul după 2 secunde
            setTimeout(() => {
                document.getElementById('feedbackSection').style.display = 'none';
            }, 2000);
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
        if (isCorrect) {
            this.correctCount++;
            this.currentQuestion.card.attempts++;
            this.currentQuestion.card.correct++;
        }
        // Nu mai incrementăm wrongCount și attempts aici pentru răspunsuri greșite
        // deoarece o facem deja în fiecare metodă de verificare
        
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
        
        // Ascunde butoanele Skip și Next Question pentru răspunsuri greșite
        const feedbackActions = document.querySelector('.feedback-actions');
        if (feedbackActions) {
            feedbackActions.style.display = isCorrect ? 'flex' : 'none';
        }
        
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
        document.getElementById('listeningAnswer').value = '';
        document.getElementById('speedAnswer').value = '';
    }

    // ===== FLASHCARD MODE =====
    setupFlashcard() {
        const flashcard = document.getElementById('flashcard');
        const front = flashcard.querySelector('.flashcard-front');
        const back = flashcard.querySelector('.flashcard-back');
        
        // Reset flashcard
        front.style.display = 'block';
        back.style.display = 'none';
        flashcard.classList.remove('flipped');
        
        // Set content
        document.getElementById('flashcardFront').textContent = this.currentQuestion.card.sourceText;
        document.getElementById('flashcardBack').textContent = this.currentQuestion.correctAnswer;
    }

    flipFlashcard() {
        const flashcard = document.getElementById('flashcard');
        const front = flashcard.querySelector('.flashcard-front');
        const back = flashcard.querySelector('.flashcard-back');
        
        if (flashcard.classList.contains('flipped')) {
            flashcard.classList.remove('flipped');
            front.style.display = 'block';
            back.style.display = 'none';
        } else {
            flashcard.classList.add('flipped');
            front.style.display = 'none';
            back.style.display = 'block';
        }
    }

    handleFlashcardAnswer(isCorrect) {
        if (this.isAnswered) return;
        
        this.handleAnswer(isCorrect);
        
        setTimeout(() => {
            this.nextQuestion();
        }, 1000);
    }

    // ===== LISTENING MODE =====
    playAudio(slow = false) {
        const text = this.currentQuestion.correctAnswer;
        
        // Use Web Speech API
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            
            // Set language based on target language
            const targetLang = this.currentQuestion.card.targetLanguage;
            if (targetLang === 'it') {
                utterance.lang = 'it-IT';
            } else if (targetLang === 'ro') {
                utterance.lang = 'ro-RO';
            } else if (targetLang === 'en') {
                utterance.lang = 'en-US';
            }
            
            utterance.rate = slow ? 0.7 : 1.0;
            utterance.pitch = 1.0;
            
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
        } else {
            this.showNotification('Text-to-speech not supported in your browser', 'error');
        }
    }

    // Pronounce card text (for flashcards)
    pronounceCard(text, language) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            
            // Set language
            if (language === 'it') {
                utterance.lang = 'it-IT';
            } else if (language === 'ro') {
                utterance.lang = 'ro-RO';
            } else if (language === 'en') {
                utterance.lang = 'en-US';
            }
            
            utterance.rate = 0.9; // Slightly slower for clarity
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
        } else {
            this.showNotification('Text-to-speech not supported in your browser', 'error');
        }
    }

    checkListeningAnswer() {
        if (this.isAnswered) return;
        
        const answerInput = document.getElementById('listeningAnswer');
        const userAnswer = answerInput.value.trim().toLowerCase();
        const correctAnswer = this.currentQuestion.correctAnswer.toLowerCase();
        const isCorrect = this.isAnswerCorrect(userAnswer, correctAnswer);
        
        if (isCorrect) {
            this.isAnswered = true;
            this.handleAnswer(true);
            this.showFeedback(true, `✅ Corect! Răspunsul este: ${this.currentQuestion.correctAnswer}`);
            
            setTimeout(() => {
                this.nextQuestion();
            }, 2000);
        } else {
            // Răspuns greșit - permite reîncercare
            this.wrongCount++;
            this.currentQuestion.card.attempts++;
            this.saveCards();
            this.updateStats();
            
            // Arată feedback fără butoane
            this.showFeedback(false, `❌ Greșit! Ascultă din nou și încearcă.`);
            
            // Golește input-ul
            answerInput.value = '';
            answerInput.focus();
            
            // Redă audio din nou
            setTimeout(() => {
                this.playAudio(false);
            }, 1000);
            
            // Ascunde feedback-ul după 2 secunde
            setTimeout(() => {
                document.getElementById('feedbackSection').style.display = 'none';
            }, 2000);
        }
    }

    // ===== MATCHING MODE =====
    generateMatchingPairs() {
        const container = document.getElementById('matchingGrid');
        
        // Get 4 cards for matching
        const cardsForMatching = this.currentQuiz.slice(
            this.currentQuestionIndex,
            this.currentQuestionIndex + 4
        );
        
        if (cardsForMatching.length < 2) {
            // Not enough cards, skip to next question
            this.nextQuestion();
            return;
        }
        
        // Create pairs
        const leftItems = cardsForMatching.map((card, idx) => ({
            id: `left-${idx}`,
            text: card.sourceText,
            pairId: idx
        }));
        
        const rightItems = cardsForMatching.map((card, idx) => ({
            id: `right-${idx}`,
            text: card.targetText,
            pairId: idx
        }));
        
        // Shuffle right items
        this.shuffleArray(rightItems);
        
        this.matchingPairs = { left: leftItems, right: rightItems, matched: [] };
        this.selectedMatchingItems = [];
        
        // Render matching grid
        container.innerHTML = `
            <div class="matching-column">
                ${leftItems.map(item => `
                    <div class="matching-item" data-id="${item.id}" data-pair="${item.pairId}">
                        ${item.text}
                    </div>
                `).join('')}
            </div>
            <div class="matching-column">
                ${rightItems.map(item => `
                    <div class="matching-item" data-id="${item.id}" data-pair="${item.pairId}">
                        ${item.text}
                    </div>
                `).join('')}
            </div>
        `;
        
        // Add click handlers
        container.querySelectorAll('.matching-item').forEach(item => {
            item.addEventListener('click', () => this.selectMatchingItem(item));
        });
    }

    selectMatchingItem(item) {
        if (item.classList.contains('matched')) return;
        
        if (this.selectedMatchingItems.length === 0) {
            item.classList.add('selected');
            this.selectedMatchingItems.push(item);
        } else if (this.selectedMatchingItems.length === 1) {
            const first = this.selectedMatchingItems[0];
            
            // Check if same column
            if (first.parentElement === item.parentElement) {
                first.classList.remove('selected');
                item.classList.add('selected');
                this.selectedMatchingItems = [item];
                return;
            }
            
            // Check if match
            const firstPair = first.dataset.pair;
            const secondPair = item.dataset.pair;
            
            if (firstPair === secondPair) {
                // Correct match
                first.classList.add('matched');
                item.classList.add('matched');
                first.classList.remove('selected');
                this.matchingPairs.matched.push(firstPair);
                
                // Check if all matched
                if (this.matchingPairs.matched.length === this.matchingPairs.left.length) {
                    this.handleAnswer(true);
                    setTimeout(() => {
                        this.currentQuestionIndex += this.matchingPairs.left.length - 1;
                        this.nextQuestion();
                    }, 1500);
                }
            } else {
                // Wrong match
                first.classList.add('wrong');
                item.classList.add('wrong');
                
                setTimeout(() => {
                    first.classList.remove('selected', 'wrong');
                    item.classList.remove('wrong');
                }, 500);
            }
            
            this.selectedMatchingItems = [];
        }
    }

    // ===== SPEED MODE =====
    startSpeedTimer() {
        this.speedTimeLeft = 10;
        document.getElementById('speedTimer').textContent = this.speedTimeLeft;
        document.getElementById('speedAnswer').value = '';
        document.getElementById('speedAnswer').focus();
        
        this.speedTimer = setInterval(() => {
            this.speedTimeLeft--;
            document.getElementById('speedTimer').textContent = this.speedTimeLeft;
            
            if (this.speedTimeLeft <= 0) {
                clearInterval(this.speedTimer);
                
                // Timp expirat - marchează ca greșit și treci la următoarea
                if (!this.isAnswered) {
                    this.isAnswered = true;
                    this.wrongCount++;
                    this.currentQuestion.card.attempts++;
                    this.saveCards();
                    this.updateStats();
                    
                    // Arată feedback cu butoane (pentru că timpul a expirat)
                    this.showFeedback(false, `⏰ Timp expirat! Răspunsul corect era: ${this.currentQuestion.correctAnswer}`);
                    
                    // În acest caz, arată butoanele pentru că nu mai poate încerca
                    const feedbackActions = document.querySelector('.feedback-actions');
                    if (feedbackActions) {
                        feedbackActions.style.display = 'flex';
                    }
                }
            }
        }, 1000);
    }

    checkSpeedAnswer() {
        if (this.isAnswered) return;
        
        const answerInput = document.getElementById('speedAnswer');
        const userAnswer = answerInput.value.trim().toLowerCase();
        const correctAnswer = this.currentQuestion.correctAnswer.toLowerCase();
        const isCorrect = this.isAnswerCorrect(userAnswer, correctAnswer);
        
        if (isCorrect) {
            clearInterval(this.speedTimer);
            this.isAnswered = true;
            this.handleAnswer(true);
            this.showFeedback(true, `⚡ Corect! Răspuns rapid: ${this.currentQuestion.correctAnswer}`);
            
            setTimeout(() => {
                this.nextQuestion();
            }, 1500);
        } else {
            // Răspuns greșit - permite reîncercare (dacă mai e timp)
            this.wrongCount++;
            this.currentQuestion.card.attempts++;
            this.saveCards();
            this.updateStats();
            
            // Arată feedback fără butoane
            this.showFeedback(false, `❌ Greșit! Încearcă din nou rapid!`);
            
            // Golește input-ul
            answerInput.value = '';
            answerInput.focus();
            
            // Ascunde feedback-ul după 1 secundă
            setTimeout(() => {
                document.getElementById('feedbackSection').style.display = 'none';
            }, 1000);
        }
    }

    // ===== PRONUNCIATION MODE =====
    setupPronunciation() {
        const word = this.currentQuestion.correctAnswer;
        document.getElementById('pronunciationWord').textContent = word;
        document.getElementById('playbackSection').style.display = 'none';
        document.getElementById('recordingIndicator').style.display = 'none';
        this.recordedAudio = null;
    }

    playPronunciation() {
        this.playAudio(false);
    }

    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.audioChunks = [];
            
            this.mediaRecorder = new MediaRecorder(stream);
            
            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };
            
            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                this.recordedAudio = URL.createObjectURL(audioBlob);
                document.getElementById('playbackSection').style.display = 'block';
                document.getElementById('recordingIndicator').style.display = 'none';
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };
            
            this.mediaRecorder.start();
            document.getElementById('recordingIndicator').style.display = 'flex';
            document.getElementById('recordText').textContent = 'Recording...';
            
        } catch (error) {
            console.error('Error accessing microphone:', error);
            this.showNotification('Could not access microphone. Please check permissions.', 'error');
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
            document.getElementById('recordText').textContent = 'Hold to Record';
        }
    }

    playRecording() {
        if (this.recordedAudio) {
            const audio = new Audio(this.recordedAudio);
            audio.play();
        }
    }

    savePronunciation() {
        if (!this.recordedAudio) {
            this.showNotification('Please record your pronunciation first', 'error');
            return;
        }
        
        // Convert blob URL to base64 for storage
        fetch(this.recordedAudio)
            .then(res => res.blob())
            .then(blob => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64data = reader.result;
                    const cardId = this.currentQuestion.card.id;
                    const word = this.currentQuestion.correctAnswer;
                    
                    // Save pronunciation
                    if (!this.pronunciations[cardId]) {
                        this.pronunciations[cardId] = {};
                    }
                    this.pronunciations[cardId][word] = {
                        audio: base64data,
                        date: new Date().toISOString()
                    };
                    
                    this.savePronunciations();
                    this.showNotification('Pronunciation saved!', 'success');
                    
                    // Mark as correct and move to next
                    this.handleAnswer(true);
                    setTimeout(() => this.nextQuestion(), 1000);
                };
                reader.readAsDataURL(blob);
            })
            .catch(error => {
                console.error('Error saving pronunciation:', error);
                this.showNotification('Error saving pronunciation', 'error');
            });
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
        const container = document.getElementById('myWordsResults');
        
        if (!container) {
            console.error('myWordsResults container not found');
            return;
        }
        
        if (results.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-bookmark"></i>
                    </div>
                    <h3>No saved words yet</h3>
                    <p>Add words from the online dictionary or create your own</p>
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

    renderTheory(category = 'all') {
        const container = document.getElementById('resourcesGrid');
        if (!container) {
            console.error('resourcesGrid container not found');
            return;
        }
        
        let resources = this.theory;
        console.log('Rendering resources:', resources.length, 'Category:', category);
        
        // Filter by category
        if (category !== 'all') {
            resources = resources.filter(r => r.category === category || (category === 'links' && r.type === 'link'));
        }
        
        if (resources.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-icon">
                        <i class="fas fa-folder-open"></i>
                    </div>
                    <h3>No resources in this category</h3>
                    <p>Add your first learning resource to get started!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = resources.map(resource => {
            const iconClass = resource.type === 'link' ? 'link' : 
                             resource.category === 'grammar' ? 'grammar' : 'pdf';
            const icon = resource.type === 'link' ? 'fa-link' : 'fa-file-pdf';
            
            return `
                <div class="resource-card slide-in-up">
                    <div class="resource-card-header">
                        <div class="resource-icon ${iconClass}">
                            <i class="fas ${icon}"></i>
                        </div>
                        <div class="resource-card-info">
                            <div class="resource-title">
                                ${resource.title}
                                ${resource.builtIn ? '<span class="built-in-badge">Built-in</span>' : ''}
                            </div>
                            <span class="resource-category-badge">${resource.category}</span>
                        </div>
                    </div>
                    ${resource.description ? `<div class="resource-description">${resource.description}</div>` : ''}
                    <div class="resource-actions">
                        <button class="resource-action-btn" onclick="app.openResource('${resource.id}')">
                            <i class="fas fa-external-link-alt"></i>
                            Open
                        </button>
                        ${!resource.builtIn ? `
                            <button class="resource-action-btn delete" onclick="app.deleteResource('${resource.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    openResource(id) {
        const resource = this.theory.find(r => r.id === id);
        if (!resource) return;
        
        if (resource.type === 'link') {
            window.open(resource.url, '_blank');
        } else if (resource.path) {
            // Open PDF in new tab
            window.open(resource.path, '_blank');
        } else if (resource.fileData) {
            // Open uploaded file
            const blob = this.base64ToBlob(resource.fileData, resource.fileType);
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        }
    }
    
    deleteResource(id) {
        if (confirm('Are you sure you want to delete this resource?')) {
            this.theory = this.theory.filter(r => r.id !== id);
            this.saveTheory();
            this.renderTheory(this.currentResourceCategory || 'all');
            this.showNotification('Resource deleted successfully!', 'success');
        }
    }
    
    addResource(formData) {
        const resource = {
            id: 'user-' + Date.now(),
            title: formData.title,
            category: formData.category,
            description: formData.description,
            type: 'file',
            fileData: formData.fileData,
            fileName: formData.fileName,
            fileType: formData.fileType,
            builtIn: false,
            createdAt: new Date().toISOString()
        };
        
        this.theory.push(resource);
        this.saveTheory();
        this.renderTheory(this.currentResourceCategory || 'all');
        this.showNotification('Resource added successfully! 📚', 'success');
    }
    
    addLink(formData) {
        const link = {
            id: 'link-' + Date.now(),
            title: formData.title,
            url: formData.url,
            description: formData.description,
            type: 'link',
            category: 'links',
            builtIn: false,
            createdAt: new Date().toISOString()
        };
        
        this.theory.push(link);
        this.saveTheory();
        this.renderTheory(this.currentResourceCategory || 'all');
        this.showNotification('Link added successfully! 🔗', 'success');
    }
    
    base64ToBlob(base64, type) {
        const byteCharacters = atob(base64.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: type });
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

    getLanguageFlag(code) {
        const languages = {
            'ro': '🇷🇴 RO',
            'en': '🇬🇧 EN',
            'it': '🇮🇹 IT'
        };
        return languages[code] || code.toUpperCase();
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
        // Total cards
        document.getElementById('totalCards').textContent = this.cards.length;
        
        // Learned/Mastered cards (>80% accuracy)
        const learnedCards = this.cards.filter(card => {
            if (card.attempts === 0) return false;
            const accuracy = (card.correct / card.attempts) * 100;
            return accuracy > 80;
        }).length;
        document.getElementById('learnedCards').textContent = learnedCards;
        
        // Today's exercises and studied
        const exercisesEl = document.getElementById('exercisesToday');
        if (exercisesEl) {
            exercisesEl.textContent = this.dailyProgress.exercisesToday || 0;
        }
        const studiedEl = document.getElementById('studiedToday');
        if (studiedEl) {
            studiedEl.textContent = this.dailyProgress.studiedToday || 0;
        }
        
        // Streak
        document.getElementById('streak').textContent = this.dailyProgress.streak || 0;
        
        // Accuracy
        const accuracyEl = document.getElementById('accuracy');
        if (accuracyEl) {
            const totalAttempts = this.cards.reduce((sum, card) => sum + (card.attempts || 0), 0);
            const totalCorrect = this.cards.reduce((sum, card) => sum + (card.correct || 0), 0);
            const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
            accuracyEl.textContent = accuracy + '%';
        }
        
        // Update badges
        const cardsBadge = document.getElementById('cardsBadge');
        if (cardsBadge) cardsBadge.textContent = this.cards.length;
        
        const dictBadge = document.getElementById('dictBadge');
        if (dictBadge) dictBadge.textContent = this.dictionary.length;
        
        // Update daily goal progress
        this.updateDailyGoalProgress();
    }
    
    updateDailyGoalProgress() {
        const current = this.dailyProgress.exercisesToday || 0;
        const target = 20; // Daily goal
        const percentage = Math.min((current / target) * 100, 100);
        
        const currentEl = document.getElementById('dailyGoalCurrent');
        if (currentEl) currentEl.textContent = current;
        
        const targetEl = document.getElementById('dailyGoalTarget');
        if (targetEl) targetEl.textContent = target;
        
        const progressEl = document.getElementById('dailyGoalProgress');
        if (progressEl) progressEl.style.width = percentage + '%';
        
        const messageEl = document.getElementById('goalMessage');
        if (messageEl) {
            if (current === 0) {
                messageEl.textContent = '🚀 Start learning today!';
            } else if (current < target / 2) {
                messageEl.textContent = '💪 Keep going! You\'re doing great!';
            } else if (current < target) {
                messageEl.textContent = '🔥 Almost there! Push a bit more!';
            } else {
                messageEl.textContent = '🎉 Goal achieved! You\'re amazing!';
            }
        }
    }

    updateDailyProgress() {
        const today = new Date().toDateString();
        
        // Check if it's a new day
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
            this.dailyProgress.exercisesToday = 0;
        }
        
        // Increment counters
        this.dailyProgress.studiedToday++;
        this.dailyProgress.exercisesToday++;
        this.dailyProgress.totalStudied++;
        
        this.saveDailyProgress();
        this.updateStats();
    }
    
    resetDailyStats() {
        if (confirm('Are you sure you want to reset all statistics? This cannot be undone.')) {
            this.dailyProgress = {
                lastStudyDate: null,
                studiedToday: 0,
                exercisesToday: 0,
                streak: 0,
                totalStudied: 0
            };
            this.saveDailyProgress();
            this.updateStats();
            this.showNotification('Statistics reset successfully!', 'success');
        }
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // Modal Management
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            console.log('Modal opened:', modalId);
        } else {
            console.error('Modal not found:', modalId);
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            console.log('Modal closed:', modalId);
        }
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
        
        if (!notification || !messageEl) return;
        
        // Clear any existing timeout
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
        }
        
        // Show notification
        notification.style.display = 'block';
        messageEl.textContent = message;
        notification.className = `notification ${type}`;
        
        // Force reflow for animation
        notification.offsetHeight;
        notification.classList.add('show');
        
        // Auto-hide after 3 seconds
        this.notificationTimeout = setTimeout(() => {
            this.hideNotification();
        }, 3000);
    }
    
    hideNotification() {
        const notification = document.getElementById('notification');
        if (notification) {
            notification.classList.remove('show');
            // Wait for animation to complete before hiding
            setTimeout(() => {
                notification.style.display = 'none';
            }, 300);
        }
    }
    
    // ===== BUILT-IN DICTIONARY =====
    loadBuiltInDictionary() {
        // Dicționar integrat cu cuvinte comune română-italiană
        return {
            'ro-it': {
                'A': [
                    { word: 'acasă', translation: 'a casa', type: 'adverb' },
                    { word: 'acum', translation: 'adesso', type: 'adverb' },
                    { word: 'adevăr', translation: 'verità', type: 'noun' },
                    { word: 'aici', translation: 'qui', type: 'adverb' },
                    { word: 'ajutor', translation: 'aiuto', type: 'noun' },
                    { word: 'an', translation: 'anno', type: 'noun' },
                    { word: 'apă', translation: 'acqua', type: 'noun' },
                    { word: 'arbore', translation: 'albero', type: 'noun' },
                    { word: 'astăzi', translation: 'oggi', type: 'adverb' },
                    { word: 'atunci', translation: 'allora', type: 'adverb' }
                ],
                'B': [
                    { word: 'bani', translation: 'soldi', type: 'noun' },
                    { word: 'băiat', translation: 'ragazzo', type: 'noun' },
                    { word: 'bine', translation: 'bene', type: 'adverb' },
                    { word: 'birou', translation: 'ufficio', type: 'noun' },
                    { word: 'bok', translation: 'libro', type: 'noun' },
                    { word: 'bună', translation: 'buongiorno', type: 'interjection' },
                    { word: 'bunic', translation: 'nonno', type: 'noun' },
                    { word: 'bunică', translation: 'nonna', type: 'noun' }
                ],
                'C': [
                    { word: 'cafea', translation: 'caffè', type: 'noun' },
                    { word: 'cal', translation: 'cavallo', type: 'noun' },
                    { word: 'carte', translation: 'libro', type: 'noun' },
                    { word: 'casă', translation: 'casa', type: 'noun' },
                    { word: 'câine', translation: 'cane', type: 'noun' },
                    { word: 'cer', translation: 'cielo', type: 'noun' },
                    { word: 'ceva', translation: 'qualcosa', type: 'pronoun' },
                    { word: 'cine', translation: 'chi', type: 'pronoun' },
                    { word: 'copil', translation: 'bambino', type: 'noun' },
                    { word: 'cum', translation: 'come', type: 'adverb' }
                ],
                'D': [
                    { word: 'da', translation: 'sì', type: 'adverb' },
                    { word: 'dator', translation: 'debito', type: 'noun' },
                    { word: 'de', translation: 'di', type: 'preposition' },
                    { word: 'dimineață', translation: 'mattina', type: 'noun' },
                    { word: 'drum', translation: 'strada', type: 'noun' },
                    { word: 'duminică', translation: 'domenica', type: 'noun' }
                ],
                'E': [
                    { word: 'el', translation: 'lui', type: 'pronoun' },
                    { word: 'ea', translation: 'lei', type: 'pronoun' },
                    { word: 'eu', translation: 'io', type: 'pronoun' }
                ],
                'F': [
                    { word: 'familie', translation: 'famiglia', type: 'noun' },
                    { word: 'fată', translation: 'ragazza', type: 'noun' },
                    { word: 'fericit', translation: 'felice', type: 'adjective' },
                    { word: 'fiu', translation: 'figlio', type: 'noun' },
                    { word: 'floare', translation: 'fiore', type: 'noun' },
                    { word: 'frate', translation: 'fratello', type: 'noun' },
                    { word: 'frumos', translation: 'bello', type: 'adjective' }
                ],
                'G': [
                    { word: 'gară', translation: 'stazione', type: 'noun' },
                    { word: 'gât', translation: 'collo', type: 'noun' },
                    { word: 'gol', translation: 'vuoto', type: 'adjective' },
                    { word: 'greu', translation: 'difficile', type: 'adjective' }
                ],
                'H': [
                    { word: 'haine', translation: 'vestiti', type: 'noun' },
                    { word: 'hartă', translation: 'mappa', type: 'noun' },
                    { word: 'hotel', translation: 'albergo', type: 'noun' }
                ],
                'I': [
                    { word: 'iarnă', translation: 'inverno', type: 'noun' },
                    { word: 'ieri', translation: 'ieri', type: 'adverb' },
                    { word: 'inimă', translation: 'cuore', type: 'noun' },
                    { word: 'iubire', translation: 'amore', type: 'noun' }
                ],
                'J': [
                    { word: 'joc', translation: 'gioco', type: 'noun' },
                    { word: 'joi', translation: 'giovedì', type: 'noun' }
                ],
                'L': [
                    { word: 'lac', translation: 'lago', type: 'noun' },
                    { word: 'lege', translation: 'legge', type: 'noun' },
                    { word: 'lume', translation: 'mondo', type: 'noun' },
                    { word: 'lună', translation: 'luna', type: 'noun' },
                    { word: 'luni', translation: 'lunedì', type: 'noun' }
                ],
                'M': [
                    { word: 'mamă', translation: 'madre', type: 'noun' },
                    { word: 'mână', translation: 'mano', type: 'noun' },
                    { word: 'mare', translation: 'grande', type: 'adjective' },
                    { word: 'mașină', translation: 'macchina', type: 'noun' },
                    { word: 'masă', translation: 'tavolo', type: 'noun' },
                    { word: 'mâine', translation: 'domani', type: 'adverb' },
                    { word: 'mic', translation: 'piccolo', type: 'adjective' },
                    { word: 'miercuri', translation: 'mercoledì', type: 'noun' },
                    { word: 'munte', translation: 'montagna', type: 'noun' }
                ],
                'N': [
                    { word: 'noapte', translation: 'notte', type: 'noun' },
                    { word: 'nou', translation: 'nuovo', type: 'adjective' },
                    { word: 'nu', translation: 'no', type: 'adverb' },
                    { word: 'nume', translation: 'nome', type: 'noun' }
                ],
                'O': [
                    { word: 'oameni', translation: 'persone', type: 'noun' },
                    { word: 'ochi', translation: 'occhio', type: 'noun' },
                    { word: 'om', translation: 'uomo', type: 'noun' },
                    { word: 'oră', translation: 'ora', type: 'noun' },
                    { word: 'oraș', translation: 'città', type: 'noun' }
                ],
                'P': [
                    { word: 'pace', translation: 'pace', type: 'noun' },
                    { word: 'pâine', translation: 'pane', type: 'noun' },
                    { word: 'părinte', translation: 'genitore', type: 'noun' },
                    { word: 'parte', translation: 'parte', type: 'noun' },
                    { word: 'pas', translation: 'passo', type: 'noun' },
                    { word: 'pătrat', translation: 'quadrato', type: 'noun' },
                    { word: 'peste', translation: 'pesce', type: 'noun' },
                    { word: 'piață', translation: 'piazza', type: 'noun' },
                    { word: 'pisică', translation: 'gatto', type: 'noun' },
                    { word: 'pom', translation: 'albero', type: 'noun' },
                    { word: 'porc', translation: 'maiale', type: 'noun' },
                    { word: 'prieten', translation: 'amico', type: 'noun' }
                ],
                'R': [
                    { word: 'râu', translation: 'fiume', type: 'noun' },
                    { word: 'restaurant', translation: 'ristorante', type: 'noun' },
                    { word: 'roșu', translation: 'rosso', type: 'adjective' },
                    { word: 'rău', translation: 'male', type: 'adjective' }
                ],
                'S': [
                    { word: 'sală', translation: 'sala', type: 'noun' },
                    { word: 'sânge', translation: 'sangue', type: 'noun' },
                    { word: 'sare', translation: 'sale', type: 'noun' },
                    { word: 'sat', translation: 'villaggio', type: 'noun' },
                    { word: 'scaun', translation: 'sedia', type: 'noun' },
                    { word: 'școală', translation: 'scuola', type: 'noun' },
                    { word: 'seară', translation: 'sera', type: 'noun' },
                    { word: 'soare', translation: 'sole', type: 'noun' },
                    { word: 'soră', translation: 'sorella', type: 'noun' },
                    { word: 'stradă', translation: 'strada', type: 'noun' }
                ],
                'T': [
                    { word: 'tată', translation: 'padre', type: 'noun' },
                    { word: 'timp', translation: 'tempo', type: 'noun' },
                    { word: 'tren', translation: 'treno', type: 'noun' },
                    { word: 'tu', translation: 'tu', type: 'pronoun' }
                ],
                'U': [
                    { word: 'ușă', translation: 'porta', type: 'noun' },
                    { word: 'unu', translation: 'uno', type: 'numeral' },
                    { word: 'unde', translation: 'dove', type: 'adverb' }
                ],
                'V': [
                    { word: 'vară', translation: 'estate', type: 'noun' },
                    { word: 'vânt', translation: 'vento', type: 'noun' },
                    { word: 'verde', translation: 'verde', type: 'adjective' },
                    { word: 'viață', translation: 'vita', type: 'noun' },
                    { word: 'vineri', translation: 'venerdì', type: 'noun' },
                    { word: 'voi', translation: 'voi', type: 'pronoun' }
                ],
                'Z': [
                    { word: 'zăpadă', translation: 'neve', type: 'noun' },
                    { word: 'zi', translation: 'giorno', type: 'noun' },
                    { word: 'ziar', translation: 'giornale', type: 'noun' }
                ]
            }
        };
    }
    
    // ===== ONLINE DICTIONARY =====
    switchDictTab(tabName) {
        // Update tabs
        document.querySelectorAll('.dict-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelector(`[data-dict-tab="${tabName}"]`)?.classList.add('active');
        
        // Update content
        document.querySelectorAll('.dict-tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(`${tabName === 'online' ? 'online' : 'my-words'}-dict-content`)?.classList.add('active');
        
        this.currentDictTab = tabName;
        
        if (tabName === 'my-words') {
            this.renderMyWords();
        }
    }
    
    async searchOnlineDictionary(word) {
        if (!word) return;
        
        const resultsEl = document.getElementById('onlineResults');
        if (!resultsEl) return;
        
        // Show loading
        resultsEl.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p class="loading-text">Translating "${word}" with LibreTranslate...</p>
            </div>
        `;
        
        try {
            const { from, to } = this.translationDirection;
            
            // Use LibreTranslate API (multiple instances for reliability)
            const translation = await this.translateWithLibreTranslate(word, from, to);
            
            if (translation) {
                this.displayTranslation(word, { 
                    translatedText: translation.text, 
                    match: translation.confidence / 100,
                    source: translation.source 
                }, from, to);
            } else {
                throw new Error('Translation not found');
            }
        } catch (error) {
            console.error('Translation error:', error);
            resultsEl.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"><i class="fas fa-exclamation-circle"></i></div>
                    <h3>Translation not found</h3>
                    <p>Try a different word or check your internet connection</p>
                    <button class="btn btn-primary" onclick="app.showManualTranslation('${word}')">
                        <i class="fas fa-plus"></i> Add Manual Translation
                    </button>
                </div>
            `;
        }
    }
    
    async translateWithLibreTranslate(text, from, to) {
        // List of LibreTranslate instances (public and mirrors)
        const instances = [
            'https://libretranslate.de',
            'https://translate.argosopentech.com',
            'https://libretranslate.com'
        ];
        
        for (const instance of instances) {
            try {
                const response = await fetch(`${instance}/translate`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        q: text,
                        source: from,
                        target: to,
                        format: 'text'
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.translatedText) {
                        return {
                            text: data.translatedText,
                            confidence: 95,
                            source: 'LibreTranslate'
                        };
                    }
                }
            } catch (e) {
                console.log(`${instance} failed, trying next...`);
                continue;
            }
        }
        
        // Fallback to MyMemory
        try {
            const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;
            const response = await fetch(myMemoryUrl);
            const data = await response.json();
            
            if (data.responseStatus === 200 && data.responseData) {
                return {
                    text: data.responseData.translatedText,
                    confidence: data.responseData.match ? Math.round(data.responseData.match * 100) : 85,
                    source: 'MyMemory'
                };
            }
        } catch (e) {
            console.error('All translation services failed');
        }
        
        return null;
    }
    
    showManualTranslation(word) {
        // Pre-fill the add dictionary form with the searched word
        document.getElementById('dictSourceWord').value = word;
        document.getElementById('dictSourceLang').value = this.translationDirection.from;
        document.getElementById('dictTargetLang').value = this.translationDirection.to;
        this.showModal('dictionaryModal');
    }
    
    async showAllLetters() {
        const resultsEl = document.getElementById('onlineResults');
        if (!resultsEl) return;
        
        resultsEl.innerHTML = `
            <div class="dictionary-browse-info">
                <h3>📖 Complete Dictionary</h3>
                <p>Select a letter to browse thousands of words from online dictionaries</p>
                <div class="dictionary-stats">
                    <div class="stat-item">
                        <i class="fas fa-book"></i>
                        <span>Full dictionary access via API</span>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-infinity"></i>
                        <span>Unlimited words available</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    async showWordsByLetter(letter, page = 1) {
        const resultsEl = document.getElementById('onlineResults');
        if (!resultsEl) return;
        
        this.currentPage = page;
        
        // Show loading
        resultsEl.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p class="loading-text">Loading words starting with "${letter}"... Page ${page}</p>
            </div>
        `;
        
        try {
            // Fetch words from Wiktionary API
            const { from } = this.translationDirection;
            const langCode = from === 'ro' ? 'ro' : 'it';
            
            // Get all words for this letter (cached)
            let allWords = this.allWordsCache[letter];
            if (!allWords) {
                allWords = await this.fetchWordsFromWiktionary(letter, langCode);
                this.allWordsCache[letter] = allWords;
            }
            
            if (allWords.length === 0) {
                resultsEl.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon"><i class="fas fa-info-circle"></i></div>
                        <h3>No words found</h3>
                        <p>Try searching for a specific word instead</p>
                    </div>
                `;
                return;
            }
            
            // Calculate pagination
            const totalPages = Math.ceil(allWords.length / this.wordsPerPage);
            const startIndex = (page - 1) * this.wordsPerPage;
            const endIndex = startIndex + this.wordsPerPage;
            const wordsToShow = allWords.slice(startIndex, endIndex);
            
            resultsEl.innerHTML = `
                <div class="letter-section">
                    <div class="letter-header">
                        ${letter} 
                        <span class="word-count">(${allWords.length} words total)</span>
                    </div>
                    <div class="dictionary-words-list">
                        ${wordsToShow.map(w => this.renderWordItemSimple(w)).join('')}
                    </div>
                    ${this.renderPagination(letter, page, totalPages)}
                </div>
            `;
        } catch (error) {
            console.error('Error loading words:', error);
            resultsEl.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"><i class="fas fa-exclamation-circle"></i></div>
                    <h3>Error loading words</h3>
                    <p>Please try again or search for a specific word</p>
                </div>
            `;
        }
    }
    
    renderPagination(letter, currentPage, totalPages) {
        if (totalPages <= 1) return '';
        
        let pages = [];
        
        // Always show first page
        pages.push(1);
        
        // Show pages around current page
        for (let i = Math.max(2, currentPage - 2); i <= Math.min(totalPages - 1, currentPage + 2); i++) {
            if (!pages.includes(i)) pages.push(i);
        }
        
        // Always show last page
        if (!pages.includes(totalPages)) pages.push(totalPages);
        
        let html = '<div class="pagination">';
        
        // Previous button
        if (currentPage > 1) {
            html += `<button class="pagination-btn" onclick="app.showWordsByLetter('${letter}', ${currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>`;
        }
        
        // Page numbers
        let lastPage = 0;
        pages.forEach(page => {
            // Add ellipsis if there's a gap
            if (page - lastPage > 1) {
                html += '<span class="pagination-ellipsis">...</span>';
            }
            
            const isActive = page === currentPage ? 'active' : '';
            html += `<button class="pagination-btn ${isActive}" onclick="app.showWordsByLetter('${letter}', ${page})">
                ${page}
            </button>`;
            lastPage = page;
        });
        
        // Next button
        if (currentPage < totalPages) {
            html += `<button class="pagination-btn" onclick="app.showWordsByLetter('${letter}', ${currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>`;
        }
        
        html += '</div>';
        return html;
    }
    
    async fetchWordsFromWiktionary(letter, langCode) {
        try {
            // Use Wiktionary API to get more words
            const allWords = [];
            
            // Try multiple search queries to get more words
            const searches = [
                letter.toLowerCase(),
                letter.toUpperCase(),
                letter.toLowerCase() + 'a',
                letter.toLowerCase() + 'e',
                letter.toLowerCase() + 'i',
                letter.toLowerCase() + 'o',
                letter.toLowerCase() + 'u'
            ];
            
            for (const search of searches) {
                try {
                    const url = `https://${langCode}.wiktionary.org/w/api.php?action=opensearch&search=${search}&limit=500&namespace=0&format=json&origin=*`;
                    const response = await fetch(url);
                    const data = await response.json();
                    
                    if (data && data[1]) {
                        const words = data[1]
                            .filter(word => {
                                const firstChar = word.charAt(0).toUpperCase();
                                return firstChar === letter.toUpperCase();
                            })
                            .map(word => ({ word: word }));
                        
                        allWords.push(...words);
                    }
                } catch (e) {
                    console.log('Search failed for:', search);
                }
            }
            
            // Remove duplicates
            const uniqueWords = Array.from(new Set(allWords.map(w => w.word)))
                .map(word => ({ word: word }))
                .sort((a, b) => a.word.localeCompare(b.word));
            
            // If we got words, return them
            if (uniqueWords.length > 0) {
                return uniqueWords;
            }
            
            // Fallback to built-in dictionary
            const dictKey = `${this.translationDirection.from}-${this.translationDirection.to}`;
            const dictionary = this.builtInDictionary[dictKey];
            return dictionary && dictionary[letter] ? dictionary[letter] : [];
            
        } catch (error) {
            console.error('Wiktionary API error:', error);
            // Fallback to built-in dictionary
            const dictKey = `${this.translationDirection.from}-${this.translationDirection.to}`;
            const dictionary = this.builtInDictionary[dictKey];
            return dictionary && dictionary[letter] ? dictionary[letter] : [];
        }
    }
    
    renderWordItemSimple(wordObj) {
        const word = wordObj.word;
        const isSaved = this.dictionary.some(e => 
            e.sourceWord.toLowerCase() === word.toLowerCase()
        );
        
        return `
            <div class="word-item" onclick="app.translateAndShowWord('${word.replace(/'/g, "\\'")}')">
                <div class="word-item-content">
                    <div class="word-item-source">${word}</div>
                    <div class="word-item-target"><i class="fas fa-language"></i> Click to translate</div>
                </div>
                <button class="word-item-action" onclick="event.stopPropagation(); app.translateAndSaveWord('${word.replace(/'/g, "\\'")}')">
                    <i class="fas ${isSaved ? 'fa-check' : 'fa-bookmark'}"></i>
                </button>
            </div>
        `;
    }
    
    translateAndShowWord(word) {
        this.searchOnlineDictionary(word);
    }
    
    async translateAndSaveWord(word) {
        const { from, to } = this.translationDirection;
        
        // Show loading notification
        this.showNotification(`Translating "${word}"...`, 'info');
        
        try {
            // Translate the word
            const libreUrl = `https://libretranslate.de/translate`;
            const response = await fetch(libreUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    q: word,
                    source: from,
                    target: to,
                    format: 'text'
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                const translation = data.translatedText;
                
                // Check if already saved
                const exists = this.dictionary.some(e => 
                    e.sourceWord.toLowerCase() === word.toLowerCase()
                );
                
                if (exists) {
                    this.showNotification(`"${word}" is already in your dictionary!`, 'info');
                    return;
                }
                
                // Save to dictionary
                const entry = {
                    id: Date.now(),
                    sourceLang: from,
                    targetLang: to,
                    sourceWord: word,
                    targetWord: translation,
                    type: 'word',
                    description: 'Added from dictionary browse',
                    createdAt: new Date().toISOString()
                };
                
                this.dictionary.push(entry);
                this.saveDictionary();
                this.updateStats();
                this.showNotification(`"${word}" → "${translation}" saved! 📚`, 'success');
                
                // Refresh the current view to update the bookmark icon
                if (this.selectedLetter !== 'all') {
                    this.showWordsByLetter(this.selectedLetter, this.currentPage);
                }
            } else {
                throw new Error('Translation failed');
            }
        } catch (error) {
            console.error('Translation error:', error);
            this.showNotification('Error translating word. Try again!', 'error');
        }
    }
    
    renderWordItem(wordObj) {
        const isSaved = this.dictionary.some(e => 
            e.sourceWord.toLowerCase() === wordObj.word.toLowerCase()
        );
        
        return `
            <div class="word-item" onclick="app.showWordDetails('${wordObj.word.replace(/'/g, "\\'")}', '${wordObj.translation.replace(/'/g, "\\'")}', '${wordObj.type}')">
                <div class="word-item-content">
                    <div class="word-item-source">${wordObj.word}</div>
                    <div class="word-item-target">${wordObj.translation}</div>
                </div>
                <button class="word-item-action" onclick="event.stopPropagation(); app.saveWordFromDict('${wordObj.word.replace(/'/g, "\\'")}', '${wordObj.translation.replace(/'/g, "\\'")}', '${wordObj.type}')" ${isSaved ? 'disabled' : ''}>
                    <i class="fas ${isSaved ? 'fa-check' : 'fa-bookmark'}"></i>
                </button>
            </div>
        `;
    }
    
    showWordDetails(word, translation, type) {
        const resultsEl = document.getElementById('onlineResults');
        const currentContent = resultsEl.innerHTML;
        
        const isSaved = this.dictionary.some(e => 
            e.sourceWord.toLowerCase() === word.toLowerCase()
        );
        
        // Show detailed view
        resultsEl.innerHTML = `
            <div class="translation-card slide-in-up">
                <div class="translation-header">
                    <div class="translation-main">
                        <div class="word-original">${word}</div>
                        <div class="word-translation">${translation}</div>
                    </div>
                    <div class="translation-actions">
                        <button class="btn-save-word ${isSaved ? 'saved' : ''}" 
                                onclick="app.saveWordFromDict('${word.replace(/'/g, "\\'")}', '${translation.replace(/'/g, "\\'")}', '${type}')"
                                ${isSaved ? 'disabled' : ''}>
                            <i class="fas ${isSaved ? 'fa-check' : 'fa-bookmark'}"></i>
                            ${isSaved ? 'Saved' : 'Save Word'}
                        </button>
                        <button class="btn btn-secondary" onclick="app.goBackToBrowse()">
                            <i class="fas fa-arrow-left"></i>
                            Back
                        </button>
                    </div>
                </div>
                <div class="translation-details">
                    <div class="detail-section">
                        <div class="detail-label">Word Type</div>
                        <div class="detail-content">${type}</div>
                    </div>
                    <div class="detail-section">
                        <div class="detail-label">Translation Direction</div>
                        <div class="detail-content">${this.getLanguageName(this.translationDirection.from)} → ${this.getLanguageName(this.translationDirection.to)}</div>
                    </div>
                </div>
            </div>
        `;
        
        // Store previous content for back button
        this.previousDictContent = currentContent;
    }
    
    goBackToBrowse() {
        const resultsEl = document.getElementById('onlineResults');
        if (this.previousDictContent) {
            resultsEl.innerHTML = this.previousDictContent;
        } else if (this.selectedLetter === 'all') {
            this.showAllLetters();
        } else {
            this.showWordsByLetter(this.selectedLetter);
        }
    }
    
    saveWordFromDict(word, translation, type) {
        const entry = {
            id: Date.now(),
            sourceLang: this.translationDirection.from,
            targetLang: this.translationDirection.to,
            sourceWord: word,
            targetWord: translation,
            type: type,
            description: 'Added from built-in dictionary',
            createdAt: new Date().toISOString()
        };
        
        this.dictionary.push(entry);
        this.saveDictionary();
        this.updateStats();
        this.showNotification('Word saved to your dictionary! 📚', 'success');
        
        // Refresh view
        if (this.previousDictContent) {
            this.goBackToBrowse();
        }
    }
    
    displayTranslation(word, data, from, to) {
        const resultsEl = document.getElementById('onlineResults');
        if (!resultsEl) return;
        
        const translation = data.translatedText;
        const isSaved = this.dictionary.some(e => 
            e.sourceWord.toLowerCase() === word.toLowerCase() &&
            e.sourceLang === from &&
            e.targetLang === to
        );
        
        resultsEl.innerHTML = `
            <div class="translation-card slide-in-up">
                <div class="translation-header">
                    <div class="translation-main">
                        <div class="word-original">${word}</div>
                        <div class="word-translation">${translation}</div>
                    </div>
                    <div class="translation-actions">
                        <button class="btn-save-word ${isSaved ? 'saved' : ''}" 
                                onclick="app.saveTranslation('${word.replace(/'/g, "\\'")}', '${translation.replace(/'/g, "\\'")}', '${from}', '${to}')"
                                ${isSaved ? 'disabled' : ''}>
                            <i class="fas ${isSaved ? 'fa-check' : 'fa-bookmark'}"></i>
                            ${isSaved ? 'Saved' : 'Save Word'}
                        </button>
                        <button class="btn btn-secondary" onclick="app.goBackToBrowse()">
                            <i class="fas fa-arrow-left"></i>
                            Back
                        </button>
                    </div>
                </div>
                <div class="translation-details">
                    <div class="detail-section">
                        <div class="detail-label">Translation Direction</div>
                        <div class="detail-content">${this.getLanguageName(from)} → ${this.getLanguageName(to)}</div>
                    </div>
                    ${data.match ? `
                        <div class="detail-section">
                            <div class="detail-label">Confidence</div>
                            <div class="detail-content">
                                <div class="confidence-bar">
                                    <div class="confidence-fill" style="width: ${Math.round(data.match * 100)}%"></div>
                                </div>
                                <span>${Math.round(data.match * 100)}% accurate</span>
                            </div>
                        </div>
                    ` : ''}
                    ${data.source ? `
                        <div class="detail-section">
                            <div class="detail-label">Translation Engine</div>
                            <div class="detail-content">
                                <span class="engine-badge">${data.source}</span>
                                ${data.source === 'LibreTranslate' ? '<span class="engine-info">🔓 Open Source</span>' : ''}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    saveTranslation(sourceWord, targetWord, from, to) {
        const entry = {
            id: Date.now(),
            sourceLang: from,
            targetLang: to,
            sourceWord: sourceWord,
            targetWord: targetWord,
            type: 'word',
            description: 'Added from online dictionary',
            createdAt: new Date().toISOString()
        };
        
        this.dictionary.push(entry);
        this.saveDictionary();
        this.updateStats();
        this.showNotification('Word saved to your dictionary! 📚', 'success');
        
        // Refresh display
        this.searchOnlineDictionary(sourceWord);
    }
    
    renderMyWords() {
        const resultsEl = document.getElementById('myWordsResults');
        if (!resultsEl) return;
        
        if (this.dictionary.length === 0) {
            resultsEl.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"><i class="fas fa-bookmark"></i></div>
                    <h3>No saved words yet</h3>
                    <p>Add words from the online dictionary or create your own</p>
                </div>
            `;
            return;
        }
        
        let list = [...this.dictionary];
        
        // Search filter
        const searchQuery = document.getElementById('myWordsSearch')?.value.trim().toLowerCase();
        if (searchQuery) {
            list = list.filter(e =>
                (e.sourceWord || '').toLowerCase().includes(searchQuery) ||
                (e.targetWord || '').toLowerCase().includes(searchQuery)
            );
        }
        
        // Language filters
        const sourceLang = document.getElementById('myWordsSourceFilter')?.value;
        const targetLang = document.getElementById('myWordsTargetFilter')?.value;
        if (sourceLang && sourceLang !== 'any') list = list.filter(e => e.sourceLang === sourceLang);
        if (targetLang && targetLang !== 'any') list = list.filter(e => e.targetLang === targetLang);
        
        // Sort
        const sort = document.getElementById('myWordsSort')?.value || 'recent';
        if (sort === 'recent') {
            list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (sort === 'az') {
            list.sort((a, b) => (a.sourceWord || '').localeCompare(b.sourceWord || ''));
        } else if (sort === 'za') {
            list.sort((a, b) => (b.sourceWord || '').localeCompare(a.sourceWord || ''));
        }
        
        if (list.length === 0) {
            resultsEl.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"><i class="fas fa-search"></i></div>
                    <h3>No matches found</h3>
                    <p>Try adjusting your search or filters</p>
                </div>
            `;
            return;
        }
        
        resultsEl.innerHTML = list.map(entry => `
            <div class="dictionary-entry slide-in-up">
                <div class="dictionary-main">
                    <div class="dictionary-word">${entry.sourceWord}</div>
                    <div class="dictionary-translation">${entry.targetWord}</div>
                    ${entry.description ? `<div class="dictionary-description">${entry.description}</div>` : ''}
                </div>
                <div class="dictionary-meta">
                    <span class="dictionary-type">${entry.type || ''}</span>
                    <div class="dictionary-actions">
                        <button class="btn-icon" onclick="app.editDictionaryEntry(${entry.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete" onclick="app.deleteDictionaryEntry(${entry.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Update badge
        const badge = document.getElementById('myWordsBadge');
        if (badge) badge.textContent = this.dictionary.length;
    }
}

// Initialize the app
const app = new LanguageLearningApp();
