import { languages, defaultLanguage } from './locales/languages.js';
import en from './locales/en.js';
import de from './locales/de.js';

const translations = { en, de };

let currentLanguage = defaultLanguage;

/**
 * Extracts language code from URL path prefix (/en, /de)
 */
function getLanguageFromURL() {
    const pathname = window.location.pathname;
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length > 0) {
        const firstSegment = segments[0].toLowerCase();
        if (languages.some(lang => lang.code === firstSegment)) {
            return firstSegment;
        }
    }
    return null;
}

/**
 * Updates URL pathname prefix to match language
 */
function updateURL(langCode, replace = false) {
    const segments = window.location.pathname.split('/').filter(Boolean);
    if (segments.length > 0 && languages.some(lang => lang.code === segments[0].toLowerCase())) {
        segments[0] = langCode;
    } else {
        segments.unshift(langCode);
    }

    const newPath = '/' + segments.join('/') + window.location.search + window.location.hash;
    const currentFullPath = window.location.pathname + window.location.search + window.location.hash;

    if (currentFullPath !== newPath) {
        if (replace) {
            window.history.replaceState({ lang: langCode }, '', newPath);
        } else {
            window.history.pushState({ lang: langCode }, '', newPath);
        }
    }
}

/**
 * Applies translations to all tagged DOM elements
 */
function applyTranslations(langCode) {
    const t = translations[langCode] || translations[defaultLanguage];
    const langObj = languages.find(l => l.code === langCode) || languages[0];

    // Document & HTML tag attributes
    document.documentElement.lang = langObj.code;
    document.documentElement.dir = langObj.direction || 'ltr';

    if (t.pageTitle) {
        document.title = t.pageTitle;
    }

    // Meta tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle && (t.ogTitle || t.pageTitle)) {
        ogTitle.setAttribute('content', t.ogTitle || t.pageTitle);
    }

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc && t.ogDescription) {
        ogDesc.setAttribute('content', t.ogDescription);
    }

    // Text content: [data-i18n]
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key] !== undefined) {
            el.textContent = t[key];
        }
    });

    // Image source: [data-i18n-src]
    document.querySelectorAll('[data-i18n-src]').forEach(el => {
        const key = el.getAttribute('data-i18n-src');
        if (t[key] !== undefined) {
            el.setAttribute('src', t[key]);
        }
    });

    // Link href: [data-i18n-href]
    document.querySelectorAll('[data-i18n-href]').forEach(el => {
        const key = el.getAttribute('data-i18n-href');
        if (t[key] !== undefined) {
            el.setAttribute('href', t[key]);
        }
    });

    // Alt text: [data-i18n-alt]
    document.querySelectorAll('[data-i18n-alt]').forEach(el => {
        const key = el.getAttribute('data-i18n-alt');
        if (t[key] !== undefined) {
            el.setAttribute('alt', t[key]);
        }
    });

    // Aria label: [data-i18n-aria]
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
        const key = el.getAttribute('data-i18n-aria');
        if (t[key] !== undefined) {
            el.setAttribute('aria-label', t[key]);
        }
    });

    // Download attribute: [data-i18n-download]
    document.querySelectorAll('[data-i18n-download]').forEach(el => {
        const key = el.getAttribute('data-i18n-download');
        if (t[key] !== undefined) {
            el.setAttribute('download', t[key]);
        }
    });
}

/**
 * Sets the active language and triggers UI & URL updates
 */
export function setLanguage(langCode, updateHistory = true, replaceHistory = false) {
    const validLang = languages.some(l => l.code === langCode) ? langCode : defaultLanguage;
    currentLanguage = validLang;

    try {
        localStorage.setItem('tornado_lang', validLang);
    } catch (e) {
        console.warn('Unable to access localStorage', e);
    }

    if (updateHistory) {
        updateURL(validLang, replaceHistory);
    }

    applyTranslations(validLang);
    renderLanguageDropdown();
}

/**
 * Renders and attaches event handlers to the language dropdown switcher
 */
function renderLanguageDropdown() {
    const switcher = document.getElementById('lang-switcher');
    if (!switcher) return;

    const currentLangObj = languages.find(l => l.code === currentLanguage) || languages[0];

    switcher.innerHTML = `
        <button type="button" class="lang-current" id="lang-current-btn" aria-haspopup="true" aria-expanded="false" aria-label="Select Language">
            <img src="${currentLangObj.flag}" alt="${currentLangObj.name}" class="lang-flag" width="20" height="15">
            <span class="lang-name">${currentLangObj.name}</span>
            <i class="fas fa-chevron-down lang-chevron" aria-hidden="true"></i>
        </button>
        <div class="lang-dropdown" id="lang-dropdown-menu" role="menu" aria-labelledby="lang-current-btn">
            ${languages.map(lang => `
                <button type="button" 
                        class="lang-option ${lang.code === currentLanguage ? 'active' : ''}" 
                        data-lang-code="${lang.code}" 
                        role="menuitem"
                        tabindex="${lang.code === currentLanguage ? '0' : '-1'}">
                    <img src="${lang.flag}" alt="${lang.name}" class="lang-flag" width="20" height="15">
                    <span class="lang-option-name">${lang.name}</span>
                    ${lang.code === currentLanguage ? '<i class="fas fa-check lang-check" aria-hidden="true"></i>' : ''}
                </button>
            `).join('')}
        </div>
    `;

    const currentBtn = switcher.querySelector('#lang-current-btn');
    const dropdownMenu = switcher.querySelector('#lang-dropdown-menu');

    function toggleDropdown(open) {
        const shouldOpen = open !== undefined ? open : !dropdownMenu.classList.contains('show');
        if (shouldOpen) {
            dropdownMenu.classList.add('show');
            currentBtn.setAttribute('aria-expanded', 'true');
            currentBtn.classList.add('active');
        } else {
            dropdownMenu.classList.remove('show');
            currentBtn.setAttribute('aria-expanded', 'false');
            currentBtn.classList.remove('active');
        }
    }

    currentBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown();
    });

    switcher.querySelectorAll('.lang-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const code = btn.getAttribute('data-lang-code');
            if (code && code !== currentLanguage) {
                setLanguage(code, true, false);
            }
            toggleDropdown(false);
        });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!switcher.contains(e.target)) {
            toggleDropdown(false);
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            toggleDropdown(false);
        }
    });
}

/**
 * Initializes the i18n engine
 */
function init() {
    const urlLang = getLanguageFromURL();
    // Default to 'en' if accessed directly at root or invalid language prefix
    const initialLang = urlLang || defaultLanguage;

    if (!urlLang) {
        // Automatically redirect / to /en
        setLanguage(initialLang, true, true);
    } else {
        setLanguage(initialLang, false, false);
    }

    window.addEventListener('popstate', () => {
        const lang = getLanguageFromURL() || defaultLanguage;
        setLanguage(lang, false, false);
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
