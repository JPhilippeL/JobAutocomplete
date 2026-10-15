// ==UserScript==
// @name         Auto-Fill Empleo Local (Ollama)
// @namespace   Violentmonkey Scripts
// @version      1.0.0
// @description  Rellena formularios de empleo con Ollama local
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      localhost
// @connect      127.0.0.1
// @require      file:///C:/Users/phili/Desktop/codigoboludo/JobAutocomplete/datos_mios.js?v=1
// ==/UserScript==

(function() {
    'use strict';

    // Verificación defensiva por si el archivo no cargó
    const profile = window.MY_PROFILE;
    if (!profile) {
        console.error("No se encontró window.MY_PROFILE. Revisa la ruta del @require.");
        return;
    }

    // Botón flotante
    const btn = document.createElement('button');
    btn.innerText = 'Rellenar Automaticamente';
    btn.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:999999;padding:12px 16px;background:#10a37f;color:#fff;border:none;border-radius:8px;font-weight:bold;cursor:pointer;box-shadow:0 4px 10px rgba(0,0,0,0.3);';
    document.body.appendChild(btn);

    btn.onclick = async () => {
        btn.innerText = 'Analizando...';
        btn.disabled = true;

        try {
            const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="password"]), textarea'));
            
            const fieldSummary = inputs.map((input, index) => {
                const labelElem = document.querySelector(`label[for="${input.id}"]`);
                const parentLabel = input.closest('label');
                const labelText = labelElem?.innerText || parentLabel?.innerText || '';
                
                const descriptor = labelText.replace(/\s+/g, ' ').trim()
                                  || input.getAttribute('aria-label') 
                                  || input.placeholder 
                                  || input.name 
                                  || input.id 
                                  || '';

                return {
                    id: String(index),
                    label: descriptor.replace(/[*:]/g, '').trim()
                };
            }).filter(f => f.label.length > 0);

            console.log("Campos enviados a Ollama:", fieldSummary);

            const prompt = `Task: Data matching for form autofill.

CANDIDATE PROFILE:
${JSON.stringify(profile)}

FIELDS TO FILL:
${JSON.stringify(fieldSummary)}

STRICT RULES:
1. You MUST include EVERY single "id" from the Fields list in your JSON output. Do not skip any.
2. If you know the answer from the profile, write the exact value.
3. For Yes/No questions or checkboxes (like "Yes", "I accept"), if it matches the profile, write "true".
4. If you DO NOT have the data for a field, you MUST write "" (empty string).
5. NEVER write the id number as the value.

EXAMPLE FORMAT:
{"0": "Carlos", "1": "García", "2": "carlos@email.com", "3": "+34600000000", "4": "", "19": "true"}

OUTPUT ONLY VALID JSON.`;

            // 2. EN LA LLAMADA A OLLAMA, AÑADIMOS NUM_PREDICT
            GM_xmlhttpRequest({
                method: "POST",
                url: "http://127.0.0.1:11434/api/generate",
                headers: { "Content-Type": "application/json" },
                data: JSON.stringify({
                    model: "llama3.2:1b",
                    prompt: prompt,
                    stream: false,
                    format: "json",
                    options: { 
                        temperature: 0.0, // Cero absoluto de creatividad
                        num_predict: 1500 // Evita que corte el JSON por la mitad
                    }
                }),
                onload: (response) => {
                    let rellenados = 0;
                    try {
                        const resData = JSON.parse(response.responseText);
                        const filledData = typeof resData.response === 'string' ? JSON.parse(resData.response) : resData.response;
                        
                        console.log("Respuesta devuelta por Ollama:", filledData);

                        for (const [key, value] of Object.entries(filledData)) {
                            if (!value || String(value).trim() === "") continue;

                            let targetInput = null;

                            // Caso 1: Devolvió el id numérico esperado
                            if (!isNaN(parseInt(key, 10)) && inputs[parseInt(key, 10)]) {
                                targetInput = inputs[parseInt(key, 10)];
                            } 
                            // Caso 2: El modelo devolvió el nombre de la etiqueta en vez del id
                            else {
                                const matchingField = fieldSummary.find(f => f.label.toLowerCase() === key.toLowerCase());
                                if (matchingField) {
                                    targetInput = inputs[parseInt(matchingField.id, 10)];
                                }
                            }

                            if (targetInput) {
                                setNativeValue(targetInput, String(value));
                                rellenados++;
                            }
                        }

                        console.log(`Total campos inyectados: ${rellenados}`);
                        btn.innerText = `¡Listo (${rellenados})!`;

                    } catch (err) {
                        console.error("Error procesando:", err);
                        btn.innerText = 'Error JSON';
                    } finally {
                        setTimeout(() => {
                            btn.innerText = '🤖 Rellenar con IA';
                            btn.disabled = false;
                        }, 3000);
                    }
                },
                onerror: (err) => {
                    console.error("Error red:", err);
                    btn.innerText = 'Error red';
                    btn.disabled = false;
                }
            });

        } catch (err) {
            console.error("Error:", err);
            btn.innerText = 'Error';
            btn.disabled = false;
        }
    };

    function setNativeValue(element, value) {
        // Manejar checkboxes y radio buttons
        if (element.type === 'checkbox' || element.type === 'radio') {
            element.checked = (value === 'true' || value === true);
            element.dispatchEvent(new Event('click', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            return;
        }
        
        // Manejar inputs de texto normales
        const lastValue = element.value;
        element.value = value;
        const tracker = element._valueTracker;
        if (tracker) {
            tracker.setValue(lastValue);
        }
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
    }
})();