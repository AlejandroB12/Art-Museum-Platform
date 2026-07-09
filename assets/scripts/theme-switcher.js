(function () {
    const THEME_KEY = 'doart-theme';
    const ACCENT_KEY = 'doart-accent';

    function loadTheme() {
        const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
        const savedAccent = localStorage.getItem(ACCENT_KEY) || 'teal';
        document.documentElement.setAttribute('data-theme', savedTheme);
        document.documentElement.setAttribute('data-accent', savedAccent);
    }

    window.DoArtTheme = {
        saveTheme(theme) {
            localStorage.setItem(THEME_KEY, theme);
            document.documentElement.setAttribute('data-theme', theme);
        },
        saveAccent(accent) {
            localStorage.setItem(ACCENT_KEY, accent);
            document.documentElement.setAttribute('data-accent', accent);
        }
    };

    loadTheme();
})();
