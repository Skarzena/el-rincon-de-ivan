document.addEventListener('DOMContentLoaded', () => {
    const lock = document.getElementById('lock');
    const addBtn = document.getElementById('addBtn');
    const removeBtn = document.getElementById('removeBtn');
    const saveBtn = document.getElementById('saveBtn');
    const importBtn = document.getElementById('importBtn');
    const exportBtn = document.getElementById('exportBtn');
    const elementsContainer = document.getElementById('elementsContainer');
    var weatherButton = document.getElementById("imagenSol");
    var weatherWidget = document.getElementById("tiempo"); 
    let isLocked = true;
    let elementsData = [];
    let isRemoveMode = false;
    let isSaveMenuVisible = false;

    // Cargar elementos desde localStorage al iniciar
    const loadElements = () => {
        const savedData = localStorage.getItem('elementsData');
        if (savedData) {
            elementsData = JSON.parse(savedData);
            let migrated = false;
            const container = document.querySelector('.container');
            elementsData.forEach(element => {
                // Detecta si el formato es "Npx"
                if (typeof element.top === 'string' && element.top.endsWith('px')) {
                    // Convierte px a porcentaje
                    const pxTop = parseFloat(element.top);
                    const pxLeft = parseFloat(element.left);
                    element.top = (pxTop / container.offsetHeight) * 100 + "%";
                    element.left = (pxLeft / container.offsetWidth) * 100 + "%";
                    migrated = true;
                }
                addElementToDOM(element);
            });
            // Si migró alguno, guarda los datos ya en porcentaje
            if (migrated) {
                saveElements();
            }
    }

    };

    // Guardar elementos en localStorage
    const saveElements = () => {
        localStorage.setItem('elementsData', JSON.stringify(elementsData));
    };

    // Añadir elemento al DOM y configurar su posición
    const addElementToDOM = (elementData) => {
        const element = document.createElement('img');
        element.draggable = false;
        element.addEventListener('dragstart', e => {e.preventDefault();});
        element.src = elementData.image;
        element.classList.add('element');
        element.style.top = elementData.top;
        element.style.left = elementData.left;
        element.draggable = !isLocked;
        element.addEventListener('click', () => {
            if (isLocked) {
                window.location.href = elementData.url;
            } else if (isRemoveMode) {
                removeElement(element, elementData);
            }
        });

        // Habilitar arrastrar elementos cuando está desbloqueado
        if (!isLocked) {
            enableDragAndDrop(element, elementData);
        }

        elementsContainer.appendChild(element);
    };

    // Función para habilitar arrastrar y soltar en un elemento
    const enableDragAndDrop = (element, elementData) => {
        let isDragging = false;
        let hasMoved   = false;
        let startX = 0, startY = 0;
        let offsetX = 0, offsetY = 0;
        const DRAG_THRESHOLD = 5;
        const container = document.querySelector('.container');
        
        // Evita transiciones en left/top
        const savedTransition = element.style.transition;
        element.style.userSelect = 'none';
        element.style.position   = 'absolute';
        
        element.addEventListener('mousedown', e => {
            if (isLocked) return;
            if (e.button !== 0) return;      // solo botón izquierdo
            isDragging = true;
            hasMoved   = false;
            startX     = e.clientX;
            startY     = e.clientY;

            // Offset interno: dónde clickas dentro de la imagen
            const elRect   = element.getBoundingClientRect();
            offsetX = e.clientX - elRect.left;
            offsetY = e.clientY - elRect.top;

            // Desactiva la transición para mover sin retardos
            element.style.transition = 'none';

            // Escuchas a nivel documento para no “perder” el ratón si sales del elemento
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup',   onMouseUp);
        });
        
        function onMouseMove(e) {
            if (!isDragging) return;

            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            // hasta que no supere DRAG_THRESHOLD, no consideramos drag
            if (!hasMoved && Math.hypot(dx, dy) < DRAG_THRESHOLD) {
                return;
            }
            hasMoved = true;

            // Nueva posición relativa al contenedor
            const contRect = container.getBoundingClientRect();
            let newLeft = e.clientX - contRect.left - offsetX;
            let newTop  = e.clientY - contRect.top  - offsetY;

            // Límite para que no salga del contenedor
            newLeft = Math.max(0, Math.min(newLeft, contRect.width  - element.clientWidth));
            newTop  = Math.max(0, Math.min(newTop,  contRect.height - element.clientHeight));

            element.style.left = `${newLeft}px`;
            element.style.top  = `${newTop}px`;
        }
        
        function onMouseUp() {
            if (!isDragging) return;
            isDragging = false;

            // Restauras la transición (por ejemplo para hover/scale)
            element.style.transition = savedTransition;

            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup',   onMouseUp);

            // Si no hubo movimiento más allá del umbral, no reposicionamos
            if (!hasMoved) {
                return;
            }

            // Guardas en porcentajes
            const contRect = container.getBoundingClientRect();
            const leftPct = (parseFloat(element.style.left) / contRect.width ) * 100;
            const topPct  = (parseFloat(element.style.top)  / contRect.height) * 100;
            elementData.left = `${leftPct}%`;
            elementData.top  = `${topPct}%`;

            // Reaplicas para mantener tu sistema de %
            element.style.left = elementData.left;
            element.style.top  = elementData.top;

            saveElements();
        }
    };


    // Alternar el estado del candado (bloqueado/desbloqueado)
    const toggleLock = () => {
        isLocked = !isLocked;
        lock.style.backgroundImage = isLocked ? "url('images/lock.png')" : "url('images/unlock.png')";
        addBtn.style.display = isLocked ? 'none' : 'block';
        removeBtn.style.display = isLocked ? 'none' : 'block';
        const elements = document.querySelectorAll('.element');
        elements.forEach((element, index) => {
            element.draggable = !isLocked;
            if (!isLocked) {
                enableDragAndDrop(element, elementsData[index]);
            }
        });
        if (isLocked) saveElements();
    };

    // Alternar modo de eliminación
    const toggleRemoveMode = () => {
        isRemoveMode = !isRemoveMode;
        removeBtn.classList.toggle('active', isRemoveMode);
    };

    // Eliminar elemento
    const removeElement = (element, elementData) => {
        const index = elementsData.indexOf(elementData);
        if (index !== -1) {
            elementsData.splice(index, 1);
            elementsContainer.removeChild(element);
            saveElements();
        }
    };

    // Procesa la imagen elegida para que sea JPG 
    function imageResize(file, callback) {
        const maxWidth = 150;
        const maxHeight = 150;
        const reader = new FileReader();

        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                // Redimensionar manteniendo la proporción
                let width = img.width;
                let height = img.height;
                if (width > maxWidth || height > maxHeight) {
                    if (width / height > maxWidth / maxHeight) {
                        height = Math.round(height * (maxWidth / width));
                        width = maxWidth;
                    } else {
                        width = Math.round(width * (maxHeight / height));
                        height = maxHeight;
                    }
                }

                // Dibuja en canvas
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Exportar a JPG, calidad 0.8
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

                callback(dataUrl);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }


    // Añadir nuevo elemento
    const addNewElement = () => {
        const url = prompt('Ingrese la URL:');
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            
            imageResize(file, function(processedImage) {
                const container = document.querySelector('.container');
                const defaultTop = (100 / container.offsetHeight) * 100 + "%";
                const defaultLeft = (100 / container.offsetWidth) * 100 + "%";
                const newElement = {
                    image: processedImage,
                    url: url,
                    top: defaultTop,
                    left: defaultLeft
                };
                elementsData.push(newElement);
                addElementToDOM(newElement);
                saveElements();
            });
        };
        input.click();
    };

    // Botón de 'save'
    const toggleSaveMenu = () => {
        isSaveMenuVisible = !isSaveMenuVisible;
        importBtn.style.display = isSaveMenuVisible ? 'block' : 'none';
        exportBtn.style.display = isSaveMenuVisible ? 'block' : 'none';
    };

    // Exportar datos actuales a un archivo JSON
    const exportData = () => {
        const data = {
            elements: elementsData,
            notes: localStorage.getItem('notasContenido') || ""
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
        const dlAnchor = document.createElement('a');
        dlAnchor.setAttribute("href", dataStr);
        dlAnchor.setAttribute("download", "elementsData.json");
        document.body.appendChild(dlAnchor);
        dlAnchor.click();
        dlAnchor.remove();
    };

    // Importar datos de un JSON
    const importData = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const importedData = JSON.parse(event.target.result);
                    // Notas
                    if (importedData.notes !== undefined) {
                        localStorage.setItem('notasContenido', importedData.notes);
                        // Mostrar en textarea si está abierto
                        const textarea = document.getElementById("textArea");
                        if (textarea && textarea.style.display === "block") {
                            textarea.value = importedData.notes;
                        }
                    }
                    // Elementos
                    if (Array.isArray(importedData.elements)) {
                        // Vacía los actuales en el DOM
                        elementsData.length = 0;
                        const container = document.getElementById('elementsContainer');
                        container.innerHTML = "";
                        importedData.elements.forEach(el => elementsData.push(el));
                        saveElements();
                        importedData.elements.forEach(addElementToDOM);
                    }
                    alert("Datos importados correctamente");
                } catch (err) {
                    alert("Archivo inválido");
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    // Script Tiempo
    const scriptTiempo = (weatherButton, weatherWidget) => {
        weatherButton.addEventListener("click", function () {
            if (weatherWidget.style.display === "none") {
            weatherWidget.style.display = "block";
            } else {
            weatherWidget.style.display = "none";
            }
        });
    };

    // Script Notas
    const scriptNotas = () => {
        // Obtener una referencia al elemento <textarea> y al botón
        var imagennotita = document.getElementById("imagenNotas");
        var textarea = document.getElementById("textArea");

        // Clave para almacenar los datos en localStorage
        var localStorageKey = "notasContenido";

        // Mostrar el elemento <textarea> y cargar contenido desde localStorage
        imagennotita.addEventListener("click", function () {
            if (textarea.style.display === "none") {
                // Cargar contenido desde localStorage
                var contenido = localStorage.getItem(localStorageKey);
                if (contenido) {
                    textarea.value = contenido;
                }
                textarea.style.display = "block";
            } else {
                // Guardar contenido en localStorage
                var contenido = textarea.value;
                localStorage.setItem(localStorageKey, contenido);
                textarea.style.display = "none";
            }
        });
    };

    lock.addEventListener('click', toggleLock);
    addBtn.addEventListener('click', addNewElement);
    removeBtn.addEventListener('click', toggleRemoveMode);
    saveBtn.addEventListener('click', toggleSaveMenu);
    exportBtn.addEventListener('click', exportData);
    importBtn.addEventListener('click', importData);
    scriptTiempo(weatherButton, weatherWidget);
    scriptNotas();

    loadElements();
});




