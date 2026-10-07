import { extension_settings } from '../../../extensions.js';
import { saveSettingsDebounced } from '../../../../script.js';

const MODULE_NAME = 'emdash_converter';
const DEFAULT_SETTINGS = Object.freeze({ enabled: true });

// Text inputs the converter watches: main chat box and the message edit box.
const TARGET_SELECTOR = '#send_textarea, #curEditTextarea';

function getSettings() {
    if (!extension_settings[MODULE_NAME]) {
        extension_settings[MODULE_NAME] = { ...DEFAULT_SETTINGS };
    }
    for (const key of Object.keys(DEFAULT_SETTINGS)) {
        if (!Object.hasOwn(extension_settings[MODULE_NAME], key)) {
            extension_settings[MODULE_NAME][key] = DEFAULT_SETTINGS[key];
        }
    }
    return extension_settings[MODULE_NAME];
}

/**
 * When the user types a hyphen right after another hyphen, swap both for an em dash.
 * Only fires on typed characters (not paste), so pasted code/CLI flags stay untouched.
 */
function onInput(event) {
    if (!getSettings().enabled) return;
    if (event.isComposing || event.inputType !== 'insertText' || event.data !== '-') return;

    const el = event.target;
    if (!(el instanceof HTMLTextAreaElement)) return;
    if (el.selectionStart !== el.selectionEnd) return;

    const pos = el.selectionStart;
    if (pos < 2) return;
    if (el.value.slice(pos - 2, pos) !== '--') return;

    el.setRangeText('\u2014', pos - 2, pos, 'end');
}

function addSettingsUI() {
    const html = `
    <div id="emdash_converter_settings">
        <div class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>Em Dash Converter</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
            </div>
            <div class="inline-drawer-content">
                <label class="emdash_row checkbox_label" for="emdash_converter_enabled">
                    <input id="emdash_converter_enabled" type="checkbox" />
                    <span>Convert double hyphen (--) to em dash (&mdash;)</span>
                </label>
            </div>
        </div>
    </div>`;

    $('#extensions_settings2').append(html);

    const $toggle = $('#emdash_converter_enabled');
    $toggle.prop('checked', getSettings().enabled);
    $toggle.on('change', function () {
        getSettings().enabled = $(this).prop('checked');
        saveSettingsDebounced();
    });
}

jQuery(() => {
    getSettings();
    addSettingsUI();
    // Delegated, so it also works for the edit box that is created on demand.
    document.addEventListener('input', (event) => {
        if (event.target instanceof Element && event.target.matches(TARGET_SELECTOR)) {
            onInput(event);
        }
    });
});
